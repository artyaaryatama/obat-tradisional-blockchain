// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract RoleManager {
    enum en_roles { Factory, PBF, BPOM, Retailer }
 
    mapping(address => en_roles) private userRoles;
    mapping(address => bool) private isRegistered;

    event RoleAssigned(address indexed user, en_roles role);

    // Assign or update a user's role
    function assignRole(address _userAddr, en_roles _role) external {
        userRoles[_userAddr] = _role;
        isRegistered[_userAddr] = true;  
        emit RoleAssigned(_userAddr, _role);
    } 

    // Fetch a user's role
    function getRole(address _userAddr) external view returns (en_roles) {
        require(isRegistered[_userAddr], "User is not registered");
        return userRoles[_userAddr];
    }

    function checkRegistration(address _userAddr) external view returns (bool) {
        return isRegistered[_userAddr]; 
    }

    // Check if a user has a specific role
    function hasRole(address _userAddr, en_roles _role) external view returns (bool) {
        return isRegistered[_userAddr] && userRoles[_userAddr] == _role;
    }
}
