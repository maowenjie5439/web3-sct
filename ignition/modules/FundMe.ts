import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * FundMe 合约部署模块
 * 
 * Hardhat Ignition 使用声明式的方式定义部署逻辑：
 * 1. 通过 buildModule 创建部署模块
 * 2. 使用 Module Builder (m) 声明部署步骤
 * 3. Ignition 会自动处理部署顺序、状态追踪和错误恢复
 */
const FundMeModule = buildModule("FundMeModule", (m) => {
  /**
   * 获取构造函数参数
   * 
   * m.getParameter("参数名", 默认值) 允许在部署时动态传入参数：
   * - 如果不传参数，使用默认值 100
   * - 可通过 --parameters 选项传入：
   *   npx hardhat ignition deploy ignition/modules/FundMe.ts --parameters '{"FundMeModule":{"initialTarget":200}}'
   * 
   * 这种方式比硬编码更灵活，可以在不同网络使用不同参数
   */
  const initialTarget = m.getParameter("initialTarget", 100);

  /**
   * 部署 FundMe 合约
   * 
   * m.contract("合约名", [构造函数参数数组]) 会：
   * 1. 自动编译合约（如果需要）
   * 2. 使用配置的账户（默认第一个账户）作为 deployer
   * 3. 部署合约并等待确认
   * 4. 记录部署状态到 ignition/deployments/ 目录
   * 5. 返回合约实例的 Future 对象，供后续步骤使用
   * 
   * 如果部署中断，重新运行命令会从上次中断的地方继续，不会重复部署
   */
  const fundMe = m.contract("FundMe", [initialTarget]);

  /**
   * 返回部署的合约实例
   * 
   * 返回的对象会：
   * 1. 在部署完成后显示合约地址
   * 2. 可以在其他模块中引用这些合约实例
   * 3. 可以在测试或脚本中导入使用
   * 
   * 例如在其他模块中：
   *   import FundMeModule from "./FundMe";
   *   const { fundMe } = m.useModule(FundMeModule);
   *   m.call(fundMe, "fund", [], { value: ethers.parseEther("1.0") });
   */
  return { fundMe };
});

export default FundMeModule;

