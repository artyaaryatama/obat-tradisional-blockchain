// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./BaseCertificate.sol";
import "./EnumsLibrary.sol";

contract CpotbCertificate is BaseCertificate {
  using EnumsLibrary for EnumsLibrary.Roles;
  using EnumsLibrary for EnumsLibrary.StatusCertificate;

  struct st_cpotb {
    string cpotbId;
    string cpotbNumber;
    uint8 tipePermohonan;
    string factoryType;
  }

  struct st_certificateList {
    string certId;
    string certNumber; 
    string instanceName;
    uint8 tipePermohonan;
    EnumsLibrary.StatusCertificate status;
    string certHash;
  }

  struct st_updateBpom {
    string certId;
    string certNumber;
    string bpomName;
    string bpomInstance;
    uint8 tipePermohonanCpotb;
  }

  // untuk di create obat
  struct st_approvedCert {
    string ipfsCert;
    uint8 tipePermohonan; 
  }

  st_certificateList[] public allCpotbData;

  mapping (string => st_cpotb) public cpotbDataById;
  mapping(string => st_approvedCert[]) public approvedTipePermohonanByFactory;

  function requestCpotb(
    string memory _certId,
    string memory _factoryName,
    string memory _factoryInstance,
    address _factoryAddr,
    uint8 _tipePermohonanCpotb,
    string memory _factoryType
  ) public {

      st_userCertificate memory userFactory = createUserCertificate(_factoryName, _factoryAddr, _factoryInstance);
      st_userCertificate memory userBpom = createUserCertificate("", address(0), "");
  
      createCertificateDetails(userFactory, userBpom, _certId);  

      cpotbDataById[_certId] = st_cpotb({
        cpotbId: _certId,
        cpotbNumber: "",  
        tipePermohonan: _tipePermohonanCpotb,
        factoryType: _factoryType
      });

      allCpotbData.push(st_certificateList({
        certId: _certId,
        certNumber: "",
        instanceName: _factoryInstance,
        tipePermohonan: _tipePermohonanCpotb,
        status: EnumsLibrary.StatusCertificate.Requested,
        certHash: ""
      }));
  }

  function approveCpotb(
    string memory _certNumber,
    string memory _certId,
    string memory _bpomName,
    string memory _bpomInstance,
    address _bpomAddr,
    string memory _ipfsCert
  ) public {

      st_userCertificate memory userBpom = createUserCertificate(_bpomName, _bpomAddr, _bpomInstance);
  
      cpotbDataById[_certId].cpotbNumber = _certNumber;
 
      updateBpomApproveDetails(_certId, _ipfsCert, userBpom);  

      for (uint i = 0; i < allCpotbData.length; i++) {
        if (keccak256(abi.encodePacked(allCpotbData[i].certId)) == keccak256(abi.encodePacked(_certId))) {
          allCpotbData[i].certNumber = _certNumber;
          allCpotbData[i].status = EnumsLibrary.StatusCertificate.Approved; 
          allCpotbData[i].certHash = _ipfsCert;
        }  
      }
  } 

  function rejectCpotb(
    string memory _certId,
    string memory _rejectMsg,
    string memory _bpomName,
    string memory _bpomInstance,
    address _bpomAddr
  ) public {
    
      st_userCertificate memory userBpom = createUserCertificate(_bpomName, _bpomAddr, _bpomInstance);
 
      updateBpomRejectDetails(_certId, _rejectMsg, userBpom);  

      for (uint i = 0; i < allCpotbData.length; i++) {
        if (keccak256(abi.encodePacked(allCpotbData[i].certId)) == keccak256(abi.encodePacked(_certId))) {
          allCpotbData[i].status = EnumsLibrary.StatusCertificate.Rejected; 
        }   
      }  
  }

  function renewRequestCpotb(
    string memory _certId, 
    uint8 _tipePermohonanCpotb
  ) public {

    updateRenewDetails(_certId);  
    cpotbDataById[_certId].tipePermohonan = _tipePermohonanCpotb;
     
    for (uint i = 0; i < allCpotbData.length; i++) {
      if (keccak256(abi.encodePacked(allCpotbData[i].certId)) == keccak256(abi.encodePacked(_certId))) {
        allCpotbData[i].status = EnumsLibrary.StatusCertificate.RenewRequest; 
        allCpotbData[i].tipePermohonan = _tipePermohonanCpotb;  
      }  
    }
  }

  function getAllCpotbByInstance(string memory _instanceName) 
    public view returns (st_certificateList[] memory) {

    uint8 count = 0;

    for (uint i = 0; i < allCpotbData.length; i++) {
      if(keccak256(abi.encodePacked(allCpotbData[i].instanceName)) == keccak256(abi.encodePacked(_instanceName))){
        count++;
      }
    }

    st_certificateList[] memory cpotbs = new st_certificateList[](count);

    uint8 index = 0;

    for (uint256 i = 0; i < allCpotbData.length; i++) {
      if (keccak256(abi.encodePacked(allCpotbData[i].instanceName)) == keccak256(abi.encodePacked(_instanceName))) {
        cpotbs[index] = allCpotbData[i];
        index++;
      }
    }

    return cpotbs;
  } 

  function getAllCpotb() 
    public view returns (st_certificateList[] memory) {

    st_certificateList[] memory cpotbs = new st_certificateList[](allCpotbData.length);

    uint8 index = 0;

    for (uint256 i = 0; i < allCpotbData.length; i++) {
      cpotbs[index] = allCpotbData[i];
      index++;
    }

    return cpotbs;
  }

  function getCertDetails(string memory _certId) 
    public view returns (st_certificateDetails memory) {
    return getCertDetail(_certId);  
  } 

  function getCpotbDetails(string memory _certId) 
    public view returns (st_cpotb memory) {
    return cpotbDataById[_certId];  
  } 

  function getRejectsMsg(string memory _certId) 
    public view returns (string memory) {
    return getRejectMsg(_certId);  
  } 

}