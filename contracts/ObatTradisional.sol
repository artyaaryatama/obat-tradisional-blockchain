// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

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

  using EnumsLibrary for EnumsLibrary.OrderStatus;
  using EnumsLibrary for EnumsLibrary.ObatAvailability;
  using EnumsLibrary for EnumsLibrary.Roles;

  struct ObatOutputNie {
    string obatId;
    string namaProduk;
    string nieNumber;
    uint8 nieStatus;
    string factoryInstance;
  }

  struct ObatOutputBatch {
    string obatId;
    string namaProduk;
    string batchName;
    uint8 obatQuantity;
    EnumsLibrary.ObatAvailability statusStok;
    string ownerInstance;
  }

  string[] public AllObatIds;
  
  event ObatCreated(
    string namaProduk, 
    uint tipeObat, 
    string factoryInstance, 
    address factoryAddresses
  );

  event AddObatBatchProduction(
    string batchName, 
    uint8 quantity, 
    string namaProduk, 
    string factoryInstance
  );

  modifier onlyFactory() { 
    require(roleManager.hasRole(msg.sender, EnumsLibrary.Roles.Factory), "Only Factory");
    _;
  } 

  modifier onlyBPOM() {
    require(roleManager.hasRole(msg.sender, EnumsLibrary.Roles.BPOM), "Only BPOM");
    _;
  }

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
  ) 
    public 
    onlyFactory 
  {

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

    nieManager.createObatNie(
      _obatId, 
      _factoryInstance
    );

    AllObatIds.push(_obatId);

    emit ObatCreated(
      _namaProduk, 
      uint8(_tipeObat),  
      _factoryInstance, 
      msg.sender
    );
  } 

  function getAllObat() public view onlyBPOM returns (ObatOutputNie[] memory){

    uint256 totalObat = AllObatIds.length;
    ObatOutputNie[] memory obatList = new ObatOutputNie[](totalObat);

    for (uint256 i = 0; i < totalObat; i++) {
      string memory obatId = AllObatIds[i];
      ObatShared.ObatDetail memory details = obatShared.getObatDetail(obatId);
      ( 
        string memory nieNumber, 
        uint8 nieStatus
      ) = nieManager.getNieNumberAndStatus(obatId);
      
      obatList[i] = ObatOutputNie({
        obatId: obatId,
        namaProduk: details.namaProduk,
        nieNumber: nieNumber, 
        nieStatus: nieStatus,
        factoryInstance: details.factoryInstance
      });
    }

    return obatList;
  }


  function getAllObatByInstance (string memory _instanceName) public view onlyFactory returns (ObatOutputNie[] memory){
      
    uint256 ownedObat = countAllObatByInstance(_instanceName);

    ObatOutputNie[] memory obatList = new ObatOutputNie[](ownedObat);

    uint256 index = 0;

    for (uint256 i = 0; i < ownedObat; i++) {
      string memory obatId = AllObatIds[i];

      ObatShared.ObatDetail memory details =  obatShared.getObatDetail(obatId);

      if (keccak256(abi.encodePacked(details.factoryInstance)) == keccak256(abi.encodePacked(_instanceName))) {

        (
          string memory nieNumber, 
          uint8 nieStatus
        ) = nieManager.getNieNumberAndStatus(obatId);

          obatList[index] = ObatOutputNie({
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

  function detailObat (string memory _obatId) public view returns (ObatShared.ObatDetail memory){ 
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
      _factoryInstance
    ); 

    emit AddObatBatchProduction(
      _batchName, 
      _obatQuantity, 
      _namaProduk, 
      _factoryInstance
    );
  } 

  function getAllBatchProductionByInstance(string memory _instanceName) public view onlyFactory returns(ObatOutputBatch[] memory){
    uint256 totalReady = countAllBatchByInstance(_instanceName);

    ObatOutputBatch[] memory obatReadyStock = new ObatOutputBatch[](totalReady);

    bytes32 instanceHash = keccak256(abi.encodePacked(_instanceName));

    uint256 index = 0;

    for (uint256 i = 0; i < AllObatIds.length; i++) {
      string memory obatId = AllObatIds[i];
      ObatShared.ObatProduction[] memory obatBatches = obatShared.getObatProduction(obatId);

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

  function getAllBatchProductionReadyStock() public view returns (ObatOutputBatch[] memory){
    uint256 totalReady = countAllBatchReadyStock();

    if(totalReady == 0 ){
      return new ObatOutputBatch[](0);
    }

    ObatOutputBatch[] memory obatReadyStock = new ObatOutputBatch[](totalReady);

    uint256 index = 0;

    for (uint256 i = 0; i < AllObatIds.length; i++) {
      string memory obatId = AllObatIds[i];
      ObatShared.ObatProduction[] memory obatBatches = obatShared.getObatProduction(obatId);

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
  ) 
    public 
    view 
    returns (
      ObatShared.ObatProduction memory,
      string[] memory
  ){
 
    ObatShared.ObatProduction[] memory obatBatches = obatShared.getObatProduction(_obatId); 
    ObatShared.ObatProduction memory obatBatchDetail;
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

    return (
      obatBatchDetail, 
      obatIpfs
    );
  }
    
  function countAllBatchByInstance(string memory _instanceName) internal view returns (uint256){
    
    uint256 totalBatchInstance = 0;
    string memory obatId;
    bytes32 instanceHash = keccak256(abi.encodePacked(_instanceName));

    for (uint256 i = 0; i < AllObatIds.length; i++) {

      obatId = AllObatIds[i];

      ObatShared.ObatProduction[] memory batchObat = obatShared.getObatProduction(obatId); 
      
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

  function countAllBatchReadyStock() internal view returns (uint256){
    
    uint256 totalBatchReady = 0;
    string memory obatId;

    for (uint256 i = 0; i < AllObatIds.length; i++) {

      obatId = AllObatIds[i];

      ObatShared.ObatProduction[] memory batchObat = obatShared.getObatProduction(obatId);

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

  function countAllObatByInstance(string memory _factoryInstance) internal view returns (uint256){
    
    uint256 totalObat = AllObatIds.length;
    uint256 count = 0;

    for (uint i = 0; i < totalObat; i++) {
      string memory obatId = AllObatIds[i];
      ObatShared.ObatDetail memory details = obatShared.getObatDetail(obatId);

      if (keccak256(abi.encodePacked(details.factoryInstance)) == keccak256(abi.encodePacked(_factoryInstance))) {
        count++;
      }
    }

    return count;

  }

  function createObatOutputBatch(
    string memory obatId,
    ObatShared.ObatProduction memory obatBatch
  )  
    internal 
    pure 
    returns (
      ObatOutputBatch memory
  ){

    return ObatOutputBatch({
      obatId: obatId,
      namaProduk: obatBatch.namaProduk,
      batchName: obatBatch.batchName,
      obatQuantity: obatBatch.obatQuantity,
      statusStok: obatBatch.statusStok,
      ownerInstance: obatBatch.factoryInstance
    });
  } 
}