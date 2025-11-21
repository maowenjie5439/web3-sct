import { ethers } from "hardhat";

const main = async () => {
    // 1. 创建合约工厂
    // "FundMe" 必须和你的合约名字完全一致 (Contracts/FundMe.sol 中的 contract FundMe)
    const fundMeFactory = await ethers.getContractFactory("FundMe");

    // 2. 部署合约
    console.log("正在部署合约...");
    // FundMe 的构造函数需要一个参数 (lockDuration)，这里假设为 100 秒
    const fundMe = await fundMeFactory.deploy(100); 
    
    // 3. 等待部署完成
    await fundMe.waitForDeployment();

    console.log(`FundMe 合约已部署到: ${fundMe.target}`);
}

// 执行 main 函数并处理错误
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});