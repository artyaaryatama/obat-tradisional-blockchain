// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./RoleManager.sol";

contract MainSupplyChain {

  RoleManager roleManager;

  constructor(address _roleManagerAddr) {
    // contract address role manager => data ini dari scripts/deploy.js perhatikan line 11
    roleManager = RoleManager(_roleManagerAddr);
  }

  modifier onlyFactory() { 
    require(roleManager.hasRole(msg.sender, RoleManager.en_roles.Pabrik), "Access restricted to Factory role");
    _;
  }

  modifier onlyBPOM() {
    require(roleManager.hasRole(msg.sender, RoleManager.en_roles.BPOM), "Access restricted to BPOM role");
    _;
  }
 
  modifier onlyPBF() {
    require(roleManager.hasRole(msg.sender, RoleManager.en_roles.PBF), "Access restricted to PBF role");
    _; 
  }

  enum en_roles { Pabrik, PBF, BPOM, Retailer }
  enum en_statusCert { Pending, Approved }
  enum en_jenisSediaan { Tablet, Kapsul, KapsulLunak, SerbukOral, CairanOral, CairanObatDalam, CairanObatLuar, FilmStrip, Pil}
  enum en_tipePermohonan { ObatLain, CCP }

  struct st_userData {
    string name;
    string instanceName;
    address userAddr; 
  }

  struct st_cpotbData {
    string cpotbId;
    string senderName;
    address factoryAddr;
    string factoryName;
    en_jenisSediaan jenisSediaan;
    en_statusCert status;
    uint timestampRequest;
    uint timestampApprove;
    string cpotbNumber;
    address bpomAddr;
    string receiverName;
  }

  struct st_cdobData {
    string cdobId;
    string senderName;
    address pbfAddr; 
    string pbfName; 
    en_tipePermohonan tipePermohonan;
    en_statusCert status;
    uint timestampRequest;
    uint timestampApprove; 
    string cdobNumber;
    address bpomAddr;
    string receiverName;
  }

  mapping (address => st_userData) private userData; 
  mapping (string => st_cpotbData) public cpotbDataById;
  mapping (string => st_cdobData) cdobDataById;
  
  st_cpotbData[] public allCpotbData;
  st_cdobData[] public allCdobData;

  event evt_UserRegistered(address userAddr, string name, string instanceName, uint8 role);
  event evt_cpotbRequested(string senderName, address factoryAddr, string factoryName, en_jenisSediaan jenisSediaan, string cpotbId, uint timestampRequest);
  event evt_cpotbApproved(address bpomAddr, string receiverName, string factoryName, string cpotbNumber, uint timestampApprove);
  event evt_cdobRequested(string senderName, address pbfAddr, string pbfName, en_tipePermohonan tipePermohonan, string cdobId, uint timestampRequest);
  event evt_cdobApptoved(address bpomAddr, string receiverName, string pbfName, string cdobNumber, uint timestampApprove);

  function registerUser(
    string memory _name, 
    string memory _instanceName,
    address _userAddr,
    uint8 _userRole
  ) public {
    userData[_userAddr] = st_userData({
      name: _name,
      instanceName: _instanceName,
      userAddr: _userAddr
    });

    RoleManager.en_roles role = RoleManager.en_roles(uint8(_userRole));
    roleManager.assignRole(_userAddr, role);

    emit evt_UserRegistered(_userAddr, _name, _instanceName, uint8(role)); 
  }

  function getRegisteredUser(address _userAddr) public view returns (address, string memory, string memory, uint8) {
      require(roleManager.checkRegistration(_userAddr), "User is not registered"); 

      st_userData memory user = userData[_userAddr];
      RoleManager.en_roles role = roleManager.getRole(_userAddr);
       
      return (user.userAddr, user.name, user.instanceName, uint8(role)); 
  }

  function requestCpotb(
      string memory _instanceName,
      string memory _cpotbId,
      string memory _senderName,
      uint8 _jenisSediaan
  ) public onlyFactory {
      st_cpotbData memory newCpotbData = st_cpotbData({
          cpotbId: _cpotbId,
          senderName: _senderName,
          factoryAddr: msg.sender, 
          factoryName: _instanceName,
          jenisSediaan: en_jenisSediaan(_jenisSediaan), 
          status: en_statusCert.Pending,
          timestampRequest: block.timestamp,
          timestampApprove: 0,
          cpotbNumber: "",
          bpomAddr: address(0),
          receiverName: ""
      });
 
      cpotbDataById[_cpotbId] = newCpotbData;
      allCpotbData.push(newCpotbData); 

      emit evt_cpotbRequested(_senderName, msg.sender, _instanceName, en_jenisSediaan(_jenisSediaan), _cpotbId, block.timestamp);
  } 
 
  function approveCpotb(
    string memory _cpotbId,  
    string memory _cpotbNumber, 
    string memory _receiverName
  ) public onlyBPOM {
    st_cpotbData storage cpotbDatas = cpotbDataById[_cpotbId];
    require(cpotbDatas.status == en_statusCert.Pending, "CPOTB status must be pending!");
    
    cpotbDatas.status = en_statusCert.Approved;
    cpotbDatas.cpotbNumber = _cpotbNumber;
    cpotbDatas.timestampApprove = block.timestamp;
    cpotbDatas.bpomAddr = msg.sender;
    cpotbDatas.receiverName = _receiverName;

    for(uint i = 0; i < allCpotbData.length; i++){ 
      if (keccak256(abi.encodePacked(allCpotbData[i].cpotbId)) == keccak256(abi.encodePacked(_cpotbId))) {
        allCpotbData[i].status = en_statusCert.Approved;
        allCpotbData[i].cpotbNumber = _cpotbNumber;
        allCpotbData[i].timestampApprove = block.timestamp;
        allCpotbData[i].bpomAddr = msg.sender;
        allCpotbData[i].receiverName = _receiverName;
 
        break;
      } 
    } 

    emit evt_cpotbApproved(msg.sender, _receiverName, cpotbDatas.factoryName, _cpotbNumber, block.timestamp);
  }

  function getListCpotbByFactory(string memory _instanceName) 
    public view returns (
      uint8[] memory, 
      uint8[] memory, 
      uint256[] memory, 
      string[] memory) 
  {
      st_cpotbData[] memory cpotbDataArray = new st_cpotbData[](allCpotbData.length);
      uint length = 0;

      for (uint i = 0; i < allCpotbData.length; i++) {
          if (keccak256(abi.encodePacked(allCpotbData[i].factoryName)) == keccak256(abi.encodePacked(_instanceName))) {
              cpotbDataArray[length] = allCpotbData[i];
              length++;
          }
      }

      uint8[] memory jenisSediaanArray = new uint8[](length);
      string[] memory cpotbIdArray = new string[](length);
      uint8[] memory statusArray = new uint8[](length);
      uint256[] memory latestTimestampArray = new uint256[](length);

      for (uint i = 0; i < length; i++) {
          jenisSediaanArray[i] = uint8(cpotbDataArray[i].jenisSediaan);
          statusArray[i] = uint8(cpotbDataArray[i].status);
          cpotbIdArray[i] = cpotbDataArray[i].cpotbId;
          uint latest = cpotbDataArray[i].timestampApprove > cpotbDataArray[i].timestampRequest 
              ? cpotbDataArray[i].timestampApprove 
              : cpotbDataArray[i].timestampRequest;
          latestTimestampArray[i] = latest;

      }
      return (
        jenisSediaanArray, 
        statusArray, 
        latestTimestampArray, 
        cpotbIdArray
      );
  }
  
  function getListAllCpotb() 
    public view returns (
      uint8[] memory, 
      string[] memory, 
      uint8[] memory, 
      uint256[] memory, 
      string[] memory) 
  { 
    uint length = allCpotbData.length;

    uint8[] memory jenisSediaanArray = new uint8[](length);
    string[] memory cpotbIdArray = new string[](length);
    string[] memory factoryNameArray = new string[](length);
    uint8[] memory statusArray = new uint8[](length);
    uint256[] memory latestTimestampArray = new uint256[](length);

    for (uint i = 0; i < length; i++) {  
        jenisSediaanArray[i] = uint8(allCpotbData[i].jenisSediaan);
        statusArray[i] = uint8(allCpotbData[i].status);
        factoryNameArray[i] = allCpotbData[i].factoryName; 
        cpotbIdArray[i] = allCpotbData[i].cpotbId;
        uint latest = allCpotbData[i].timestampApprove > allCpotbData[i].timestampRequest 
            ? allCpotbData[i].timestampApprove 
            : allCpotbData[i].timestampRequest;
        latestTimestampArray[i] = latest; 
    }

    return (
      jenisSediaanArray, 
      factoryNameArray, 
      statusArray, 
      latestTimestampArray, 
      cpotbIdArray
    );  
  }

  function getListCpotbById(string memory _cpotbId) public view returns(st_cpotbData memory) {
    require(bytes(cpotbDataById[_cpotbId].cpotbId).length > 0, "No data found for this ID.");
    return cpotbDataById[_cpotbId];
  }

  function requestCdob(
      string memory _instanceName,
      string memory _cdobId,
      string memory _senderName,
      en_tipePermohonan _tipePermohonan
  ) public onlyPBF {
      st_cdobData memory newCdobData = st_cdobData({
          cdobId: _cdobId, 
          senderName: _senderName,
          pbfAddr: msg.sender, 
          pbfName: _instanceName, 
          tipePermohonan: _tipePermohonan, 
          status: en_statusCert.Pending,
          timestampRequest: block.timestamp,
          timestampApprove: 0,
          cdobNumber: "",
          bpomAddr: address(0),
          receiverName: ""
      }); 

      cdobDataById[_cdobId] = newCdobData;
      allCdobData.push(newCdobData); 

      emit evt_cdobRequested(_senderName, msg.sender, _instanceName, _tipePermohonan, _cdobId, block.timestamp);
  }  

  function approveCdob(
    string memory _cdobId,  
    string memory _cdobNumber, 
    string memory _receiverName
  ) public onlyBPOM {
    st_cdobData storage cdobDatas = cdobDataById[_cdobId];
    require(cdobDatas.status == en_statusCert.Pending, "CPOTB status must be pending!");
    
    cdobDatas.status = en_statusCert.Approved;
    cdobDatas.cdobNumber = _cdobNumber;
    cdobDatas.timestampApprove = block.timestamp;
    cdobDatas.bpomAddr = msg.sender;
    cdobDatas.receiverName = _receiverName;

    for(uint i = 0; i < allCdobData.length; i++){ 
      if (keccak256(abi.encodePacked(allCdobData[i].cdobId)) == keccak256(abi.encodePacked(_cdobId))) {
        allCdobData[i].status = en_statusCert.Approved;
        allCdobData[i].cdobNumber = _cdobNumber;
        allCdobData[i].timestampApprove = block.timestamp;
        allCdobData[i].bpomAddr = msg.sender;
        allCdobData[i].receiverName = _receiverName;
 
        break;  
      } 
    } 

    emit evt_cpotbApproved(msg.sender, _receiverName, cdobDatas.pbfName, _cdobNumber, block.timestamp);
  }

  function getListCdobByPbf(string memory _instanceName) 
    public view returns (
      uint8[] memory, 
      uint8[] memory, 
      uint256[] memory, 
      string[] memory) 
  {
      st_cdobData[] memory cdobDataArray = new st_cdobData[](allCdobData.length);
      uint length = 0; 

      for (uint i = 0; i < allCdobData.length; i++) {
          if (keccak256(abi.encodePacked(allCdobData[i].pbfName)) == keccak256(abi.encodePacked(_instanceName))) {
              cdobDataArray[length] = allCdobData[i];
              length++;
          } 
      }

      uint8[] memory tipePermohonan = new uint8[](length);
      string[] memory cdobIdArray = new string[](length);
      uint8[] memory statusArray = new uint8[](length);
      uint256[] memory latestTimestampArray = new uint256[](length);

      for (uint i = 0; i < length; i++) {
          tipePermohonan[i] = uint8(cdobDataArray[i].tipePermohonan);
          statusArray[i] = uint8(cdobDataArray[i].status);
          cdobIdArray[i] = cdobDataArray[i].cdobId;
          uint latest = cdobDataArray[i].timestampApprove > cdobDataArray[i].timestampRequest 
              ? cdobDataArray[i].timestampApprove 
              : cdobDataArray[i].timestampRequest;
          latestTimestampArray[i] = latest;

      }
      return (
        tipePermohonan, 
        statusArray, 
        latestTimestampArray, 
        cdobIdArray
      );
  }

  function getListAllCdob() 
    public view returns (
      uint8[] memory, 
      string[] memory, 
      uint8[] memory, 
      uint256[] memory, 
      string[] memory) 
  { 
    uint length = allCdobData.length;

    uint8[] memory tipePermohonanArray = new uint8[](length);
    string[] memory cdobIdArray = new string[](length);
    string[] memory pbfNameArray = new string[](length);
    uint8[] memory statusArray = new uint8[](length);
    uint256[] memory latestTimestampArray = new uint256[](length);

    for (uint i = 0; i < length; i++) {  
        tipePermohonanArray[i] = uint8(allCdobData[i].tipePermohonan);
        statusArray[i] = uint8(allCdobData[i].status);
        pbfNameArray[i] = allCdobData[i].pbfName; 
        cdobIdArray[i] = allCdobData[i].cdobId;
        uint latest = allCdobData[i].timestampApprove > allCdobData[i].timestampRequest 
            ? allCdobData[i].timestampApprove 
            : allCdobData[i].timestampRequest;
        latestTimestampArray[i] = latest;  
    }

    return (
      tipePermohonanArray, 
      pbfNameArray, 
      statusArray, 
      latestTimestampArray, 
      cdobIdArray
    );  
  }

  function getListCdobById(string memory _cdobId) public view returns(st_cdobData memory) {
    require(bytes(cdobDataById[_cdobId].cdobId).length > 0, "No data found for this ID.");

    return cdobDataById[_cdobId];
  } 

}
