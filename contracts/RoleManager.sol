// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract RoleManager {
    enum en_roles { Pabrik, PBF, BPOM, Retailer }
 
    mapping(address => en_roles) private userRoles;
    mapping(address => bool) private isRegistered;

    event RoleAssigned(address indexed user, en_roles role);

    // Assign or update a user's role
    function assignRole(address user, en_roles role) external {
        userRoles[user] = role;
        isRegistered[user] = true;
        emit RoleAssigned(user, role);
    }

    // Fetch a user's role
    function getRole(address user) external view returns (en_roles) {
        require(isRegistered[user], "User is not registered");
        return userRoles[user];
    }

    function checkRegistration(address user) external view returns (bool) {
        return isRegistered[user];
    }

    // Check if a user has a specific role
    function hasRole(address user, en_roles role) external view returns (bool) {
        return isRegistered[user] && userRoles[user] == role;
    }
}
