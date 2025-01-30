const fs = require("fs");
const hre = require("hardhat");

async function main() {
    // Deploy RoleManager
    const RoleManager = await hre.ethers.getContractFactory("RoleManager");
    const deployedRoleManager = await RoleManager.deploy();
    await deployedRoleManager.waitForDeployment();
    console.log("RoleManager deployed to:", deployedRoleManager.target);
    
    // Deploy ObatShared
    const ObatShared = await hre.ethers.getContractFactory("ObatShared");
    const deployedObatShared = await ObatShared.deploy();
    await deployedObatShared.waitForDeployment();
    console.log("ObatShared deployed to:", deployedObatShared.target);
    
    // Deploy CpotbCertificate
    const CpotbCertificate = await hre.ethers.getContractFactory("CpotbCertificate");
    const deployedCpotbCertificate = await CpotbCertificate.deploy();
    await deployedCpotbCertificate.waitForDeployment();
    console.log("CpotbCertificate deployed to:", deployedCpotbCertificate.target);

    // Deploy CdobCertificate
    const CdobCertificate = await hre.ethers.getContractFactory("CdobCertificate");
    const deployedCdobCertificate = await CdobCertificate.deploy();
    await deployedCdobCertificate.waitForDeployment();
    console.log("CdobCertificate deployed to:", deployedCdobCertificate.target);
    
    // // Deploy ObatShared
    // const BaseCertificate = await hre.ethers.getContractFactory("BaseCertificate");
    // const deployedBaseCertificate = await ObatShared.deploy();
    // await deployedBaseCertificate.waitForDeployment();
    // console.log("BaseCertificate deployed to:", deployedBaseCertificate.target);
    
    // Deploy CertificateManager
    const CertificateManager = await hre.ethers.getContractFactory("CertificateManager");
    const deployedCertificateManager = await CertificateManager.deploy(deployedRoleManager.target, deployedCpotbCertificate.target, deployedCdobCertificate.target);
    await deployedCertificateManager.waitForDeployment();
    console.log("CertificateManager deployed to:", deployedCertificateManager.target);

    // Deploy MainSupplyChain
    const MainSupplyChain = await hre.ethers.getContractFactory("MainSupplyChain");
    const deployedMainSupplyChain = await MainSupplyChain.deploy(deployedRoleManager.target);
    await deployedMainSupplyChain.waitForDeployment();
    console.log("MainSupplyChain deployed to:", deployedMainSupplyChain.target);

    // Deploy ObatTradisional
    const ObatTradisional = await hre.ethers.getContractFactory("ObatTradisional");
    const deployedObatTradisional = await ObatTradisional.deploy(deployedRoleManager.target, deployedMainSupplyChain.target, deployedObatShared.target);
    await deployedObatTradisional.waitForDeployment();
    console.log("ObatTradisional deployed to:", deployedObatTradisional.target);

    // Deploy OrderObatTradisional
    const OrderManagement = await hre.ethers.getContractFactory("OrderManagement");
    const deployedOrderManagement = await OrderManagement.deploy(deployedObatTradisional.target, deployedRoleManager.target, deployedObatShared.target, deployedMainSupplyChain.target);
    await deployedOrderManagement.waitForDeployment();
    console.log("OrderManagement deployed to:", deployedOrderManagement.target);

    // Deploy RejectManager
    const RejectManager = await hre.ethers.getContractFactory("RejectManager");
    const deployedRejectManager = await RejectManager.deploy(deployedRoleManager.target, deployedObatTradisional.target,  deployedMainSupplyChain.target);
    await deployedRejectManager.waitForDeployment();
    console.log("RejectManager deployed to:", deployedRejectManager.target);

    // Save all deployment data
    const deploymentData = {
        MainSupplyChain: {
            address: deployedMainSupplyChain.target,
            abi: (await hre.artifacts.readArtifact("MainSupplyChain")).abi
        },
        ObatTradisional: {
            address: deployedObatTradisional.target,
            abi: (await hre.artifacts.readArtifact("ObatTradisional")).abi
        },
        OrderManagement: {
            address: deployedOrderManagement.target,
            abi: (await hre.artifacts.readArtifact("OrderManagement")).abi
        },
        RoleManager: {
            address: deployedRoleManager.target,
            abi: (await hre.artifacts.readArtifact("RoleManager")).abi
        },
        RejectManager: {
            address: deployedRejectManager.target,
            abi: (await hre.artifacts.readArtifact("RejectManager")).abi

        },
        CertificateManager: {
            address: deployedCertificateManager.target,
            abi: (await hre.artifacts.readArtifact("CertificateManager")).abi
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
