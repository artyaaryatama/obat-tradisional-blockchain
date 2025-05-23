// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./RoleManager.sol";
import "./CpotbCertificate.sol";
import "./CdobCertificate.sol";
import "./EnumsLibrary.sol";

contract CertificateManager is ReentrancyGuard {

  RoleManager public immutable roleManager;
  CpotbCertificate public immutable cpotbCertificate;
  CdobCertificate public immutable cdobCertificate;

  constructor(
    address roleManagerAddr,
    address cpotbCertificateAddr, 
    address cdobCertificateAddr
  ) {
    roleManager = RoleManager(roleManagerAddr);
    cpotbCertificate = CpotbCertificate(cpotbCertificateAddr);
    cdobCertificate = CdobCertificate(cdobCertificateAddr);
  }

  using EnumsLibrary for EnumsLibrary.Roles;
 
  struct CertificateRequest { 
    string certId;
    string senderName;
    string senderInstance;
    address senderAddr;
  }

  struct CertificateApproval {
    string certNumber;
    string certId;
    string bpomName;
    string bpomInstance;
    address bpomAddr;
  }

  event CertRequested(
    string senderInstance, 
    address senderAddr, 
    uint8 tipePermohonan, 
    uint timestamp
  );

  event CertApproved(
    string bpomInstance, 
    address bpomAddr, 
    uint8 tipePermohonan, 
    string certNumber, 
    uint timestamp
  );

  event CertRejected(
    string bpomInstance, 
    address bpomAddr, 
    uint8 tipePermohonan, 
    uint timestamp, 
    string rejectMsg
  );
  
  event CertRenewRequest(
    string senderInstance, 
    address senderAddr, 
    uint timestamp
  );
  
  event CertExtend(
    address senderAddr, 
    uint timestamp
  );

  event CertExtendReject(
    address bpomAddr,  
    string rejectMsgExt,
    uint timestamp
  );

  modifier onlyFactory() { 
    require(roleManager.hasRole(msg.sender, EnumsLibrary.Roles.Factory), "Only Factory can do this transaction!");
    _;
  } 

  modifier onlyPBF() {
    require(roleManager.hasRole(msg.sender, EnumsLibrary.Roles.PBF), "Only PBF can do this transaction!");
    _;
  }

  modifier onlyBPOM() {
    require(roleManager.hasRole(msg.sender, EnumsLibrary.Roles.BPOM), "Only BPOM can do this transaction!");
    _;
  }

  function requestCpotb(
    CertificateRequest memory reqData,
    uint8 jenisSediaan,
    string memory factoryType,
    CpotbCertificate.DokumenAdministrasi memory dokuAdmin,
    CpotbCertificate.DokumenTeknis memory dokuTeknis
  ) public
    onlyFactory
    nonReentrant 
  {

    cpotbCertificate.requestCpotb(
      reqData.certId, 
      reqData.senderName, 
      reqData.senderInstance, 
      reqData.senderAddr, 
      jenisSediaan, 
      factoryType, 
      dokuAdmin, 
      dokuTeknis
    );

    emit CertRequested(
      reqData.senderInstance, 
      msg.sender, 
      jenisSediaan, 
      block.timestamp
    ); 
  }

  function approveCpotb( 
    CertificateApproval memory approveData,
    string memory ipfsCert,
    uint8 jenisSediaan 
  ) public 
    onlyBPOM 
    nonReentrant 
  {
    cpotbCertificate.approveCpotb(
      approveData.certNumber, 
      approveData.certId, 
      approveData.bpomName, 
      approveData.bpomInstance, 
      approveData.bpomAddr, 
      ipfsCert
    ); 

    emit CertApproved(
      approveData.bpomInstance, 
      msg.sender, 
      jenisSediaan, 
      approveData.certNumber, 
      block.timestamp
    ); 
  }
 
  function rejectCpotb(
    string memory certId,
    string memory rejectMsg,
    string memory bpomName,
    string memory bpomInstance,
    uint8 jenisSediaan 
  ) 
    public 
    onlyBPOM 
    nonReentrant 
  {
    cpotbCertificate.rejectCpotb(
      certId, 
      rejectMsg, 
      bpomName, 
      bpomInstance, 
      msg.sender
    );

    emit CertRejected(
      bpomInstance, 
      msg.sender, 
      jenisSediaan, 
      block.timestamp, 
      rejectMsg
    ); 
  } 

  function renewCpotb( 
    CertificateRequest memory reqData,
    CpotbCertificate.DokumenAdministrasi memory newDokuAdmin,
    CpotbCertificate.DokumenTeknis memory newDokuTeknis
  ) 
    public 
    onlyFactory 
    nonReentrant 
  {  
    cpotbCertificate.renewRequestCpotb(
      reqData.certId, 
      newDokuAdmin, 
      newDokuTeknis
    );  
 
    emit CertRenewRequest(
      reqData.senderInstance, 
      reqData.senderAddr,
      block.timestamp
    );
  }

  function extendCpotb( 
    string memory cpotbId,
    uint256 expTimestamp, 
    CpotbCertificate.DokumenReSertifikasi memory newDoku
  ) 
    public 
    onlyFactory 
    nonReentrant 
  {  
    cpotbCertificate.extendCpotb(
      cpotbId,
      expTimestamp,
      newDoku
    );  
 
    emit CertExtend(
      msg.sender,
      block.timestamp
    );
  } 

  function approveExtendCpotb( 
    string memory cpotbId,
    string memory ipfsCert
  ) 
    public 
    onlyBPOM 
    nonReentrant 
  {  
    cpotbCertificate.approveExtendCpotb(
      cpotbId,
      ipfsCert
    );  
 
    emit CertExtend(
      msg.sender,
      block.timestamp 
    );
  } 

  function rejectExtendCpotb( 
    string memory cpotbId,
    string memory rejectExtendMsg
  ) 
    public 
    onlyBPOM 
    nonReentrant 
  {  
    cpotbCertificate.rejectExtendCpotb(
      cpotbId,
      rejectExtendMsg
    );  
 
    emit CertExtendReject(
      msg.sender,
      rejectExtendMsg,
      block.timestamp 
    );
  } 

  function renewExtendCpotb( 
    string memory cpotbId,
    CpotbCertificate.DokumenReSertifikasi memory newDoku
  ) 
    public 
    onlyFactory 
    nonReentrant 
  {  
    cpotbCertificate.renewExtendCpotb(
      cpotbId,
      newDoku 
    );  
 
    emit CertExtend( 
      msg.sender, 
      block.timestamp 
    );
  } 
 
  function getCpotbByInstance(string memory instanceName) public view returns (CpotbCertificate.CertificateList[] memory){ 
    return cpotbCertificate.getAllCpotbByInstance(instanceName); 
  } 
 
  function getAllCpotb() public view returns (CpotbCertificate.CertificateList[] memory){
    return cpotbCertificate.getAllCpotb();
  }
 
  function getCpotbDetails(string memory certId) public view returns (
    CpotbCertificate.CertificateDetails memory,
    CpotbCertificate.CpotbData memory,
    CpotbCertificate.DokumenAdministrasi memory,
    CpotbCertificate.DokumenTeknis memory,
    CpotbCertificate.DokumenReSertifikasi memory 
  ) { 
    (
      CpotbCertificate.CpotbData memory cpotb,
      CpotbCertificate.DokumenAdministrasi memory dokuAdmin,
      CpotbCertificate.DokumenTeknis memory dokuTeknis,
      CpotbCertificate.DokumenReSertifikasi memory dokuReSertifikasi
    ) = cpotbCertificate.getCpotbDetails(certId);
 
    return (
      cpotbCertificate.getCertDetails(certId), 
      cpotb, 
      dokuAdmin, 
      dokuTeknis,
      dokuReSertifikasi
    );
  }

  function getRejectMsgCpotb(string memory certId) public view returns (
    string memory,
    string memory
  ) {
    return cpotbCertificate.getRejectMsg(certId);
  }

  function requestCdob(
    CertificateRequest memory reqData,
    uint8 tipePermohonan,
    CdobCertificate.DokumenAdministrasi memory dokuAdmin,
    CdobCertificate.DokumenTeknis memory dokuTeknis
  )
    public 
    onlyPBF
    nonReentrant 
  {

    cdobCertificate.requestCdob(
      reqData.certId, 
      reqData.senderName, 
      reqData.senderInstance, 
      reqData.senderAddr, 
      tipePermohonan, 
      dokuAdmin, 
      dokuTeknis
    );

    emit CertRequested(
      reqData.senderInstance, 
      msg.sender, 
      tipePermohonan, 
      block.timestamp
    ); 
  }

  function approveCdob(
    CertificateApproval memory approveData,
    string memory ipfsCert,
    uint8 tipePermohonan 
  )
    public 
    onlyBPOM 
    nonReentrant 
  {

    cdobCertificate.approveCdob(
      approveData.certNumber, 
      approveData.certId, 
      approveData.bpomName, 
      approveData.bpomInstance, 
      approveData.bpomAddr, 
      ipfsCert
    ); 

    emit CertApproved(
      approveData.bpomInstance, 
      msg.sender, 
      tipePermohonan, 
      approveData.certNumber, 
      block.timestamp
    );
  }
 
  function rejectCdob(
    string memory certId,
    string memory rejectMsg,
    string memory bpomName,
    string memory bpomInstance,
    uint8 tipePermohonan 
  ) 
    public 
    onlyBPOM
    nonReentrant  
  {

    cdobCertificate.rejectCdob(
      certId, 
      rejectMsg, 
      bpomName, 
      bpomInstance, 
      msg.sender
    );

    emit CertRejected(
      bpomInstance, 
      msg.sender, 
      tipePermohonan, 
      block.timestamp, 
      rejectMsg
    ); 
  } 

  function renewCdob( 
    CertificateRequest memory reqData,
    CdobCertificate.DokumenAdministrasi memory newDokuAdmin,
    CdobCertificate.DokumenTeknis memory newDokuTeknis
  ) 
    public 
    onlyPBF 
    nonReentrant 
  {  
    cdobCertificate.renewRequestCdob(
      reqData.certId, 
      newDokuAdmin, 
      newDokuTeknis
    );
 
    emit CertRenewRequest(
      reqData.senderInstance, 
      reqData.senderAddr, 
      block.timestamp
    );
  }

  function extendCdob( 
    string memory cdobId,
    uint256 expTimestamp,
    CdobCertificate.DokumenReSertifikasi memory newDokus 
  ) 
    public 
    onlyPBF   
    nonReentrant 
  {  
    cdobCertificate.extendCdob(
      cdobId,
      expTimestamp,
      newDokus 
    );  
 
    emit CertExtend(
      msg.sender,
      block.timestamp
    );
  } 

  function approveExtendCdob( 
    string memory cdobId,
    string memory ipfsCert
  ) 
    public 
    onlyBPOM 
    nonReentrant 
  {  
    cdobCertificate.approveExtendCdob(
      cdobId,
      ipfsCert
    );  
 
    emit CertExtend(
      msg.sender,
      block.timestamp
    );
  } 

    function rejectExtendCdob( 
    string memory cdobId,
    string memory rejectExtendMsg
  ) 
    public 
    onlyBPOM 
    nonReentrant 
  {  
    cdobCertificate.rejectExtendCdob(
      cdobId,
      rejectExtendMsg
    );  
 
    emit CertExtendReject(
      msg.sender,
      rejectExtendMsg,
      block.timestamp 
    );
  } 

  function renewExtendCdob( 
    string memory cdobId,
    CdobCertificate.DokumenReSertifikasi memory newDoku
  ) 
    public 
    onlyPBF 
    nonReentrant 
  {  
    cdobCertificate.renewExtendCdob(
      cdobId,
      newDoku 
    );  

    emit CertExtend(
      msg.sender, 
      block.timestamp 
    );
  } 
 
  function getCdobByInstance(string memory instanceName) public view returns (CdobCertificate.CertificateList[] memory){ 
    return cdobCertificate.getAllCdobByInstance(instanceName);  
  } 
   
  function getAllCdob() public view returns (CdobCertificate.CertificateList[] memory){
    return cdobCertificate.getAllCdob();
  } 
 
  function getCdobDetails(string memory certId) public view returns (
    CdobCertificate.CertificateDetails memory,
    CdobCertificate.CdobData memory,
    CdobCertificate.DokumenAdministrasi memory,
    CdobCertificate.DokumenTeknis memory,
    CdobCertificate.DokumenReSertifikasi memory 
  ) { 

    (
      CdobCertificate.CdobData memory cdob,
      CdobCertificate.DokumenAdministrasi memory dokuAdmin,
      CdobCertificate.DokumenTeknis memory dokuTeknis,
      CdobCertificate.DokumenReSertifikasi memory dokuReSertifikasi
    ) = cdobCertificate.getCdobDetails(certId);

    return (
      cdobCertificate.getCertDetails(certId), 
      cdob, 
      dokuAdmin, 
      dokuTeknis,
      dokuReSertifikasi
    );
  }
 
  function getRejectMsgCdob(string memory certId) public view returns (
    string memory,
    string memory
  ) {
    return cdobCertificate.getRejectMsg(certId);
  }
 
}