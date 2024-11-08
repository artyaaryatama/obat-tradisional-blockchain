// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract MainSupplyChain {

  address public owner;

  constructor() {
    owner = msg.sender;
  }

  modifier onlyOwner() {
    require (owner == msg.sender, "Sorry, you don't have authorization to access the data");
    _;
  } 

  modifier onlyFactory() { 
      require(userRoles[msg.sender] == en_roles.Factory, "Sorry, you don't have authorized to access this!");
      _;
  }

  modifier onlyBPOM() {
      require(userRoles[msg.sender] == en_roles.BPOM, "Sorry, you don't have authorized to access this!");
      _;
  }

  modifier onlyPBF() {
      require(userRoles[msg.sender] == en_roles.PBF, "Sorry, you don't have authorized to access this!");
      _;
  }

  enum en_roles {
    Factory,
    PBF, 
    BPOM,
    Retailer,
    Guest
  }
  
  enum en_statusCert {
    Pending,
    Approved
  }

  enum en_jenisSediaan {
    TabletNonbetalaktam,
    KapsulKerasNonbetalaktam,
    SerbukOralNonbetalaktam,
    CairanOralNonbetalaktam
  }
  
  struct st_userData {
    string name;
    string email;
    address userAddr;
    en_roles userRole; 
  }

  struct st_cpotbData {
    string cpotbId;
    address factoryAddr;
    string factoryName;
    en_jenisSediaan jenisSediaan;
    en_statusCert status;
    uint timestampRequest;
    uint timestampApprove;
    string cpotbNumber;
    address bpomAddr;
  }

  struct st_cdobData {
    bytes cdobId;
    address pbfAddr;
    address bpomAddr;
    uint timestamp;
    bytes cdobNumber;
  }

  mapping (address => st_userData) private userData;
  mapping (address => en_roles) public userRoles; 
  mapping (address => bool) private isRegistered;
  mapping (string => st_cpotbData) cpotbData;

  event evt_UserRegistered(address userAddr, string name, en_roles role);
  event evt_cpotbRequested(address factoryAddr, string factoryName, en_jenisSediaan jenisSediaan, string cpotbId, uint timestampRequest);
  event evt_cpotbApproved(address bpomAddr, string factoryName, string cpotbNumber, uint timestampApprove);

  function registerUser(
    string memory _name, 
    string memory _email, 
    address _userAddr,
    uint8 _userRole
  ) public {
    require(!isRegistered[_userAddr], "User is already registered");

    console.log("RegisterUser function called by:", _userAddr);
    console.log("User Role:", _userRole);

    userData[_userAddr] = st_userData({
      name : _name, 
      email : _email,
      userAddr : _userAddr,
      userRole : en_roles(_userRole)
    }); 

    isRegistered[_userAddr] = true; 
    
    emit evt_UserRegistered(_userAddr, _name, en_roles(_userRole));  
  }

  function getRegisteredUser(address _userAddr) public view returns (address, string memory, uint8) {
      require(isRegistered[_userAddr], "User is not registered");

      st_userData memory user = userData[_userAddr];
      
      return (user.userAddr, user.name, uint8(user.userRole)); 
  }

  function requestCpotb(
    string memory _factoryName,
    string memory _cpotbId,
    en_jenisSediaan _jenisSediaan
  ) public onlyFactory{

    cpotbData[_cpotbId] = st_cpotbData({
      cpotbId: _cpotbId,
      factoryAddr: msg.sender, 
      factoryName: _factoryName,
      jenisSediaan: en_jenisSediaan(_jenisSediaan), 
      status: en_statusCert.Pending,
      timestampRequest: block.timestamp,
      timestampApprove: 0,
      cpotbNumber: "",
      bpomAddr: address(0)
    });

    emit evt_cpotbRequested(msg.sender, _factoryName, _jenisSediaan, _cpotbId, block.timestamp);
  }

  function approveCpotb(
    string memory _cpotbId,  
    string memory _cpotbNumber
  ) public onlyBPOM {
     
    st_cpotbData storage cpotbDatas =  cpotbData[_cpotbId];
    require(cpotbDatas.status == en_statusCert.Pending, "CPOTB status must be pending!");

    cpotbDatas.status = en_statusCert.Approved;
    cpotbDatas.cpotbNumber = _cpotbNumber;
    cpotbDatas.timestampApprove = block.timestamp;

    emit evt_cpotbApproved(msg.sender, cpotbDatas.factoryName, _cpotbNumber, block.timestamp);
  }
  

}
