// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockUSDT is ERC20 {
    constructor() ERC20("Mock USDT", "USDT") {
        // 部署时给部署者先发 1,000,000 个币
        _mint(msg.sender, 1000000 * 10**18);
    }

    // 测试专用：任何人都能领钱
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

