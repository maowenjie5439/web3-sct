// cron-trigger.ts
import { network } from "hardhat";
import * as cron from "node-cron";

const CONTRACT_ADDRESS = "0x36B72f1662c5f512174a171b8Ce602920d98136C";

async function checkAndExecute() {
  const connection = await network.connect();
  const { ethers } = connection;
  
  const [signer] = await ethers.getSigners();
  const contract = await ethers.getContractAt("RecurringPayment", CONTRACT_ADDRESS);
  
  // 检查是否需要执行
  const [upkeepNeeded] = await contract.checkUpkeep("0x");
  
  if (upkeepNeeded) {
    console.log("执行支付...");
    const tx = await contract.performUpkeep("0x");
    await tx.wait();
    console.log("✅ 支付完成:", tx.hash);
  } else {
    console.log("暂无需要执行的支付");
  }
}

// 每分钟执行一次
cron.schedule("* * * * *", () => {
  console.log("触发定期检查...");
  checkAndExecute().catch(console.error);
});

console.log("⏰ Cron 任务已启动，每分钟执行一次");