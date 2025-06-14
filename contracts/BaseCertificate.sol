// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./EnumsLibrary.sol";

contract BaseCertificate {

  using EnumsLibrary for EnumsLibrary.StatusCertificate;
  
  uint constant extTimestamp = (2*60) + 10;

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
    uint timestampRenewRequest; 
    uint timestampExpired; 
    uint timestampExtendRequest; 
    uint timestampExtendApprove; 
    uint timestampExtendReject; 
    uint timestampExtendRenew; 
    UserCert sender;  
    UserCert bpom; 
    string ipfsCert;
  }

  mapping (string => CertificateDetails) public certDetailById;
  mapping (string => string) public rejectMsgById;
  mapping (string => string) public rejectMsgExtendById;

  function createUserCertificate( 
    string memory userName,
    string memory userInstance,
    address userAddr
  ) 
    public 
    pure 
    returns (UserCert memory) 
  {
    return UserCert({
      userName: userName,
      userInstance:  userInstance,
      userAddr: userAddr
    });
  }

  function createCertificateDetails(
    UserCert memory senderData,
    UserCert memory bpomData,
    string memory certId
  ) 
    public 
  {
    certDetailById[certId] = CertificateDetails({
      status: EnumsLibrary.StatusCertificate.Requested,
      timestampRequest: block.timestamp,
      timestampApprove: 0,
      timestampRejected: 0,
      timestampRenewRequest: 0,
      timestampExpired: 0,
      timestampExtendRequest: 0,
      timestampExtendApprove: 0,
      timestampExtendReject: 0,
      timestampExtendRenew: 0,
      sender: senderData,
      bpom: bpomData,
      ipfsCert: ""
    });
  }

  function updateBpomApproveDetails(
    string memory certId, 
    string memory ipfsCert,
    UserCert memory bpomData
  ) 
    public 
  { 

    CertificateDetails storage certData = certDetailById[certId];
    
    certData.bpom.userName = bpomData.userName;
    certData.bpom.userAddr = bpomData.userAddr;
    certData.bpom.userInstance = bpomData.userInstance;
    certData.timestampApprove = block.timestamp;
    certData.timestampExpired = block.timestamp + extTimestamp; 
    certData.status = EnumsLibrary.StatusCertificate.Approved;
    certData.ipfsCert = ipfsCert; 
  } 

  function updateBpomExtendCertificateDetails(
    string memory certId, 
    string memory ipfsCert
  ) 
    public 
  { 
    CertificateDetails storage certData = certDetailById[certId];
    certData.timestampApprove = block.timestamp;
    certData.timestampExpired = block.timestamp + extTimestamp; 
    certData.status = EnumsLibrary.StatusCertificate.ExtendApprove; 
    certData.ipfsCert = ipfsCert; 
  } 

  function updateBpomApproveExtendCertificateDetails(
    string memory certId, 
    string memory ipfsCert
  ) 
    public 
  { 
    CertificateDetails storage certData = certDetailById[certId];
    certData.timestampExtendApprove = block.timestamp;
    certData.timestampExpired = block.timestamp + extTimestamp;  
    certData.status = EnumsLibrary.StatusCertificate.ExtendApprove; 
    certData.ipfsCert = ipfsCert; 
  } 

  function updateBpomRejectExtendCertificateDetails( 
    string memory certId,
    string memory rejectMsg
  ) 
    public
  {
    CertificateDetails storage certData = certDetailById[certId];
    rejectMsgExtendById[certId] = rejectMsg;
    certData.timestampExtendReject = block.timestamp;
    certData.status = EnumsLibrary.StatusCertificate.ExtendReject;
  }

  function updateRenewExtendCertificateDetails( 
    string memory certId
  ) 
    public
  {
    CertificateDetails storage certData = certDetailById[certId];
    certData.timestampExtendRenew = block.timestamp;
    certData.status = EnumsLibrary.StatusCertificate.ExtendRenew;
  }

  function updateBpomRejectDetails( 
    string memory certId,
    string memory rejectMsg,
    UserCert memory bpomData
  ) 
    public
  {
    CertificateDetails storage certData = certDetailById[certId];
    rejectMsgById[certId] = rejectMsg;
 
    certData.bpom.userName = bpomData.userName;
    certData.bpom.userAddr = bpomData.userAddr;
    certData.bpom.userInstance = bpomData.userInstance;
    certData.timestampRejected = block.timestamp;
    certData.status = EnumsLibrary.StatusCertificate.Rejected;
  }


  function updateRenewDetails( 
    string memory certId 
  ) 
    public  
  { 
    CertificateDetails storage certData = certDetailById[certId];
  
    certData.timestampRenewRequest = block.timestamp;
    certData.status = EnumsLibrary.StatusCertificate.RenewRequest;
  }

  function updateExtendRenewDetails( 
    string memory certId,
    uint256 expiredTimestamp
  ) 
    public  
  { 
    require(block.timestamp > expiredTimestamp, "Sertifikat masih berlaku");
    CertificateDetails storage certData = certDetailById[certId];
  
    certData.timestampExtendRequest = block.timestamp;
    certData.status = EnumsLibrary.StatusCertificate.ExtendRequest; 
  }

  function getCertDetail(string memory certId) public view returns (CertificateDetails memory) {
    return certDetailById[certId];
  }
  function getRejectMsg(string memory certId) public view returns (
    string memory,
    string memory
  ) {
    return (rejectMsgById[certId], rejectMsgExtendById[certId]);
  }

  function getSenderDetail(string memory certId) public view returns (UserCert memory) {
    return certDetailById[certId].sender;
  }
}