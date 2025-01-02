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
        string addressInstance;
    }

    mapping(address => st_user) private users;
    mapping(address => bool) private isRegistered;

    event RoleAssigned(address indexed user, EnumsLibrary.Roles role);
    event UserRegistered(address indexed userAddr, string name, string instanceName, EnumsLibrary.Roles role);

    function registerUser(
        string memory _name,
        string memory _instanceName,
        address _userAddr,
        EnumsLibrary.Roles _role,
        string memory _addressInstance
    ) external {
        require(!isRegistered[_userAddr], "User already registered");

        users[_userAddr] = st_user({
            name: _name,
            instanceName: _instanceName,
            userAddr: _userAddr,
            role: _role,
            addressInstance: _addressInstance 
        });

        isRegistered[_userAddr] = true;

        emit UserRegistered(_userAddr, _name, _instanceName, _role);
        emit RoleAssigned(_userAddr, _role);
    }

    function getRegisteredUser(address _userAddr)
        external
        view
        returns (st_user memory)
    {
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
