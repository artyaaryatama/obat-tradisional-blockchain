// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./RoleManager.sol";
import "./MainSupplyChain.sol";
import "./EnumsLibrary.sol";
 
contract ObatTradisional {

  RoleManager public roleManager;
  MainSupplyChain public mainSupplyChain; 

  constructor(address _roleManagerAddr, address _mainSupplyChainAddr) {
    roleManager = RoleManager(_roleManagerAddr);
    mainSupplyChain = MainSupplyChain(_mainSupplyChainAddr);
  }

    modifier onlyFactory() { 
    require(roleManager.hasRole(msg.sender, EnumsLibrary.Roles.Factory), "Access restricted to Factory role");
    _;
  } 

  modifier onlyPBF() {
    require(roleManager.hasRole(msg.sender, EnumsLibrary.Roles.PBF), "Access restricted to PBF role");
    _;
  }

  modifier onlyBPOM() {
    require(roleManager.hasRole(msg.sender, EnumsLibrary.Roles.BPOM), "Access restricted to BPOM role");
    _;
  }

  using EnumsLibrary for EnumsLibrary.NieStatus;
  using EnumsLibrary for EnumsLibrary.OrderStatus;
  using EnumsLibrary for EnumsLibrary.ObatAvailability;
  using EnumsLibrary for EnumsLibrary.Roles;
  using EnumsLibrary for EnumsLibrary.TipeProduk;
  using EnumsLibrary for EnumsLibrary.TipePermohonanCpotb;

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

  struct st_obatProduction {
    EnumsLibrary.ObatAvailability statusStok;
    string namaProduk;
    string batchName;
    uint8 obatQuantity;
    string[] obatIpfs;
    string factoryInstance; 
  }

  struct st_obatOutputBatch {
    string obatId;
    string namaProduk;
    string batchName;
    uint8 obatQuantity;
    EnumsLibrary.ObatAvailability statusStok;
    string factoryInstance;
  }

  struct st_obatNameApprovedNie {
    string obatId;
    string namaProduk;
  }

  string[] public allObatIds;
  
  mapping (string => st_obatNie) public obatNieById;
  mapping (string => st_obatDetails) public obatDetailsById;
  mapping (string => st_obatProduction[]) public obatProductionById;
  mapping (string => st_obatNameApprovedNie[]) public obatProductNameApprovedByFactory;

  event evt_obatCreated(string namaProduk, string factoryInstance, address factoryAddresses);
  event evt_nieRequested(string factoryInstance, address factoryAddr,uint timestampRequest);
  event evt_nieApproved(string bpomInstance, address bpomAddr, string nieNumber, uint timestampApproved);
  event evt_addBatchProduction(string batchName, uint8 quantity, string namaProduk, string factoryInstance);

  function getJenisSediaanAvail(string memory _factoryInstanceName)
    public 
    view 
    returns(
      uint8[] memory
  ) {
     uint8[] memory approvedJenisSediaan = mainSupplyChain.approvedTipePermohonan(_factoryInstanceName); 
     return approvedJenisSediaan;
  }

  // status: 200ok
  function createDetailObat (
    string memory _merk,
    string memory _namaPoduk,
    string[] memory _klaim,
    string[] memory _komposisi,
    string memory _kemasan,
    EnumsLibrary.TipeProduk _tipeProduk,
    string memory _factoryInstance,
    address _factoryAddr
  ) internal pure returns (st_obatDetails memory){
      return st_obatDetails({
        merk: _merk,
        namaProduk: _namaPoduk,
        klaim: _klaim,
        komposisi: _komposisi,
        kemasan: _kemasan,
        tipeProduk: _tipeProduk,
        factoryInstance: _factoryInstance,
        factoryAddr: _factoryAddr
      });
  }

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
    EnumsLibrary.TipeProduk _tipeProduk
  ) public onlyFactory {
      require(bytes(_obatId).length > 0, "Invalid Obat ID");

      obatDetailsById[_obatId] = createDetailObat(
        _merk,
        _namaProduk, 
        _klaim,
        _komposisi,
        _kemasan, 
        _tipeProduk, 
        _factoryInstance,
        msg.sender
      );

      obatNieById[_obatId] = createObatNie(
        EnumsLibrary.NieStatus.inLocalProduction,
        block.timestamp
      );

      allObatIds.push(_obatId);

      approveNie(
        _obatId,
        "LALALAL12-1",
        "BPOM Makassar",
        0x70997970C51812dc3A010C7d01b50e0d17dc79C8
      ); 

    emit evt_obatCreated(_namaProduk, _factoryInstance, msg.sender);
  }
   
  // status: 200ok
  function getAllObat() 
    public view onlyBPOM returns (st_obatOutputNie[] memory) {

      uint256 totalObat = allObatIds.length; 

      st_obatOutputNie[] memory obatList = new st_obatOutputNie[](totalObat);

      for (uint i = 0; i < totalObat; i++) {
        string memory obatId = allObatIds[i];

        st_obatNie memory nie = obatNieById[obatId];
        st_obatDetails memory details = obatDetailsById[obatId];

        if (nie.nieStatus != EnumsLibrary.NieStatus.inLocalProduction) {
          obatList[i] = st_obatOutputNie({
              obatId: obatId,
              namaProduk: details.namaProduk,
              nieNumber: nie.nieNumber,
              nieStatus: nie.nieStatus,
              factoryInstance: details.factoryInstance
          });
          
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

        st_obatDetails memory details = obatDetailsById[obatId];
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
        
        st_obatDetails memory details = obatDetailsById[obatId];
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
      st_obatDetails memory,
      st_obatNie memory
    ){
      return (obatDetailsById[_obatId], obatNieById[_obatId]);
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

  // status: 200ok (change into bpom onlyl later) DAN UBAH MSG SENDER NYA DI BPOM ADDR
  function approveNie (
    string memory _obatId,
    string memory _nieNumber,
    string memory _instanceName, 
    address _instanceAddr 
  ) public {

      obatNieById[_obatId].bpomInstance = _instanceName;
      obatNieById[_obatId].bpomAddr = _instanceAddr;
      obatNieById[_obatId].nieNumber = _nieNumber;
      obatNieById[_obatId].timestampNieApprove = block.timestamp;
      obatNieById[_obatId].nieStatus = EnumsLibrary.NieStatus.ApprovedNie;

      string memory namaProduk = obatDetailsById[_obatId].namaProduk;
      string memory factoryInstance = obatDetailsById[_obatId].factoryInstance;

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

    st_obatProduction memory newBatch = st_obatProduction({
      statusStok: EnumsLibrary.ObatAvailability.Ready,
      namaProduk: _namaProduk,
      batchName: _batchName,
      obatQuantity: _obatQuantity,
      obatIpfs: _obatIpfsHash,
      factoryInstance: _factoryInstance
    });

    obatProductionById[_obatId].push(newBatch);

    emit evt_addBatchProduction (_batchName, _obatQuantity, _namaProduk, _factoryInstance);
  }

  function countAllBatchReadyStock()
    internal view returns (uint256){
      uint256 totalBatchReady = 0;
      string memory obatId;

      for (uint256 i = 0; i < allObatIds.length; i++) {

        obatId = allObatIds[i];

        st_obatProduction[] memory batchObat = obatProductionById[obatId];

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

        st_obatProduction[] memory batchObat = obatProductionById[obatId];
        
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
    st_obatProduction memory obatBatch
  ) internal pure returns (st_obatOutputBatch memory) {
      return st_obatOutputBatch({
        obatId: obatId,
        namaProduk: obatBatch.namaProduk,
        batchName: obatBatch.batchName,
        obatQuantity: obatBatch.obatQuantity,
        statusStok: obatBatch.statusStok,
        factoryInstance: obatBatch.factoryInstance
      });
  }

  // status: 200ok
  function getAllBatchProductionByInstance(string memory _instanceName)
    public view onlyFactory returns(st_obatOutputBatch[] memory){
      uint256 totalReady = countAllBatchByInstance(_instanceName);

      st_obatOutputBatch[] memory obatReadyStock = new st_obatOutputBatch[](totalReady);

      // diubah ke bytes krn lebih murah untuk gas fees nya
      bytes32 instanceHash = keccak256(abi.encodePacked(_instanceName));

      uint256 index = 0;

      for (uint256 i = 0; i < allObatIds.length; i++) {
        string memory obatId = allObatIds[i];
        st_obatProduction[] memory obatBatches = obatProductionById[obatId];

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

      st_obatOutputBatch[] memory obatReadyStock = new st_obatOutputBatch[](totalReady);

      uint256 index = 0;

      for (uint256 i = 0; i < allObatIds.length; i++) {
        string memory obatId = allObatIds[i];
        st_obatProduction[] memory obatBatches = obatProductionById[obatId];

        if (obatBatches.length == 0) {
          continue;
        }

        for (uint256 j = 0; j < obatBatches.length; j++) {
          if (obatBatches[j].statusStok == EnumsLibrary.ObatAvailability.Ready) {
            obatReadyStock[index] = createObatOutputBatch(obatId, obatBatches[j]);
            index++;
          }
        }
    }

    return obatReadyStock;
  }

  // status: 200ok
  function detailBatchProduction(
    string memory _obatId,
    string memory _batchName
  ) public view returns (st_obatProduction memory){
    st_obatProduction[] memory obatBatches = obatProductionById[_obatId];

    st_obatProduction memory obatBatchDetail;

    bytes32 batchHash = keccak256(abi.encodePacked(_batchName));

    for (uint256 i = 0; i < obatBatches.length; i++){
      if (keccak256(abi.encodePacked(obatBatches[i].batchName)) == batchHash) {
        obatBatchDetail =  obatBatches[i];
      } 
    }

    if ((roleManager.hasRole(msg.sender, EnumsLibrary.Roles.PBF))) {
      obatBatchDetail.obatIpfs = new string[](0);
    }

    return obatBatchDetail;
  }

  function updateBatchProduction(
    string memory _obatId,
    string memory _batchName,
    string[] memory _obatIpfs
  ) public view onlyPBF {
    st_obatProduction[] memory obatBatches = obatProductionById[_obatId];

    bytes32 batchHash = keccak256(abi.encodePacked(_batchName));

    for (uint256 i = 0; i < obatBatches.length; i++){
      if (keccak256(abi.encodePacked(obatBatches[i].batchName)) == batchHash) {
        obatBatches[i].statusStok = EnumsLibrary.ObatAvailability.Sold;
        obatBatches[i].obatIpfs = _obatIpfs;
      } 
    }
  }

}