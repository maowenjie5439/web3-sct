// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IRedPacket {
    function consumeFromRouter(
        uint256 id, address user, address merchant, uint256 total, uint256 mcc
    ) external;
}

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract PaymentRouter {
    IERC20 public paymentToken;     // USDT
    IRedPacket public redPacket;    // 红包合约

    constructor(address _token, address _redPacket) {
        paymentToken = IERC20(_token);
        redPacket = IRedPacket(_redPacket);
    }

    // === 用户调用的支付接口 ===
    // 参数：商户地址，订单总额(10)，红包ID(888)，商户MCC(5812)
    function pay(
        address merchant, 
        uint256 totalAmount, 
        uint256 packetId, 
        uint256 merchantMCC
    ) external {
        // 1. 查询红包面额 (这里简化为固定值，实际应该调红包合约查)
        // 假设我们知道红包是 1 USDT
        uint256 couponValue = 1 * 10**18; 
        
        // 2. 计算用户需要自付多少： 10 - 1 = 9
        uint256 userPay = totalAmount - couponValue;

        // 3. 【自付部分】从用户 -> 商户
        // 前提：用户必须先 Approve Router 合约
        require(paymentToken.transferFrom(msg.sender, merchant, userPay), "User payment failed");

        // 4. 【红包部分】调用红包合约
        // 这一步如果失败（比如红包过期），整笔交易会 Revert，上面的 9 块钱也会退回去
        redPacket.consumeFromRouter(
            packetId, 
            msg.sender, // 谁在付钱
            merchant, 
            totalAmount,// 传总额进去做校验
            merchantMCC
        );
    }
}