# obat-tradisional-blockchain
<p align="center">
  <img src="https://github.com/artyaaryatama/obat-tradisional-blockchain/blob/master/src/assets/images/OT-Blockchain.png?raw=true" width="460"/>
</p>
This project is part of my Undergraduate Thesis and focuses on using blockchain technology with Proof of Stake (PoS) consensus to improve the supply chains of traditional medicine (Obat Tradisional).

## Branch Information
- **`master` branch**: Contains the stable version with smart contracts deployed on the **Sepolia testnet**. This branch is production-ready and suitable for testing with real testnet transactions.
  
- **`feature-resertifikasi-logic` branch**: Contains experimental resertifikasi (re-certification) transaction logic. This branch only works in **local development using Hardhat** due to its experimental nature. The resertifikasi feature has not been deployed to the testnet as it's still under development and testing.

> **Note**: The separation of branches allows for stable production deployment on the master branch while keeping experimental features isolated for local testing and development.

## Technologies used in this project:
- **Hardhat** for local blockchain development and testing.
- **Sepolia** test network for Ethereum deployment and transactions.
- **MetaMask** for browser extension wallet management.
- **Ether.js** for interacting with the Ethereum blockchain.
- **React.js** for building the frontend interface.
- **Firebase** for handling off-chain backend services.
- **IPFS** for decentralized off-chain file storage.
- **Slither** for analyzing security vulnerabilities and issues in smart contracts.

## Installation

### For Master Branch (Sepolia Testnet)
1. Clone this repository and checkout master branch:
   ```bash
   git clone https://github.com/artyaaryatama/obat-tradisional-blockchain.git
   cd obat-tradisional-blockchain
   git checkout master
    ```
2. Install dependencies for the frontend and smart contracts:
   ```bash
   npm install
    ```
3. The smart contract is already deployed on Sepolia testnet. Configure your MetaMask to connect to Sepolia network.

4. Run the frontend application:
   ```bash
   npm run dev
    ```

### For Feature Branch (Local Development)
1. Clone this repository and checkout feature branch:
   ```bash
   git clone https://github.com/artyaaryatama/obat-tradisional-blockchain.git
   cd obat-tradisional-blockchain
   git checkout feature-resertifikasi-logic
    ```
2. Install dependencies:
   ```bash
   npm install
    ```
3. Start local Hardhat node:
   ```bash
   npx hardhat node
    ```
4. Deploy smart contract locally:
   ```bash
   npx hardhat run scripts/deploy.js --network localhost
    ```
5. Configure MetaMask to connect to your local Hardhat network (usually http://localhost:8545).

6. Run the frontend application:
   ```bash
   npm run dev
    ```
