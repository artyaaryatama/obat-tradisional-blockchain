// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./EnumsLibrary.sol";

contract RoleManager {
  using EnumsLibrary for EnumsLibrary.Roles;

  struct UserData {
    string name;
    string instanceName;
    address userAddr;
    EnumsLibrary.Roles role;
    string locationInstance;
    string factoryType;
    string NibNumber;
    string NpwpNumber;
  }

  mapping(address => UserData) private Users;
  mapping(address => bool) private IsRegistered;

  event UserRegistered(
    address userAddr, 
    string name, 
    string instanceName, 
    EnumsLibrary.Roles role, 
    string locationInstance, 
    string nib, 
    string npwp
  );

  function checkRegistration(address _userAddr) external view returns (bool) {
    return IsRegistered[_userAddr];
  }

  function hasRole(
    address _userAddr, 
    EnumsLibrary.Roles _role
  ) external view returns (bool) {
    return IsRegistered[_userAddr] && Users[_userAddr].role == _role;
  }

  function registerUser( 
    string memory _name,
    string memory _instanceName,
    uint8 _role,
    string memory _locationInstance,
    string memory _factoryType,
    string memory _nib,
    string memory _npwp
  ) public {
    require(!IsRegistered[msg.sender], "User already registered");

    Users[msg.sender] = UserData({
      name: _name,
      instanceName: _instanceName,
      userAddr: msg.sender,
      role: EnumsLibrary.Roles(_role),
      locationInstance: _locationInstance,
      factoryType: _factoryType,
      NibNumber: _nib,
      NpwpNumber: _npwp
    });

    IsRegistered[msg.sender] = true;

    emit UserRegistered(
      msg.sender, 
      _name, 
      _instanceName, 
      EnumsLibrary.Roles(_role), 
      _locationInstance, 
      _nib, 
      _npwp
    ); 
  }

  function loginUser() public view returns (UserData memory) {
    require(IsRegistered[msg.sender], "User address missmatch");
    
    return Users[msg.sender];
  }

  function getUserData(address _userAddr) public view returns (UserData memory) {
    require(IsRegistered[_userAddr], "User is not registered");
    return Users[_userAddr];
  }
}
