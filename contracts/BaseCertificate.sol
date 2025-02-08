// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./EnumsLibrary.sol";

contract BaseCertificate {

  using EnumsLibrary for EnumsLibrary.StatusCertificate;

  struct UserCert {
    string userName;
    string userInstance;
    address userAddr;
  }

  struct CertificateDetails {
    EnumsLibrary.StatusCertificate status;
    uint timestampRequest;
    uint timestampApprove;
    uint timestampRejected;
    uint timestsmpRenewRequest; 
    UserCert sender;  
    UserCert bpom; 
    string ipfsCert;
  }

  mapping (string => CertificateDetails) public CertDetailsById;
  mapping (string => string) public RejectMsgById;

  function createUserCertificate( 
    string memory _userName,
    string memory _userInstance,
    address _userAddr
  ) 
    public 
    pure 
    returns (UserCert memory) 
  {
    return UserCert({
      userName: _userName,
      userInstance:  _userInstance,
      userAddr: _userAddr
    });
  }

  function createCertificateDetails(
    UserCert memory _sender,
    UserCert memory _bpom,
    string memory _certId
  ) 
    public 
  {
    CertDetailsById[_certId] = CertificateDetails({
      status: EnumsLibrary.StatusCertificate.Requested,
      timestampRequest: block.timestamp,
      timestampApprove: 0,
      timestampRejected: 0,
      timestsmpRenewRequest: 0,
      sender: _sender,
      bpom: _bpom,
      ipfsCert: ""
    });
  }

  function updateBpomApproveDetails(
    string memory _certId, 
    string memory _ipfsCert,
    UserCert memory _bpom
  ) 
    public 
  { 
    CertificateDetails storage certData = CertDetailsById[_certId];
    
    certData.bpom.userName = _bpom.userName;
    certData.bpom.userAddr = _bpom.userAddr;
    certData.bpom.userInstance = _bpom.userInstance;
    certData.timestampApprove = block.timestamp;
    certData.status = EnumsLibrary.StatusCertificate.Approved;
    certData.ipfsCert = _ipfsCert; 
  } 

  function updateBpomRejectDetails( 
    string memory _certId,
    string memory _rejectMsg,
    UserCert memory _bpom
  ) 
    public
  {
    CertificateDetails storage certData = CertDetailsById[_certId];
    RejectMsgById[_certId] = _rejectMsg;
 
    certData.bpom.userName = _bpom.userName;
    certData.bpom.userAddr = _bpom.userAddr;
    certData.bpom.userInstance = _bpom.userInstance;
    certData.timestampRejected = block.timestamp;
    certData.status = EnumsLibrary.StatusCertificate.Rejected;
  }

  function updateRenewDetails( 
    string memory _certId 
  ) 
    public  
  { 
    CertificateDetails storage certData = CertDetailsById[_certId];
  
    certData.timestsmpRenewRequest = block.timestamp;
    certData.status = EnumsLibrary.StatusCertificate.RenewRequest;
  }

  function getCertDetail(string memory _certId) public view returns (CertificateDetails memory) {
    return CertDetailsById[_certId];
  }
  function getRejectMsg(string memory _certId) public view returns (string memory) {
    return RejectMsgById[_certId];
  }

  function getSenderDetail(string memory _certId) public view returns (UserCert memory) {
    return CertDetailsById[_certId].sender;
  }
}