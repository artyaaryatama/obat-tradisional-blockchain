// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./RoleManager.sol";
import "./EnumsLibrary.sol";
import "./NieManager.sol";
import "./ObatShared.sol";
 
contract ObatTradisional {

  RoleManager public roleManager;
  ObatShared public obatShared;
  NieManager public nieManager;

  constructor(address _roleManagerAddr, address _obatSharedAddr, address _nieManagerAddr) {
    roleManager = RoleManager(_roleManagerAddr);
    obatShared = ObatShared(_obatSharedAddr);
    nieManager = NieManager(_nieManagerAddr);
  }

  modifier onlyFactory() { 
    require(roleManager.hasRole(msg.sender, EnumsLibrary.Roles.Factory), "Only Factory");
    _;
  } 

  modifier onlyBPOM() {
    require(roleManager.hasRole(msg.sender, EnumsLibrary.Roles.BPOM), "Only BPOM");
    _;
  }

  using EnumsLibrary for EnumsLibrary.OrderStatus;
  using EnumsLibrary for EnumsLibrary.ObatAvailability;
  using EnumsLibrary for EnumsLibrary.Roles;

  struct st_obatOutputNie {
    string obatId;
    string namaProduk;
    string nieNumber;
    uint8 nieStatus;
    string factoryInstance;
  }

  struct st_obatOutputBatch {
    string obatId;
    string namaProduk;
    string batchName;
    uint8 obatQuantity;
    EnumsLibrary.ObatAvailability statusStok;
    string ownerInstance;
  }

  string[] public allObatIds;
  
  event evt_obatCreated(string namaProduk, uint tipeObat, string factoryInstance, address factoryAddresses);
  event evt_addBatchProduction(string batchName, uint8 quantity, string namaProduk, string factoryInstance);
  event evt_renewRejectedNie(string namaProduk, uint256 timestamp);

  function createObat(
    string memory _obatId,
    string memory _merk,
    string memory _namaProduk,
    string[] memory _klaim,
    string memory _kemasan,
    string[] memory _komposisi,
    string memory _factoryInstance,
    EnumsLibrary.TipePermohonanCdob _tipeObat,
    string memory _cpotbIpfs,
    string memory _jenisObat
  ) public onlyFactory {

    obatShared.setObatDetail(
      _obatId,
      _merk, 
      _namaProduk,
      _klaim,
      _komposisi,
      _kemasan,
      _factoryInstance,
      msg.sender,
      _tipeObat, 
      _cpotbIpfs,
      _jenisObat
    );

    nieManager.createObatNie(_obatId, _factoryInstance);

    allObatIds.push(_obatId);

    emit evt_obatCreated(_namaProduk, uint8(_tipeObat),  _factoryInstance, msg.sender);
  } 

  function renewRequestedNie(
    string memory _obatId,
    string memory _merk,
    string memory _namaProduk,
    string[] memory _klaim, 
    string memory _kemasan,
    string[] memory _komposisi,
    EnumsLibrary.TipePermohonanCdob _tipeObat,
    string memory _jenisObat
  ) public onlyFactory {

    obatShared.updateObatDetail(
      _obatId,
      _merk, 
      _namaProduk,
      _klaim,
      _komposisi,
      _kemasan,
      _tipeObat, 
      _jenisObat
    );

    nieManager.renewRequestNie(_obatId, block.timestamp);

    allObatIds.push(_obatId); 

    emit evt_renewRejectedNie(_namaProduk, block.timestamp);
  } 
  
  function getAllObat()
    public
    view
    onlyBPOM
    returns (st_obatOutputNie[] memory)
  {
    uint256 totalObat = allObatIds.length;
    st_obatOutputNie[] memory obatList = new st_obatOutputNie[](totalObat);

    for (uint256 i = 0; i < totalObat; i++) {
      string memory obatId = allObatIds[i];

      (string memory nieNumber, uint8 nieStatus) = nieManager.getNieNumberAndStatus(obatId);
      ObatShared.st_obatDetails memory details = obatShared.getObatDetail(obatId);

      obatList[i] = st_obatOutputNie({
        obatId: obatId,
        namaProduk: details.namaProduk,
        nieNumber: nieNumber, 
        nieStatus: nieStatus,
        factoryInstance: details.factoryInstance
      });
    }

    return obatList;
  }

  function countAllObatByInstance(string memory _factoryInstance)
    internal view returns (uint256){
      uint256 totalObat = allObatIds.length;
      uint256 count = 0;

      for (uint i = 0; i < totalObat; i++) {
        string memory obatId = allObatIds[i];

        ObatShared.st_obatDetails memory details =  obatShared.getObatDetail(obatId);
        if (keccak256(abi.encodePacked(details.factoryInstance)) == keccak256(abi.encodePacked(_factoryInstance))) {
          count++;
        }
      }

      return count;

  }

  function getAllObatByInstance (string memory _instanceName)
    public view onlyFactory returns (st_obatOutputNie[] memory){
      
      uint256 ownedObat = countAllObatByInstance(_instanceName);

      st_obatOutputNie[] memory obatList = new st_obatOutputNie[](ownedObat);

      for (uint256 index = 0; index < ownedObat; index++) {
        string memory obatId = allObatIds[index];

        ObatShared.st_obatDetails memory details =  obatShared.getObatDetail(obatId);

        if (keccak256(abi.encodePacked(details.factoryInstance)) == keccak256(abi.encodePacked(_instanceName))) {

          (string memory nieNumber, uint8 nieStatus) = nieManager.getNieNumberAndStatus(obatId);

            obatList[index] = st_obatOutputNie({
              obatId: obatId, 
              namaProduk: details.namaProduk,
              nieNumber: nieNumber, 
              nieStatus: nieStatus,
              factoryInstance: details.factoryInstance
            });

          index++;
        }
      }

    return obatList;
  }

  function detailObat (string memory _obatId) 
    public view returns ( 
      ObatShared.st_obatDetails memory
    ){ 
      return obatShared.getObatDetail(_obatId);
  }  

  function addBatchProduction(
    string memory _obatId,
    string memory _namaProduk,
    string memory _batchName,
    uint8 _obatQuantity,
    string[] memory _obatIpfsHash, 
    string memory _factoryInstance
  ) public onlyFactory {

    obatShared.addBatchProduction(
      _obatId,
      _namaProduk,
      _batchName,
      _obatQuantity,
      _obatIpfsHash,
      _factoryInstance); 

    emit evt_addBatchProduction (_batchName, _obatQuantity, _namaProduk, _factoryInstance);
  } 
 
  function countAllBatchReadyStock()
    internal view returns (uint256){
      uint256 totalBatchReady = 0;
      string memory obatId;

      for (uint256 i = 0; i < allObatIds.length; i++) {

        obatId = allObatIds[i];

        ObatShared.st_obatProduction[] memory batchObat = obatShared.getObatProduction(obatId);

        if (batchObat.length == 0) {
          continue;
        }

        for (uint256 j = 0; j < batchObat.length; j++) {
          if (batchObat[j].statusStok == EnumsLibrary.ObatAvailability.Ready) {
            totalBatchReady++;
          }
        }
      }

    return totalBatchReady;
  }

  function countAllBatchByInstance(string memory _instanceName)
    internal view returns (uint256){
      uint256 totalBatchInstance = 0;
      string memory obatId;
      bytes32 instanceHash = keccak256(abi.encodePacked(_instanceName));

      for (uint256 i = 0; i < allObatIds.length; i++) {

        obatId = allObatIds[i];

        ObatShared.st_obatProduction[] memory batchObat = obatShared.getObatProduction(obatId); 
        
        if (batchObat.length == 0) {
            continue;
        }

        for (uint256 j = 0; j < batchObat.length; j++) {
          if (keccak256(abi.encodePacked(batchObat[j].factoryInstance)) == instanceHash) {
            totalBatchInstance++;
          }
        }
      }

    return totalBatchInstance;
  }

  function createObatOutputBatch(
    string memory obatId,
    ObatShared.st_obatProduction memory obatBatch
  ) internal pure returns (st_obatOutputBatch memory) {
      return st_obatOutputBatch({
        obatId: obatId,
        namaProduk: obatBatch.namaProduk,
        batchName: obatBatch.batchName,
        obatQuantity: obatBatch.obatQuantity,
        statusStok: obatBatch.statusStok,
        ownerInstance: obatBatch.factoryInstance
      });
  } 

  function getAllBatchProductionByInstance(string memory _instanceName)
    public view onlyFactory returns(st_obatOutputBatch[] memory){
      uint256 totalReady = countAllBatchByInstance(_instanceName);

      st_obatOutputBatch[] memory obatReadyStock = new st_obatOutputBatch[](totalReady);

      bytes32 instanceHash = keccak256(abi.encodePacked(_instanceName));

      uint256 index = 0;

      for (uint256 i = 0; i < allObatIds.length; i++) {
        string memory obatId = allObatIds[i];
        ObatShared.st_obatProduction[] memory obatBatches = obatShared.getObatProduction(obatId);

        if (obatBatches.length == 0) {
          continue;
        }

        for (uint256 j = 0; j < obatBatches.length; j++) {
          if (keccak256(abi.encodePacked(obatBatches[j].factoryInstance)) == instanceHash) {

            obatReadyStock[index] = createObatOutputBatch(obatId, obatBatches[j]); 
            index++; 
          }
        }
      }

    return obatReadyStock;
  }


  function getAllBatchProductionReadyStock()
    public view returns (
      st_obatOutputBatch[] memory
  ){
      uint256 totalReady = countAllBatchReadyStock();

      if(totalReady == 0 ){
        return new st_obatOutputBatch[](0);
      }

      st_obatOutputBatch[] memory obatReadyStock = new st_obatOutputBatch[](totalReady);

      uint256 index = 0;

      for (uint256 i = 0; i < allObatIds.length; i++) {
        string memory obatId = allObatIds[i];
        ObatShared.st_obatProduction[] memory obatBatches = obatShared.getObatProduction(obatId);

        for (uint256 j = 0; j < obatBatches.length; j++) {
          if (obatBatches[j].statusStok == EnumsLibrary.ObatAvailability.Ready) {
            obatReadyStock[index] = createObatOutputBatch(obatId, obatBatches[j]);
            index++;
          }
        }
    }

    return obatReadyStock;
  }

  function detailBatchProduction(
    string memory _obatId,
    string memory _batchName
  ) public view returns (
      ObatShared.st_obatProduction memory,
      string[] memory
    ){

    ObatShared.st_obatProduction[] memory obatBatches = obatShared.getObatProduction(_obatId); 

    ObatShared.st_obatProduction memory obatBatchDetail;
    string[] memory obatIpfs = obatShared.getObatIpfsByBatchName(_batchName);

    bytes32 batchHash = keccak256(abi.encodePacked(_batchName));

    for (uint256 i = 0; i < obatBatches.length; i++){
      if (keccak256(abi.encodePacked(obatBatches[i].batchName)) == batchHash) {
        obatBatchDetail =  obatBatches[i];
        break;
      } 
    }

    if ((roleManager.hasRole(msg.sender, EnumsLibrary.Roles.PBF))) {
      obatIpfs = new string[](0);
    }

    return (obatBatchDetail, obatIpfs);
  }

}