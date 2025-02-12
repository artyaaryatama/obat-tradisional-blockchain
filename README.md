# Obat-tradisonal-blockchain

![OT-Blockchain](https://github.com/artyaaryatama/obat-tradisional-blockchain/blob/master/src/assets/images/OT-Blockchain.png?raw=true)

This project is part of my Undergraduate Thesis and focuses on using blockchain technology to improve the supply chains of traditional medicine. The aim is to make the process more secure and transparent, helping to prevent counterfeit medicines by utilizing Proof of Stake (PoS) as a consensus mechanism.

## Technologies used in this project:
- **Hardhat** for local blockchain development and testing.
- **Sepolia** test network for Ethereum deployment and transactions.
- **MetaMask** for browser extension wallet management.
- **Ether.js** for interacting with the Ethereum blockchain.
- **React.js** for the frontend interface.
- **Firebase** for off-chain backend services.
- **IPFS** for off-chain decentralized file storage.
- **Slither** for static analysis of smart contracts.

## Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/your-username/Obat-tradisonal-blockchain.git
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
