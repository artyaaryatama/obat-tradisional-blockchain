// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

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

  struct st_certificateRequest { 
    string certId;
    string senderName;
    string senderInstance;
    address senderAddr;
  }

  struct st_certificateApproval {
    string certNumber;
    string certId;
    string bpomName;
    string bpomInstance;
    address bpomAddr;
  }

  event evt_certRequested(string senderInstance, address senderAddr, uint8 tipePermohonan, uint timestamp);
  event evt_certApproved(string bpomInstance, address bpomAddr, uint8 tipePermohonan, string certNumber, uint timestamp);
  event evt_certRejected(string bpomInstance, address bpomAddr, uint8 tipePermohonan, uint timestamp, string rejectMsg);
  event evt_certRenewRequest(string senderInstance, address senderAddr, uint timestamp);

  function requestCpotb(
    st_certificateRequest memory requestData,
    uint8 _jenisSediaan,
    string memory _factoryType,
    CpotbCertificate.st_dokumenAdministrasiIpfs memory dokuAdmin,
    CpotbCertificate.st_dokumenTeknisIpfs memory dokuTeknis
  ) public onlyFactory{

    cpotbCertificate.requestCpotb(requestData.certId, requestData.senderName, requestData.senderInstance, requestData.senderAddr, _jenisSediaan, _factoryType, dokuAdmin, dokuTeknis);

    emit evt_certRequested(requestData.senderInstance, msg.sender, _jenisSediaan, block.timestamp); 
  }

  function approveCpotb( 
    st_certificateApproval memory approvalData,
    string memory _ipfsCert,
    uint8 _jenisSediaan 
  ) public onlyBPOM {
    cpotbCertificate.approveCpotb(approvalData.certNumber, approvalData.certId, approvalData.bpomName, approvalData.bpomInstance, approvalData.bpomAddr, _ipfsCert); 

    emit evt_certApproved(approvalData.bpomInstance, msg.sender, _jenisSediaan, approvalData.certId, block.timestamp);
  }
 
  function rejectCpotb(
    string memory _certId,
    string memory _rejectMsg,
    string memory _bpomName,
    string memory _bpomInstance,
    address _bpomAddr,
    uint8 _jenisSediaan 
  ) public onlyBPOM {
    cpotbCertificate.rejectCpotb(_certId, _rejectMsg, _bpomName, _bpomInstance, _bpomAddr);

    emit evt_certRejected(_bpomInstance, msg.sender, _jenisSediaan, block.timestamp, _rejectMsg); 
  } 

  function renewCpotb( 
    st_certificateRequest memory requestData,
    CpotbCertificate.st_dokumenAdministrasiIpfs memory newDokuAdmin,
    CpotbCertificate.st_dokumenTeknisIpfs memory newDokuTeknis
  ) public onlyFactory {  
    cpotbCertificate.renewRequestCpotb(requestData.certId, newDokuAdmin, newDokuTeknis);  
 
    emit evt_certRenewRequest(requestData.senderInstance, requestData.senderAddr, block.timestamp);
  }
 
  function getCpotbByInstance(string memory _instanceName) public view returns (CpotbCertificate.st_certificateList[] memory) { 
    return cpotbCertificate.getAllCpotbByInstance(_instanceName);
  } 
 
  function getAllCpotb() public view returns (CpotbCertificate.st_certificateList[] memory) {
    return cpotbCertificate.getAllCpotb();
  }
 
  function getCpotbDetails(string memory _certId) public view returns (
    CpotbCertificate.st_certificateDetails memory,
    CpotbCertificate.st_cpotb memory,
    CpotbCertificate.st_dokumenAdministrasiIpfs memory,
    CpotbCertificate.st_dokumenTeknisIpfs memory
  ) {
    (
      CpotbCertificate.st_cpotb memory cpotb,
      CpotbCertificate.st_dokumenAdministrasiIpfs memory dokuAdmin,
      CpotbCertificate.st_dokumenTeknisIpfs memory dokuTeknis
    ) = cpotbCertificate.getCpotbDetails(_certId);

    return (cpotbCertificate.getCertDetails(_certId), cpotb, dokuAdmin, dokuTeknis);
  }

  function getRejectMsgCpotb(string memory _certId) public view returns (string memory) {
    return cpotbCertificate.getRejectMsg(_certId);
  }

  function requestCdob(
    st_certificateRequest memory requestData,
    uint8 _tipePermohonanCdob,
    CdobCertificate.st_dokumenAdministrasiIpfs memory dokuAdmin,
    CdobCertificate.st_dokumenTeknisIpfs memory dokuTeknis
  ) public onlyPBF{

    cdobCertificate.requestCdob(requestData.certId, requestData.senderName, requestData.senderInstance, requestData.senderAddr, _tipePermohonanCdob, dokuAdmin, dokuTeknis);

    emit evt_certRequested(requestData.senderInstance, msg.sender, _tipePermohonanCdob, block.timestamp); 
  }

  function approveCdob(
    st_certificateApproval memory approvalData,
    string memory _ipfsCert,
    uint8 _tipePermohonanCdob 
  ) public onlyBPOM {

    cdobCertificate.approveCdob(approvalData.certNumber, approvalData.certId, approvalData.bpomName, approvalData.bpomInstance, approvalData.bpomAddr, _ipfsCert); 

    emit evt_certApproved(approvalData.bpomInstance, msg.sender, _tipePermohonanCdob, approvalData.certId, block.timestamp);
  }
 
  function rejectCdob(
    string memory _certId,
    string memory _rejectMsg,
    string memory _bpomName,
    string memory _bpomInstance,
    address _bpomAddr,
    uint8 _tipePermohonanCdob 
  ) public onlyBPOM {

    cdobCertificate.rejectCdob(_certId, _rejectMsg, _bpomName, _bpomInstance, _bpomAddr);

    emit evt_certRejected(_bpomInstance, msg.sender, _tipePermohonanCdob, block.timestamp, _rejectMsg); 
  } 

  function renewCdob( 
    st_certificateRequest memory requestData,
    CdobCertificate.st_dokumenAdministrasiIpfs memory newDokuAdmin,
    CdobCertificate.st_dokumenTeknisIpfs memory newDokuTeknis
  ) public onlyPBF {  
    cdobCertificate.renewRequestCdob(requestData.certId, newDokuAdmin, newDokuTeknis);
 
    emit evt_certRenewRequest(requestData.senderInstance, requestData.senderAddr, block.timestamp);
  }
 
  function getCdobByInstance(string memory _instanceName) public view returns (CdobCertificate.st_certificateList[] memory) { 
    return cdobCertificate.getAllCdobByInstance(_instanceName);  
  } 
   
  function getAllCdob() public view returns (CdobCertificate.st_certificateList[] memory) {
    return cdobCertificate.getAllCdob();
  } 
 
  function getCdobDetails(string memory _certId) public view returns (
    CdobCertificate.st_certificateDetails memory,
    CdobCertificate.st_cdob memory,
    CdobCertificate.st_dokumenAdministrasiIpfs memory,
    CdobCertificate.st_dokumenTeknisIpfs memory
  ) { 
    (
      CdobCertificate.st_cdob memory cdob,
      CdobCertificate.st_dokumenAdministrasiIpfs memory dokuAdmin,
      CdobCertificate.st_dokumenTeknisIpfs memory dokuTeknis
    ) = cdobCertificate.getCdobDetails(_certId);
    return (cdobCertificate.getCertDetails(_certId), cdob, dokuAdmin, dokuTeknis);
  }
 
  function getRejectMsgCdob(string memory _certId) public view returns (string memory) {
    return cdobCertificate.getRejectMsg(_certId);
  }
 
}