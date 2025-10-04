require("dotenv").config();
require("@nomiclabs/hardhat-ethers");
require("hardhat-contract-sizer");
require("hardhat-gas-reporter");
require("solidity-docgen");
require("@nomicfoundation/hardhat-verify")

module.exports = {
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
    holesky: {
      url: "https://autumn-quaint-asphalt.ethereum-holesky.quiknode.pro/f303f014a92cec2cf6773c1f4fccf092e1eb050d", 
      chainId: 17000,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },

  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },

  sourcify: {
    enabled: true
  },

  paths: {
    sources: "./contracts",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: true,
    strict: true,
    only: [":Ticket"], // Adjust contract name if needed
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
    gasPrice: 21,
    coinmarketcap: process.env.COINMARKETCAP_API_KEY || "", // Optional for fetching real-time gas prices
  },
  docgen: {
    path: "./docs",
    clear: true,
    runOnCompile: true,
  }
};
