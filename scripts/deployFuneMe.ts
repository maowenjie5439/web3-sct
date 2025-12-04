import hre, { network } from "hardhat";

const main = async () => {
    // 0. 连接到默认网络并获取 ethers 插件
    const connection = await network.connect();
    const { ethers } = connection;

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
    // 等待5个区块确认
    console.log("等待5个区块确认...");
    await fundMe.deploymentTransaction()?.wait(5);
    console.log("✅ 已等待5个区块确认完成");

    // 4. 尝试自动验证（仅在非本地网络）
    const networkName = connection.networkName;
    
    if (networkName !== "hardhat") {
        console.log(`\n正在 ${networkName} 上执行验证...`);
        try {
            const verifyTask = hre.tasks.getTask(["verify", "etherscan"]);
            await verifyTask.run({
                address: fundMe.target as string,
                constructorArgs: ["100"],
            });
            console.log("✅ 合约验证成功！");
        } catch (verifyError: any) {
            console.warn("⚠️  自动验证失败:", verifyError.message);
            console.log(`请手动运行: npx hardhat verify --network ${networkName} ${fundMe.target} 100`);
        }
    }else{
        console.log("在hardhat本地网络上，无需验证");
    }
}

// 执行 main 函数并处理错误
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});