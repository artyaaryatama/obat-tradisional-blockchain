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

  enum en_roles {
    factory,
    pbf, 
    bpom,
    retailer,
    guest
  }
  
  struct st_userData {
    string name;
    string email;
    address userAddr;
    en_roles userRole; 
  }

  struct st_cpotbData {
    bytes cpotbId;
    address pabrikAddr;
    address bpomAddr;
    uint timestamp;
    bytes cpotbNumber;
  }

  struct st_cdobData {
    bytes cdobId;
    address pbfAddr;
    address bpomAddr;
    uint timestamp;
    bytes cdobNumber;
  }

  mapping (address => st_userData) private userData;
  mapping (address => bool) private isRegistered;

  event evt_UserRegistered(address userAddr, string name);

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
    
    emit evt_UserRegistered(_userAddr, _name);  
  }

  function getRegisteredUser(address _userAddr) public view returns (address, string memory) {
      require(isRegistered[_userAddr], "User is not registered");

      st_userData memory user = userData[_userAddr];
      
      return (user.userAddr, user.name); 
  }

}