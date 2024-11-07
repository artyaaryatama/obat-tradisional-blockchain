const fs =  require("fs");
const hre = require("hardhat");

async function main() {
  // const CpotbRegistration = await hre.ethers.getContractFactory('CpotbRegistration')
  // const cpotbRegistration = await CpotbRegistration.deploy();
  // await cpotbRegistration.waitForDeployment();
  // console.log('owner contract: ', cpotbRegistration.runner.address)
  // console.log('CpotbRegistration deployed to: ', cpotbRegistration.target);

  const MainSupplyChain = await hre.ethers.getContractFactory('MainSupplyChain');
  const supplyChain = await MainSupplyChain.deploy();
  await supplyChain.waitForDeployment();
  console.log('supplyChain deployed to:', supplyChain.target);
  
  // const ObatTradisional = await hre.ethers.getContractFactory('ObatTradisional');
  // const obatTradisional = await ObatTradisional.deploy();
  // await obatTradisional.waitForDeployment();
  // console.log('ObatTradisional deployed to:', obatTradisional.target);

  // const CdobRegistration = await hre.ethers.getContractFactory('CdobRegistration');
  // const cdobRegistration = await CdobRegistration.deploy();
  // await cdobRegistration.waitForDeployment();
  // console.log('CDOB Registration deployed to:', cdobRegistration.target);

  const artifact = await hre.artifacts.readArtifact("MainSupplyChain");

  const ContractData = {
    address: supplyChain.target,
    abi: artifact.abi
  }

  console.log("Formatted ABI:", supplyChain.interface.format('json'));

  fs.writeFileSync('./src/auto-artifacts/MainSupplyChain.json', JSON.stringify(ContractData, null, 2))
  console.log("Contract address and ABI saved to artifact.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
