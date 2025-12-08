import { network } from "hardhat";

async function main() {
  const connection = await network.connect();
  const { ethers } = connection;
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // 1. 部署 MockUSDT (钱)
  const MockUSDT = await ethers.getContractFactory("MockUSDT");
  const usdtContract = await MockUSDT.deploy();
  await usdtContract.waitForDeployment();
  const usdtAddr = await usdtContract.getAddress();
  console.log("MockUSDT deployed to:", usdtAddr);
  
  // 获取带类型的合约实例
  const usdt = await ethers.getContractAt("MockUSDT", usdtAddr);

  // 2. 部署 RedPacket (红包资金池)
  const RedPacket = await ethers.getContractFactory("RedPacket");
  // 构造函数传入 USDT 地址
  const redPacket = await RedPacket.deploy(usdtAddr); 
  await redPacket.waitForDeployment();
  const redPacketAddr = await redPacket.getAddress();
  console.log("RedPacket deployed to:", redPacketAddr);

  // 3. 部署 PaymentRouter (支付入口)
  const PaymentRouter = await ethers.getContractFactory("PaymentRouter");
  // 构造函数传入 USDT 地址 和 红包合约地址
  const router = await PaymentRouter.deploy(usdtAddr, redPacketAddr);
  await router.waitForDeployment();
  const routerAddr = await router.getAddress();
  console.log("PaymentRouter deployed to:", routerAddr);

  // === 初始化配置 ===
  console.log("\n--- Configuring ---");

  // 4. 将 Router 地址告诉 RedPacket 合约 (授权 Router 可以在这里扣钱)
  console.log("Setting Router address in RedPacket...");
  await redPacket.setRouter(routerAddr);

  // 5. 【关键步骤】管理员往红包合约里充值 1000 USDT (作为补贴资金)
  console.log("Charging RedPacket contract...");
  const chargeAmount = ethers.parseEther("1000");
  // 先把钱转给 RedPacket 合约
  await usdt.transfer(redPacketAddr, chargeAmount);
  
  // 打印余额验证
  const balance = await usdt.balanceOf(redPacketAddr);
  console.log(`RedPacket contract balance: ${ethers.formatEther(balance)} USDT`);

  console.log("\nDeployment and Setup Completed!");
  console.log("-----------------------------------");
  console.log(`npx hardhat verify --network <network> ${usdtAddr}`);
  console.log(`npx hardhat verify --network <network> ${redPacketAddr} ${usdtAddr}`);
  console.log(`npx hardhat verify --network <network> ${routerAddr} ${usdtAddr} ${redPacketAddr}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

