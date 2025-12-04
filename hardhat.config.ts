import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-verify";
import { defineConfig } from "hardhat/config";
import * as dotenv from "dotenv";

dotenv.config();

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "";
const SEPOLIA_PRIVATE_KEY = process.env.SEPOLIA_PRIVATE_KEY || "";
const CONFLUX_RPC_URL = process.env.CONFLUX_RPC_URL || "";
const CONFLUX_PRIVATE_KEY = process.env.CONFLUX_PRIVATE_KEY || "";
const CONFLUXSCAN_API_KEY =
  process.env.CONFLUXSCAN_API_KEY || "confluxscan-placeholder-key";

export default defineConfig({
  plugins: [hardhatToolboxMochaEthersPlugin],
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
    hardhatOp: {
      type: "edr-simulated",
      chainType: "op",
    },
    sepolia: {
      type: "http",
      chainType: "l1",
      url: SEPOLIA_RPC_URL,
      accounts: SEPOLIA_PRIVATE_KEY ? [SEPOLIA_PRIVATE_KEY] : [],
    },
    confluxESpace: {
      type: "http",
      chainType: "l1",
      chainId: 71,
      url: CONFLUX_RPC_URL,
      accounts: CONFLUX_PRIVATE_KEY ? [CONFLUX_PRIVATE_KEY] : [],
    },
  },
  chainDescriptors: {
    71: {
      name: "Conflux eSpace Testnet",
      chainType: "l1",
      blockExplorers: {
        etherscan: {
          name: "ConfluxScan",
          url: "https://evmtestnet.confluxscan.net/",
          apiUrl: "https://evmapi-testnet.confluxscan.net/api/",
        },
      },
    },
  },
  verify: {
    etherscan: {
      apiKey: CONFLUXSCAN_API_KEY,
    },
    blockscout: {
      enabled: false,
    },
    sourcify: {
      enabled: false,
    },
  },
});
