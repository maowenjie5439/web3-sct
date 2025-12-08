# 定期支付合约 - 快速开始

## 📦 项目文件

```
contracts/
  └── RecurringPayment.sol         # 定期支付合约
scripts/
  ├── deploy_recurring_payment.ts  # 部署脚本
  └── interact_recurring_payment.ts # 交互脚本
docs/
  └── recurring_payment_deployment.md # 详细部署文档
```

## 🚀 快速部署（本地测试）

### 1. 编译合约

```bash
npx hardhat compile
```

### 2. 本地测试网部署

```bash
npx hardhat run scripts/deploy_recurring_payment.ts --network hardhatMainnet
```

## 🌐 测试网部署（Sepolia）

### 1. 配置环境变量

编辑 `.env` 文件：

```bash
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
SEPOLIA_PRIVATE_KEY=your_private_key_here
```

### 2. 部署到 Sepolia

```bash
npx hardhat run scripts/deploy_recurring_payment.ts --network sepolia
```

### 3. 记录合约地址

部署成功后，复制输出的合约地址，例如：
```
合约地址: 0x1234567890123456789012345678901234567890
```

### 4. 修改交互脚本配置

编辑 `scripts/interact_recurring_payment.ts`：

```typescript
const CONTRACT_ADDRESS = "0x1234567890123456789012345678901234567890"; // 替换为实际地址
```

## 💰 合约操作

### 查看合约信息

```bash
OPERATION=info npx hardhat run scripts/interact_recurring_payment.ts --network sepolia
```

### 充值资金（例如充值 10 ETH）

```bash
OPERATION=deposit DEPOSIT_AMOUNT=10 npx hardhat run scripts/interact_recurring_payment.ts --network sepolia
```

### 激活合约（开始自动支付）

```bash
OPERATION=activate npx hardhat run scripts/interact_recurring_payment.ts --network sepolia
```

### 检查是否需要执行支付

```bash
OPERATION=checkUpkeep npx hardhat run scripts/interact_recurring_payment.ts --network sepolia
```

### 停用合约（停止自动支付）

```bash
OPERATION=deactivate npx hardhat run scripts/interact_recurring_payment.ts --network sepolia
```

### 提取资金（例如提取 5 ETH）

```bash
OPERATION=withdraw WITHDRAW_AMOUNT=5 npx hardhat run scripts/interact_recurring_payment.ts --network sepolia
```

## ⚙️ Chainlink Automation 配置

### 1. 访问 Chainlink Automation

打开：https://automation.chain.link/

### 2. 注册 Upkeep

- 选择 **"Register New Upkeep"**
- 选择 **"Custom logic"**
- 填写合约地址
- 选择 **Time-based** 触发
- Cron 表达式：`0 9 * * *`（每天 UTC 9:00）
- 充值 LINK 代币

### 3. Cron 表达式说明

```
0 9 * * *  - 每天 UTC 9:00
│ │ │ │ │
│ │ │ │ └─ 星期 (0-6, 0=周日)
│ │ │ └─── 月份 (1-12)
│ │ └───── 日期 (1-31)
│ └─────── 小时 (0-23)
└───────── 分钟 (0-59)
```

其他示例：
- `0 */6 * * *` - 每 6 小时执行一次
- `0 0 * * 1` - 每周一午夜执行
- `0 0 1 * *` - 每月 1 号午夜执行

## 📊 监控

### 方法 1: 命令行查询

```bash
OPERATION=info npx hardhat run scripts/interact_recurring_payment.ts --network sepolia
```

### 方法 2: 区块链浏览器

访问 https://sepolia.etherscan.io/ 输入合约地址查看：
- 交易历史
- 事件日志
- 余额变化

### 方法 3: Chainlink Dashboard

在 https://automation.chain.link/ 查看：
- 执行历史
- Gas 使用情况
- LINK 余额

## ⚠️ 重要提示

1. **充值金额**: 建议充值至少 30 ETH（用于 30 天支付）
2. **LINK 余额**: 确保 Chainlink Automation 有足够的 LINK 支付 Gas
3. **时区**: 所有时间都是 UTC 时间
4. **测试**: 先在测试网充分测试再使用主网

## 📖 详细文档

查看完整部署文档：[recurring_payment_deployment.md](docs/recurring_payment_deployment.md)

## 🆘 常见问题

**Q: 为什么支付没有自动执行？**

A: 检查：
1. 合约是否已激活 (`isActive = true`)
2. 合约余额是否充足
3. 是否已过支付间隔时间
4. Chainlink Automation 是否有足够的 LINK

**Q: 如何更改支付时间？**

A: 在 Chainlink Automation Dashboard 中修改 Cron 表达式。

**Q: 如何更改支付金额？**

A: 需要部署新合约，合约参数部署后无法修改。

---

**🎉 恭喜！您已成功部署定期支付合约！**

