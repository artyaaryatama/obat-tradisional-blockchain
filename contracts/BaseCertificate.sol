// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./EnumsLibrary.sol";

contract BaseCertificate {

  using EnumsLibrary for EnumsLibrary.StatusCertificate;

  struct st_userCertificate {
    string userName;
    string userInstance;
    address userAddr;
  }

  struct st_certificateDetails {
    EnumsLibrary.StatusCertificate status;
    uint timestampRequest;
    uint timestampApprove;
    uint timestampRejected;
    uint timestsmpRenewRequest; 
    st_userCertificate sender;  
    st_userCertificate bpom; 
    string ipfsCert;
  }

  struct st_updateCertificateDetails {
    EnumsLibrary.StatusCertificate status;
    uint timestamp;
    st_userCertificate bpom; 
    string ipfsCert;
  }

  mapping (string => st_certificateDetails) public certDetailsById;
  mapping (string => string) public rejectMsgbyId;

  function createUserCertificate( 
    string memory _userName,
    string memory _userInstance,
    address _userAddr
  ) public pure returns (st_userCertificate memory) {
    return st_userCertificate({
      userName: _userName,
      userInstance:  _userInstance,
      userAddr: _userAddr
    });
  }

  function createCertificateDetails(
    st_userCertificate memory _sender,
    st_userCertificate memory _bpom,
    string memory _certId
  ) public {
    certDetailsById[_certId] = st_certificateDetails({
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
    st_userCertificate memory _bpom
  ) public { 
    st_certificateDetails storage certData = certDetailsById[_certId];
    
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
    st_userCertificate memory _bpom
  ) public{
    st_certificateDetails storage certData = certDetailsById[_certId];
    rejectMsgbyId[_certId] = _rejectMsg;
 
    certData.bpom.userName = _bpom.userName;
    certData.bpom.userAddr = _bpom.userAddr;
    certData.bpom.userInstance = _bpom.userInstance;
    certData.timestampRejected = block.timestamp;
    certData.status = EnumsLibrary.StatusCertificate.Rejected;
  }

  function updateRenewDetails( 
    string memory _certId 
  ) public  { 
    st_certificateDetails storage certData = certDetailsById[_certId];
  
    certData.timestsmpRenewRequest = block.timestamp;
    certData.status = EnumsLibrary.StatusCertificate.RenewRequest;
  }

  function getCertDetail(string memory _certId) public view returns 
  (st_certificateDetails memory) {
    return certDetailsById[_certId];
  }
  function getRejectMsg(string memory _certId) public view returns 
  (string memory) {
    return rejectMsgbyId[_certId];
  }

  function getSenderDetail(string memory _certId) public view returns 
  (st_userCertificate memory) {
    return certDetailsById[_certId].sender;
  }
}