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

  mapping (string => CdobData) public cdobDataById;
  mapping (string => DokumenAdministrasi) public dokuAdminById;
  mapping (string => DokumenTeknis) public dokuTeknisById;

  function requestCdob(
    string memory certId,
    string memory pbfName,
    string memory pbfInstance,
    address pbfAddr,
    uint8 tipePermohonan,
    DokumenAdministrasi memory dokuAdmin,
    DokumenTeknis memory dokuTeknis 
  ) 
    public 
  { 

    UserCert memory userFactory = createUserCertificate(
      pbfName, 
      pbfInstance, 
      pbfAddr
    );

    UserCert memory userBpom = createUserCertificate(
      "", 
      "", 
      address(0)
    );

    createCertificateDetails(
      userFactory, 
      userBpom, 
      certId
    );  
 
    cdobDataById[certId] = CdobData({ 
      cdobId: certId,
      cdobNumber: "",  
      tipePermohonan: tipePermohonan
    });

    allCdobData.push(CertificateList({
      certId: certId,
      certNumber: "",
      instanceName: pbfInstance,
      tipePermohonan: tipePermohonan,
      status: EnumsLibrary.StatusCertificate.Requested, 
      certHash: ""
    }));

    dokuAdminById[certId] = dokuAdmin;
    dokuTeknisById[certId] = dokuTeknis; 
  }

  function approveCdob(
    string memory certNumber,
    string memory certId,
    string memory bpomName,
    string memory bpomInstance,
    address bpomAddr,
    string memory ipfsCert
  ) 
    public  
  {

    UserCert memory userBpom = createUserCertificate(
      bpomName, 
      bpomInstance, 
      bpomAddr
    );

    cdobDataById[certId].cdobNumber = certNumber;

    updateBpomApproveDetails(
      certId, 
      ipfsCert, 
      userBpom
    );  

    uint length = allCdobData.length;

    for (uint i = 0; i < length; i++) {
      if (keccak256(abi.encodePacked(allCdobData[i].certId)) == keccak256(abi.encodePacked(certId))) {
        allCdobData[i].certNumber = certNumber;
        allCdobData[i].status = EnumsLibrary.StatusCertificate.Approved; 
        allCdobData[i].certHash = ipfsCert;
      }  
    }
  } 

  function rejectCdob(
    string memory certId,
    string memory rejectMsg,
    string memory bpomName,
    string memory bpomInstance,
    address bpomAddr
  ) 
    public  
  {
    
    UserCert memory userBpom = createUserCertificate(
      bpomName,
      bpomInstance,
      bpomAddr
    );

    updateBpomRejectDetails(
      certId, 
      rejectMsg, 
      userBpom 
    );  

    uint length = allCdobData.length;

    for (uint i = 0; i < length; i++) {
      if (keccak256(abi.encodePacked(allCdobData[i].certId)) == keccak256(abi.encodePacked(certId))) {
        allCdobData[i].status = EnumsLibrary.StatusCertificate.Rejected; 
      }   
    }  
  }

  function renewRequestCdob(
    string memory certId,  
    DokumenAdministrasi memory newDokuAdmin,
    DokumenTeknis memory newDokuTeknis
  ) 
    public  
  {

    updateRenewDetails(certId);  

    uint length = allCdobData.length;
     
    for (uint i = 0; i < length; i++) {
      if (keccak256(abi.encodePacked(allCdobData[i].certId)) == keccak256(abi.encodePacked(certId))) {
        allCdobData[i].status = EnumsLibrary.StatusCertificate.RenewRequest; 
        dokuAdminById[allCdobData[i].certId] = newDokuAdmin;
        dokuTeknisById[allCdobData[i].certId] = newDokuTeknis;
      }  
    }
  }

  function getAllCdobByInstance(string memory instanceName) public view returns (CertificateList[] memory) {

    uint8 count = 0;
    uint length = allCdobData.length;

    for (uint i = 0; i < length; i++) {
      if(keccak256(abi.encodePacked(allCdobData[i].instanceName)) == keccak256(abi.encodePacked(instanceName))){
        count++;
      }
    }

    CertificateList[] memory cdobs = new CertificateList[](count);

    uint8 index = 0;

    for (uint256 i = 0; i < length; i++) {
      if (keccak256(abi.encodePacked(allCdobData[i].instanceName)) == keccak256(abi.encodePacked(instanceName))) {
        cdobs[index] = allCdobData[i];
        index++;
      }
    }

    return cdobs;
  } 

  function getAllCdob() public view returns (CertificateList[] memory) {

    uint length = allCdobData.length;

    CertificateList[] memory cdobs = new CertificateList[](length);

    uint8 index = 0;

    for (uint256 i = 0; i < length; i++) {
      cdobs[index] = allCdobData[i]; 
      index++;
    }

    return cdobs;
  }

  function getCertDetails(string memory certId) public view returns (CertificateDetails memory) { 
    return getCertDetail(certId);  
  } 

  function getCdobDetails(string memory certId) public view returns (
    CdobData memory,  
    DokumenAdministrasi memory, 
    DokumenTeknis memory
  ) {
    return (
      cdobDataById[certId],
      dokuAdminById[certId], 
      dokuTeknisById[certId]
    );  
  }  

  function getRejectsMsg(string memory certId) public view returns (string memory) {
    return getRejectMsg(certId);  
  }  

}