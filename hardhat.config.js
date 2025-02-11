require("dotenv").config();
require('@nomicfoundation/hardhat-ethers');
require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.27",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: true,
      evmVersion: "cancun"
    }
  },
  paths: {
    artifacts: './src/artifacts',
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545", 
      chainId: 31337, 
    },
    sepolia: {
      url: `https://sepolia.infura.io/v3/${process.env.REACT_APP_INFURA_API_KEY}`, 
      accounts: [
        `0x${process.env.REACT_APP_MY_PRIVATE_KEY}`
      ],
    }
  }
};

