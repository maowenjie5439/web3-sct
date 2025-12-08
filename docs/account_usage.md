# 账户使用说明

## 📌 账户角色

在 `hardhat.config.ts` 中配置的两个账户：

```typescript
accounts: [CONFLUX_PRIVATE_KEY1, CONFLUX_PRIVATE_KEY2]
//         ↓                    ↓
//      账户 0 (部署方)      账户 1 (租户)
```

| 索引 | 环境变量 | 角色 | 用途 |
|------|---------|------|------|
| 0 | `CONFLUX_PRIVATE_KEY1` | 部署方 | 部署合约 |
| 1 | `CONFLUX_PRIVATE_KEY2` | 租户 | 充值、激活、停用、提取 |

## 🔧 脚本自动选择账户

### 部署脚本 (`deploy_recurring_payment.ts`)

```typescript
const [deployer, tenant] = await ethers.getSigners();
// deployer = 账户 0，用于部署合约
// tenant = 账户 1，其地址作为合约的租户参数
```

- 使用 **账户 0** 部署合约
- 将 **账户 1 的地址** 设置为合约的租户地址

### 交互脚本 (`interact_recurring_payment.ts`)

**自动根据操作类型选择账户**：

```typescript
// 租户操作使用账户 1
const tenantOperations = ["deposit", "activate", "deactivate", "withdraw"];

// 其他操作使用账户 0
```

| 操作 | 使用账户 | 说明 |
|------|---------|------|
| `info` | 账户 0 | 查询信息（任何人都可以） |
| `deposit` | **账户 1** | 租户充值 |
| `activate` | **账户 1** | 租户激活合约 |
| `deactivate` | **账户 1** | 租户停用合约 |
| `withdraw` | **账户 1** | 租户提取资金 |
| `checkUpkeep` | 账户 0 | 检查执行条件（任何人都可以） |

## 🚀 使用示例

### 1. 部署合约

```bash
npx hardhat run scripts/deploy_recurring_payment.ts --network confluxESpace
```

**自动使用**：账户 0 部署，账户 1 作为租户

### 2. 租户充值

```bash
OPERATION=deposit DEPOSIT_AMOUNT=30 npx hardhat run scripts/interact_recurring_payment.ts --network confluxESpace
```

**自动使用**：账户 1（租户）

### 3. 租户激活

```bash
OPERATION=activate npx hardhat run scripts/interact_recurring_payment.ts --network confluxESpace
```

**自动使用**：账户 1（租户）

### 4. 查询信息

```bash
OPERATION=info npx hardhat run scripts/interact_recurring_payment.ts --network confluxESpace
```

**自动使用**：账户 0（但任何人都可以查询）

### 5. 租户停用

```bash
OPERATION=deactivate npx hardhat run scripts/interact_recurring_payment.ts --network confluxESpace
```

**自动使用**：账户 1（租户）

### 6. 租户提取

```bash
OPERATION=withdraw WITHDRAW_AMOUNT=10 npx hardhat run scripts/interact_recurring_payment.ts --network confluxESpace
```

**自动使用**：账户 1（租户）

## ✅ 优势

1. **无需手动指定账户**：脚本自动根据操作类型选择正确的账户
2. **减少错误**：避免使用错误账户导致的权限错误
3. **简化使用**：用户只需关注操作类型，不用管账户索引

## 💡 工作原理

```typescript
// 在 interact_recurring_payment.ts 中

// 1. 获取所有账户
const accounts = await ethers.getSigners();

// 2. 根据操作类型选择账户
const tenantOperations = ["deposit", "activate", "deactivate", "withdraw"];
const accountIndex = tenantOperations.includes(operation) ? 1 : 0;
const signer = accounts[accountIndex];

// 3. 使用选定的账户连接合约
const recurringPayment = await ethers.getContractAt(
  "RecurringPayment",
  CONTRACT_ADDRESS,
  signer  // 重点：指定使用哪个账户
);
```

## ⚠️ 注意事项

1. **必须配置两个私钥**：
   ```bash
   CONFLUX_PRIVATE_KEY1=部署方私钥
   CONFLUX_PRIVATE_KEY2=租户私钥
   ```

2. **部署方只部署，不参与后续操作**：
   - 部署方的作用仅是部署合约
   - 所有资金操作由租户执行

3. **公司账户**：
   - 只是被动接收转账
   - 不需要执行任何操作

## 📊 完整流程

```bash
# 1. 配置 .env 文件（两个私钥）
CONFLUX_PRIVATE_KEY1=0x...  # 部署方
CONFLUX_PRIVATE_KEY2=0x...  # 租户

# 2. 部署（自动使用账户 0）
npx hardhat run scripts/deploy_recurring_payment.ts --network confluxESpace

# 3. 更新 CONTRACT_ADDRESS

# 4. 充值（自动使用账户 1）
OPERATION=deposit DEPOSIT_AMOUNT=30 npx hardhat run scripts/interact_recurring_payment.ts --network confluxESpace

# 5. 激活（自动使用账户 1）
OPERATION=activate npx hardhat run scripts/interact_recurring_payment.ts --network confluxESpace

# 6. 查询（自动使用账户 0）
OPERATION=info npx hardhat run scripts/interact_recurring_payment.ts --network confluxESpace
```

就是这么简单！脚本会自动处理一切！🎉

