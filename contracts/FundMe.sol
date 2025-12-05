// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

// 1. 创建一个收款函数
// 2. 记录投资人并且查看
// 3. 锁定期内达到目标值，可以提款
// 4. 没有达到目标值，在锁定期结束后退款

contract FundMe{
    AggregatorV3Interface internal dataFeed;

    mapping(address => uint256) public acctBals;

    // 单笔fund最小值 (0.01 CFX)
    uint256 SINGLE_MININUM_VALUE = 0.01 * 10 ** 18;

    // 提现最小余额 (0.1 CFX)
    uint256 WITHDRAW_MININUM_BALANCE = 0.1 * 10 ** 18;

    address public owner;

    // 合约部署时间
    uint256 immutable private deployTime;
    // 锁定期时长
    uint256 immutable private lockDuration;

    bool public isFundSuccess = false;

    address private erc20Addr;
    

    constructor(uint256 duration){
        // dataFeed = AggregatorV3Interface(0x5147eA642CAEF7BD9c1265AadcA78f997AbB9649);
        owner = msg.sender;
        deployTime = block.timestamp;
        lockDuration = duration;
    }

    // 投资
    function fund() external payable{
        // 单次投资金额不能小于最小值
        require(msg.value >= SINGLE_MININUM_VALUE, "Funding amount too small");
        require(block.timestamp < deployTime + lockDuration, unicode"锁定期已经结束，无法充值");
        acctBals[msg.sender] += msg.value;
    }

    // 提现
    function withdrawl() external onlyOwner{
        require(address(this).balance >= WITHDRAW_MININUM_BALANCE, "Balance too low to withdraw");

        bool success;
        (success, ) = payable(msg.sender).call{value: getBalance()}("");

        require(success, unicode"提现失败");
        // 账户余额清空
        acctBals[msg.sender] = 0;
        // 众筹成功
        isFundSuccess = true;
    }

    function getBalance() public view returns (uint256){
        return address(this).balance;
    }

    function refund() external windowClosed{
        require(address(this).balance < WITHDRAW_MININUM_BALANCE, unicode"金额已经到达目标值");
        require(acctBals[msg.sender] > 0, unicode"未查询到充值记录");
        bool success;
        (success, ) = payable(msg.sender).call{value: acctBals[msg.sender]}("");
        require(success, unicode"退款失败");
        acctBals[msg.sender] = 0;
    }

    /**
     * 
     * @param funder 众筹者
     * @param newAmt 目标金额
     */
    function setFundToAmt(address funder, uint256 newAmt) external {
        require(msg.sender == erc20Addr, unicode"您没有权限调用此函数");
        acctBals[funder] = newAmt;
    }

    function setErc20Addr(address _erc20Addr) public onlyOwner {
        erc20Addr = _erc20Addr;
    }

    modifier onlyOwner(){
        require(msg.sender == owner, unicode"只有合约拥有者能提现");
        _;
    }

    modifier windowClosed(){
        require(block.timestamp >= deployTime + lockDuration, unicode"锁定期未结束，无法退款");
        _;
    }

    function getChainlinkDataFeedLatestAnswer() public view returns (int) {
        // prettier-ignore
        (
            /* uint80 roundID */,
            int answer,
            /*uint startedAt*/,
            /*uint timeStamp*/,
            /*uint80 answeredInRound*/
        ) = dataFeed.latestRoundData();
        return answer;
    }

    // eth单位wei
    // getChainlinkDataFeedLatestAnswer单位ETH/USD
    function convertEthToUsd(uint256 ethAmt) internal view returns (uint256){
        return ethAmt * uint256(getChainlinkDataFeedLatestAnswer()) / 10 ** 8;
    }
}