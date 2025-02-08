// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

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
 
  CertificateList[] public AllCpotbData;

  mapping (string => CpotbData) public CpotbDataById;
  mapping (string => DokumenAdministrasi) public DokuAdminById;
  mapping (string => DokumenTeknis) public DokuTeknisById;

  function requestCpotb(
    string memory _certId,
    string memory _factoryName,
    string memory _factoryInstance,
    address _factoryAddr,
    uint8 _tipePermohonanCpotb,
    string memory _factoryType,
    DokumenAdministrasi memory _dokuAdmin,
    DokumenTeknis memory _dokuTeknis
  ) public {

    UserCert memory userFactory = createUserCertificate(
      _factoryName, 
      _factoryInstance, 
      _factoryAddr
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

    CpotbDataById[_certId] = CpotbData({
      cpotbId: _certId,
      cpotbNumber: "",  
      tipePermohonan: _tipePermohonanCpotb,
      factoryType: _factoryType
    });

    AllCpotbData.push(CertificateList({
      certId: _certId,
      certNumber: "",
      instanceName: _factoryInstance,
      tipePermohonan: _tipePermohonanCpotb,
      status: EnumsLibrary.StatusCertificate.Requested,
      certHash: ""
    }));

    DokuAdminById[_certId] = _dokuAdmin;
    DokuTeknisById[_certId] = _dokuTeknis;
  }

  function approveCpotb(
    string memory _certNumber,
    string memory _certId,
    string memory _bpomName,
    string memory _bpomInstance,
    address _bpomAddr,
    string memory _ipfsCert
  ) public { 

      UserCert memory userBpom = createUserCertificate(
        _bpomName, 
        _bpomInstance, 
        _bpomAddr
      );
  
      CpotbDataById[_certId].cpotbNumber = _certNumber; 
 
      updateBpomApproveDetails(
        _certId, 
        _ipfsCert, 
        userBpom
      );  

      for (uint i = 0; i < AllCpotbData.length; i++) {
        if (keccak256(abi.encodePacked(AllCpotbData[i].certId)) == keccak256(abi.encodePacked(_certId))) {
          AllCpotbData[i].certNumber = _certNumber;
          AllCpotbData[i].status = EnumsLibrary.StatusCertificate.Approved; 
          AllCpotbData[i].certHash = _ipfsCert;
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

      for (uint i = 0; i < AllCpotbData.length; i++) {
        if (keccak256(abi.encodePacked(AllCpotbData[i].certId)) == keccak256(abi.encodePacked(_certId))) {
          AllCpotbData[i].status = EnumsLibrary.StatusCertificate.Rejected; 
        }   
      }  
  }

  function renewRequestCpotb(
    string memory _certId, 
    DokumenAdministrasi memory newDokuAdmin,
    DokumenTeknis memory newDokuTeknis
  ) public {

    updateRenewDetails(_certId);
     
    for (uint i = 0; i < AllCpotbData.length; i++) {
      if (keccak256(abi.encodePacked(AllCpotbData[i].certId)) == keccak256(abi.encodePacked(_certId))) {
        AllCpotbData[i].status = EnumsLibrary.StatusCertificate.RenewRequest; 
        DokuAdminById[AllCpotbData[i].certId] = newDokuAdmin;
        DokuTeknisById[AllCpotbData[i].certId] = newDokuTeknis;
      }  
    } 
  }

  function getAllCpotbByInstance(string memory _instanceName) 
    public view returns (CertificateList[] memory) {

    uint8 count = 0;

    for (uint i = 0; i < AllCpotbData.length; i++) {
      if(keccak256(abi.encodePacked(AllCpotbData[i].instanceName)) == keccak256(abi.encodePacked(_instanceName))){
        count++;
      }
    }

    CertificateList[] memory cpotbs = new CertificateList[](count);

    uint8 index = 0;

    for (uint256 i = 0; i < AllCpotbData.length; i++) {
      if (keccak256(abi.encodePacked(AllCpotbData[i].instanceName)) == keccak256(abi.encodePacked(_instanceName))) {
        cpotbs[index] = AllCpotbData[i];
        index++;
      }
    }

    return cpotbs;
  } 

  function getAllCpotb() 
    public view returns (CertificateList[] memory) {

    CertificateList[] memory cpotbs = new CertificateList[](AllCpotbData.length);

    uint8 index = 0;

    for (uint256 i = 0; i < AllCpotbData.length; i++) {
      cpotbs[index] = AllCpotbData[i];
      index++;
    }

    return cpotbs;
  }

  function getCertDetails(string memory _certId) 
    public view returns (CertificateDetails memory) {
    return getCertDetail(_certId);  
  } 

  function getCpotbDetails(string memory _certId) 
    public view returns (
      CpotbData memory,
      DokumenAdministrasi memory, 
      DokumenTeknis memory 
    ) {
      
    return (
      CpotbDataById[_certId], 
      DokuAdminById[_certId], 
      DokuTeknisById[_certId])
      ;     
  } 

  function getRejectsMsg(string memory _certId) 
    public view returns (string memory) {
    return getRejectMsg(_certId);  
  } 

}