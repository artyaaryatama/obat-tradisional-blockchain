// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol"; 
import "./RoleManager.sol";
import "./EnumsLibrary.sol";
import "./NieManager.sol";
import "./ObatShared.sol";
 
contract ObatTradisional is ReentrancyGuard{

  RoleManager public immutable roleManager;
  ObatShared public immutable obatShared;
  NieManager public immutable nieManager;

  constructor(
    address roleManagerAddr, 
    address obatSharedAddr, 
    address nieManagerAddr
  ) {
    roleManager = RoleManager(roleManagerAddr);
    obatShared = ObatShared(obatSharedAddr);
    nieManager = NieManager(nieManagerAddr);
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
    uint256 timestampExpired;
  }

  struct ObatOutputBatch {
    string obatId;
    string namaProduk;
    string batchName;
    uint8 obatQuantity;
    EnumsLibrary.ObatAvailability statusStok;
    string ownerInstance;
  }

  string[] public allObatIds;
  
  event ObatCreated(
    string namaProduk, 
    uint tipeObat, 
    string factoryInstance, 
    address factoryAddresses,
    uint256 timestamp
  );

  event AddObatBatchProduction(
    string batchName, 
    uint8 quantity, 
    string namaProduk, 
    string factoryInstance,
    uint256 timestamp 
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
    string memory obatId,
    string memory merk,
    string memory namaProduk,
    string[] memory klaim,
    string memory kemasan,
    string[] memory komposisi,
    string memory factoryInstance,
    EnumsLibrary.TipePermohonanCdob tipeObat,
    string memory cpotbIpfs,
    string memory jenisObat
  ) 
    public 
    onlyFactory 
    nonReentrant 
  {
    allObatIds.push(obatId);

    obatShared.setObatDetail(
      obatId,
      merk, 
      namaProduk,
      klaim,
      komposisi,
      kemasan,
      factoryInstance,
      msg.sender,
      tipeObat, 
      cpotbIpfs,
      jenisObat
    );

    nieManager.createObatNie(
      obatId, 
      factoryInstance 
    );

    emit ObatCreated(
      namaProduk, 
      uint8(tipeObat),  
      factoryInstance, 
      msg.sender,
      block.timestamp
    );
  } 

  function getAllObat() public view onlyBPOM returns (ObatOutputNie[] memory){

    uint256 totalId = allObatIds.length;
    ObatOutputNie[] memory obatList = new ObatOutputNie[](totalId);
    string[] memory obatIds = allObatIds;

    for (uint256 i = 0; i < totalId; i++) {
      string memory obatId = obatIds[i];

      ObatShared.ObatDetail memory details = obatShared.getObatDetail(obatId);

      ( 
        string memory nieNumber, 
        uint8 nieStatus,
        uint256 timestampNieExpired
      ) = nieManager.getNieNumberAndStatus(obatId);
      
      obatList[i] = ObatOutputNie({
        obatId: obatId,
        namaProduk: details.namaProduk,
        nieNumber: nieNumber, 
        nieStatus: nieStatus,
        factoryInstance: details.factoryInstance,
        timestampExpired: timestampNieExpired 
      });
    }

    return obatList;
  }

  function getAllObatByInstance(string memory instanceName) public view onlyFactory returns (ObatOutputNie[] memory) {
    uint256 totalId = allObatIds.length;
    uint256 ownedObat = countAllObatByInstance(instanceName);
    ObatOutputNie[] memory obatList = new ObatOutputNie[](ownedObat);
    uint256 index = 0;
    
    bytes32 instanceHash = keccak256(abi.encodePacked(instanceName));

    for (uint256 i = 0; i < totalId; i++) {
        string memory obatId = allObatIds[i];
        ObatShared.ObatDetail memory details = obatShared.getObatDetail(obatId);

        // Filter only matching instances
        if (keccak256(abi.encodePacked(details.factoryInstance)) == instanceHash) {
            (
              string memory nieNumber, 
              uint8 nieStatus,
              uint256 timestampNieExpired
              ) = nieManager.getNieNumberAndStatus(obatId);

            obatList[index] = ObatOutputNie({
                obatId: obatId,
                namaProduk: details.namaProduk,
                nieNumber: nieNumber,
                nieStatus: nieStatus,
                factoryInstance: details.factoryInstance,
                timestampExpired: timestampNieExpired
            });

            index++;
        }
    }

    return obatList;
  }

  function detailObat (string memory obatId) public view returns (ObatShared.ObatDetail memory){ 
    return obatShared.getObatDetail(obatId);
  }  

  function addBatchProduction(
    string memory obatId,
    string memory namaProduk,
    string memory batchName,
    uint8 obatQuantity,
    string[] memory obatIpfs, 
    string memory factoryInstance
  ) public onlyFactory nonReentrant{

    obatShared.addBatchProduction(
      obatId,
      namaProduk,
      batchName,
      obatQuantity,
      obatIpfs,
      factoryInstance
    ); 

    emit AddObatBatchProduction(
      batchName, 
      obatQuantity, 
      namaProduk, 
      factoryInstance,
      block.timestamp 
    );
  } 

  function getAllBatchProductionByInstance(string memory instanceName) public view onlyFactory returns (ObatOutputBatch[] memory) {
    uint256 totalId = allObatIds.length;
    bytes32 instanceHash = keccak256(abi.encodePacked(instanceName));

    ObatOutputBatch[] memory tempObatReadyStock = new ObatOutputBatch[](totalId * 5);
    uint256 index = 0;

    for (uint256 i = 0; i < totalId; i++) {
      string memory obatId = allObatIds[i];
      ObatShared.ObatProduction[] memory obatBatches = obatShared.getObatProduction(obatId);

      for (uint256 j = 0; j < obatBatches.length; j++) {
        if (keccak256(abi.encodePacked(obatBatches[j].factoryInstance)) == instanceHash) {
          tempObatReadyStock[index] = createObatOutputBatch(obatId, obatBatches[j]);
          index++;
        }
      }
    }

    ObatOutputBatch[] memory obatReadyStock = new ObatOutputBatch[](index);
    for (uint256 k = 0; k < index; k++) {
      obatReadyStock[k] = tempObatReadyStock[k];
    }

    return obatReadyStock;
  }


  // function getAllBatchProductionByInstance(string memory instanceName) public view onlyFactory returns(ObatOutputBatch[] memory){
  //   uint256 totalId = allObatIds.length;
  //   uint256 totalReady = countAllBatchByInstance(instanceName);
  //   bytes32 instanceHash = keccak256(abi.encodePacked(instanceName));
  //   uint256 index = 0;
  //   ObatOutputBatch[] memory obatReadyStock = new ObatOutputBatch[](totalReady);

  //   for (uint256 i = 0; i < totalId; i++) {
  //     string memory obatId = allObatIds[i];
  //     ObatShared.ObatProduction[] memory obatBatches = obatShared.getObatProduction(obatId);

  //     if (obatBatches.length == 0) {
  //       continue;
  //     }

  //     for (uint256 j = 0; j < obatBatches.length; j++) {
  //       if (keccak256(abi.encodePacked(obatBatches[j].factoryInstance)) == instanceHash) {

  //         obatReadyStock[index] = createObatOutputBatch(obatId, obatBatches[j]); 
  //         index++; 
  //       }
  //     }
  //   }

  //   return obatReadyStock;
  // }

  function getAllBatchProductionReadyStock() public view returns (ObatOutputBatch[] memory) {
    uint256 totalId = allObatIds.length;

    ObatOutputBatch[] memory tempObatReadyStock = new ObatOutputBatch[](totalId * 5);
    uint256 index = 0;

    for (uint256 i = 0; i < totalId; i++) {
      string memory obatId = allObatIds[i];
      ObatShared.ObatProduction[] memory obatBatches = obatShared.getObatProduction(obatId);

      for (uint256 j = 0; j < obatBatches.length; j++) {
        if (obatBatches[j].statusStok == EnumsLibrary.ObatAvailability.Ready) {
          tempObatReadyStock[index] = createObatOutputBatch(obatId, obatBatches[j]);
          index++;
        }
      }
    }

    ObatOutputBatch[] memory obatReadyStock = new ObatOutputBatch[](index);

    for (uint256 k = 0; k < index; k++) {
      obatReadyStock[k] = tempObatReadyStock[k];
    }

    return obatReadyStock;
}


  // function getAllBatchProductionReadyStock() public view returns (ObatOutputBatch[] memory){
  //   uint256 totalReady = countAllBatchReadyStock();

  //   if(totalReady == 0 ){
  //     return new ObatOutputBatch[](0);
  //   }

  //   ObatOutputBatch[] memory obatReadyStock = new ObatOutputBatch[](totalReady);

  //   uint256 index = 0;
  //   uint256 totalId = allObatIds.length;

  //   for (uint256 i = 0; i < totalId; i++) {
  //     string memory obatId = allObatIds[i];
  //     ObatShared.ObatProduction[] memory obatBatches = obatShared.getObatProduction(obatId);

  //     for (uint256 j = 0; j < obatBatches.length; j++) {
  //       if (obatBatches[j].statusStok == EnumsLibrary.ObatAvailability.Ready) {
  //         obatReadyStock[index] = createObatOutputBatch(obatId, obatBatches[j]);
  //         index++;
  //       }
  //     }
  //   }
 
  //   return obatReadyStock;
  // }

  function detailBatchProduction(
    string memory obatId,
    string memory batchName
  ) 
    public 
    view 
    returns (
      ObatShared.ObatProduction memory,
      string[] memory
  ){
 
    string[] memory obatIpfs = obatShared.getObatIpfsByBatchName(batchName);

    bytes32 batchHash = keccak256(abi.encodePacked(batchName));
    
    ObatShared.ObatProduction[] memory obatBatches = obatShared.getObatProduction(obatId); 
    
    ObatShared.ObatProduction memory obatBatchDetail = ObatShared.ObatProduction({
      statusStok: EnumsLibrary.ObatAvailability.Ready,
      namaProduk: "",
      batchName: "",
      obatQuantity: 0,
      factoryInstance: ""
    });

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
    
  // function countAllBatchByInstance(string memory instanceName) internal view returns (uint256){
    
  //   uint256 totalBatchInstance = 0;
  //   string memory obatId;
  //   bytes32 instanceHash = keccak256(abi.encodePacked(instanceName));
  //   uint256 totalId = allObatIds.length;

  //   for (uint256 i = 0; i < totalId; i++) {

  //     obatId = allObatIds[i];

  //     ObatShared.ObatProduction[] memory batchObat = obatShared.getObatProduction(obatId); 
      
  //     if (batchObat.length == 0) {
  //         continue;
  //     }

  //     for (uint256 j = 0; j < batchObat.length; j++) {
  //       if (keccak256(abi.encodePacked(batchObat[j].factoryInstance)) == instanceHash) {
  //         totalBatchInstance++;
  //       }
  //     }
  //   }

  //   return totalBatchInstance;
  // }

  // function countAllBatchReadyStock() internal view returns (uint256){
    
  //   uint256 totalBatchReady = 0;
  //   string memory obatId;
  //   uint256 totalId = allObatIds.length;

  //   for (uint256 i = 0; i < totalId; i++) {

  //     obatId = allObatIds[i];

  //     ObatShared.ObatProduction[] memory batchObat = obatShared.getObatProduction(obatId);

  //     if (batchObat.length == 0) {
  //       continue;
  //     }

  //     for (uint256 j = 0; j < batchObat.length; j++) {
  //       if (batchObat[j].statusStok == EnumsLibrary.ObatAvailability.Ready) {
  //         totalBatchReady++;
  //       }
  //     }
  //   }

  //   return totalBatchReady;
  // }

  function countAllObatByInstance(string memory factoryInstance) internal view returns (uint256){
    
    uint256 totalId = allObatIds.length;
    uint256 count = 0;

    for (uint i = 0; i < totalId; i++) {
      string memory obatId = allObatIds[i];
      ObatShared.ObatDetail memory details = obatShared.getObatDetail(obatId);

      if (keccak256(abi.encodePacked(details.factoryInstance)) == keccak256(abi.encodePacked(factoryInstance))) {
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