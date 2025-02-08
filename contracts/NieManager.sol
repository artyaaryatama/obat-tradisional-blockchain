// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./RoleManager.sol";
import "./EnumsLibrary.sol";

contract NieManager {
  RoleManager public roleManager;

  constructor(address _roleManagerAddr) {
    roleManager = RoleManager(_roleManagerAddr);
  }

  struct NieDetail {
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

  struct DokumenObat {
    string masterFormula;
    string suratKuasa;
    string suratPernyataan;
    string komposisiProduk;
    string caraPembuatanProduk;
    string spesifikasiKemasan;
    string hasilUjiStabilitas;
  }

  struct DokumenPendukung{
    string sertifikatAnalisaBahanBaku;
    string sertifikatAnalisaProdukJadi;
    string spesifikasiProdukJadi;
    string sistemPenomoranBets;
    string desainKemasan;
    string dataPendukungKeamanan;
  } 

  mapping (string => NieDetail) public NieDetailById;
  mapping (string => string) public RejectMsgById; 
  mapping (string => DokumenObat) public DokuObatById;
  mapping (string => DokumenPendukung) public DokuPendukungById;

  event NieRequested(
    string factoryInstance,
    address factoryAddr,
    uint timestamp
  );

  event NieApproved(
    string bpomInstance, 
    address bpomAddr, 
    string nieNumber, 
    uint tiemstamp
  );

  event NieRejected(
    string bpomInstance, 
    address bpomAddr, 
    string rejectMsg, 
    uint tiemstamp
  );

  event NieRenewRequest(
    string factoryInstance, 
    address factoryAddr, 
    uint timestamp
  );

  modifier onlyFactory() {
    require(roleManager.hasRole(msg.sender, EnumsLibrary.Roles.Factory), "Only Factory");
    _;
  }

  modifier onlyBPOM() {
    require(roleManager.hasRole(msg.sender, EnumsLibrary.Roles.BPOM), "Only BPOM");
    _;
  }

  function createObatNie(
    string memory _obatId,
    string memory _factoryInstance
  ) public {

    NieDetail memory nieDetail = NieDetail({
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


    NieDetailById[_obatId] = nieDetail;
  }

  function requestNie(
    string memory _obatId,
    DokumenObat memory _dokuObat,
    DokumenPendukung memory _dokuPendukung
  ) 
    public 
    onlyFactory 
  {

    NieDetailById[_obatId].nieStatus = EnumsLibrary.NieStatus.RequestedNie;
    NieDetailById[_obatId].timestampNieRequest = block.timestamp;
    DokuObatById[_obatId] = _dokuObat; 
    DokuPendukungById[_obatId] = _dokuPendukung;  
    
    emit NieRequested(
      NieDetailById[_obatId].factoryInstance, 
      msg.sender, 
      block.timestamp
    ); 
  } 

  function approveNie(
    string memory _obatId,
    string memory _nieNumber,
    string memory _bpomInstance
  ) 
    public 
    onlyBPOM
  {

    NieDetail storage nieData = NieDetailById[_obatId];

    nieData.nieNumber = _nieNumber;
    nieData.nieStatus = EnumsLibrary.NieStatus.ApprovedNie; 
    nieData.timestampNieApprove = block.timestamp;
    nieData.bpomInstance = _bpomInstance;
    nieData.bpomAddr = msg.sender;
    
    emit NieApproved(
      _bpomInstance,
      msg.sender, 
      _nieNumber, 
      block.timestamp
    );  
  }
 
  function rejectNie(
    string memory _obatId,
    string memory _bpomInstance,
    string memory _rejectMsg
  ) 
    public 
    onlyBPOM 
  {

    NieDetail storage nieData = NieDetailById[_obatId];

    nieData.nieStatus = EnumsLibrary.NieStatus.RejectedNie; 
    nieData.bpomInstance = _bpomInstance;
    nieData.bpomAddr = msg.sender;
    nieData.timestampNieRejected = block.timestamp;
    RejectMsgById[_obatId] = _rejectMsg;
     
    emit NieRejected(
      _bpomInstance, 
      msg.sender, 
      _rejectMsg, 
      block.timestamp
    );  
  }

  function renewRequestNie(
    string memory _obatId,
    DokumenObat memory _dokuObat,
    DokumenPendukung memory _dokuPendukung
  ) 
    public 
    onlyFactory 
  {

    NieDetail storage nieData = NieDetailById[_obatId];

    nieData.nieStatus = EnumsLibrary.NieStatus.RenewRequestNie; 
    nieData.timestampNieRenewRequest = block.timestamp;

    delete DokuObatById[_obatId];
    delete DokuPendukungById[_obatId];
    
    DokuObatById[_obatId] = _dokuObat; 
    DokuPendukungById[_obatId] = _dokuPendukung;  

    emit NieRenewRequest(
      NieDetailById[_obatId].factoryInstance, 
      msg.sender, 
      block.timestamp
    );
  }

  function getNieDetail(string memory _obatId) public view returns (
    NieDetail memory,
    DokumenObat memory,
    DokumenPendukung memory
  ){
    return (
      NieDetailById[_obatId], 
      DokuObatById[_obatId], 
      DokuPendukungById[_obatId]
    );
  }

  function getNieNumberAndStatus(string memory _obatId) public view returns (
    string memory, 
    uint8
  ){
    return (
      NieDetailById[_obatId].nieNumber, 
      uint8(NieDetailById[_obatId].nieStatus));
  }

  function getRejectMsgNie(string memory _obatId) public view returns (string memory) {
    return RejectMsgById[_obatId];
  }

}
