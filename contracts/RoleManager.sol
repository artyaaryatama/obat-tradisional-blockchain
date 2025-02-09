// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

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
    string nib;
    string npwp;
  }

  mapping(address => UserData) private userDataByAddr;
  mapping(address => bool) private isRegistered;

  event UserRegistered(
    address userAddr, 
    string name, 
    string instanceName, 
    EnumsLibrary.Roles role, 
    string locationInstance, 
    string nib, 
    string npwp
  );

  function checkRegistration(address userAddr) external view returns (bool) {
    return isRegistered[userAddr];
  }

  function hasRole(
    address userAddr, 
    EnumsLibrary.Roles role
  ) external view returns (bool) {
    return isRegistered[userAddr] && userDataByAddr[userAddr].role == role;
  }

  function registerUser( 
    string memory userName,
    string memory userInstance,
    uint8 role,
    string memory locationInstance,
    string memory factoryType,
    string memory nibNumber,
    string memory npwpNumber
  ) public {
    require(!isRegistered[msg.sender], "User sudah terdaftar.");

    userDataByAddr[msg.sender] = UserData({
      name: userName,
      instanceName: userInstance,
      userAddr: msg.sender,
      role: EnumsLibrary.Roles(role),
      locationInstance: locationInstance,
      factoryType: factoryType,
      nib: nibNumber,
      npwp: npwpNumber
    });

    isRegistered[msg.sender] = true;

    emit UserRegistered(
      msg.sender, 
      userName, 
      userInstance, 
      EnumsLibrary.Roles(role), 
      locationInstance, 
      nibNumber, 
      npwpNumber
    ); 
  }

  function loginUser() public view returns (UserData memory) {
    require(isRegistered[msg.sender], "Nama dan alamat User salah");
    
    return userDataByAddr[msg.sender];
  }

  function getUserData(address userAddr) public view returns (UserData memory) {
    require(isRegistered[userAddr], "User belum terdaftar");
    return userDataByAddr[userAddr];
  }
}
