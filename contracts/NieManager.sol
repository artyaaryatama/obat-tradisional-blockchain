// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

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

  struct st_dokumenObat {
    string masterFormula;
    string suratKuasa;
    string suratPernyataan;
    string komposisiProduk;
    string caraPembuatanProduk;
    string spesifikasiKemasan;
    string hasilUjiStabilitas;
  }

  struct st_dokumenSpesifikasiObat{
    string sertifikatAnalisaBahanBaku;
    string sertifikatAnalisaProdukJadi;
    string spesifikasiProdukJadi;
    string sistemPenomoranBets;
    string desainKemasan;
    string dataPendukungKeamanan;
  } 

  mapping (string => st_NieDetails) public nieDetailsByObatId;
  mapping (string => string) public rejectMsgbyId; 
  mapping (string => st_dokumenObat) public dokuObatByObatId;
  mapping (string => st_dokumenSpesifikasiObat) public dokuSpesifikasiByObatId;

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
    st_dokumenObat memory _dokuObat,
    st_dokumenSpesifikasiObat memory _dokuSpefikasi
  ) public onlyFactory {

    nieDetailsByObatId[_obatId].nieStatus = EnumsLibrary.NieStatus.RequestedNie;
    nieDetailsByObatId[_obatId].timestampNieRequest = block.timestamp;
    dokuObatByObatId[_obatId] = _dokuObat; 
    dokuSpesifikasiByObatId[_obatId] = _dokuSpefikasi;  
    
    emit evt_nieRequested(nieDetailsByObatId[_obatId].factoryInstance, msg.sender, block.timestamp); 
  } 

  function approveNie(
    string memory _obatId,
    string memory _nieNumber,
    string memory _bpomInstance
  ) public onlyBPOM{

    st_NieDetails storage nieData = nieDetailsByObatId[_obatId];

    nieData.nieNumber = _nieNumber;
    nieData.nieStatus = EnumsLibrary.NieStatus.ApprovedNie; 
    nieData.timestampNieApprove = block.timestamp;
    nieData.bpomInstance = _bpomInstance;
    nieData.bpomAddr = msg.sender;
    
    emit evt_nieApproved(_bpomInstance, msg.sender, _nieNumber, block.timestamp);  
  }
 
  function rejectNie(
    string memory _obatId,
    string memory _bpomInstance,
    string memory _rejectMsg
  ) public onlyBPOM {

    st_NieDetails storage nieData = nieDetailsByObatId[_obatId];

    nieData.nieStatus = EnumsLibrary.NieStatus.RejectedNie; 
    nieData.bpomInstance = _bpomInstance;
    nieData.bpomAddr = msg.sender;
    nieData.timestampNieRejected = block.timestamp;
    rejectMsgbyId[_obatId] = _rejectMsg;
     
    emit evt_nieRejected(_bpomInstance, msg.sender, _rejectMsg, block.timestamp);  
  }

  function renewRequestNie(
    string memory _obatId,
    st_dokumenObat memory _dokuObat,
    st_dokumenSpesifikasiObat memory _dokuSpefikasi
  ) public onlyFactory {

    st_NieDetails storage nieData = nieDetailsByObatId[_obatId];

    nieData.nieStatus = EnumsLibrary.NieStatus.RenewRequestNie; 
    nieData.timestampNieRenewRequest = block.timestamp;

    delete dokuObatByObatId[_obatId];
    delete dokuSpesifikasiByObatId[_obatId];
    
    dokuObatByObatId[_obatId] = _dokuObat; 
    dokuSpesifikasiByObatId[_obatId] = _dokuSpefikasi;  

    emit evt_nieRenewRequest(nieDetailsByObatId[_obatId].factoryInstance, msg.sender, block.timestamp);
  }

  function getNieDetail(string memory _obatId) public view returns (
    st_NieDetails memory,
    st_dokumenObat memory,
    st_dokumenSpesifikasiObat memory
  ) {
    return (nieDetailsByObatId[_obatId], dokuObatByObatId[_obatId], dokuSpesifikasiByObatId[_obatId]);
  }

  function getNieNumberAndStatus(string memory _obatId) public view returns (string memory, uint8) {
    return (nieDetailsByObatId[_obatId].nieNumber, uint8(nieDetailsByObatId[_obatId].nieStatus));
  }

  function getRejectMsgNie(string memory _obatId) public view returns (string memory) {
    return rejectMsgbyId[_obatId];
  }

}
