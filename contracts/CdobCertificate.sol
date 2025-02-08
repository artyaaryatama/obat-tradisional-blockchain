// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./BaseCertificate.sol";
import "./EnumsLibrary.sol";

contract CdobCertificate is BaseCertificate {
  using EnumsLibrary for EnumsLibrary.Roles;
  using EnumsLibrary for EnumsLibrary.StatusCertificate;
  
  struct CdobData {
    string cdobId;
    string cdobNumber;
    uint8 tipePermohonan;
  }

  struct DokumenAdministrasi {
    string suratPermohonan;
    string buktiPembayaranPajak;
  }

  struct DokumenTeknis {
    string suratIzinCdob; 
    string denahBangunan;
    string strukturOrganisasi;
    string daftarPersonalia;
    string daftarPeralatan;
    string eksekutifQualityManagement;
    string suratIzinApoteker; 
    string dokumenSelfAssesment; 
  }

  struct CertificateList {
    string certId;
    string certNumber; 
    string instanceName;
    uint8 tipePermohonan;
    EnumsLibrary.StatusCertificate status;
    string certHash;
  }

  CertificateList[] public allCdobData;

  mapping (string => CdobData) public CdobDataById;
  mapping (string => DokumenAdministrasi) public DokuAdminById;
  mapping (string => DokumenTeknis) public DokuTeknisById;

  function requestCdob(
    string memory _certId,
    string memory _pbfName,
    string memory _pbfInstance,
    address _pbfAddr,
    uint8 _tipePermohonanCdob,
    DokumenAdministrasi memory _dokuAdmin,
    DokumenTeknis memory _dokuTeknis 
  ) 
    public 
  { 

    UserCert memory userFactory = createUserCertificate(
      _pbfName, 
      _pbfInstance, 
      _pbfAddr
    );

    UserCert memory userBpom = createUserCertificate(
      "", 
      "", 
      address(0)
    );

    createCertificateDetails(
      userFactory, 
      userBpom, 
      _certId
    );  
 
    CdobDataById[_certId] = CdobData({ 
      cdobId: _certId,
      cdobNumber: "",  
      tipePermohonan: _tipePermohonanCdob
    });

    allCdobData.push(CertificateList({
      certId: _certId,
      certNumber: "",
      instanceName: _pbfInstance,
      tipePermohonan: _tipePermohonanCdob,
      status: EnumsLibrary.StatusCertificate.Requested, 
      certHash: ""
    }));

    DokuAdminById[_certId] = _dokuAdmin;
    DokuTeknisById[_certId] = _dokuTeknis; 
  }

  function approveCdob(
    string memory _certNumber,
    string memory _certId,
    string memory _bpomName,
    string memory _bpomInstance,
    address _bpomAddr,
    string memory _ipfsCert
  ) 
    public 
  {

    UserCert memory userBpom = createUserCertificate(
      _bpomName, 
      _bpomInstance, 
      _bpomAddr
    );

    CdobDataById[_certId].cdobNumber = _certNumber;

    updateBpomApproveDetails(
      _certId, 
      _ipfsCert, 
      userBpom
    );  

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
  ) 
    public 
  {
    
    UserCert memory userBpom = createUserCertificate(
      _bpomName,
      _bpomInstance,
      _bpomAddr
    );

    updateBpomRejectDetails(
      _certId, 
      _rejectMsg, 
      userBpom 
    );  

    for (uint i = 0; i < allCdobData.length; i++) {
      if (keccak256(abi.encodePacked(allCdobData[i].certId)) == keccak256(abi.encodePacked(_certId))) {
        allCdobData[i].status = EnumsLibrary.StatusCertificate.Rejected; 
      }   
    }  
  }

  function renewRequestCdob(
    string memory _certId,  
    DokumenAdministrasi memory _newDokuAdmin,
    DokumenTeknis memory _newDokuTeknis
  ) 
    public 
  {

    updateRenewDetails(_certId);  
     
    for (uint i = 0; i < allCdobData.length; i++) {
      if (keccak256(abi.encodePacked(allCdobData[i].certId)) == keccak256(abi.encodePacked(_certId))) {
        allCdobData[i].status = EnumsLibrary.StatusCertificate.RenewRequest; 
        DokuAdminById[allCdobData[i].certId] = _newDokuAdmin;
        DokuTeknisById[allCdobData[i].certId] = _newDokuTeknis;
      }  
    }
  }

  function getAllCdobByInstance(string memory _instanceName) public view returns (CertificateList[] memory) {

    uint8 count = 0;

    for (uint i = 0; i < allCdobData.length; i++) {
      if(keccak256(abi.encodePacked(allCdobData[i].instanceName)) == keccak256(abi.encodePacked(_instanceName))){
        count++;
      }
    }

    CertificateList[] memory cdobs = new CertificateList[](count);

    uint8 index = 0;

    for (uint256 i = 0; i < allCdobData.length; i++) {
      if (keccak256(abi.encodePacked(allCdobData[i].instanceName)) == keccak256(abi.encodePacked(_instanceName))) {
        cdobs[index] = allCdobData[i];
        index++;
      }
    }

    return cdobs;
  } 

  function getAllCdob() public view returns (CertificateList[] memory) {

    CertificateList[] memory cdobs = new CertificateList[](allCdobData.length);

    uint8 index = 0;

    for (uint256 i = 0; i < allCdobData.length; i++) {
      cdobs[index] = allCdobData[i]; 
      index++;
    }

    return cdobs;
  }

  function getCertDetails(string memory _certId) public view returns (CertificateDetails memory) { 
    return getCertDetail(_certId);  
  } 

  function getCdobDetails(string memory _certId) public view returns (
    CdobData memory,  
    DokumenAdministrasi memory, 
    DokumenTeknis memory
  ) {
    return (
      CdobDataById[_certId],
      DokuAdminById[_certId], 
      DokuTeknisById[_certId]
    );  
  }  

  function getRejectsMsg(string memory _certId) public view returns (string memory) {
    return getRejectMsg(_certId);  
  }  

}