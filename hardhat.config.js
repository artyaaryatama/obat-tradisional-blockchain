// require("@nomicfoundation/hardhat-toolbox");

// /** @type import('hardhat/config').HardhatUserConfig */
// module.exports = {
//   solidity: {
//     version: "0.8.27",
//     settings: {
//       optimizer: {
//         enabled: true,
//         runs: 200
//       },
//       viaIR: true
//     }
//   },
//   paths: {
//     artifacts: './src/artifacts',
//   },
//   networks: {
//     hardhat: {
//       chainId : 1337,
//     },
//     localhost: {
//       url: "http://127.0.0.1:8545", // This points to your local Hardhat node
//       chainId: 1337,
//     }
//   }
// };

require('dotenv').config();
require('@nomicfoundation/hardhat-ethers');

module.exports = {
  solidity: {
    version: "0.8.0",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
    },
  },
  networks: {
    sepolia: {
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`, 
      accounts: [
        `0x${process.env.MY_PRIVATE_KEY}`,
        // `0x${process.env.BPOM_PRIVATE_KEY}`,
        // `0x${process.env.PABRIK_PRIVATE_KEY}`,
        // `0x${process.env.PBF_PRIVATE_KEY}`,
        // `0x${process.env.RETAILER_PRIVATE_KEY}`
      ],
    },
  }
};
