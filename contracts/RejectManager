// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./EnumsLibrary.sol";
import "./RoleManager.sol";
import "./MainSupplyChain.sol";
import "./ObatTradisional.sol";

contract RejectManager {

  RoleManager public roleManager;
  ObatTradisional public obatTradisional;
  MainSupplyChain public mainSupplyChain; 

  constructor(address _roleManagerAddr, address _obatTradisionalAddr, address _mainSupplyChainAddr) {
    roleManager = RoleManager(_roleManagerAddr);
    obatTradisional = ObatTradisional(_obatTradisionalAddr);
    mainSupplyChain = MainSupplyChain(_mainSupplyChainAddr);
  }

  modifier onlyBPOM() {
    require(roleManager.hasRole(msg.sender, EnumsLibrary.Roles.BPOM), "Only BPOM");
    _;
  }

  struct st_rejectDetails{
    string rejectMsg;
    string bpomName;
    string bpomInstance;
    uint8 tipePermohonan;
    address bpomAddr;
    uint256 timestampRejected;
  }

  // struct st_userCertificate {
  //   string userName;
  //   address userAddr;
  //   string userInstanceName;
  // }

  // struct st_certificateDetails {
  //   EnumsLibrary.StatusCertificate status;
  //   uint timestampRequest;
  //   uint timestampApprove;
  //   st_userCertificate sender;
  //   st_userCertificate bpom; 
  //   string ipfsCert;
  // }

  // using EnumsLibrary for EnumsLibrary.StatusCertificate;
  // using EnumsLibrary for EnumsLibrary.NieStatus;
  using EnumsLibrary for EnumsLibrary.TipePermohonanCdob;

  mapping(string => st_rejectDetails) public rejectedDataById;

  event evt_cpotbRejected(string bpomInstance, address bpomAddr, uint8 jenisSediaan, uint timestampRejected, string rejectedMsg);
  event evt_cdobRejected(string bpomInstance, address bpomAddr, uint8 tipePermohonan, uint timestampRejected, string rejectedMsg);
  event evt_nieRejected(string bpomInstance, address bpomAddr, uint timestampRejected, string rejectedMsg);
  // mapping (string => st_certificateDetails) public certificateDetailsById;

  // function createUserCertificate(
  //   string memory _userName,
  //   address _userAddr,
  //   string memory _userInstanceName
  // ) internal pure returns (st_userCertificate memory) {
  //     return st_userCertificate({
  //       userName: _userName,
  //       userAddr: _userAddr,
  //       userInstanceName: _userInstanceName
  //     });
  // }

  // function createCertificateDetails(
  //   st_certificateDetails memory _certData,
  //   st_userCertificate memory _senderData,
  //   string memory _certId
  // ) public {
  //   st_userCertificate memory userData = createUserCertificate(requestData.senderName, msg.sender, requestData.senderInstance);
  //   st_userCertificate memory userBpom = createUserCertificate("", address(0), "");

  //   certificateDetailsById[_certId] = st_certificateDetails({
  //     status: EnumsLibrary.StatusCertificate.Rejected,
  //     timestampRequest: block.timestamp,
  //     timestampApprove: 0,
  //     sender: userData,
  //     bpom: userBpom,
  //     ipfsCert: ""
  //   });
  // }
 
  function rejectedByBpom(
    string memory _rejectMsg,
    string memory _bpomName,
    string memory _bpomInstanceName,
    string memory _id,
    string memory _certType,
    uint8 _tipePermohonan
  ) public onlyBPOM{
      rejectedDataById[_id] = st_rejectDetails({
        rejectMsg: _rejectMsg,
        bpomName: _bpomName,
        bpomInstance: _bpomInstanceName,
        bpomAddr: msg.sender,
        tipePermohonan: _tipePermohonan,
        timestampRejected: block.timestamp
      });

    if (keccak256(abi.encodePacked(_certType)) == keccak256(abi.encodePacked("cpotb"))) {

      mainSupplyChain.rejectCert(_id, "cpotb");
      emit evt_cpotbRejected(_bpomInstanceName, msg.sender,_tipePermohonan, block.timestamp, _rejectMsg); 
    } else if (keccak256(abi.encodePacked(_certType)) == keccak256(abi.encodePacked("cdob"))) { 

      mainSupplyChain.rejectCert(_id, "cdob");
      emit evt_cdobRejected(_bpomInstanceName, msg.sender,_tipePermohonan, block.timestamp, _rejectMsg); 
    } else {

      obatTradisional.rejectNie(_id);
      emit evt_nieRejected(_bpomInstanceName, msg.sender, block.timestamp, _rejectMsg); 
    }
  }

  function rejectedDetails(string memory _id) public view returns (st_rejectDetails memory) {
    return rejectedDataById[_id];
  }  

}