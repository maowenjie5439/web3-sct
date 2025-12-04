// [dotenv@17.2.3] injecting env (5) from .env -- tip: ⚙️  write to custom object with { processEnv: myObject }
// Sources flattened with hardhat v3.0.15 https://hardhat.org

// SPDX-License-Identifier: MIT

// File npm/@chainlink/contracts@1.5.0/src/v0.8/shared/interfaces/AggregatorV3Interface.sol

// Original license: SPDX_License_Identifier: MIT
pragma solidity ^0.8.0;

// solhint-disable-next-line interface-starts-with-i
interface AggregatorV3Interface {
  function decimals() external view returns (uint8);

  function description() external view returns (string memory);

  function version() external view returns (uint256);

  function getRoundData(
    uint80 _roundId
  ) external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound);

  function latestRoundData()
    external
    view
    returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound);
}


// File contracts/FundMe.sol

// Original license: SPDX_License_Identifier: MIT
pragma solidity ^0.8.20;
// 1. 创建一个收款函数
// 2. 记录投资人并且查看
// 3. 锁定期内达到目标值，可以提款
// 4. 没有达到目标值，在锁定期结束后退款

contract FundMe{
    AggregatorV3Interface internal dataFeed;

    mapping(address => uint256) public acctBals;

    // 单笔fund最小值
    uint256 SINGLE_MININUM_VALUE = 1 * 10 ** 18; // 1 USD

    // 提现最小余额
    uint256 WITHDRAW_MININUM_BALANCE = 5 * 10 ** 18; // 5 USD

    address owner;

    // 合约部署时间
    uint256 immutable private deployTime;
    // 锁定期时长
    uint256 immutable private lockDuration;

    bool public isFundSuccess = false;

    address private erc20Addr;
    

    constructor(uint256 duration){
        dataFeed = AggregatorV3Interface(0x5147eA642CAEF7BD9c1265AadcA78f997AbB9649);
        owner = msg.sender;
        deployTime = block.timestamp;
        lockDuration = duration;
    }

    // 投资
    function fund() external payable{
        // 单次投资金额不能小于1USD
        require(convertEthToUsd(msg.value) >= SINGLE_MININUM_VALUE, "need to more ETH");
        require(block.timestamp < deployTime + lockDuration, unicode"锁定期已经结束，无法充值");
        acctBals[msg.sender] += msg.value;
    }

    // 提现
    function withdrawl() external onlyOwner{
        require(convertEthToUsd(address(this).balance) >= WITHDRAW_MININUM_BALANCE , unicode"提现金额不能小于5USD");

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
        require(convertEthToUsd(address(this).balance) < WITHDRAW_MININUM_BALANCE , unicode"金额已经到达目标值");
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

