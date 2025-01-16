require('@nomicfoundation/hardhat-ethers');
require("@nomicfoundation/hardhat-toolbox");
// require('dotenv').config();

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
      // forking: {
      //   url: `https://sepolia.infura.io/v3/${process.env.REACT_APP_INFURA_PROJECT_ID}`, 
      // },
      url: "http://127.0.0.1:8545", 
      chainId: 31337,
    },
    sepolia: {
      url: `https://sepolia.infura.io/v3/${process.env.REACT_APP_INFURA_PROJECT_ID}`, 
      accounts: [
        `0x${process.env.REACT_APP_MY_PRIVATE_KEY}`
      ],
    },
  }
};
