# obat-tradisonal-blockchain

<p align="center">
  <img src="https://github.com/artyaaryatama/obat-tradisional-blockchain/blob/master/src/assets/images/OT-Blockchain.png?raw=true" width="460"/>
</p>

This project is part of my Undergraduate Thesis and focuses on using blockchain technology with Proof of Stake (PoS) consensus to improve the supply chains of traditional medicine (Obat Tradisional). 

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

1. Clone this repository:
   ```bash
   git clone https://github.com/artyaaryatama/obat-tradisional-blockchain.git
    ```
2. Install dependencies for the frontend and smart contracts:
   ```bash
   npm install
    ```
3. Set up and deploy the smart contract on the Sepolia test network using Hardhat:
   ```bash
   npx hardhat run scripts/deploy.js --network sepolia
    ```
4. Run the frontend application:
   ```bash
   npm start
    ```
