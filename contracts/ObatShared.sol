// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

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

  string[] private AllObatPbfBatchName;
  string[] private AllObatRetailBatchName;

  mapping(string => ObatDetail) public ObatDetailById;
  mapping (string => ObatProduction[]) public ObatProductionById;
  mapping (string => ObatPbf) public ObatPbfBatchName;
  mapping (string => ObatRetail) public ObatRetailerBatchName;
  mapping (string => string[]) public ObatIpfsbyBatchName;

  function setObatDetail(
    string memory _obatId,
    string memory _merk,
    string memory _namaProduk,
    string[] memory _klaim,
    string[] memory _komposisi,
    string memory _kemasan,
    string memory _factoryInstance, 
    address _factoryAddr,
    EnumsLibrary.TipePermohonanCdob _tipeObat,
    string memory _cpotbHash,
    string memory _jenisObat
  ) external {
      
      require(bytes(_obatId).length > 0, "Invalid ID");

      ObatDetailById[_obatId] = ObatDetail({
        merk: _merk,
        namaProduk: _namaProduk,
        klaim: _klaim,
        komposisi: _komposisi,
        kemasan: _kemasan, 
        factoryInstance: _factoryInstance,
        factoryAddr: _factoryAddr,
        tipeObat: _tipeObat, 
        cpotbHash: _cpotbHash,
        cdobHash: "",
        jenisObat: _jenisObat
      });
  }

  function getObatDetail(string memory _obatId) external view returns (ObatDetail memory){
    
    require(bytes(_obatId).length > 0, "Invalid ID");
    
    return ObatDetailById[_obatId];
  }

  function addCdobId(
    string memory _obatId,
    string memory _cdobHash
  ) external {
      
      require(bytes(_obatId).length > 0, "Invalid ID");

      ObatDetailById[_obatId].cdobHash= _cdobHash; 
  } 

  function addBatchProduction(
    string memory _obatId,
    string memory _namaProduk,
    string memory _batchName,
    uint8 _obatQuantity,
    string[] memory _obatIpfs, 
    string memory _factoryInstance
  ) external {
     
      ObatProduction memory newBatch = ObatProduction({
        statusStok: EnumsLibrary.ObatAvailability.Ready,
        namaProduk: _namaProduk,
        batchName: _batchName,
        obatQuantity: _obatQuantity,
        factoryInstance: _factoryInstance
      });

      delete ObatIpfsbyBatchName[_batchName];

      for (uint i = 0; i < _obatIpfs.length; i++) {
        ObatIpfsbyBatchName[_batchName].push(_obatIpfs[i]);  
      }

      ObatProductionById[_obatId].push(newBatch); 
  }

  function getObatProduction(string memory _obatId) external view returns (ObatProduction[] memory){
    
    require(bytes(_obatId).length > 0, "Invalid ID");
    return ObatProductionById[_obatId];
  }

  function getObatIpfsByBatchName (string memory _batchName) external view returns (string[] memory) {
    return ObatIpfsbyBatchName[_batchName];
  }

  function updateBatchProduction(
    string memory _obatId,
    string memory _batchName,
    EnumsLibrary.ObatAvailability _newStatus
  ) external {
    
    ObatProduction[] storage obatBatches = ObatProductionById[_obatId];
 
    bytes32 batchHash = keccak256(abi.encodePacked(_batchName));

    for (uint256 i = 0; i < obatBatches.length; i++){
      if (keccak256(abi.encodePacked(obatBatches[i].batchName)) == batchHash) {
        obatBatches[i].statusStok = _newStatus;
        break;
      } 
    }
  }

  function addObatPbf (
    string memory _obatId,
    string memory _orderId,
    string memory _namaProduk,
    string memory _batchName,
    uint8 _obatQuantity,
    string memory _pbfInstance
  ) external {

    ObatPbf memory newObatPbf = ObatPbf({
      obatId: _obatId, 
      orderId: _orderId,
      statusStok: EnumsLibrary.ObatAvailability.Ready,
      namaProduk: _namaProduk,
      batchName: _batchName,
      obatQuantity: _obatQuantity,
      pbfInstance: _pbfInstance
    });

    AllObatPbfBatchName.push(_batchName);
    ObatPbfBatchName[_batchName] = newObatPbf;
  } 

  function getAllObatPbfByInstance(string memory _pbfInstance) external view returns (ObatOutputStok[] memory){
    
    uint256 count = 0;
    bytes32 ownerInstance = keccak256(abi.encodePacked(_pbfInstance));

    for (uint i = 0; i < AllObatPbfBatchName.length; i++) {  
      bytes32 batchNameHash = keccak256(abi.encodePacked(ObatPbfBatchName[AllObatPbfBatchName[i]].pbfInstance));

      if (batchNameHash == ownerInstance) {
        count++;
      } 
    }

    ObatOutputStok[] memory obatInstance = new ObatOutputStok[](count);
    uint256 count1 = 0;

    for (uint i = 0; i <  AllObatPbfBatchName.length; i++) {
      bytes32 batchNameHash = keccak256(abi.encodePacked(ObatPbfBatchName[AllObatPbfBatchName[i]].pbfInstance));

      if (batchNameHash == ownerInstance) {

        ObatPbf memory currentObatRetailer = ObatPbfBatchName[AllObatPbfBatchName[i]];

        obatInstance[count1] = ObatOutputStok({
          orderId: currentObatRetailer.orderId,
          obatId: currentObatRetailer.obatId,
          namaProduk: currentObatRetailer.namaProduk,
          batchName: currentObatRetailer.batchName,
          obatQuantity: currentObatRetailer.obatQuantity,
          statusStok: currentObatRetailer.statusStok,
          ownerInstance: currentObatRetailer.pbfInstance
        });

        count1++; 
      } 
    }

    return obatInstance;
  }

  function getAllObatPbfReadyStock() external view returns (ObatOutputStok[] memory) {
      
      uint256 count = 0;

      for (uint i = 0; i < AllObatPbfBatchName.length; i++) {
        if (ObatPbfBatchName[AllObatPbfBatchName[i]].statusStok == EnumsLibrary.ObatAvailability.Ready) {
          count++;
        } 
      }

      ObatOutputStok[] memory obatReady = new ObatOutputStok[](count);
      uint256 count1 = 0;

      for (uint i = 0; i <  AllObatPbfBatchName.length; i++) {

        if (ObatPbfBatchName[AllObatPbfBatchName[i]].statusStok == EnumsLibrary.ObatAvailability.Ready) {

          ObatPbf memory currentObatPbf = ObatPbfBatchName[AllObatPbfBatchName[i]];

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
    string memory _batchName,
    EnumsLibrary.ObatAvailability _newStatus 
  ) external {
    ObatPbfBatchName[_batchName].statusStok = _newStatus;
  }

  function updateObatIpfs(
    string memory _batchName,
    string[] memory _obatIpfs
  ) public {

    delete ObatIpfsbyBatchName[_batchName];

    for (uint i = 0; i < _obatIpfs.length; i++) {
      ObatIpfsbyBatchName[_batchName].push(_obatIpfs[i]); 
    }
  }

  function addObatRetailer (
    string memory _obatId,
    string memory _orderId,
    string memory _namaProduk,
    string memory _batchName,
    uint8 _obatQuantity,
    string memory _retailerInstance
  ) external {

    ObatRetail memory newObatRetailer = ObatRetail({
      obatId: _obatId, 
      orderId: _orderId,
      statusStok: EnumsLibrary.ObatAvailability.Ready,
      namaProduk: _namaProduk,
      batchName: _batchName,
      obatQuantity: _obatQuantity, 
      retailerInstance: _retailerInstance
    });  

    AllObatRetailBatchName.push(_batchName);
    ObatRetailerBatchName[_batchName] = newObatRetailer;
  } 

  function getAllObatRetailerByInstance(string memory _retailerInstance) external view returns (ObatOutputStok[] memory) {
    
    uint256 count = 0; 
    bytes32 ownerInstance = keccak256(abi.encodePacked(_retailerInstance));

    for (uint i = 0; i < AllObatRetailBatchName.length; i++) {  
      bytes32 batchNameHash = keccak256(abi.encodePacked(ObatRetailerBatchName[AllObatRetailBatchName[i]].retailerInstance));

      if (batchNameHash == ownerInstance) {
        count++;
      } 
    }

    ObatOutputStok[] memory obatInstance = new ObatOutputStok[](count);
    uint256 count1 = 0;

    for (uint i = 0; i <  AllObatRetailBatchName.length; i++) {
      
      bytes32 batchNameHash = keccak256(abi.encodePacked(ObatRetailerBatchName[AllObatRetailBatchName[i]].retailerInstance));

      if (batchNameHash== ownerInstance) {

        ObatRetail memory currentObatRetailer = ObatRetailerBatchName[AllObatRetailBatchName[i]];

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

