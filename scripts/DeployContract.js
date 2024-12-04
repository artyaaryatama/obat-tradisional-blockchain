const fs = require("fs");
const hre = require("hardhat");

async function main() {
    // Deploy RoleManager
    const RoleManager = await hre.ethers.getContractFactory("RoleManager");
    const deployedRoleManager = await RoleManager.deploy();
    await deployedRoleManager.waitForDeployment();
    console.log("RoleManager deployed to:", deployedRoleManager.target);

    // Deploy MainSupplyChain
    const MainSupplyChain = await hre.ethers.getContractFactory("MainSupplyChain");
    const deployedMainSupplyChain = await MainSupplyChain.deploy(deployedRoleManager.target);
    await deployedMainSupplyChain.waitForDeployment();
    console.log("MainSupplyChain deployed to:", deployedMainSupplyChain.target);

    // Deploy ObatTradisional
    const ObatTradisional = await hre.ethers.getContractFactory("ObatTradisional");
    const deployedObatTradisional = await ObatTradisional.deploy(deployedRoleManager.target, deployedMainSupplyChain.target);
    await deployedObatTradisional.waitForDeployment();
    console.log("ObatTradisional deployed to:", deployedObatTradisional.target);

    // Deploy OrderObatTradisional
    const OrderManagement = await hre.ethers.getContractFactory("OrderManagement");
    const deployedOrderManagement = await OrderManagement.deploy(deployedObatTradisional.target, deployedRoleManager.target);
    await deployedOrderManagement.waitForDeployment();
    console.log("OrderManagement deployed to:", deployedOrderManagement.target);

    // Save all deployment data
    const deploymentData = {
        MainSupplyChain: {
            address: deployedMainSupplyChain.target,
            abi: (await hre.artifacts.readArtifact("MainSupplyChain")).abi,
        },
        ObatTradisional: {
            address: deployedObatTradisional.target,
            abi: (await hre.artifacts.readArtifact("ObatTradisional")).abi,
        },
        OrderManagement: {
            address: deployedOrderManagement.target,
            abi: (await hre.artifacts.readArtifact("OrderManagement")).abi,
        }
    };

    fs.writeFileSync('./src/auto-artifacts/deployments.json', JSON.stringify(deploymentData, null, 2));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
