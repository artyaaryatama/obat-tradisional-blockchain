// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

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
    guest, 
    factory,
    pbf, 
    bpom,
    retailer
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

  mapping (address => st_userData) public userData;

  event registeredUser(address indexed userAddr, string name, en_roles userRole);

  function registerUser(
    string memory _name, 
    string memory _email, 
    address _userAddr, 
    uint8 _userRole
  ) public onlyOwner {
    userData[_userAddr] = st_userData({
      name : _name, 
      email : _email,
      userAddr : _userAddr,
      userRole : en_roles(_userRole)
    }); 
    
    emit registeredUser(_userAddr, _name, en_roles(_userRole)); 
  }

  function getRegisteredUser(address userAddr) public view returns (address, string memory) {
    st_userData memory user = userData[userAddr]; 
    return (user.userAddr, user.name);   
  } 
 
}