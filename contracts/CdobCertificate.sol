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

  struct st_dokumenAdministrasiIpfs {
    string suratPermohonan;
    string buktiPembayaranPajak;
  }

  struct st_dokumenTeknisIpfs {
    string suratIzinCdob; 
    string denahBangunan;
    string strukturOrganisasi;
    string daftarPersonalia;
    string daftarPeralatan;
    string eksekutifQualityManagement;
    string suratIzinApoteker; 
    string dokumenSelfAssesment; 
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
  mapping (string => st_dokumenAdministrasiIpfs) public dokuAdminById;
  mapping (string => st_dokumenTeknisIpfs) public dokuTeknisById;

  function requestCdob(
    string memory _certId,
    string memory _pbfName,
    string memory _pbfInstance,
    address _pbfAddr,
    uint8 _tipePermohonanCdob,
    st_dokumenAdministrasiIpfs memory _dokuAdmin,
    st_dokumenTeknisIpfs memory _dokuTeknis 
  ) public {

    st_userCertificate memory userFactory = createUserCertificate(_pbfName, _pbfInstance, _pbfAddr);
    st_userCertificate memory userBpom = createUserCertificate("", "", address(0));

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

    dokuAdminById[_certId] = _dokuAdmin;
    dokuTeknisById[_certId] = _dokuTeknis; 
  }

  function approveCdob(
    string memory _certNumber,
    string memory _certId,
    string memory _bpomName,
    string memory _bpomInstance,
    address _bpomAddr,
    string memory _ipfsCert
  ) public {

      st_userCertificate memory userBpom = createUserCertificate(_bpomName, _bpomInstance, _bpomAddr);
  
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
    
      st_userCertificate memory userBpom = createUserCertificate(_bpomName, _bpomInstance, _bpomAddr);
 
      updateBpomRejectDetails(_certId, _rejectMsg, userBpom);  

      for (uint i = 0; i < allCdobData.length; i++) {
        if (keccak256(abi.encodePacked(allCdobData[i].certId)) == keccak256(abi.encodePacked(_certId))) {
          allCdobData[i].status = EnumsLibrary.StatusCertificate.Rejected; 
        }   
      }  
  }

  function renewRequestCdob(
    string memory _certId,  
    st_dokumenAdministrasiIpfs memory newDokuAdmin,
    st_dokumenTeknisIpfs memory newDokuTeknis
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
      st_dokumenAdministrasiIpfs memory, 
      st_dokumenTeknisIpfs memory
    ) {
    return (cdobDataById[_certId], dokuAdminById[_certId], dokuTeknisById[_certId]);  
  } 

  function getRejectsMsg(string memory _certId) 
    public view returns (string memory) {
    return getRejectMsg(_certId);  
  } 

}