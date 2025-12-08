import hre, { network } from "hardhat";

/**
 * 部署定期支付合约脚本
 * 使用场景：租户 A 每天向公司 B 支付 1 ETH
 */
async function main() {
  console.log("========================================");
  console.log("开始部署定期支付合约系统...");
  console.log("========================================\n");

  // 连接到网络并获取 ethers
  const connection = await network.connect();
  const { ethers } = connection;

  // 获取账户
  // deployer (账户 0) = 部署方，负责部署合约
  // tenant (账户 1) = 租户，负责充值和支付操作
  const [deployer, tenant] = await ethers.getSigners();
  
  console.log("部署方账户:", deployer.address);
  const deployerBalance = await ethers.provider.getBalance(deployer.address);
  console.log("部署方余额:", ethers.formatEther(deployerBalance), "ETH");
  
  console.log("租户账户:", tenant.address);
  const tenantBalance = await ethers.provider.getBalance(tenant.address);
  console.log("租户余额:", ethers.formatEther(tenantBalance), "ETH\n");

  // ==================== 配置参数 ====================
  
  // 租户地址（支付方）= 账户 1
  const TENANT_ADDRESS = tenant.address;
  
  // 公司地址（接收方）= 可以指定或创建新地址
  const COMPANY_ADDRESS = process.env.COMPANY_ADDRESS || ethers.Wallet.createRandom().address;
  
  // 每次支付金额：1 ETH = 1000000000000000000 wei
  const PAYMENT_AMOUNT = ethers.parseEther("1.0"); // 1 ETH
  
  // 支付间隔：86400 秒 = 1 天（24小时）
  // 注意：UTC 9:00 的时间控制需要在 Chainlink Automation 上配置 Cron 表达式
//   const INTERVAL = 86400; // 1 天（秒）
  const INTERVAL = 300; // 5 minutes（秒）
  
  console.log("合约配置参数:");
  console.log("- 租户地址 (Tenant):", TENANT_ADDRESS);
  console.log("- 公司地址 (Company):", COMPANY_ADDRESS);
  console.log("- 支付金额 (Payment Amount):", ethers.formatEther(PAYMENT_AMOUNT), "ETH");
  console.log("- 支付间隔 (Interval):", INTERVAL, "秒 (", INTERVAL / 86400, "天)\n");

  // ==================== 部署合约 ====================
  
  console.log("正在部署 RecurringPayment 合约...");
  
  const RecurringPayment = await ethers.getContractFactory("RecurringPayment");
  const recurringPayment = await RecurringPayment.deploy(
    TENANT_ADDRESS,
    COMPANY_ADDRESS,
    PAYMENT_AMOUNT,
    INTERVAL
  );

  await recurringPayment.waitForDeployment();
  const contractAddress = await recurringPayment.getAddress();

  console.log("✅ RecurringPayment 合约部署成功!");
  console.log("合约地址:", contractAddress);
  
  // 等待 5 个区块确认
  console.log("等待 5 个区块确认...");
  await recurringPayment.deploymentTransaction()?.wait(5);
  console.log("✅ 已等待 5 个区块确认完成");

  // ==================== 自动验证合约 ====================
  
  const networkName = connection.networkName;
  
  if (networkName !== "hardhat" && networkName !== "hardhatMainnet" && networkName !== "hardhatOp") {
    console.log(`\n正在 ${networkName} 上执行合约验证...`);
    try {
      const verifyTask = hre.tasks.getTask(["verify", "etherscan"]);
      await verifyTask.run({
        address: contractAddress as string,
        constructorArgs: [
          TENANT_ADDRESS,
          COMPANY_ADDRESS,
          PAYMENT_AMOUNT.toString(),
          INTERVAL.toString()
        ],
      });
      console.log("✅ 合约验证成功！");
    } catch (verifyError: any) {
      console.warn("⚠️  自动验证失败:", verifyError.message);
      console.log(`\n请手动运行验证命令:`);
      console.log(`npx hardhat verify --network ${networkName} ${contractAddress} "${TENANT_ADDRESS}" "${COMPANY_ADDRESS}" "${PAYMENT_AMOUNT.toString()}" "${INTERVAL.toString()}"`);
    }
  } else {
    console.log("在本地网络上部署，无需验证");
  }

  console.log("\n========================================");
  console.log("部署完成！");
  console.log("========================================\n");

  // ==================== 后续操作说明 ====================
  
  console.log("📋 后续操作步骤：\n");
  
  console.log("1️⃣ 租户充值资金到合约：");
  console.log(`   OPERATION=deposit DEPOSIT_AMOUNT=30 npx hardhat run scripts/interact_recurring_payment.ts --network confluxESpace`);
  console.log(`   （脚本会自动使用租户账户）`);
  console.log(`   建议充值金额：至少 ${ethers.formatEther(PAYMENT_AMOUNT)} ETH × 预期支付天数\n`);
  
  console.log("2️⃣ 租户激活合约：");
  console.log(`   OPERATION=activate npx hardhat run scripts/interact_recurring_payment.ts --network confluxESpace`);
  console.log(`   （脚本会自动使用租户账户）\n`);
  
  console.log("3️⃣ 在 Chainlink Automation 上注册合约：");
  console.log("   - 访问: https://automation.chain.link/");
  console.log(`   - 注册自定义逻辑 Upkeep`);
  console.log(`   - Target contract address: ${contractAddress}`);
  console.log(`   - 选择网络: Sepolia (或 Goerli 如果可用)`);
  console.log(`   - 使用 Cron 表达式设置每天 UTC 9:00 执行:`);
  console.log(`     0 9 * * * (每天 UTC 9:00)`);
  console.log(`   - 充值 LINK 代币以支付 Automation 服务费\n`);
  
  console.log("4️⃣ 监控合约：");
  console.log(`   OPERATION=info npx hardhat run scripts/interact_recurring_payment.ts --network confluxESpace\n`);
  
  console.log("5️⃣ 停用合约（如需要）：");
  console.log(`   停用: OPERATION=deactivate npx hardhat run scripts/interact_recurring_payment.ts --network confluxESpace`);
  console.log(`   提取: OPERATION=withdraw WITHDRAW_AMOUNT=10 npx hardhat run scripts/interact_recurring_payment.ts --network confluxESpace`);
  console.log(`   （脚本会自动使用租户账户）\n`);

  // ==================== 合约信息汇总 ====================
  
  console.log("========================================");
  console.log("合约部署信息汇总");
  console.log("========================================");
  console.log("合约地址:", contractAddress);
  console.log("租户地址:", TENANT_ADDRESS);
  console.log("公司地址:", COMPANY_ADDRESS);
  console.log("支付金额:", ethers.formatEther(PAYMENT_AMOUNT), "ETH");
  console.log("支付间隔:", INTERVAL / 86400, "天");
  console.log("========================================\n");

  // ==================== 保存部署信息 ====================
  
  const deploymentInfo = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    contractAddress: contractAddress,
    tenantAddress: TENANT_ADDRESS,
    companyAddress: COMPANY_ADDRESS,
    paymentAmount: ethers.formatEther(PAYMENT_AMOUNT),
    interval: INTERVAL,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
  };

  console.log("📄 部署信息（JSON 格式）：");
  console.log(JSON.stringify(deploymentInfo, null, 2));
  console.log("\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 部署失败:", error);
    process.exit(1);
  });

