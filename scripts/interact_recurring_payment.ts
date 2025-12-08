import { network } from "hardhat";

/**
 * 定期支付合约交互脚本
 * 用于充值、激活、停用和查询合约状态
 */

// ==================== 配置 ====================
// 请替换为您部署的合约地址
const CONTRACT_ADDRESS = "0x36B72f1662c5f512174a171b8Ce602920d98136C";

async function main() {
  console.log("========================================");
  console.log("定期支付合约交互脚本");
  console.log("========================================\n");

  // 连接到网络并获取 ethers
  const connection = await network.connect();
  const { ethers } = connection;

  // 获取账户
  const accounts = await ethers.getSigners();
  
  // 选择操作
  const operation = process.env.OPERATION || "info";
  
  // 先用第一个账户连接合约，读取租户地址
  const tempContract = await ethers.getContractAt(
    "RecurringPayment",
    CONTRACT_ADDRESS,
    accounts[0]
  );
  
  // 读取合约中的租户地址
  const contractTenantAddress = await tempContract.tenant();
  
  // 租户操作需要使用租户账户
  const tenantOperations = ["deposit", "activate", "deactivate", "withdraw"];
  let signer = accounts[0];
  let signerRole = "查询账户";
  
  if (tenantOperations.includes(operation)) {
    // 查找哪个账户是租户
    const tenantAccount = accounts.find(acc => acc.address.toLowerCase() === contractTenantAddress.toLowerCase());
    if (tenantAccount) {
      signer = tenantAccount;
      signerRole = "租户";
    } else {
      console.log("⚠️  警告: 当前账户中没有租户地址:", contractTenantAddress);
      console.log("将使用第一个账户尝试操作（可能失败）\n");
    }
  }
  
  console.log("执行操作:", operation);
  console.log("使用账户:", signerRole);
  console.log("账户地址:", signer.address);
  console.log("合约租户:", contractTenantAddress);
  
  const balance = await ethers.provider.getBalance(signer.address);
  console.log("账户余额:", ethers.formatEther(balance), "ETH\n");

  // 连接到已部署的合约（使用对应的账户）
  const recurringPayment = await ethers.getContractAt(
    "RecurringPayment",
    CONTRACT_ADDRESS,
    signer
  );

  switch (operation) {
    case "info":
      await getContractInfo(recurringPayment, ethers);
      break;
    case "deposit":
      await depositFunds(recurringPayment, ethers);
      break;
    case "activate":
      await activateContract(recurringPayment);
      break;
    case "deactivate":
      await deactivateContract(recurringPayment);
      break;
    case "withdraw":
      await withdrawFunds(recurringPayment, ethers);
      break;
    case "checkUpkeep":
      await checkUpkeep(recurringPayment);
      break;
    default:
      console.log("❌ 未知操作:", operation);
      console.log("可用操作: info, deposit, activate, deactivate, withdraw, checkUpkeep");
  }
}

/**
 * 查询合约信息
 */
async function getContractInfo(contract: any, ethers: any) {
  console.log("📊 查询合约信息...\n");

  const info = await contract.getContractInfo();
  const nextPaymentTime = await contract.getNextPaymentTime();

  console.log("合约信息:");
  console.log("- 租户地址:", info[0]);
  console.log("- 公司地址:", info[1]);
  console.log("- 支付金额:", ethers.formatEther(info[2]), "ETH");
  console.log("- 支付间隔:", info[3].toString(), "秒 (", Number(info[3]) / 86400, "天)");
  console.log("- 上次支付时间:", new Date(Number(info[4]) * 1000).toISOString());
  console.log("- 合约状态:", info[5] ? "✅ 已激活" : "⏸️  未激活");
  console.log("- 合约余额:", ethers.formatEther(info[6]), "ETH");
  console.log("- 累计支付:", ethers.formatEther(info[7]), "ETH");
  console.log("- 支付次数:", info[8].toString(), "次");
  
  if (nextPaymentTime > 0) {
    console.log("- 下次支付时间:", new Date(Number(nextPaymentTime) * 1000).toISOString());
  } else {
    console.log("- 下次支付时间: 未安排");
  }
}

/**
 * 充值资金到合约
 */
async function depositFunds(contract: any, ethers: any) {
  const depositAmount = process.env.DEPOSIT_AMOUNT || "5.0"; // 默认充值 5 ETH
  
  console.log(`💰 充值 ${depositAmount} ETH 到合约...\n`);

  const tx = await contract.depositFunds({
    value: ethers.parseEther(depositAmount),
  });

  console.log("交易哈希:", tx.hash);
  console.log("等待交易确认...");

  await tx.wait();

  console.log("✅ 充值成功!");
  
  const balance = await contract.getBalance();
  console.log("合约当前余额:", ethers.formatEther(balance), "ETH");
}

/**
 * 激活合约
 */
async function activateContract(contract: any) {
  console.log("🚀 激活合约（开始自动支付）...\n");

  const tx = await contract.activateContract();

  console.log("交易哈希:", tx.hash);
  console.log("等待交易确认...");

  await tx.wait();

  console.log("✅ 合约已激活!");
  console.log("定期支付已开始，Chainlink Automation 将自动执行转账。");
}

/**
 * 停用合约
 */
async function deactivateContract(contract: any) {
  console.log("⏸️  停用合约（停止自动支付）...\n");

  const tx = await contract.deactivateContract();

  console.log("交易哈希:", tx.hash);
  console.log("等待交易确认...");

  await tx.wait();

  console.log("✅ 合约已停用!");
  console.log("定期支付已停止。");
}

/**
 * 提取资金
 */
async function withdrawFunds(contract: any, ethers: any) {
  const withdrawAmount = process.env.WITHDRAW_AMOUNT;
  
  if (!withdrawAmount) {
    console.log("❌ 请设置 WITHDRAW_AMOUNT 环境变量");
    return;
  }

  console.log(`💸 提取 ${withdrawAmount} ETH 从合约...\n`);

  const tx = await contract.withdrawFunds(ethers.parseEther(withdrawAmount));

  console.log("交易哈希:", tx.hash);
  console.log("等待交易确认...");

  await tx.wait();

  console.log("✅ 提取成功!");
}

/**
 * 检查是否需要执行支付（模拟 Chainlink Automation）
 */
async function checkUpkeep(contract: any) {
  console.log("🔍 检查是否需要执行支付...\n");

  const [upkeepNeeded] = await contract.checkUpkeep("0x");

  console.log("是否需要执行:", upkeepNeeded ? "✅ 是" : "❌ 否");

  if (upkeepNeeded) {
    console.log("\n合约满足执行条件，可以调用 performUpkeep()");
  } else {
    console.log("\n合约不满足执行条件，请检查：");
    console.log("1. 合约是否已激活");
    console.log("2. 是否已过支付间隔");
    console.log("3. 合约余额是否充足");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 执行失败:", error);
    process.exit(1);
  });

