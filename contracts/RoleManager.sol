// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./EnumsLibrary.sol";

contract RoleManager {
    using EnumsLibrary for EnumsLibrary.Roles;

    struct User {
        string name;
        string instanceName;
        address userAddr;
        EnumsLibrary.Roles role;
    }

    mapping(address => User) private users;
    mapping(address => bool) private isRegistered;

    event RoleAssigned(address indexed user, EnumsLibrary.Roles role);
    event UserRegistered(address indexed userAddr, string name, string instanceName, EnumsLibrary.Roles role);

    // Register a user and assign a role
    function registerUser(
        string memory _name,
        string memory _instanceName,
        address _userAddr,
        EnumsLibrary.Roles _role
    ) external {
        require(!isRegistered[_userAddr], "User already registered");

        users[_userAddr] = User({
            name: _name,
            instanceName: _instanceName,
            userAddr: _userAddr,
            role: _role
        });

        isRegistered[_userAddr] = true;

        emit UserRegistered(_userAddr, _name, _instanceName, _role);
        emit RoleAssigned(_userAddr, _role);
    }

    function getRegisteredUser(address _userAddr)
        external
        view
        returns (string memory, string memory, address, EnumsLibrary.Roles)
    {
        require(isRegistered[_userAddr], "User is not registered");
        User memory user = users[_userAddr];
        return (user.name, user.instanceName, user.userAddr, user.role);
    }

    function checkRegistration(address _userAddr) external view returns (bool) {
        return isRegistered[_userAddr];
    }


    function hasRole(address _userAddr, EnumsLibrary.Roles _role) external view returns (bool) {
        return isRegistered[_userAddr] && users[_userAddr].role == _role;
    }
}
