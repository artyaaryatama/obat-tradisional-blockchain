// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./EnumsLibrary.sol";

contract ObatCreator {
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

  mapping(string => st_obatDetails) public obatDetailsById;
  mapping (string => st_obatProduction[]) public obatProductionById;

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

}
