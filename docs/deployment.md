# 部署与验证指引

## 环境准备

1. 安装依赖  
   ```bash
   npm install
   npm install --save-dev @nomicfoundation/hardhat-verify
   ```
2. 配置 `.env`（可参考 `env.example`）：  
   ```
   SEPOLIA_RPC_URL=
   SEPOLIA_PRIVATE_KEY=
   CONFLUX_RPC_URL=
   CONFLUX_PRIVATE_KEY=
   CONFLUXSCAN_API_KEY=confluxscan-placeholder-key
   ```
   - Sepolia：可用 Infura/Alchemy RPC，私钥需有测试 ETH。  
   - Conflux eSpace Testnet：RPC 可用 `https://evm.confluxrpc.com` 或官方节点，私钥需在 eSpace 里有 CFX。  
   - `CONFLUXSCAN_API_KEY` 目前可填占位值，若申请到正式 key 再替换。

## 部署命令

### 方式一：使用 Hardhat Ignition（推荐）

Hardhat 3 官方推荐使用 Ignition 模块进行部署，支持声明式配置和更好的状态管理。

#### 本地 Hardhat 网络
```bash
npx hardhat ignition deploy ignition/modules/FundMe.ts
```

#### Sepolia 测试网
```bash
npx hardhat ignition deploy ignition/modules/FundMe.ts --network sepolia
```

#### Conflux eSpace 测试网
```bash
npx hardhat ignition deploy ignition/modules/FundMe.ts --network confluxESpace
```

#### 自定义构造函数参数
```bash
npx hardhat ignition deploy ignition/modules/FundMe.ts --network sepolia --parameters '{"FundMeModule":{"initialTarget":200}}'
```

### 方式二：使用传统部署脚本

#### 本地 Hardhat 网络
```bash
npx hardhat run scripts/deployFuneMe.ts
```
> 只运行在内存链上，进程结束部署即消失。

#### Sepolia 测试网
```bash
npx hardhat run scripts/deployFuneMe.ts --network sepolia
```
要求 `.env` 中的 `SEPOLIA_RPC_URL` 与 `SEPOLIA_PRIVATE_KEY` 已配置且账户有 gas 费。

### Conflux eSpace Testnet
```bash
npx hardhat run scripts/deployFuneMe.ts --network confluxESpace
```
确保 `.env` 中 `CONFLUX_RPC_URL`、`CONFLUX_PRIVATE_KEY` 指向 eSpace 账户；若在 Core Space 领取了测试币，需先桥接到 eSpace。

## 合约验证

### Conflux eSpace（ConfluxScan）

#### 命令行（Hardhat Verify）
```bash
npx hardhat verify --network confluxESpace <合约地址> "<构造参数>"
```
示例：
```bash
npx hardhat verify --network confluxESpace 0xF48A75ea6f80C02C64deC4eacdd5783a5249c6dA "120"
```
若 ConfluxScan 返回 `bytecode_length_mismatch` 可检查：
- 部署时的构造参数是否与命令一致。
- `hardhat.config.ts` 的编译器版本与优化设置是否与部署时相同。
- 目标地址是否确实由当前源码部署。

#### 网页手动验证
1. 生成扁平化源码
   ```bash
   mkdir -p flattened
   npx hardhat flatten contracts/FundMe.sol > flattened/FundMe_flat.sol
   # 如果文件第一行包含 dotenv 提示，手动删除
   ```
2. 打开 https://evmtestnet.confluxscan.org/ ，进入目标合约页面点击 “Verify & Publish”。  
3. 选择 `Solidity (Multi-file)` 或 `Flattened` 模式，粘贴 `FundMe_flat.sol` 的内容。  
4. 设置编译选项：
   - Compiler 版本：`0.8.20`  
   - 优化：`是`，运行次数 `200`  
   - License：`MIT`  
   - 合约名称：`FundMe`  
   - 构造参数：`["100"]`  
5. 提交后等待结果；若遇到 `contract_not_found_in_compiler_output`，检查合约名称是否正确，或改用 `Standard JSON Input` 模式，粘贴 `artifacts/build-info/*.json` 中的完整内容，并把合约名写为 `contracts/FundMe.sol:FundMe`。
6. 若仍出现 `bytecode_length_mismatch` 或 `compiler_error`，多半是 ConfluxScan 的编译器与项目不匹配，记录地址与版本信息反馈官方支持。

### Sepolia（Etherscan）
Hardhat toolbox 自带 Etherscan 配置，可在 `.env` 中新增 `ETHERSCAN_API_KEY` 并运行：
```bash
npx hardhat verify --network sepolia <合约地址> "<构造参数>"
```

## 自定义任务：与合约交互

项目中实现了自定义 Hardhat Task `interact-fundme`，用于测试部署后的 FundMe 合约。

### 创建步骤

1. **定义任务** (`tasks/interact-fundme.ts`)：
   ```typescript
   import { task } from "hardhat/config";
   import type { HardhatRuntimeEnvironment } from "hardhat/types/hre";

   const interactFundMeTask = task(["interact-fundme"], "Interact with FundMe contract")
       .addOption({
           name: "addr",
           description: "FundMe contract address",
           defaultValue: "",
       })
       .setAction(async () => {
           return {
               default: async (taskArgs: { addr: string }, hre: HardhatRuntimeEnvironment) => {
                   const { network } = hre;
                   const connection = await network.connect();
                   const { ethers } = connection;
                   // ... 任务逻辑
               }
           };
       })
       .build();
   
   export default interactFundMeTask;
   ```

2. **注册任务** (`hardhat.config.ts`)：
   ```typescript
   import interactFundMeTask from "./tasks/interact-fundme.js";
   
   export default defineConfig({
       tasks: [interactFundMeTask],
       // ... 其他配置
   });
   ```

### 使用方法

```bash
npx hardhat interact-fundme --network confluxESpace --addr 0x你的合约地址
```

- `--network`：指定合约所在网络（必须与部署时一致）
- `--addr`：合约地址

### Hardhat 3 Task API 特点

- **任务 ID**：使用数组表示层级，如 `["interact-fundme"]` 或 `["verify", "etherscan"]`
- **Lazy Loading**：`setAction()` 返回 `{ default: Function }` 支持延迟加载
- **Builder 模式**：链式调用 `.addOption()` → `.setAction()` → `.build()`
- **类型安全**：通过 TypeScript 类型参数推断任务参数类型

## 常见问题

- **insufficient funds**：账户网络余额不足，需到对应 faucet 或桥接测试币。  
- **链 ID 不匹配 (HHE708)**：RPC 指向的网络与配置 `chainId` 不一致，确认是否使用主网/测试网正确 RPC。  
- **HHE80001 / 404**：`chainDescriptors` 的 `apiUrl` 必须包含 `/api` 后缀，例如 `https://evmapi-testnet.confluxscan.org/api`。  
- **私钥格式错误 (HHE15)**：`CONFLUX_PRIVATE_KEY`、`SEPOLIA_PRIVATE_KEY` 必须是带 `0x` 的 64 位十六进制字符串。
- **execution reverted**：合约调用失败，检查锁定期是否过期、价格源是否可用、金额是否满足最小值等。

