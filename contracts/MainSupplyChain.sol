// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./RoleManager.sol";
import "./EnumsLibrary.sol";

contract MainSupplyChain {

  RoleManager roleManager;

  constructor(address _roleManagerAddr) {
    roleManager = RoleManager(_roleManagerAddr);
  }

  using EnumsLibrary for EnumsLibrary.Roles;
  using EnumsLibrary for EnumsLibrary.StatusCertificate;
  using EnumsLibrary for EnumsLibrary.TipePermohonanCdob;

  struct st_userCertificate {
    string userName;
    address userAddr;
    string userInstanceName;
  }

  struct st_certificateDetails {
    EnumsLibrary.StatusCertificate status;
    uint timestampRequest;
    uint timestampApprove;
    st_userCertificate sender;
    st_userCertificate bpom; 
    string ipfsCert;
  }

  struct st_cpotb {
    string cpotbId;
    string cpotbNumber;
    st_certificateDetails details;
    uint8 tipePermohonan;
    string factoryType;
  }

  struct st_cdob {
    string cdobId;
    string cdobNumber;
    st_certificateDetails details;
    EnumsLibrary.TipePermohonanCdob tipePermohonan;
  }

  struct st_certificateRequest {
    string certId;
    string senderName;
    string senderInstance;
  }

  struct st_certificateApproval {
    string certNumber;
    string certId;
    string bpomName;
    string bpomInstance;
  }

  struct st_certificateList {
    string certId;
    string certNumber;
    string instanceName;
    string certificateType;
    uint8 tipePermohonan;
    EnumsLibrary.StatusCertificate status;
    string ipfsCert;
  }

  struct st_approvedCert {
    string ipfsCert;
    uint8 tipePermohonan;
  }

  mapping (string => st_cpotb) public cpotbDataById;
  mapping (string => st_cdob) public cdobDataById;
  mapping(string => st_approvedCert[]) public approvedTipePermohonanByFactory;
  mapping(string => st_approvedCert[]) public approvedTipePermohonanByPbf;

  st_certificateList[] public allCertificateData;

  event evt_UserRegistered(address userAddr, string name, string instanceName, uint8 role, string addressInstance);
  event evt_cpotbRequested(string factoryInstance, address factoryAddr, uint8 TipePermohonanCpotb, uint timestampRequest);
  event evt_cpotbApproved(string bpomInstance, address bpomAddr, uint8 TipePermohonanCpotb, string cpotbId, uint timestampApproved);
  event evt_cdobRequested(string pbfInstance, address pbfAddr, EnumsLibrary.TipePermohonanCdob tipePermohonan, uint timestampRequest);
  event evt_cdobApproved(string bpomInstance, address bpomAddr, EnumsLibrary.TipePermohonanCdob, string cdobNumber, uint timestampApproved);


  function checkRole(
    EnumsLibrary.Roles _role, 
    address _userAddr
  ) internal view {
    require(roleManager.hasRole(_userAddr, _role), "Unauthorized");
  }

  // status: 200ok
  function createUserCertificate(
    string memory _userName,
    address _userAddr,
    string memory _userInstanceName
  ) internal pure returns (st_userCertificate memory) {
      return st_userCertificate({
        userName: _userName,
        userAddr: _userAddr,
        userInstanceName: _userInstanceName
      });
  }

  // status: 200ok
  function createCertificateDetails(
    st_userCertificate memory _sender,
    st_userCertificate memory _bpom 
  ) internal view returns (st_certificateDetails memory) {
      return st_certificateDetails({
        status: EnumsLibrary.StatusCertificate.Requested,
        timestampRequest: block.timestamp,
        timestampApprove: 0,
        sender: _sender,
        bpom: _bpom,
        ipfsCert: ""
      }); 
  }

  // status: 200ok
  function createCertificateList(
    string memory _certId,
    string memory _certNumber,
    string memory _instanceName,
    uint8 _tipePermohonan,
    string memory _certificateType,
    EnumsLibrary.StatusCertificate _status
  ) internal pure returns (st_certificateList memory) {
      return st_certificateList({
        certId: _certId,
        certNumber: _certNumber,
        instanceName: _instanceName,
        certificateType: _certificateType,
        tipePermohonan: _tipePermohonan,
        status: _status,
        ipfsCert: ""
      });
  }

  // status: 200ok
  function requestCpotb(
    st_certificateRequest memory requestData,
    uint8 _tipePermohonanCpotb,
    string memory _factoryType
  ) public {
      checkRole(EnumsLibrary.Roles.Factory, msg.sender);
      require(bytes(cpotbDataById[requestData.certId].cpotbId).length == 0, "CPOTB ID already exists");

      st_userCertificate memory userFactory = createUserCertificate(requestData.senderName, msg.sender, requestData.senderInstance);
      st_userCertificate memory userBpom = createUserCertificate("", address(0), "");

      st_certificateDetails memory certficateDetails =  createCertificateDetails(userFactory, userBpom); 

      cpotbDataById[requestData.certId] = st_cpotb({
        cpotbId: requestData.certId,
        cpotbNumber: "", 
        details: certficateDetails,
        tipePermohonan: _tipePermohonanCpotb,
        factoryType: _factoryType
      });

      st_certificateList memory certificateList = createCertificateList(
        requestData.certId,
        "", 
        requestData.senderInstance, 
        _tipePermohonanCpotb,
        "cpotb",
        EnumsLibrary.StatusCertificate.Requested
      );

      allCertificateData.push(certificateList); 

      emit evt_cpotbRequested(requestData.senderInstance, msg.sender,_tipePermohonanCpotb, block.timestamp);  
  }

  // status: 200ok
  function approveCpotb(
    st_certificateApproval memory approvalData,
    string memory _ipfsCert,
    uint8 _tipePermohonanCpotb
  ) public {
      checkRole(EnumsLibrary.Roles.BPOM, msg.sender);
      st_cpotb storage cpotbData = cpotbDataById[approvalData.certId];

      require(bytes(cpotbData.cpotbId).length > 0, "CPOTB not found");
      require(cpotbData.details.status == EnumsLibrary.StatusCertificate.Requested, "CPOTB status must be 'Requested'");

      cpotbData.details.bpom = createUserCertificate(approvalData.bpomName, msg.sender, approvalData.bpomInstance);

      cpotbData.details.status = EnumsLibrary.StatusCertificate.Approved;
      cpotbData.details.timestampApprove = block.timestamp;
      cpotbData.cpotbNumber = approvalData.certNumber;
      cpotbData.details.ipfsCert = _ipfsCert;  

      string memory factoryInstance = cpotbData.details.sender.userInstanceName;
 
      st_approvedCert memory approvedCpotb = st_approvedCert({
        ipfsCert : _ipfsCert, 
        tipePermohonan: _tipePermohonanCpotb
      });

      approvedTipePermohonanByFactory[factoryInstance].push(approvedCpotb);

      for (uint i = 0; i < allCertificateData.length; i++) {
        if (keccak256(abi.encodePacked(allCertificateData[i].certId)) == keccak256(abi.encodePacked(approvalData.certId))) {
          allCertificateData[i].certNumber = approvalData.certNumber;
          allCertificateData[i].status = EnumsLibrary.StatusCertificate.Approved;
          allCertificateData[i].ipfsCert = _ipfsCert;
        } 
      }
 
      emit evt_cpotbApproved(approvalData.bpomInstance, msg.sender, _tipePermohonanCpotb, approvalData.certNumber, block.timestamp);
  }

  // status: 200ok
  function approvedTipePermohonan(string memory _factoryName)
    public view returns (st_approvedCert[] memory) { 
      return approvedTipePermohonanByFactory[_factoryName];
  } 

  // status: 200ok
  function approvedTipePermohonanCdob(string memory _pbfName)
    public view returns (st_approvedCert[] memory) { 
      return approvedTipePermohonanByPbf[_pbfName]; 
  } 

  // status: 200ok
  function countCertificateByInstance(string memory _instanceName) 
    internal view returns (uint8){
      uint8 count = 0;

      for (uint i = 0; i < allCertificateData.length; i++) {
        if(keccak256(abi.encodePacked(allCertificateData[i].instanceName)) == keccak256(abi.encodePacked(_instanceName))){
          count++;
        }
      }

      return count;
  }

  // status: 200ok
  function countCertificateByType(string memory _certType) 
    internal view returns (uint8){
      uint8 count = 0;
      bytes32 certTypeHash = keccak256(abi.encodePacked(_certType));

      for (uint i = 0; i < allCertificateData.length; i++) {
        if(keccak256(abi.encodePacked(allCertificateData[i].certificateType)) == certTypeHash){
          count++;
        }
      }

      return count;
  }

  // status: 200ok
  function getListAllCertificateByInstance(string memory _instanceName)
    public view returns ( st_certificateList[] memory){
      uint8 countCertificate = countCertificateByInstance(_instanceName);

      st_certificateList[] memory filteredCertificates = new st_certificateList[](countCertificate);

      uint8 index = 0;

      for (uint256 i = 0; i < allCertificateData.length; i++) {
        if (keccak256(abi.encodePacked(allCertificateData[i].instanceName)) == keccak256(abi.encodePacked(_instanceName))) {
          filteredCertificates[index] = allCertificateData[i];
          index++;
        }
      }

      return filteredCertificates;
  }

  // status: 200ok
  function getListAllCpotb()
    public view returns (st_certificateList[] memory){
      uint8 countCertificate = countCertificateByType("cpotb");

      bytes32 certTypeHash = keccak256(abi.encodePacked("cpotb"));

      st_certificateList[] memory filteredCertificates = new st_certificateList[](countCertificate);

      uint8 index = 0;

      for (uint256 i = 0; i < allCertificateData.length; i++) {
        if (keccak256(abi.encodePacked(allCertificateData[i].certificateType)) == certTypeHash) {
          filteredCertificates[index] = allCertificateData[i];
          index++;
        }
      }

      return filteredCertificates;
  }

  // status: 200ok
  function detailCpotb (string memory _certId)
    public view returns ( st_cpotb memory ){
    return cpotbDataById[_certId];
  }

  // status: 200ok
  function requestCdob(
    st_certificateRequest memory requestData,
    uint8 _tipePermohonanCdob
  ) public {
      checkRole(EnumsLibrary.Roles.PBF, msg.sender);
      require(bytes(cdobDataById[requestData.certId].cdobId).length == 0, "CDOB ID already exists");

      st_userCertificate memory userPbf = createUserCertificate(requestData.senderName, msg.sender, requestData.senderInstance);
      st_userCertificate memory userBpom = createUserCertificate("", address(0), "");

      st_certificateDetails memory certficateDetails = createCertificateDetails(userPbf, userBpom); 

      cdobDataById[requestData.certId] = st_cdob({
        cdobId: requestData.certId,
        cdobNumber: "", 
        details: certficateDetails,
        tipePermohonan: EnumsLibrary.TipePermohonanCdob(_tipePermohonanCdob)
      });

      st_certificateList memory certificateList = createCertificateList(
        requestData.certId,
        "", 
        requestData.senderInstance, 
        uint8(EnumsLibrary.TipePermohonanCdob(_tipePermohonanCdob)),
        "cdob",
        EnumsLibrary.StatusCertificate.Requested
      );

      allCertificateData.push(certificateList); 

      emit evt_cdobRequested(requestData.senderInstance, msg.sender,EnumsLibrary.TipePermohonanCdob(_tipePermohonanCdob), block.timestamp); 
  }

  // status: 200ok
  function approveCdob(
    st_certificateApproval memory approvalData,
    string memory _ipfsCert, 
    uint8 _tipePermohonanCdob
  ) public {
      checkRole(EnumsLibrary.Roles.BPOM, msg.sender);
      st_cdob storage cdobData = cdobDataById[approvalData.certId];

      require(bytes(cdobData.cdobId).length > 0, "CDOB not found");
      require(cdobData.details.status == EnumsLibrary.StatusCertificate.Requested, "CDOB status must be 'Requested'");

      cdobData.details.bpom = createUserCertificate(approvalData.bpomName, msg.sender, approvalData.bpomInstance);

      cdobData.details.status = EnumsLibrary.StatusCertificate.Approved;
      cdobData.details.timestampApprove = block.timestamp;
      cdobData.cdobNumber = approvalData.certNumber;
      cdobData.details.ipfsCert = _ipfsCert; 

      for (uint i = 0; i < allCertificateData.length; i++) {
        if (keccak256(abi.encodePacked(allCertificateData[i].certId)) == keccak256(abi.encodePacked(approvalData.certId))) {
          allCertificateData[i].certNumber = approvalData.certNumber;
          allCertificateData[i].status = EnumsLibrary.StatusCertificate.Approved;
        } 
      }

      string memory pbfInstance = cdobData.details.sender.userInstanceName;
      
      st_approvedCert memory approvedCdob = st_approvedCert({
        ipfsCert : _ipfsCert, 
        tipePermohonan: uint8(_tipePermohonanCdob)
      });

      approvedTipePermohonanByPbf[pbfInstance].push(approvedCdob);

      emit evt_cdobApproved(approvalData.bpomInstance, msg.sender, EnumsLibrary.TipePermohonanCdob(_tipePermohonanCdob), approvalData.certNumber, block.timestamp);
  }

  // status: 200ok
  function getListAllCdob()
    public view returns (st_certificateList[] memory){
      uint8 countCertificate = countCertificateByType("cdob");

      bytes32 certTypeHash = keccak256(abi.encodePacked("cdob"));
 
      st_certificateList[] memory filteredCertificates = new st_certificateList[](countCertificate);

      uint8 index = 0;

      for (uint256 i = 0; i < allCertificateData.length; i++) {
        if (keccak256(abi.encodePacked(allCertificateData[i].certificateType)) == certTypeHash) {
          filteredCertificates[index] = allCertificateData[i];
          index++;
        }
      }

      return filteredCertificates;
  }

  // status: 200ok
  function detailCdob(string memory _certId)
    public view returns ( st_cdob memory ){
    return cdobDataById[_certId];
  }

}