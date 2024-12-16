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
    string obatId;
    string namaProduk;
    string batchName;
    uint8 obatQuantity;
    EnumsLibrary.ObatAvailability statusStok;
    string ownerInstance;
  }

  struct st_obatPbf {
    EnumsLibrary.ObatAvailability statusStok;
    string namaProduk;
    string batchName;
    uint8 obatQuantity;
    string[] obatIpfs;
    string pbfInstance; 
    string obatId;
  }

  struct st_obatRetailer {
    EnumsLibrary.ObatAvailability statusStok;
    string namaProduk;
    string batchName;
    uint8 obatQuantity;
    string[] obatIpfs;
    string retailerInstance; 
    string obatId;
  }

  string[] private allObatPbfBatchName;

  mapping(string => st_obatDetails) public obatDetailsById;
  mapping (string => st_obatProduction[]) public obatProductionById;
  mapping (string => st_obatPbf) public ObatPbfBatchName;


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
    string memory _namaProduk,
    string memory _batchName,
    uint8 _obatQuantity,
    string[] memory _obatIpfsHash, 
    string memory _pbfInstance
  ) external {

    st_obatPbf memory newObatPbf = st_obatPbf({
      obatId: _obatId, 
      statusStok: EnumsLibrary.ObatAvailability.Ready,
      namaProduk: _namaProduk,
      batchName: _batchName,
      obatQuantity: _obatQuantity,
      obatIpfs: _obatIpfsHash,
      pbfInstance: _pbfInstance
    });  

    allObatPbfBatchName.push(_batchName);
    ObatPbfBatchName[_batchName] = newObatPbf;
  } 

  function getAllObatPbfReadyStock()
    external view returns (st_obatOutputStock[] memory) {
      uint256 count = 0;

      for (uint i = 0; i < allObatPbfBatchName.length; i++) {
        if (ObatPbfBatchName[allObatPbfBatchName[i]].statusStok == EnumsLibrary.ObatAvailability.Ready) {
          count++;
        } 
      }

      st_obatOutputStock[] memory obatReady = new st_obatOutputStock[](count);

      uint256 count1 = 0;

      for (uint i = 0; i <  allObatPbfBatchName.length; i++) {

          if (ObatPbfBatchName[allObatPbfBatchName[i]].statusStok == EnumsLibrary.ObatAvailability.Ready) {

          st_obatPbf memory currentObatPbf = ObatPbfBatchName[allObatPbfBatchName[i]];

          obatReady[count1] = st_obatOutputStock({
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


}
