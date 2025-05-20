// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./RoleManager.sol";
import "./EnumsLibrary.sol";

contract NieManager {
  RoleManager public immutable roleManager;

  constructor(address roleManagerAddr) {
    roleManager = RoleManager(roleManagerAddr);
  }
    uint constant extTimestamp = (2*60) + 10;
  // uint constant extTimestamp = (5*60) + 10;

  struct NieDetail {
    string nieNumber; 
    EnumsLibrary.NieStatus nieStatus;   
    uint256 timestampProduction;
    uint256 timestampNieRequest;       
    uint256 timestampNieApprove;  
    uint256 timestampNieRejected;  
    uint256 timestampNieRenewRequest;  
    uint256 timestampNieExpired;  
    uint256 timestampNieExtendRequest;  
    uint256 timestampNieExtendApprove;  
    string factoryInstance;
    string bpomInstance;      
    address bpomAddr;
    string nieIpfs;
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

  struct ReSertifikasi{
    string masterFormula;
    string desainKemasanTerbaru;
    string skPersetujuan;
    string desainKemasanDisetujui;
    string dokumenSemuaJenisVariasi;
    string suratBermaterai;
    string hasilUjiStabilitas;
  } 

  mapping (string => NieDetail) public nieDetailById;
  mapping (string => string) public rejectMsgById; 
  mapping (string => DokumenObat) public dokuObatById;
  mapping (string => DokumenPendukung) public dokuPendukungById;

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

  event NieExtendRequest(
    address factoryAddr,
    uint timestamp
  );

  event NieApprovedExtendRequest(
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
    string memory obatId,
    string memory factoryInstance
  ) public {

    NieDetail memory nieDetail = NieDetail({
      nieNumber: "",
      nieStatus: EnumsLibrary.NieStatus.inLocalProduction, 
      timestampProduction: block.timestamp, 
      timestampNieRequest: 0,
      timestampNieApprove: 0,
      timestampNieRejected: 0,
      timestampNieRenewRequest: 0,
      timestampNieExpired: 0,
      timestampNieExtendRequest: 0,
      timestampNieExtendApprove: 0,
      factoryInstance: factoryInstance,
      bpomInstance: "",
      bpomAddr: address(0),
      nieIpfs: ""
    });


    nieDetailById[obatId] = nieDetail;
  }

  function requestNie(
    string memory obatId,
    DokumenObat memory dokuObat,
    DokumenPendukung memory dokuPendukung
  ) 
    public 
    onlyFactory 
  {

    nieDetailById[obatId].nieStatus = EnumsLibrary.NieStatus.RequestedNie;
    nieDetailById[obatId].timestampNieRequest = block.timestamp;
    dokuObatById[obatId] = dokuObat; 
    dokuPendukungById[obatId] = dokuPendukung;  
    
    emit NieRequested(
      nieDetailById[obatId].factoryInstance, 
      msg.sender, 
      block.timestamp
    ); 
  } 

  function approveNie(
    string memory obatId,
    string memory nieNumber,
    string memory bpomInstance,
    string memory ipfsNie
  ) 
    public 
    onlyBPOM
  {

    NieDetail storage nieData = nieDetailById[obatId]; 

    nieData.nieNumber = nieNumber;
    nieData.nieStatus = EnumsLibrary.NieStatus.ApprovedNie; 
    nieData.timestampNieApprove = block.timestamp;
    nieData.bpomInstance = bpomInstance;
    nieData.bpomAddr = msg.sender;
    nieData.timestampNieExpired= block.timestamp + extTimestamp; 
    nieData.nieIpfs = ipfsNie;
    
    emit NieApproved(
      bpomInstance,
      msg.sender, 
      nieNumber, 
      block.timestamp
    );  
  }
 
  function rejectNie(
    string memory obatId,
    string memory bpomInstance,
    string memory rejectMsg
  ) 
    public 
    onlyBPOM 
  {

    NieDetail storage nieData = nieDetailById[obatId];

    nieData.nieStatus = EnumsLibrary.NieStatus.RejectedNie; 
    nieData.bpomInstance = bpomInstance;
    nieData.bpomAddr = msg.sender;
    nieData.timestampNieRejected = block.timestamp;
    rejectMsgById[obatId] = rejectMsg;
     
    emit NieRejected(
      bpomInstance, 
      msg.sender, 
      rejectMsg, 
      block.timestamp
    );  
  }

  function renewRequestNie(
    string memory obatId,
    DokumenObat memory dokuObat,
    DokumenPendukung memory dokuPendukung
  ) 
    public 
    onlyFactory 
  {

    NieDetail storage nieData = nieDetailById[obatId];

    nieData.nieStatus = EnumsLibrary.NieStatus.RenewRequestNie; 
    nieData.timestampNieRenewRequest = block.timestamp;

    delete dokuObatById[obatId];
    delete dokuPendukungById[obatId];
    
    dokuObatById[obatId] = dokuObat; 
    dokuPendukungById[obatId] = dokuPendukung;  

    emit NieRenewRequest(
      nieDetailById[obatId].factoryInstance, 
      msg.sender, 
      block.timestamp
    );
  }

  function extendRequestNie(
    string memory obatId,
    uint256 expiredTimestamp
  ) 
    public 
    onlyFactory 
  {
    require(block.timestamp > expiredTimestamp, "NIE masih berlaku");
    NieDetail storage nieData = nieDetailById[obatId];

    nieData.nieStatus = EnumsLibrary.NieStatus.ExtendRequestNie; 
    nieData.timestampNieExtendRequest = block.timestamp; 

    emit NieExtendRequest(
      msg.sender,  
      block.timestamp
    );
  }

  function approveExtendRequest(
    string memory obatId,
    string memory ipfsNie 
  ) 
    public 
    onlyBPOM 
  {
    NieDetail storage nieData = nieDetailById[obatId];

    nieData.nieStatus = EnumsLibrary.NieStatus.extendedNie; 
    nieData.timestampNieExtendApprove = block.timestamp;  
    nieData.timestampNieExpired = block.timestamp + extTimestamp;  
    nieData.nieIpfs = ipfsNie;

    emit NieApprovedExtendRequest(
      msg.sender,   
      block.timestamp
    ); 
  } 

  function getNieDetail(string memory obatId) public view returns (
    NieDetail memory,
    DokumenObat memory,
    DokumenPendukung memory
  ){
    return (
      nieDetailById[obatId], 
      dokuObatById[obatId], 
      dokuPendukungById[obatId]
    );
  }

  function getNieNumberAndStatus(string memory obatId) public view returns (
    string memory, 
    uint8, 
    uint256
  ){
    return (
      nieDetailById[obatId].nieNumber, 
      uint8(nieDetailById[obatId].nieStatus), 
      nieDetailById[obatId].timestampNieExpired 
    );  
  }

  function getRejectMsgNie(string memory obatId) public view returns (string memory) {
    return rejectMsgById[obatId];
  }

}
