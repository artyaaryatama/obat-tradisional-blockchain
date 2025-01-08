// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./RoleManager.sol";
import "./MainSupplyChain.sol";
import "./EnumsLibrary.sol";
import "./ObatShared.sol";
 
contract ObatTradisional {

  RoleManager public roleManager;
  MainSupplyChain public mainSupplyChain; 
  ObatShared public obatShared;

  constructor(address _roleManagerAddr, address _mainSupplyChainAddr, address _obatSharedAddr) {
    roleManager = RoleManager(_roleManagerAddr);
    mainSupplyChain = MainSupplyChain(_mainSupplyChainAddr);
    obatShared = ObatShared(_obatSharedAddr);
  }

  modifier onlyFactory() { 
    require(roleManager.hasRole(msg.sender, EnumsLibrary.Roles.Factory), "Only Factory");
    _;
  } 

  modifier onlyPBF() {
    require(roleManager.hasRole(msg.sender, EnumsLibrary.Roles.PBF), "Only PBF");
    _;
  }

  modifier onlyBPOM() {
    require(roleManager.hasRole(msg.sender, EnumsLibrary.Roles.BPOM), "Only BPOM");
    _;
  }

  using EnumsLibrary for EnumsLibrary.NieStatus;
  using EnumsLibrary for EnumsLibrary.OrderStatus;
  using EnumsLibrary for EnumsLibrary.ObatAvailability;
  using EnumsLibrary for EnumsLibrary.Roles;
  using EnumsLibrary for EnumsLibrary.TipePermohonanCpotb;

  struct st_obatNie {
    string nieNumber; 
    EnumsLibrary.NieStatus nieStatus;   
    uint256 timestampProduction;
    uint256 timestampNieRequest;       
    uint256 timestampNieApprove;  
    string bpomInstance;      
    address bpomAddr;
  }

  struct st_obatOutputNie {
    string obatId;
    string namaProduk;
    string nieNumber;
    EnumsLibrary.NieStatus nieStatus;
    string factoryInstance;
  }

  struct st_obatNameApprovedNie {
    string obatId;
    string namaProduk;
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
  
  mapping (string => st_obatNie) public obatNieById;
  mapping (string => st_obatNameApprovedNie[]) public obatProductNameApprovedByFactory;

  event evt_obatCreated(string namaProduk, uint tipeObat, string factoryInstance, address factoryAddresses);
  event evt_nieRequested(string factoryInstance, address factoryAddr,uint timestampRequest);
  event evt_nieApproved(string bpomInstance, address bpomAddr, string nieNumber, uint timestampApproved);
  event evt_addBatchProduction(string batchName, uint8 quantity, string namaProduk, string factoryInstance);


  // status: 200ok
  // function getJenisSediaanAvail(string memory _factoryInstanceName)
  //   public 
  //   view 
  //   returns(
  //     MainSupplyChain.st_approvedCert[] memory
  // ) {
  //    MainSupplyChain.st_approvedCert[] memory approvedJenisSediaan = mainSupplyChain.approvedTipePermohonan(_factoryInstanceName); 
  //    return approvedJenisSediaan;
  // }

  // status: 200ok
  function createObatNie(
    EnumsLibrary.NieStatus _nieStatus,
    uint256 _timestampProuction
  ) internal pure returns (st_obatNie memory){
    return st_obatNie({
      nieNumber: "",
      nieStatus: _nieStatus,
      timestampProduction: _timestampProuction, 
      timestampNieRequest: 0,
      timestampNieApprove: 0,
      bpomInstance: "",
      bpomAddr: address(0)
    }); 
  }

  // status: 200ok
  function createObat(
    string memory _obatId,
    string memory _merk,
    string memory _namaProduk,
    string[] memory _klaim,
    string memory _kemasan,
    string[] memory _komposisi,
    string memory _factoryInstance,
    EnumsLibrary.TipePermohonanCdob _tipeObat,
    string memory _cpotbIpfs
  ) public onlyFactory {
      require(bytes(_obatId).length > 0, "Invalid ID");

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
        _cpotbIpfs 
      );

      obatNieById[_obatId] = createObatNie(
        EnumsLibrary.NieStatus.inLocalProduction,
        block.timestamp
      );

      allObatIds.push(_obatId);

    emit evt_obatCreated(_namaProduk, uint8(_tipeObat),  _factoryInstance, msg.sender);
  } 
   
  // status: 200ok
  function getAllObat()
      public
      view
      onlyBPOM
      returns (st_obatOutputNie[] memory)
  {
      uint256 totalObat = allObatIds.length;

      uint256 totalNie = 0;
      for (uint256 i = 0; i < totalObat; i++) {
        string memory obatId = allObatIds[i];
        st_obatNie memory nie = obatNieById[obatId];

        if (nie.nieStatus != EnumsLibrary.NieStatus.inLocalProduction) {
          totalNie++;
        }
      }

      st_obatOutputNie[] memory obatList = new st_obatOutputNie[](totalNie);

      uint256 index = 0;
      for (uint256 i = 0; i < totalObat; i++) {
          string memory obatId = allObatIds[i];
          st_obatNie memory nie = obatNieById[obatId];
          ObatShared.st_obatDetails memory details = obatShared.getObatDetail(obatId);

          if (nie.nieStatus != EnumsLibrary.NieStatus.inLocalProduction) {
            obatList[index] = st_obatOutputNie({
              obatId: obatId,
              namaProduk: details.namaProduk,
              nieNumber: nie.nieNumber,
              nieStatus: nie.nieStatus,
              factoryInstance: details.factoryInstance
            });
            index++;
          }
      }

      return obatList;
  }

  // status: 200ok
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

  // status: 200ok
  function getAllObatByInstance (string memory _instanceName)
    public view onlyFactory returns (st_obatOutputNie[] memory){
      
      uint256 ownedObat = countAllObatByInstance(_instanceName);

      st_obatOutputNie[] memory filteredObatList = new st_obatOutputNie[](ownedObat);
      uint256 index = 0;
 
      for (uint i = 0; i < allObatIds.length; i++) {
        string memory obatId = allObatIds[i];
        
        ObatShared.st_obatDetails memory details =  obatShared.getObatDetail(obatId);
        st_obatNie memory nie = obatNieById[obatId];

        if (keccak256(abi.encodePacked(details.factoryInstance)) == keccak256(abi.encodePacked(_instanceName))) {

            filteredObatList[index] = st_obatOutputNie({
              obatId: obatId,
              namaProduk: details.namaProduk,
              nieNumber: nie.nieNumber,
              nieStatus: nie.nieStatus,
              factoryInstance: details.factoryInstance
            });

            index++;
        }
    }

    return filteredObatList;
  }

  // status: 200ok
  function detailObat (string memory _obatId)
    public view returns (
      ObatShared.st_obatDetails memory,
      st_obatNie memory
    ){
      ObatShared.st_obatDetails memory obatDetail = obatShared.getObatDetail(_obatId);  
      return (obatDetail, obatNieById[_obatId]);
  }

  // status: 200ok
  function requestNie (
    string memory _obatId,
    string memory _factoryInstance
  ) public onlyFactory { 

      obatNieById[_obatId].timestampNieRequest = block.timestamp;
      obatNieById[_obatId].nieStatus = EnumsLibrary.NieStatus.RequestedNie;

      emit evt_nieRequested(_factoryInstance, msg.sender, block.timestamp );
  }

  // status: 200ok
  function approveNie (
    string memory _obatId,
    string memory _nieNumber,
    string memory _instanceName
  ) public onlyBPOM{

      obatNieById[_obatId].bpomInstance = _instanceName;
      obatNieById[_obatId].bpomAddr = msg.sender;
      obatNieById[_obatId].nieNumber = _nieNumber;
      obatNieById[_obatId].timestampNieApprove = block.timestamp;
      obatNieById[_obatId].nieStatus = EnumsLibrary.NieStatus.ApprovedNie;

      ObatShared.st_obatDetails memory obatDetail = obatShared.getObatDetail(_obatId); 
      string memory namaProduk = obatDetail.namaProduk;
      string memory factoryInstance = obatDetail.factoryInstance;

      st_obatNameApprovedNie memory obatApproved = st_obatNameApprovedNie({
        obatId: _obatId,
        namaProduk: namaProduk
      });

      obatProductNameApprovedByFactory[factoryInstance].push(obatApproved); 
      emit evt_nieApproved(_instanceName, msg.sender, _nieNumber, block.timestamp);
  }

  // status: 200ok
  function getAllObatNameApprovedNie(string memory _instanceName)
    public view returns (st_obatNameApprovedNie[] memory){
      return obatProductNameApprovedByFactory[_instanceName]; 
  }  

  // status: 200ok
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

  // status: 200ok
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

  // status: 200ok
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