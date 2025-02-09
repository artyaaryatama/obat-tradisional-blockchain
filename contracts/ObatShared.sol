// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./EnumsLibrary.sol";

contract ObatShared {
  
  struct ObatDetail {
    string merk;
    string namaProduk;
    string[] klaim;
    string[] komposisi;
    string kemasan; 
    string factoryInstance;
    address factoryAddr;
    EnumsLibrary.TipePermohonanCdob tipeObat;
    string cpotbHash;
    string cdobHash;
    string jenisObat; 
  }

  struct ObatProduction {
    EnumsLibrary.ObatAvailability statusStok;
    string namaProduk;
    string batchName;
    uint8 obatQuantity;
    string factoryInstance; 
  }

  struct ObatOutputStok {
    string orderId;
    string obatId;
    string namaProduk;
    string batchName;
    uint8 obatQuantity;
    EnumsLibrary.ObatAvailability statusStok;
    string ownerInstance;
  }

  struct ObatPbf {
    EnumsLibrary.ObatAvailability statusStok;
    string obatId;
    string orderId;
    string namaProduk;
    string batchName;
    uint8 obatQuantity;
    string pbfInstance;
  } 

  struct ObatRetail {
    EnumsLibrary.ObatAvailability statusStok;
    string obatId;
    string orderId;
    string namaProduk;
    string batchName;
    uint8 obatQuantity;
    string retailerInstance; 
  }

  string[] private allObatPbfByBatchName;
  string[] private allObatRetailByBatchName;

  mapping(string => ObatDetail) public obatDetailById;
  mapping (string => ObatProduction[]) public obatProductionById;
  mapping (string => ObatPbf) public obatPbfByBatchName;
  mapping (string => ObatRetail) public obatRetailerByBatchName;
  mapping (string => string[]) public obatIpfsByBatchName;

  function setObatDetail(
    string memory obatId,
    string memory merk,
    string memory namaProduk,
    string[] memory klaim,
    string[] memory komposisi,
    string memory kemasan,
    string memory factoryInstance, 
    address factoryAddr,
    EnumsLibrary.TipePermohonanCdob tipeObat,
    string memory cpotbHash,
    string memory jenisObat
  ) external {
      
    require(bytes(obatId).length > 0, "Invalid ID");

    obatDetailById[obatId] = ObatDetail({
      merk: merk,
      namaProduk: namaProduk,
      klaim: klaim,
      komposisi: komposisi,
      kemasan: kemasan, 
      factoryInstance: factoryInstance,
      factoryAddr: factoryAddr,
      tipeObat: tipeObat, 
      cpotbHash: cpotbHash,
      cdobHash: "",
      jenisObat: jenisObat
    });
  }

  function getObatDetail(string memory obatId) external view returns (ObatDetail memory){
    
    require(bytes(obatId).length > 0, "Invalid ID");
    
    return obatDetailById[obatId];
  }

  function addCdobId(
    string memory obatId,
    string memory cdobHash
  ) external {
      
    require(bytes(obatId).length > 0, "Invalid ID");

    obatDetailById[obatId].cdobHash= cdobHash; 
  } 

  function addBatchProduction(
    string memory obatId,
    string memory namaProduk,
    string memory batchName,
    uint8 obatQuantity,
    string[] memory obatIpfs, 
    string memory factoryInstance
  ) external {
     
    ObatProduction memory newBatch = ObatProduction({
      statusStok: EnumsLibrary.ObatAvailability.Ready,
      namaProduk: namaProduk,
      batchName: batchName,
      obatQuantity: obatQuantity,
      factoryInstance: factoryInstance
    });

    delete obatIpfsByBatchName[batchName];

    for (uint i = 0; i < obatIpfs.length; i++) {
      obatIpfsByBatchName[batchName].push(obatIpfs[i]);  
    }

    obatProductionById[obatId].push(newBatch); 
  }

  function getObatProduction(string memory obatId) external view returns (ObatProduction[] memory){
    
    require(bytes(obatId).length > 0, "Invalid ID");
    return obatProductionById[obatId];
  }

  function getObatIpfsByBatchName (string memory batchName) external view returns (string[] memory) {
    return obatIpfsByBatchName[batchName];
  }

  function updateBatchProduction(
    string memory obatId,
    string memory batchName,
    EnumsLibrary.ObatAvailability newStatus
  ) external {
    
    ObatProduction[] storage obatBatches = obatProductionById[obatId];
 
    bytes32 batchHash = keccak256(abi.encodePacked(batchName));

    for (uint256 i = 0; i < obatBatches.length; i++){
      if (keccak256(abi.encodePacked(obatBatches[i].batchName)) == batchHash) {
        obatBatches[i].statusStok = newStatus;
        break;
      } 
    }
  }

  function addObatPbf (
    string memory obatId,
    string memory orderId,
    string memory namaProduk,
    string memory batchName,
    uint8 obatQuantity,
    string memory pbfInstance
  ) external {

    ObatPbf memory newObatPbf = ObatPbf({
      obatId: obatId, 
      orderId: orderId,
      statusStok: EnumsLibrary.ObatAvailability.Ready,
      namaProduk: namaProduk,
      batchName: batchName,
      obatQuantity: obatQuantity,
      pbfInstance: pbfInstance
    });

    allObatPbfByBatchName.push(batchName);
    obatPbfByBatchName[batchName] = newObatPbf;
  } 

  function getAllObatPbfByInstance(string memory pbfInstance) external view returns (ObatOutputStok[] memory){

    uint256 totalBatches = allObatPbfByBatchName.length;
    uint256 count = 0;
    bytes32 ownerInstance = keccak256(abi.encodePacked(pbfInstance));

    for (uint i = 0; i <totalBatches; i++) {  
      bytes32 batchNameHash = keccak256(abi.encodePacked(obatPbfByBatchName[allObatPbfByBatchName[i]].pbfInstance));

      if (batchNameHash == ownerInstance) {
        count++;
      } 
    }

    ObatOutputStok[] memory obatInstance = new ObatOutputStok[](count);
    uint256 count1 = 0;

    for (uint i = 0; i <totalBatches; i++) {
      ObatPbf memory currentObatPbf = obatPbfByBatchName[allObatPbfByBatchName[i]];
      bytes32 batchNameHash = keccak256(abi.encodePacked(currentObatPbf.pbfInstance));

      if (batchNameHash == ownerInstance) {
        obatInstance[count1] = ObatOutputStok({
          orderId: currentObatPbf.orderId,
          obatId: currentObatPbf.obatId,
          namaProduk: currentObatPbf.namaProduk,
          batchName: currentObatPbf.batchName,
          obatQuantity: currentObatPbf.obatQuantity,
          statusStok: currentObatPbf.statusStok,
          ownerInstance: currentObatPbf.pbfInstance
        });

        count1++; 
      } 
    }

    return obatInstance;
  }

  function getAllObatPbfReadyStock() external view returns (ObatOutputStok[] memory) {
    uint256 totalBatches = allObatPbfByBatchName.length;
    uint256 count = 0;

    for (uint i = 0; i <totalBatches; i++) {
      if (obatPbfByBatchName[allObatPbfByBatchName[i]].statusStok == EnumsLibrary.ObatAvailability.Ready){
        count++;
      } 
    }

    ObatOutputStok[] memory obatReady = new ObatOutputStok[](count);
    uint256 count1 = 0;

    for (uint i = 0; i <totalBatches; i++) {

      if (obatPbfByBatchName[allObatPbfByBatchName[i]].statusStok == EnumsLibrary.ObatAvailability.Ready){

        ObatPbf memory currentObatPbf = obatPbfByBatchName[allObatPbfByBatchName[i]];

        obatReady[count1] = ObatOutputStok({
          orderId: currentObatPbf.orderId,
          obatId: currentObatPbf.obatId,
          namaProduk: currentObatPbf.namaProduk,
          batchName: currentObatPbf.batchName,
          obatQuantity: currentObatPbf.obatQuantity,
          statusStok: currentObatPbf.statusStok,
          ownerInstance: currentObatPbf.pbfInstance
        });

        count1++; 
      } 
    }

    return obatReady;
  }

  function updateObatPbf(
    string memory batchName,
    EnumsLibrary.ObatAvailability newStatus 
  ) external {
    obatPbfByBatchName[batchName].statusStok = newStatus;
  }

  function updateObatIpfs(
    string memory batchName,
    string[] memory obatIpfs
  ) public {

    delete obatIpfsByBatchName[batchName];
    obatIpfsByBatchName[batchName] = obatIpfs;
  } 

  function addObatRetailer (
    string memory obatId,
    string memory orderId,
    string memory namaProduk,
    string memory batchName,
    uint8 obatQuantity,
    string memory retailerInstance
  ) external {

    ObatRetail memory newObatRetailer = ObatRetail({
      obatId: obatId, 
      orderId: orderId,
      statusStok: EnumsLibrary.ObatAvailability.Ready,
      namaProduk: namaProduk,
      batchName: batchName,
      obatQuantity: obatQuantity, 
      retailerInstance: retailerInstance
    });  

    allObatRetailByBatchName.push(batchName);
    obatRetailerByBatchName[batchName] = newObatRetailer;
  } 

  function getAllObatRetailerByInstance(string memory retailerInstance) external view returns (ObatOutputStok[] memory) {
    
    uint256 count = 0; 
    bytes32 ownerInstance = keccak256(abi.encodePacked(retailerInstance));
    uint length = allObatRetailByBatchName.length; 

    for (uint i = 0; i <length; i++) {  
      bytes32 batchNameHash = keccak256(abi.encodePacked(obatRetailerByBatchName[allObatRetailByBatchName[i]].retailerInstance));

      if (batchNameHash == ownerInstance) {
        count++;
      } 
    }

    ObatOutputStok[] memory obatInstance = new ObatOutputStok[](count);
    uint256 count1 = 0;

    for (uint i = 0; i <length; i++) {
      
      ObatRetail memory currentObatRetailer = obatRetailerByBatchName[allObatRetailByBatchName[i]];
      bytes32 batchNameHash = keccak256(abi.encodePacked(currentObatRetailer.retailerInstance)); 

      if (batchNameHash== ownerInstance) {


        obatInstance[count1] = ObatOutputStok({
          orderId: currentObatRetailer.orderId,
          obatId: currentObatRetailer.obatId,
          namaProduk: currentObatRetailer.namaProduk,
          batchName: currentObatRetailer.batchName,
          obatQuantity: currentObatRetailer.obatQuantity,
          statusStok: currentObatRetailer.statusStok,
          ownerInstance: currentObatRetailer.retailerInstance
        });

        count1++; 
      } 
    }

    return obatInstance;
  }
}

