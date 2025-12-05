import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

async function deployFundMeFixture() {
  const fundMeFactory = await ethers.getContractFactory("FundMe");
  const fundMe = await fundMeFactory.deploy(300);
  await fundMe.waitForDeployment();
  const [firstAccount, secondAccount] = await ethers.getSigners();
  return { fundMe, firstAccount, secondAccount };
}

describe("测试FundMe合约", function () {
  let fundMe: Awaited<ReturnType<typeof deployFundMeFixture>>["fundMe"];
  let firstAccount: Awaited<
    ReturnType<typeof deployFundMeFixture>
  >["firstAccount"];
  let secondAccount: Awaited<
    ReturnType<typeof deployFundMeFixture>
  >["secondAccount"];
  let snapshotId: string;

  before(async function () {
    const deployed = await deployFundMeFixture();
    fundMe = deployed.fundMe;
    firstAccount = deployed.firstAccount;
    secondAccount = deployed.secondAccount;
    snapshotId = await ethers.provider.send("evm_snapshot", []);
  });

  beforeEach(async function () {
    await ethers.provider.send("evm_revert", [snapshotId]);
    snapshotId = await ethers.provider.send("evm_snapshot", []);
  });

  it("测试合约初始化", async function () {
    expect(await fundMe.owner()).to.equal(firstAccount.address);
  });

  it("模拟 interact-fundme 任务中的双账户充值流程", async function () {
    const fundMeAddress = await fundMe.getAddress();
    const firstFundValue = ethers.parseEther("0.5");
    const secondFundValue = ethers.parseEther("0.5");

    // 第一位账户充值
    const firstFundTx = await fundMe
      .connect(firstAccount)
      .fund({ value: firstFundValue });
    await firstFundTx.wait();

    const balanceAfterFirstFund = await ethers.provider.getBalance(
      fundMeAddress
    );
    expect(balanceAfterFirstFund).to.equal(firstFundValue);

    // 第二位账户充值
    const secondFundTx = await fundMe
      .connect(secondAccount)
      .fund({ value: secondFundValue });
    await secondFundTx.wait();

    const balanceAfterSecondFund = await ethers.provider.getBalance(
      fundMeAddress
    );
    expect(balanceAfterSecondFund).to.equal(firstFundValue + secondFundValue);

    const firstAccountRecordedBalance = await fundMe.acctBals(
      firstAccount.address
    );
    const secondAccountRecordedBalance = await fundMe.acctBals(
      secondAccount.address
    );

    expect(firstAccountRecordedBalance).to.equal(firstFundValue);
    expect(secondAccountRecordedBalance).to.equal(secondFundValue);
  });
});