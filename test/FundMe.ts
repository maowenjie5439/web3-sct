import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("测试FundMe合约", function (){
    it("测试合约初始化", async function(){
        const fundMeFactory = await ethers.getContractFactory("FundMe");
        const fundMe = await fundMeFactory.deploy(300);
        await fundMe.waitForDeployment();
        const [acct1, acct2] = await ethers.getSigners();
        expect(await fundMe.owner()).to.equal(acct1.address);
    })
})