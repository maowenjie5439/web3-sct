// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title RecurringPayment
 * @dev 定期自动支付合约 - 使用 Chainlink Automation
 * @notice 每天 UTC 9:00 从租户账户向公司账户转账固定金额
 */
contract RecurringPayment {
    // 状态变量
    address public tenant;           // 租户地址（支付方）
    address public company;          // 公司地址（接收方）
    uint256 public paymentAmount;    // 每次支付金额（单位：wei）
    uint256 public interval;         // 支付间隔时间（单位：秒）
    uint256 public lastPaymentTime;  // 上次支付时间
    bool public isActive;            // 合约是否激活
    uint256 public totalPaid;        // 累计已支付金额
    uint256 public paymentCount;     // 支付次数

    // 事件
    event PaymentExecuted(
        address indexed from,
        address indexed to,
        uint256 amount,
        uint256 timestamp,
        uint256 paymentNumber
    );
    event ContractActivated(uint256 timestamp);
    event ContractDeactivated(uint256 timestamp);
    event FundsDeposited(address indexed from, uint256 amount, uint256 timestamp);
    event FundsWithdrawn(address indexed to, uint256 amount, uint256 timestamp);

    // 修饰器
    modifier onlyTenant() {
        require(msg.sender == tenant, "Only tenant can call this");
        _;
    }

    modifier onlyCompany() {
        require(msg.sender == company, "Only company can call this");
        _;
    }

    /**
     * @dev 构造函数
     * @param _tenant 租户地址
     * @param _company 公司地址
     * @param _paymentAmount 每次支付金额（单位：wei）
     * @param _interval 支付间隔（单位：秒，默认 86400 = 1天）
     */
    constructor(
        address _tenant,
        address _company,
        uint256 _paymentAmount,
        uint256 _interval
    ) {
        require(_tenant != address(0), "Invalid tenant address");
        require(_company != address(0), "Invalid company address");
        require(_tenant != _company, "Tenant and company must be different");
        require(_paymentAmount > 0, "Payment amount must be greater than 0");
        require(_interval > 0, "Interval must be greater than 0");

        tenant = _tenant;
        company = _company;
        paymentAmount = _paymentAmount;
        interval = _interval;
        isActive = false;
        totalPaid = 0;
        paymentCount = 0;
        lastPaymentTime = 0;
    }

    /**
     * @dev Chainlink Automation 调用此函数检查是否需要执行支付
     * @return upkeepNeeded 是否需要执行
     * @return performData 执行数据（此处未使用）
     */
    function checkUpkeep(bytes calldata checkData)
        external
        view
        returns (bool upkeepNeeded, bytes memory performData)
    {
        // 检查条件：
        // 1. 合约已激活
        // 2. 已过支付间隔时间
        // 3. 合约有足够的余额
        upkeepNeeded = isActive &&
            (block.timestamp >= lastPaymentTime + interval) &&
            address(this).balance >= paymentAmount;

        return (upkeepNeeded, "");
    }

    /**
     * @dev Chainlink Automation 调用此函数执行支付
     * @param performData 执行数据（此处未使用）
     */
    function performUpkeep(bytes calldata performData) external {
        // 再次验证条件（防止重入攻击）
        require(isActive, "Contract is not active");
        require(
            block.timestamp >= lastPaymentTime + interval,
            "Payment interval not reached"
        );
        require(
            address(this).balance >= paymentAmount,
            "Insufficient contract balance"
        );

        // 执行支付
        lastPaymentTime = block.timestamp;
        paymentCount++;
        totalPaid += paymentAmount;

        // 转账给公司
        (bool success, ) = company.call{value: paymentAmount}("");
        require(success, "Payment transfer failed");

        emit PaymentExecuted(tenant, company, paymentAmount, block.timestamp, paymentCount);
    }

    /**
     * @dev 租户激活合约（开始自动支付）
     */
    function activateContract() external onlyTenant {
        require(!isActive, "Contract is already active");
        require(address(this).balance >= paymentAmount, "Insufficient balance to activate");

        isActive = true;
        lastPaymentTime = block.timestamp;

        emit ContractActivated(block.timestamp);
    }

    /**
     * @dev 租户停用合约（停止自动支付）
     */
    function deactivateContract() external onlyTenant {
        require(isActive, "Contract is already inactive");

        isActive = false;

        emit ContractDeactivated(block.timestamp);
    }

    /**
     * @dev 租户向合约存入资金
     */
    function depositFunds() external payable onlyTenant {
        require(msg.value > 0, "Deposit amount must be greater than 0");

        emit FundsDeposited(msg.sender, msg.value, block.timestamp);
    }

    /**
     * @dev 租户提取剩余资金（仅在合约未激活时）
     */
    function withdrawFunds(uint256 amount) external onlyTenant {
        require(!isActive, "Cannot withdraw while contract is active");
        require(amount > 0, "Withdrawal amount must be greater than 0");
        require(address(this).balance >= amount, "Insufficient contract balance");

        (bool success, ) = tenant.call{value: amount}("");
        require(success, "Withdrawal transfer failed");

        emit FundsWithdrawn(tenant, amount, block.timestamp);
    }

    /**
     * @dev 获取合约余额
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev 获取下次支付时间
     */
    function getNextPaymentTime() external view returns (uint256) {
        if (!isActive || lastPaymentTime == 0) {
            return 0;
        }
        return lastPaymentTime + interval;
    }

    /**
     * @dev 获取合约信息
     */
    function getContractInfo()
        external
        view
        returns (
            address _tenant,
            address _company,
            uint256 _paymentAmount,
            uint256 _interval,
            uint256 _lastPaymentTime,
            bool _isActive,
            uint256 _balance,
            uint256 _totalPaid,
            uint256 _paymentCount
        )
    {
        return (
            tenant,
            company,
            paymentAmount,
            interval,
            lastPaymentTime,
            isActive,
            address(this).balance,
            totalPaid,
            paymentCount
        );
    }

    /**
     * @dev 接收 ETH
     */
    receive() external payable {
        emit FundsDeposited(msg.sender, msg.value, block.timestamp);
    }
}

