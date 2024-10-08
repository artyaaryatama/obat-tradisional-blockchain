const hre = require("hardhat")

async function main() {
  const CpotbRegistration = await hre.ethers.getContractFactory('CpotbRegistration')
  const cpotbRegistration = await CpotbRegistration.deploy();

  await cpotbRegistration.waitForDeployment();

  console.log('CpotbRegistration deployed to: ', cpotbRegistration.target);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
