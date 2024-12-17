// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./EnumsLibrary.sol";

contract ObatShared {
  struct st_obatDetails {
    string merk;
    string namaProduk;
    string[] klaim;
    string[] komposisi;
    string kemasan; 
    EnumsLibrary.TipeProduk tipeProduk;
    string factoryInstance;
    address factoryAddr;
  }

  struct st_obatProduction {
    EnumsLibrary.ObatAvailability statusStok;
    string namaProduk;
    string batchName;
    uint8 obatQuantity;
    string[] obatIpfs;
    string factoryInstance; 
  }

  struct st_obatOutputStock {
    string orderId;
    string obatId;
    string namaProduk;
    string batchName;
    uint8 obatQuantity;
    EnumsLibrary.ObatAvailability statusStok;
    string ownerInstance;
  }

  struct st_obatPbf {
    EnumsLibrary.ObatAvailability statusStok;
    string obatId;
    string orderId;
    string namaProduk;
    string batchName;
    uint8 obatQuantity;
    string[] obatIpfs;
    string pbfInstance;
  } 

  struct st_obatRetailer {
    EnumsLibrary.ObatAvailability statusStok;
    string obatId;
    string orderId;
    string namaProduk;
    string batchName;
    uint8 obatQuantity;
    string[] obatIpfs;
    string retailerInstance; 
  }

  string[] private allObatPbfBatchName;
  string[] private allObatRetailerBatchName;

  mapping(string => st_obatDetails) public obatDetailsById;
  mapping (string => st_obatProduction[]) public obatProductionById;
  mapping (string => st_obatPbf) public obatPbfBatchName;
  mapping (string => st_obatRetailer) public obatRetailerBatchName;

  function setObatDetail(
    string memory _obatId,
    string memory _merk,
    string memory _namaProduk,
    string[] memory _klaim,
    string[] memory _komposisi,
    string memory _kemasan,
    EnumsLibrary.TipeProduk _tipeProduk,
    string memory _factoryInstance,
    address _factoryAddr
  ) external {
      require(bytes(_obatId).length > 0, "Invalid Obat ID");
      require(bytes(_namaProduk).length > 0, "Invalid Obat Name");

      obatDetailsById[_obatId] = st_obatDetails({
        merk: _merk,
        namaProduk: _namaProduk,
        klaim: _klaim,
        komposisi: _komposisi,
        kemasan: _kemasan,
        tipeProduk: _tipeProduk,
        factoryInstance: _factoryInstance,
        factoryAddr: _factoryAddr
      });
  }

  function getObatDetail(string memory _obatId)
    external
    view
    returns (st_obatDetails memory){
      require(bytes(_obatId).length > 0, "Invalid ID");
      return obatDetailsById[_obatId];
  }

  function addBatchProduction(
    string memory _obatId,
    string memory _namaProduk,
    string memory _batchName,
    uint8 _obatQuantity,
    string[] memory _obatIpfsHash, 
    string memory _factoryInstance
  ) external {

    st_obatProduction memory newBatch = st_obatProduction({
      statusStok: EnumsLibrary.ObatAvailability.Ready,
      namaProduk: _namaProduk,
      batchName: _batchName,
      obatQuantity: _obatQuantity,
      obatIpfs: _obatIpfsHash,
      factoryInstance: _factoryInstance
    });

    obatProductionById[_obatId].push(newBatch);
  }

  function getObatProduction(string memory _obatId)
    external
    view
    returns (st_obatProduction[] memory) {
      require(bytes(_obatId).length > 0, "Invalid ID");
      return obatProductionById[_obatId];
  }

  function updateBatchProduction(
    string memory _obatId,
    string memory _batchName,
    string[] memory _obatIpfs
  ) external {
    st_obatProduction[] storage obatBatches = obatProductionById[_obatId];
 
    bytes32 batchHash = keccak256(abi.encodePacked(_batchName));

    for (uint256 i = 0; i < obatBatches.length; i++){
      if (keccak256(abi.encodePacked(obatBatches[i].batchName)) == batchHash) {
        obatBatches[i].statusStok = EnumsLibrary.ObatAvailability.Sold;
        obatBatches[i].obatIpfs = _obatIpfs;
      } 
    }
  }

  function addObatPbf (
    string memory _obatId,
    string memory _orderId,
    string memory _namaProduk,
    string memory _batchName,
    uint8 _obatQuantity,
    string[] memory _obatIpfsHash, 
    string memory _pbfInstance
  ) external {

    st_obatPbf memory newObatPbf = st_obatPbf({
      obatId: _obatId, 
      orderId: _orderId,
      statusStok: EnumsLibrary.ObatAvailability.Ready,
      namaProduk: _namaProduk,
      batchName: _batchName,
      obatQuantity: _obatQuantity,
      obatIpfs: _obatIpfsHash,
      pbfInstance: _pbfInstance
    });  

    allObatPbfBatchName.push(_batchName);
    obatPbfBatchName[_batchName] = newObatPbf;
  } 

  function getAllObatPbfByInstance(string memory _pbfInstance)
    external view returns (st_obatOutputStock[] memory) {
      uint256 count = 0;

      bytes32 ownerInstance = keccak256(abi.encodePacked(_pbfInstance));

      for (uint i = 0; i < allObatPbfBatchName.length; i++) {  
        bytes32 batchNameHash = keccak256(abi.encodePacked(obatPbfBatchName[allObatPbfBatchName[i]].pbfInstance));

        if (batchNameHash == ownerInstance) {
          count++;
        } 
      }

      st_obatOutputStock[] memory obatInstance = new st_obatOutputStock[](count);

      uint256 count1 = 0;

      for (uint i = 0; i <  allObatPbfBatchName.length; i++) {
        bytes32 batchNameHash = keccak256(abi.encodePacked(obatPbfBatchName[allObatPbfBatchName[i]].pbfInstance));

        if (batchNameHash== ownerInstance) {

          st_obatPbf memory currentObatRetailer = obatPbfBatchName[allObatPbfBatchName[i]];
 
          obatInstance[count1] = st_obatOutputStock({
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

  function getAllObatPbfReadyStock()
    external view returns (st_obatOutputStock[] memory) {
      uint256 count = 0;

      for (uint i = 0; i < allObatPbfBatchName.length; i++) {
        if (obatPbfBatchName[allObatPbfBatchName[i]].statusStok == EnumsLibrary.ObatAvailability.Ready) {
          count++;
        } 
      }

      st_obatOutputStock[] memory obatReady = new st_obatOutputStock[](count);

      uint256 count1 = 0;

      for (uint i = 0; i <  allObatPbfBatchName.length; i++) {

          if (obatPbfBatchName[allObatPbfBatchName[i]].statusStok == EnumsLibrary.ObatAvailability.Ready) {

          st_obatPbf memory currentObatPbf = obatPbfBatchName[allObatPbfBatchName[i]];

          obatReady[count1] = st_obatOutputStock({
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
    string[] memory _obatIpfs
  ) external {
    obatPbfBatchName[_batchName].statusStok = EnumsLibrary.ObatAvailability.Sold;
    obatPbfBatchName[_batchName].obatIpfs = _obatIpfs;
  }

  function addObatRetailer (
    string memory _obatId,
    string memory _orderId,
    string memory _namaProduk,
    string memory _batchName,
    uint8 _obatQuantity,
    string[] memory _obatIpfsHash, 
    string memory _retailerInstance
  ) external {

    st_obatRetailer memory newObatRetailer = st_obatRetailer({
      obatId: _obatId, 
      orderId: _orderId,
      statusStok: EnumsLibrary.ObatAvailability.Ready,
      namaProduk: _namaProduk,
      batchName: _batchName,
      obatQuantity: _obatQuantity,
      obatIpfs: _obatIpfsHash,
      retailerInstance: _retailerInstance
    });  

    allObatRetailerBatchName.push(_batchName);
    obatRetailerBatchName[_batchName] = newObatRetailer;
  } 

  function getAllObatRetailerByInstance(string memory _retailerInstance)
    external view returns (st_obatOutputStock[] memory) {
      uint256 count = 0;

      bytes32 ownerInstance = keccak256(abi.encodePacked(_retailerInstance));

      for (uint i = 0; i < allObatRetailerBatchName.length; i++) {  
        bytes32 batchNameHash = keccak256(abi.encodePacked(obatRetailerBatchName[allObatRetailerBatchName[i]].retailerInstance));

        if (batchNameHash == ownerInstance) {
          count++;
        } 
      }

      st_obatOutputStock[] memory obatInstance = new st_obatOutputStock[](count);

      uint256 count1 = 0;

      for (uint i = 0; i <  allObatPbfBatchName.length; i++) {
        bytes32 batchNameHash = keccak256(abi.encodePacked(obatRetailerBatchName[allObatRetailerBatchName[i]].retailerInstance));

        if (batchNameHash== ownerInstance) {

          st_obatRetailer memory currentObatRetailer = obatRetailerBatchName[allObatPbfBatchName[i]];

          obatInstance[count1] = st_obatOutputStock({
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
