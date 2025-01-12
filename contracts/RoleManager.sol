// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./EnumsLibrary.sol";

contract RoleManager {
    using EnumsLibrary for EnumsLibrary.Roles;

    struct st_user {
        string name;
        string instanceName;
        address userAddr;
        EnumsLibrary.Roles role;
        string locationInstance;
        string factoryType;
    }

    mapping(address => st_user) private users;
    mapping(address => bool) private isRegistered;

    event evt_UserRegistered(address userAddr, string name, string instanceName, EnumsLibrary.Roles role, string locationInstance);

    function registerUser( 
        string memory _name,
        string memory _instanceName,
        uint8 _role,
        string memory _locationInstance,
        string memory _factoryType
    ) public {
        require(!isRegistered[msg.sender], "User already registered");

        users[msg.sender] = st_user({
            name: _name,
            instanceName: _instanceName,
            userAddr: msg.sender,
            role: EnumsLibrary.Roles(_role),
            locationInstance: _locationInstance,
            factoryType: _factoryType
        });

        isRegistered[msg.sender] = true;

        emit evt_UserRegistered(msg.sender, _name, _instanceName, EnumsLibrary.Roles(_role), _locationInstance); 
    }
 
    function loginUser() public view returns (st_user memory) {
        require(isRegistered[msg.sender], "User address missmatch");
        
        return users[msg.sender];
        
    }

    function getUserData(address _userAddr) public view returns (st_user memory) {
        require(isRegistered[_userAddr], "User is not registered");
        return users[_userAddr];
    }

    function checkRegistration(address _userAddr) external view returns (bool) {
        return isRegistered[_userAddr];
    }

    function hasRole(address _userAddr, EnumsLibrary.Roles _role) external view returns (bool) {
        return isRegistered[_userAddr] && users[_userAddr].role == _role;
    }
}
