const hre = require("hardhat")

async function main() {
  // const CpotbRegistration = await hre.ethers.getContractFactory('CpotbRegistration')
  // const cpotbRegistration = await CpotbRegistration.deploy();
  // await cpotbRegistration.waitForDeployment();
  // console.log('CpotbRegistration deployed to: ', cpotbRegistration.target);

  const ObatTradisional = await hre.ethers.getContractFactory('ObatTradisional');
  const obatTradisional = await ObatTradisional.deploy();
  await obatTradisional.waitForDeployment();
  console.log('ObatTradisional deployed to:', obatTradisional.target);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
