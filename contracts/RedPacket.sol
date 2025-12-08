// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// 引入 ERC20 接口，因为我们要转 USDT/Token
interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract RedPacket {
    address public admin;           // 管理员（发红包的人）
    address public router;          // 路由合约地址（只允许 Router 调用消费接口）
    IERC20 public paymentToken;     // 比如 USDT 的地址

    // 红包结构体
    struct Packet {
        uint256 id;
        uint256 amount;        // 面额：1 USDT
        uint256 minSpend;      // 门槛：满 10 USDT
        uint256 expireTime;    // 过期时间
        uint256 limitMCC;      // 限制商户类型 (5812)
        bool isUsed;           // 是否已用
        address owner;         // 归属人
    }

    mapping(uint256 => Packet) public packets; // 存储所有红包

    // 事件
    event Issued(uint256 id, address owner, uint256 amount);
    event Consumed(uint256 id, address user, address merchant);

    constructor(address _token) {
        admin = msg.sender;
        paymentToken = IERC20(_token);
    }

    // 设置 Router 地址
    function setRouter(address _router) external {
        require(msg.sender == admin);
        router = _router;
    }

    // === 1. 发行红包 (Issue) ===
    // 必须先把 USDT 充值到这个合约里，才能发
    function issue(
        uint256 _id, 
        uint256 _amount, 
        uint256 _minSpend, 
        uint256 _days, 
        uint256 _mcc, 
        address _owner
    ) external {
        require(msg.sender == admin, "Only Admin");
        
        packets[_id] = Packet({
            id: _id,
            amount: _amount,
            minSpend: _minSpend,
            expireTime: block.timestamp + (_days * 1 days),
            limitMCC: _mcc,
            isUsed: false,
            owner: _owner
        });
        
        emit Issued(_id, _owner, _amount);
    }

    // === 2. 供 Router 调用的消费接口 (Consume) ===
    function consumeFromRouter(
        uint256 _packetId, 
        address _user, 
        address _merchant, 
        uint256 _orderTotal, 
        uint256 _merchantMCC
    ) external {
        // 安全校验：只允许 Router 调用！防止别人直接调这个接口偷钱
        require(msg.sender == router, "Only Router can call");

        Packet storage p = packets[_packetId];

        // 规则校验
        require(p.owner == _user, "Not your packet");
        require(!p.isUsed, "Already used");
        require(block.timestamp <= p.expireTime, "Expired");
        require(_orderTotal >= p.minSpend, "Spend not enough"); // 满10
        require(_merchantMCC == p.limitMCC, "Wrong merchant type"); // 限商户

        // 状态变更
        p.isUsed = true;

        // 资金划转：从合约资金池 -> 商户
        require(paymentToken.transfer(_merchant, p.amount), "Transfer failed");

        emit Consumed(_packetId, _user, _merchant);
    }
}