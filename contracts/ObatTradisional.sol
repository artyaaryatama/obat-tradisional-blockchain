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
    string batchName;
    uint8 obatQuantity;
    string[] obatIpfsHash;
  }

  string[] public allObatIds;
  
  mapping (string => st_obatNie) public obatNieById;
  mapping (string => st_obatDetails) public obatDetailsById;
  mapping(string => st_obatProduction[]) public obatProductionById;

  event evt_obatCreated(string namaProduk, string factoryInstance, address factoryAddresses);
  event evt_nieRequested(string factoryInstance, address factoryAddr,uint timestampRequest);
  event evt_nieApproved(string bpomInstance, address bpomAddr, string nieNumber, uint timestampApproved);
  event evt_addObatQuantity(string namaProduk, uint8 quantity, string batchName);

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

  // status: 200ok
  function approveNie (
    string memory _obatId,
    string memory _nieNumber,
    string memory _instanceName
  ) public onlyBPOM {

      obatNieById[_obatId].bpomInstance = _instanceName;
      obatNieById[_obatId].bpomAddr = msg.sender;
      obatNieById[_obatId].nieNumber = _nieNumber;
      obatNieById[_obatId].timestampNieApprove = block.timestamp;
      obatNieById[_obatId].nieStatus = EnumsLibrary.NieStatus.ApprovedNie;

      emit evt_nieApproved(_instanceName, msg.sender, _nieNumber, block.timestamp);
  }


}