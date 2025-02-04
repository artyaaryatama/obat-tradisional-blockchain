// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./BaseCertificate.sol";
import "./EnumsLibrary.sol";

contract CdobCertificate is BaseCertificate {
  using EnumsLibrary for EnumsLibrary.Roles;
  using EnumsLibrary for EnumsLibrary.StatusCertificate;
  
  struct st_cdob {
    string cdobId;
    string cdobNumber;
    uint8 tipePermohonan;
  }

  struct st_dokumenAdministrasi {
    bytes32 suratPermohonanIpfs;
    bytes32 buktiPembayaranPajakIpfs;
  }

  struct st_dokumenTeknis {
    bytes32 suratIzinCdobIpfs; 
    bytes32 denahIpfs;
    bytes32 strukturOrganisasi;
    bytes32 daftarPersonalia;
    bytes32 daftarPeralatan;
    bytes32 eksekutifQualityManagement;
    bytes32 suratIzinApotekerIpfs; 
    bytes32 dokumenSelfAssesmentIpfs; 
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

  st_certificateList[] public allCdobData;

  mapping (string => st_cdob) public cdobDataById;
  mapping (string => st_dokumenAdministrasi) public dokuAdminById;
  mapping (string => st_dokumenTeknis) public dokuTeknisById;

  function requestCdob(
    string memory _certId,
    string memory _pbfName,
    string memory _pbfInstance,
    address _pbfAddr,
    uint8 _tipePermohonanCdob,
    st_dokumenAdministrasi memory dokuAdmin,
    st_dokumenTeknis memory dokuTeknis
  ) public {

    st_userCertificate memory userFactory = createUserCertificate(_pbfName, _pbfAddr, _pbfInstance);
    st_userCertificate memory userBpom = createUserCertificate("", address(0), "");

    createCertificateDetails(userFactory, userBpom, _certId);  
 
    cdobDataById[_certId] = st_cdob({ 
      cdobId: _certId,
      cdobNumber: "",  
      tipePermohonan: _tipePermohonanCdob
    });

    allCdobData.push(st_certificateList({
      certId: _certId,
      certNumber: "",
      instanceName: _pbfInstance,
      tipePermohonan: _tipePermohonanCdob,
      status: EnumsLibrary.StatusCertificate.Requested, 
      certHash: ""
    }));

    dokuAdminById[_certId] = dokuAdmin;
    dokuTeknisById[_certId] = dokuTeknis; 
  }

  function approveCdob(
    string memory _certNumber,
    string memory _certId,
    string memory _bpomName,
    string memory _bpomInstance,
    address _bpomAddr,
    string memory _ipfsCert
  ) public {

      st_userCertificate memory userBpom = createUserCertificate(_bpomName, _bpomAddr, _bpomInstance);
  
      cdobDataById[_certId].cdobNumber = _certNumber;
 
      updateBpomApproveDetails(_certId, _ipfsCert, userBpom);  

      for (uint i = 0; i < allCdobData.length; i++) {
        if (keccak256(abi.encodePacked(allCdobData[i].certId)) == keccak256(abi.encodePacked(_certId))) {
          allCdobData[i].certNumber = _certNumber;
          allCdobData[i].status = EnumsLibrary.StatusCertificate.Approved; 
          allCdobData[i].certHash = _ipfsCert;
        }  
      }
  } 

  function rejectCdob(
    string memory _certId,
    string memory _rejectMsg,
    string memory _bpomName,
    string memory _bpomInstance,
    address _bpomAddr
  ) public {
    
      st_userCertificate memory userBpom = createUserCertificate(_bpomName, _bpomAddr, _bpomInstance);
 
      updateBpomRejectDetails(_certId, _rejectMsg, userBpom);  

      for (uint i = 0; i < allCdobData.length; i++) {
        if (keccak256(abi.encodePacked(allCdobData[i].certId)) == keccak256(abi.encodePacked(_certId))) {
          allCdobData[i].status = EnumsLibrary.StatusCertificate.Rejected; 
        }   
      }  
  }

  function renewRequestCdob(
    string memory _certId, 
    st_dokumenAdministrasi memory newDokuAdmin,
    st_dokumenTeknis memory newDokuTeknis
  ) public {

    updateRenewDetails(_certId);  
     
    for (uint i = 0; i < allCdobData.length; i++) {
      if (keccak256(abi.encodePacked(allCdobData[i].certId)) == keccak256(abi.encodePacked(_certId))) {
        allCdobData[i].status = EnumsLibrary.StatusCertificate.RenewRequest; 
        dokuAdminById[allCdobData[i].certId] = newDokuAdmin;
        dokuTeknisById[allCdobData[i].certId] = newDokuTeknis;
      }  
    }
  }

  function getAllCdobByInstance(string memory _instanceName) 
    public view returns (st_certificateList[] memory) {

    uint8 count = 0;

    for (uint i = 0; i < allCdobData.length; i++) {
      if(keccak256(abi.encodePacked(allCdobData[i].instanceName)) == keccak256(abi.encodePacked(_instanceName))){
        count++;
      }
    }

    st_certificateList[] memory cdobs = new st_certificateList[](count);

    uint8 index = 0;

    for (uint256 i = 0; i < allCdobData.length; i++) {
      if (keccak256(abi.encodePacked(allCdobData[i].instanceName)) == keccak256(abi.encodePacked(_instanceName))) {
        cdobs[index] = allCdobData[i];
        index++;
      }
    }

    return cdobs;
  } 

  function getAllCdob() 
    public view returns (st_certificateList[] memory) {

    st_certificateList[] memory cdobs = new st_certificateList[](allCdobData.length);

    uint8 index = 0;

    for (uint256 i = 0; i < allCdobData.length; i++) {
      cdobs[index] = allCdobData[i]; 
      index++;
    }

    return cdobs;
  }

  function getCertDetails(string memory _certId) 
    public view returns (st_certificateDetails memory) {
    return getCertDetail(_certId);  
  } 

  function getCdobDetails(string memory _certId) 
    public view returns (
      st_cdob memory, 
      st_dokumenAdministrasi memory, 
      st_dokumenTeknis memory
    ) {
    return (cdobDataById[_certId], dokuAdminById[_certId], dokuTeknisById[_certId]);  
  } 

  function getRejectsMsg(string memory _certId) 
    public view returns (string memory) {
    return getRejectMsg(_certId);  
  } 

}