const fs =  require("fs");
const hre = require("hardhat");

async function main() {

  const MainSupplyChain = await hre.ethers.getContractFactory('MainSupplyChain');
  const supplyChain = await MainSupplyChain.deploy();

  await supplyChain.waitForDeployment();
  console.log('supplyChain deployed to:', supplyChain.target);

  const artifact = await hre.artifacts.readArtifact("MainSupplyChain");

  const ContractDataSupplyChain = {
    address: supplyChain.target,
    abi: artifact.abi
  }

  fs.writeFileSync('./src/auto-artifacts/MainSupplyChain.json', JSON.stringify(ContractDataSupplyChain, null, 2))

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
