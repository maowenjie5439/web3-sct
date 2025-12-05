import { task } from "hardhat/config";
import type { HardhatRuntimeEnvironment } from "hardhat/types/hre";
import { FundMe } from "../types/ethers-contracts/index.js";

const interactFundMeTask = task(["interact-fundme"], "Interact with FundMe contract")
    .addOption({
        name: "addr",
        description: "FundMe contract address",
        defaultValue: "",
    })
    .setAction(async () => {
        return {
            default: async (taskArgs: { addr: string }, hre: HardhatRuntimeEnvironment) => {
                const { network } = hre;
                const connection = await network.connect();
                const { ethers } = connection;

                if (!taskArgs.addr) {
                    throw new Error("Please provide contract address with --addr option");
                }

                const fundMeFactory = await ethers.getContractFactory("FundMe");
                const fundMe = fundMeFactory.attach(taskArgs.addr) as FundMe;
                // init 2 accounts
                const [firstAccount, secondAccount] = await ethers.getSigners();
            
                console.log(`\n📝 Using accounts:`);
                console.log(`  First: ${firstAccount.address}`);
                console.log(`  Second: ${secondAccount.address}\n`);

                // fund contract with first account
                console.log(`💰 First account funding 0.5 ETH...`);
                const fundTx = await fundMe.fund({ value: ethers.parseEther("0.5") });
                await fundTx.wait();
                console.log(`✅ First fund transaction completed`);
            
                // check balance of contract
                const balanceOfContract = await ethers.provider.getBalance(fundMe.target);
                console.log(`💼 Contract balance: ${ethers.formatEther(balanceOfContract)} ETH\n`);
            
                // fund contract with second account
                console.log(`💰 Second account funding 0.5 ETH...`);
                const fundTxWithSecondAccount = await fundMe.connect(secondAccount).fund({ value: ethers.parseEther("0.5") });
                await fundTxWithSecondAccount.wait();
                console.log(`✅ Second fund transaction completed`);
            
                // check balance of contract
                const balanceOfContractAfterSecondFund = await ethers.provider.getBalance(fundMe.target);
                console.log(`💼 Contract balance: ${ethers.formatEther(balanceOfContractAfterSecondFund)} ETH\n`);
            
                // check mapping acctBals
                const firstAccountBalanceInFundMe = await fundMe.acctBals(firstAccount.address);
                const secondAccountBalanceInFundMe = await fundMe.acctBals(secondAccount.address);
                console.log(`📊 Balances in contract:`);
                console.log(`  ${firstAccount.address}: ${ethers.formatEther(firstAccountBalanceInFundMe)} ETH`);
                console.log(`  ${secondAccount.address}: ${ethers.formatEther(secondAccountBalanceInFundMe)} ETH`);
            },
        };
    })
    .build();

export default interactFundMeTask;
