// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./RoleManager.sol";
import "./EnumsLibrary.sol";

contract NieManager {
  RoleManager public roleManager;

  constructor(address _roleManagerAddr) {
    roleManager = RoleManager(_roleManagerAddr);
  }

  modifier onlyFactory() {
    require(roleManager.hasRole(msg.sender, EnumsLibrary.Roles.Factory), "Only Factory");
    _;
  }

  modifier onlyBPOM() {
    require(roleManager.hasRole(msg.sender, EnumsLibrary.Roles.BPOM), "Only BPOM");
    _;
  }

  struct st_NieDetails {
    string nieNumber; 
    EnumsLibrary.NieStatus nieStatus;   
    uint256 timestampProduction;
    uint256 timestampNieRequest;       
    uint256 timestampNieApprove;  
    uint256 timestampNieRejected;  
    uint256 timestampNieRenewRequest;  
    string factoryInstance;
    string bpomInstance;      
    address bpomAddr;
  }

  struct st_dokumenIpfs {
    string masterFormula;
    string suratKuasa;
    string suratPernyataan;
    string komposisiProduk;
    string caraPembuatanProduk;
    string sertifikatAnalisaBahanBaku;
    string sertifikatAnalisaProdukJadi;
    string spesifikasiProdukJadi;
    string spesifikasiKemasan;
    string sistemPenomoranBets;
    string hasilUjiStabilitas;
    string desainKemasan;
    string dataPendukungKeamanan;
  }

  mapping (string => st_NieDetails) public nieDetailsByObatId;
  mapping (string => string) public rejectMsgbyId;
  mapping (string => st_dokumenIpfs) public dokuNieByObatId;

  event evt_nieRequested(string factoryInstance, address factoryAddr,uint timestamp);
  event evt_nieApproved(string bpomInstance, address bpomAddr, string nieNumber, uint tiemstamp);
  event evt_nieRejected(string bpomInstance, address bpomAddr, string rejectMsg, uint tiemstamp);
  event evt_nieRenewRequest(string factoryInstance, address factoryAddr, uint timestamp);

  function createObatNie(
    string memory _obatId,
    string memory _factoryInstance
  ) public{

    st_NieDetails memory nieDetail = st_NieDetails({
      nieNumber: "",
      nieStatus: EnumsLibrary.NieStatus.inLocalProduction, 
      timestampProduction: block.timestamp, 
      timestampNieRequest: 0,
      timestampNieApprove: 0,
      timestampNieRejected: 0,
      timestampNieRenewRequest: 0,
      factoryInstance: _factoryInstance,
      bpomInstance: "",
      bpomAddr: address(0)
    });


    nieDetailsByObatId[_obatId] = nieDetail;
  }

  function requestNie(
    string memory _obatId,
    st_dokumenIpfs memory _doku
  ) public onlyFactory {

    nieDetailsByObatId[_obatId].nieStatus = EnumsLibrary.NieStatus.RequestedNie;
    nieDetailsByObatId[_obatId].timestampNieRequest = block.timestamp;
    dokuNieByObatId[_obatId] = _doku;
    
    emit evt_nieRequested(nieDetailsByObatId[_obatId].factoryInstance, msg.sender, block.timestamp); 
  } 

  function approveNie(
    string memory _obatId,
    string memory _nieNumber,
    string memory _bpomInstance
  ) public onlyBPOM{

    nieDetailsByObatId[_obatId].nieNumber = _nieNumber;
    nieDetailsByObatId[_obatId].nieStatus = EnumsLibrary.NieStatus.ApprovedNie; 
    nieDetailsByObatId[_obatId].timestampNieApprove = block.timestamp;
    nieDetailsByObatId[_obatId].bpomInstance = _bpomInstance;
    nieDetailsByObatId[_obatId].bpomAddr = msg.sender;
    
    emit evt_nieApproved(_bpomInstance, msg.sender, _nieNumber, block.timestamp);  
  }
 
  function rejectNie(
    string memory _obatId,
    string memory _bpomInstance,
    string memory _rejectMsg
  ) public onlyBPOM {

    nieDetailsByObatId[_obatId].nieStatus = EnumsLibrary.NieStatus.RejectedNie; 
    nieDetailsByObatId[_obatId].bpomInstance = _bpomInstance;
    nieDetailsByObatId[_obatId].bpomAddr = msg.sender;
    nieDetailsByObatId[_obatId].timestampNieRejected = block.timestamp;
    rejectMsgbyId[_obatId] = _rejectMsg;
     
    emit evt_nieRejected(_bpomInstance, msg.sender, _rejectMsg, block.timestamp);  
  }

  function renewRequestNie(
    string memory _obatId,
    st_dokumenIpfs memory _newDoku
  ) public onlyFactory {

    nieDetailsByObatId[_obatId].nieStatus = EnumsLibrary.NieStatus.RenewRequestNie; 
    nieDetailsByObatId[_obatId].timestampNieRenewRequest = block.timestamp;
    dokuNieByObatId[_obatId] = _newDoku; 

    emit evt_nieRenewRequest(nieDetailsByObatId[_obatId].factoryInstance, msg.sender, block.timestamp);
  }

  function getNieDetail(string memory _obatId) public view returns (
    st_NieDetails memory,
    st_dokumenIpfs memory 
  ) {
    return (nieDetailsByObatId[_obatId], dokuNieByObatId[_obatId]);
  }

  function getNieNumberAndStatus(string memory _obatId) public view returns (string memory, uint8) {
    return (nieDetailsByObatId[_obatId].nieNumber, uint8(nieDetailsByObatId[_obatId].nieStatus));
  }

  function getRejectMsgNie(string memory _obatId) public view returns (string memory) {
    return rejectMsgbyId[_obatId];
  }

}
