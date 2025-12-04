// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {FundMe} from "./FundMe.sol";
// 1. 让fundme合约的参与者，基于mapping领取特定数量的token
// 2. 实现转账token的功能
// 3. 使用完成后，需要burn token

contract FundTokenERC20 is ERC20{
    FundMe private fundMe;

    constructor(address fundMeAddr) ERC20("FundTokenERC20", "FT") {
        fundMe = FundMe(fundMeAddr);
    }


    /**
     * 给众筹者mint积分
     * @param amt 需要mint的积分数量
     */
    function mint(uint256 amt) external{
        // 只有众筹完成后才能得到积分
        require(fundMe.isFundSuccess(), unicode"众筹未成功");
        require(fundMe.acctBals(msg.sender) >= amt ,unicode"账户没有足够的余额");

        _mint(msg.sender, amt);
        fundMe.setFundToAmt(msg.sender, fundMe.acctBals(msg.sender) - amt);
    }

    /**
     * 兑换积分
     * @param amtToClaim 需要兑换的积分数量
     */
    function claim(uint256 amtToClaim) external {
        require(fundMe.isFundSuccess(), unicode"众筹未成功");
        require(balanceOf(msg.sender) >= amtToClaim, unicode"账户没有足够积分");
        // TODO 积分兑换成其他东西
        // 将积分burn掉
        _burn(msg.sender, amtToClaim);
    }

}