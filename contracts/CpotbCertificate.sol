// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./BaseCertificate.sol";
import "./EnumsLibrary.sol";

contract CpotbCertificate is BaseCertificate {
  using EnumsLibrary for EnumsLibrary.Roles;
  using EnumsLibrary for EnumsLibrary.StatusCertificate;

  struct CpotbData {
    string cpotbId;
    string cpotbNumber;
    uint8 tipePermohonan;
    string factoryType;
  }

  struct CertificateList {
    string certId;
    string certNumber; 
    string instanceName;
    uint8 tipePermohonan;
    EnumsLibrary.StatusCertificate status;
    string certHash;
  }

  struct DokumenAdministrasi {
    string suratPermohonan;
    string buktiPembayaranNegaraBukanPajak;
    string suratKomitmen;
  }

  struct DokumenTeknis {
    string denahBangunan;
    string sistemMutu;
  }

  struct ApprovedCert {
    string ipfsCert;
    uint8 tipePermohonan; 
  }
 
  CertificateList[] public allCpotbData;

  mapping (string => CpotbData) public cpotbDataById;
  mapping (string => DokumenAdministrasi) public dokuAdminById;
  mapping (string => DokumenTeknis) public dokuTeknisById;

  function requestCpotb(
    string memory certId,
    string memory factoryName,
    string memory factoryInstance,
    address factoryAddr,
    uint8 jenisSediaan,
    string memory factoryType,
    DokumenAdministrasi memory dokuAdmin,
    DokumenTeknis memory dokuTeknis
  ) public {

    UserCert memory userFactory = createUserCertificate(
      factoryName, 
      factoryInstance, 
      factoryAddr
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

    cpotbDataById[certId] = CpotbData({
      cpotbId: certId,
      cpotbNumber: "",  
      tipePermohonan: jenisSediaan,
      factoryType: factoryType
    });

    allCpotbData.push(CertificateList({
      certId: certId,
      certNumber: "",
      instanceName: factoryInstance,
      tipePermohonan: jenisSediaan,
      status: EnumsLibrary.StatusCertificate.Requested,
      certHash: ""
    }));

    dokuAdminById[certId] = dokuAdmin;
    dokuTeknisById[certId] = dokuTeknis;
  }

  function approveCpotb(
    string memory certNumber,
    string memory certId,
    string memory bpomName,
    string memory bpomInstance,
    address bpomAddr,
    string memory ipfsCert
  ) public { 

    UserCert memory userBpom = createUserCertificate(
      bpomName, 
      bpomInstance, 
      bpomAddr
    );

    cpotbDataById[certId].cpotbNumber = certNumber; 

    updateBpomApproveDetails(
      certId, 
      ipfsCert, 
      userBpom
    );  

    uint length = allCpotbData.length;

    for (uint i = 0; i < length; i++) {
      if (keccak256(abi.encodePacked(allCpotbData[i].certId)) == keccak256(abi.encodePacked(certId))) {
        allCpotbData[i].certNumber = certNumber;
        allCpotbData[i].status = EnumsLibrary.StatusCertificate.Approved; 
        allCpotbData[i].certHash = ipfsCert;
      }  
    }
  } 

  function rejectCpotb(
    string memory certId,
    string memory rejectMsg,
    string memory bpomName,
    string memory bpomInstance,
    address bpomAddr
  ) public {
     
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

    uint length = allCpotbData.length;

    for (uint i = 0; i < length; i++) {
      if (keccak256(abi.encodePacked(allCpotbData[i].certId)) == keccak256(abi.encodePacked(certId))) {
        allCpotbData[i].status = EnumsLibrary.StatusCertificate.Rejected; 
      }   
    }  
  }

  function renewRequestCpotb(
    string memory certId, 
    DokumenAdministrasi memory newDokuAdmin,
    DokumenTeknis memory newDokuTeknis
  ) public {

    updateRenewDetails(certId);
     
    uint length = allCpotbData.length;

    for (uint i = 0; i < length; i++) {
      if (keccak256(abi.encodePacked(allCpotbData[i].certId)) == keccak256(abi.encodePacked(certId))) {
        allCpotbData[i].status = EnumsLibrary.StatusCertificate.RenewRequest; 
        dokuAdminById[allCpotbData[i].certId] = newDokuAdmin;
        dokuTeknisById[allCpotbData[i].certId] = newDokuTeknis;
      }  
    } 
  }

  function getAllCpotbByInstance(string memory instanceName) public view returns (CertificateList[] memory) {

    uint8 count = 0;
    uint length = allCpotbData.length;

    for (uint i = 0; i < length; i++) {
      if(keccak256(abi.encodePacked(allCpotbData[i].instanceName)) == keccak256(abi.encodePacked(instanceName))){
        count++;
      }
    }

    CertificateList[] memory cpotbs = new CertificateList[](count);

    uint8 index = 0;

    for (uint256 i = 0; i < length; i++) {
      if (keccak256(abi.encodePacked(allCpotbData[i].instanceName)) == keccak256(abi.encodePacked(instanceName))) {
        cpotbs[index] = allCpotbData[i];
        index++;
      }
    }

    return cpotbs;
  } 

  function getAllCpotb() public view returns (CertificateList[] memory) {

    CertificateList[] memory cpotbs = new CertificateList[](allCpotbData.length);

    uint8 index = 0;
    uint length = allCpotbData.length;

    for (uint256 i = 0; i < length; i++) {
      cpotbs[index] = allCpotbData[i];
      index++;
    }

    return cpotbs;
  }

  function getCertDetails(string memory certId) public view returns (CertificateDetails memory) {
    return getCertDetail(certId);  
  } 

  function getCpotbDetails(string memory certId) public view returns (
    CpotbData memory,
    DokumenAdministrasi memory, 
    DokumenTeknis memory 
  ) {
    
  return (
    cpotbDataById[certId], 
    dokuAdminById[certId], 
    dokuTeknisById[certId])
    ;     
  } 

  function getRejectsMsg(string memory certId) public view returns (string memory) {
    return getRejectMsg(certId);  
  } 

}