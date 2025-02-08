// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./RoleManager.sol";
import "./CpotbCertificate.sol";
import "./CdobCertificate.sol";
import "./EnumsLibrary.sol";

contract CertificateManager {

  RoleManager roleManager;
  CpotbCertificate cpotbCertificate;
  CdobCertificate cdobCertificate;

  constructor(
    address _roleManagerAddr,
    address _cpotbCertificateAddr, 
    address _cdobCertificateAddr
  ) {
    roleManager = RoleManager(_roleManagerAddr);
    cpotbCertificate = CpotbCertificate(_cpotbCertificateAddr);
    cdobCertificate = CdobCertificate(_cdobCertificateAddr);
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
    CertificateRequest memory _requestData,
    uint8 _jenisSediaan,
    string memory _factoryType,
    CpotbCertificate.DokumenAdministrasi memory dokuAdmin,
    CpotbCertificate.DokumenTeknis memory dokuTeknis
  ) public
    onlyFactory
  {

    cpotbCertificate.requestCpotb(
      _requestData.certId, 
      _requestData.senderName, 
      _requestData.senderInstance, 
      _requestData.senderAddr, 
      _jenisSediaan, 
      _factoryType, 
      dokuAdmin, 
      dokuTeknis
    );

    emit CertRequested(
      _requestData.senderInstance, 
      msg.sender, 
      _jenisSediaan, 
      block.timestamp
    ); 
  }

  function approveCpotb( 
    CertificateApproval memory _approvalData,
    string memory _ipfsCert,
    uint8 _jenisSediaan 
  ) public 
    onlyBPOM 
  {
    cpotbCertificate.approveCpotb(
      _approvalData.certNumber, 
      _approvalData.certId, 
      _approvalData.bpomName, 
      _approvalData.bpomInstance, 
      _approvalData.bpomAddr, 
      _ipfsCert
    ); 

    emit CertApproved(
      _approvalData.bpomInstance, 
      msg.sender, 
      _jenisSediaan, 
      _approvalData.certId, 
      block.timestamp
    );
  }
 
  function rejectCpotb(
    string memory _certId,
    string memory _rejectMsg,
    string memory _bpomName,
    string memory _bpomInstance,
    uint8 _jenisSediaan 
  ) 
    public 
    onlyBPOM 
  {
    cpotbCertificate.rejectCpotb(
      _certId, 
      _rejectMsg, 
      _bpomName, 
      _bpomInstance, 
      msg.sender
    );

    emit CertRejected(
      _bpomInstance, 
      msg.sender, 
      _jenisSediaan, 
      block.timestamp, 
      _rejectMsg
    ); 
  } 

  function renewCpotb( 
    CertificateRequest memory _requestData,
    CpotbCertificate.DokumenAdministrasi memory _newDokuAdmin,
    CpotbCertificate.DokumenTeknis memory _newDokuTeknis
  ) 
    public 
    onlyFactory 
  {  
    cpotbCertificate.renewRequestCpotb(
      _requestData.certId, 
      _newDokuAdmin, 
      _newDokuTeknis
    );  
 
    emit CertRenewRequest(
      _requestData.senderInstance, 
      _requestData.senderAddr, 
      block.timestamp
    );
  }
 
  function getCpotbByInstance(string memory _instanceName) public view returns (CpotbCertificate.CertificateList[] memory){ 
    return cpotbCertificate.getAllCpotbByInstance(_instanceName); 
  } 
 
  function getAllCpotb() public view returns (CpotbCertificate.CertificateList[] memory){
    return cpotbCertificate.getAllCpotb();
  }
 
  function getCpotbDetails(string memory _certId) public view returns (
    CpotbCertificate.CertificateDetails memory,
    CpotbCertificate.CpotbData memory,
    CpotbCertificate.DokumenAdministrasi memory,
    CpotbCertificate.DokumenTeknis memory
  ) {
    (
      CpotbCertificate.CpotbData memory cpotb,
      CpotbCertificate.DokumenAdministrasi memory dokuAdmin,
      CpotbCertificate.DokumenTeknis memory dokuTeknis
    ) = cpotbCertificate.getCpotbDetails(_certId);
 
    return (
      cpotbCertificate.getCertDetails(_certId), 
      cpotb, 
      dokuAdmin, 
      dokuTeknis
    );
  }

  function getRejectMsgCpotb(string memory _certId) public view returns (string memory) {
    return cpotbCertificate.getRejectMsg(_certId);
  }

  function requestCdob(
    CertificateRequest memory _requestData,
    uint8 _tipePermohonanCdob,
    CdobCertificate.DokumenAdministrasi memory dokuAdmin,
    CdobCertificate.DokumenTeknis memory dokuTeknis
  )
    public 
    onlyPBF
  {

    cdobCertificate.requestCdob(
      _requestData.certId, 
      _requestData.senderName, 
      _requestData.senderInstance, 
      _requestData.senderAddr, 
      _tipePermohonanCdob, 
      dokuAdmin, 
      dokuTeknis
    );

    emit CertRequested(
      _requestData.senderInstance, 
      msg.sender, 
      _tipePermohonanCdob, 
      block.timestamp
    ); 
  }

  function approveCdob(
    CertificateApproval memory _approvalData,
    string memory _ipfsCert,
    uint8 _tipePermohonanCdob 
  )
    public 
    onlyBPOM 
  {

    cdobCertificate.approveCdob(
      _approvalData.certNumber, 
      _approvalData.certId, 
      _approvalData.bpomName, 
      _approvalData.bpomInstance, 
      _approvalData.bpomAddr, 
      _ipfsCert
    ); 

    emit CertApproved(
      _approvalData.bpomInstance, 
      msg.sender, 
      _tipePermohonanCdob, 
      _approvalData.certId, 
      block.timestamp
    );
  }
 
  function rejectCdob(
    string memory _certId,
    string memory _rejectMsg,
    string memory _bpomName,
    string memory _bpomInstance,
    uint8 _tipePermohonanCdob 
  ) 
    public 
    onlyBPOM 
  {

    cdobCertificate.rejectCdob(
      _certId, 
      _rejectMsg, 
      _bpomName, 
      _bpomInstance, 
      msg.sender
    );

    emit CertRejected(
      _bpomInstance, 
      msg.sender, 
      _tipePermohonanCdob, 
      block.timestamp, 
      _rejectMsg
    ); 
  } 

  function renewCdob( 
    CertificateRequest memory _requestData,
    CdobCertificate.DokumenAdministrasi memory _newDokuAdmin,
    CdobCertificate.DokumenTeknis memory _newDokuTeknis
  ) 
    public 
    onlyPBF 
  {  
    cdobCertificate.renewRequestCdob(
      _requestData.certId, 
      _newDokuAdmin, 
      _newDokuTeknis
    );
 
    emit CertRenewRequest(
      _requestData.senderInstance, 
      _requestData.senderAddr, 
      block.timestamp
    );
  }
 
  function getCdobByInstance(string memory _instanceName) public view returns (CdobCertificate.CertificateList[] memory){ 
    return cdobCertificate.getAllCdobByInstance(_instanceName);  
  } 
   
  function getAllCdob() public view returns (CdobCertificate.CertificateList[] memory){
    return cdobCertificate.getAllCdob();
  } 
 
  function getCdobDetails(string memory _certId) public view returns (
    CdobCertificate.CertificateDetails memory,
    CdobCertificate.CdobData memory,
    CdobCertificate.DokumenAdministrasi memory,
    CdobCertificate.DokumenTeknis memory
  ) { 

    (
      CdobCertificate.CdobData memory cdob,
      CdobCertificate.DokumenAdministrasi memory dokuAdmin,
      CdobCertificate.DokumenTeknis memory dokuTeknis
    ) = cdobCertificate.getCdobDetails(_certId);

    return (
      cdobCertificate.getCertDetails(_certId), 
      cdob, 
      dokuAdmin, 
      dokuTeknis
    );
  }
 
  function getRejectMsgCdob(string memory _certId) public view returns (string memory) {
    return cdobCertificate.getRejectMsg(_certId);
  }
 
}