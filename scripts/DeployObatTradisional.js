const fs =  require("fs");
const hre = require("hardhat");

async function main() {

  const ObatTradisional = await hre.ethers.getContractFactory('ObatTradisional');
  const obat = await ObatTradisional.deploy();

  await obat.waitForDeployment();
  console.log('Obat Tradisional deployed to:', obat.target);

  const artifact = await hre.artifacts.readArtifact("ObatTradisional");

  const ContractDataObatTradisional = {
    address: obat.target,
    abi: artifact.abi
  }

  fs.writeFileSync('./src/auto-artifacts/ObatTradisional.json', JSON.stringify(ContractDataObatTradisional, null, 2))
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
