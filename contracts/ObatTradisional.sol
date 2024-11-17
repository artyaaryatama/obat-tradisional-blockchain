// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
 
contract ObatTradisional {

  address public owner; 

  constructor() {
    owner = msg.sender;
  }

  modifier onlyFactory() { 
    require(userRoles[msg.sender] == en_roles.Pabrik, "Access restricted to Factory role");
    _;
  }

  modifier onlyBPOM() {
    require(userRoles[msg.sender] == en_roles.BPOM, "Access restricted to BPOM role");
    _;
  }

  enum en_obatStatus { inLocalProduction, Requested, Approved }
  enum en_orderStatus { inProduction, inShipment, inDelivery }
  enum en_roles { Pabrik, PBF, BPOM, Retailer }
  enum en_tipeProduk {obatTradisional, suplemenKesehatan}

  struct st_obatDetails {
    string obatId;
    string merk;
    string namaProduk;
    string[] klaim;
    string kemasan; 
    string[] komposisi;
    en_tipeProduk tipeProduk;
    en_obatStatus obatStatus;      
    uint256 nieRequestDate;       
    uint256 nieApprovalDate;        
    string nieNumber; 
  }

  st_obatDetails[] public allObatData;
  mapping (address => en_roles) public userRoles;
  mapping (string => st_obatDetails) public obatDetailsById;

  // New mappings for BPOM and Factory Details
  mapping(string => address) public bpomAddresses;
  mapping(string => string) public bpomInstanceNames;
  mapping(string => string) public bpomUserNames;
  mapping(string => address) public factoryAddresses;
  mapping(string => string) public factoryInstanceNames;
  mapping(string => string) public factoryUserNames;

  event evt_obatCreated(string namaProduk, string factoryInstanceNames, string factoryUserNames, address factoryAddresses, string kemasan, en_tipeProduk en_tipeProduk);
  event evt_nieRequested(string obatId, uint timestampRequested, string namaProduk);
  event evt_nieApproved(string nieNumber, string namaProduk);

  function createObat(
    string memory _obatId,
    string memory _merk,
    string memory _namaProduk,
    string[] memory _klaim,
    string memory _kemasan,
    string[] memory _komposisi,
    address _factoryAddr,
    string memory _factoryInstanceName,
    string memory _factoryUserName,
    en_tipeProduk _tipeProduk
  ) public onlyFactory {
    st_obatDetails memory newObatDetails = st_obatDetails({
      obatId: _obatId,
      merk: _merk,
      namaProduk: _namaProduk,
      klaim: _klaim, 
      kemasan: _kemasan,
      komposisi: _komposisi,
      tipeProduk: _tipeProduk,
      obatStatus: en_obatStatus.inLocalProduction,
      nieRequestDate: 0,
      nieApprovalDate: 0,
      nieNumber: ""
    });
 
    obatDetailsById[_obatId] = newObatDetails;
    allObatData.push(newObatDetails);

    // Save factory details
    factoryAddresses[_obatId] = _factoryAddr;
    factoryInstanceNames[_obatId] = _factoryInstanceName;
    factoryUserNames[_obatId] = _factoryUserName;

    emit evt_obatCreated(_namaProduk, _factoryInstanceName, _factoryUserName, _factoryAddr, _kemasan, en_tipeProduk(_tipeProduk));
  }

  function requestNie(string memory _obatId) public onlyFactory {
    st_obatDetails storage obatDetails = obatDetailsById[_obatId];
    require(obatDetails.obatStatus == en_obatStatus.inLocalProduction, "Obat Tradisional status must be in local production!");

    obatDetails.nieRequestDate = block.timestamp;
    obatDetails.obatStatus = en_obatStatus.Requested;

    for(uint i=0; i<allObatData.length; i++){
      if (keccak256(abi.encodePacked(allObatData[i].obatId)) == keccak256(abi.encodePacked(_obatId))) {
        allObatData[i].nieRequestDate = block.timestamp;
        allObatData[i].obatStatus = en_obatStatus.Requested;

        break;
      }
    }

    emit evt_nieRequested(_obatId, block.timestamp, obatDetails.namaProduk);
  }

  function approveNie(
    string memory _obatId,
    address _bpomAddr,
    string memory _bpomInstanceName,
    string memory _bpomUserName,
    string memory _nieNumber
  ) public {
    st_obatDetails storage obatDetails = obatDetailsById[_obatId];
    require(obatDetails.obatStatus == en_obatStatus.Requested, "Obat Tradisional status must be requested!");

    obatDetails.nieApprovalDate = block.timestamp;
    obatDetails.obatStatus = en_obatStatus.Approved;
    obatDetails.nieNumber = _nieNumber;

    // Save BPOM details
    bpomAddresses[_obatId] = _bpomAddr;
    bpomInstanceNames[_obatId] = _bpomInstanceName;
    bpomUserNames[_obatId] = _bpomUserName;

    for(uint i=0; i<allObatData.length; i++){
      if (keccak256(abi.encodePacked(allObatData[i].obatId)) == keccak256(abi.encodePacked(_obatId))) {
        allObatData[i].nieApprovalDate = block.timestamp;
        allObatData[i].obatStatus = en_obatStatus.Approved;
        allObatData[i].nieNumber = _nieNumber;

        break;  
      }
    }

    emit evt_nieApproved(_nieNumber, obatDetails.namaProduk);
  }
  
  function getListObatByFactory(string memory _factoryInstanceName)
      public view returns (
          string[] memory, // obatId
          string[] memory, // namaProduk
          uint8[] memory,  // obatStatus
          uint8[] memory  // tipe produk
      )
  {
    uint count = 0;

    // First, count the number of matching records to initialize arrays
    for (uint i = 0; i < allObatData.length; i++) {
        if (keccak256(abi.encodePacked(factoryInstanceNames[allObatData[i].obatId])) == keccak256(abi.encodePacked(_factoryInstanceName))) {
            count++;
        }
    }

    // Initialize arrays with the correct size
    string[] memory obatIdArray = new string[](count);
    string[] memory namaProdukArray = new string[](count);
    uint8[] memory obatStatusArray = new uint8[](count);
    uint8[] memory tipeProdukArray = new uint8[](count);

    // Populate arrays with matching records
    uint index = 0;
    for (uint i = 0; i < allObatData.length; i++) {
        if (keccak256(abi.encodePacked(factoryInstanceNames[allObatData[i].obatId])) == keccak256(abi.encodePacked(_factoryInstanceName))) {
            obatIdArray[index] = allObatData[i].obatId;
            namaProdukArray[index] = allObatData[i].namaProduk;
            obatStatusArray[index] = uint8(allObatData[i].obatStatus);
            tipeProdukArray[index] = uint8(allObatData[i].tipeProduk);
            index++;
        }
    }

    return (
        obatIdArray,
        namaProdukArray,
        obatStatusArray, 
        tipeProdukArray
    );
  }

  function getListAllObatNie()
      public
      view
      returns (
          string[] memory,
          string[] memory,
          string[] memory, 
          uint256[] memory, 
          uint8[] memory 
      )
  {
      uint count = 0;
      for (uint i=0; i < allObatData.length; i++) {
          if (allObatData[i].obatStatus != en_obatStatus.inLocalProduction) {
              count++;
          }
      }

      string[] memory obatIdArray = new string[](count);
      string[] memory namaProdukArray = new string[](count);
      string[] memory factoryInstanceNameArray = new string[](count);
      uint256[] memory latestTimestampArray = new uint256[](count);
      uint8[] memory obatStatusArray = new uint8[](count);

      uint index = 0;
      for (uint i= 0; i < allObatData.length; i++) {
          if (allObatData[i].obatStatus != en_obatStatus.inLocalProduction) {
              obatIdArray[index] = allObatData[i].obatId;
              namaProdukArray[index] = allObatData[i].namaProduk;
              factoryInstanceNameArray[index] = factoryInstanceNames[allObatData[i].obatId];
              
              uint latest = allObatData[i].nieApprovalDate > allObatData[i].nieRequestDate
                  ? allObatData[i].nieApprovalDate
                  : allObatData[i].nieRequestDate;

              latestTimestampArray[index] = latest;
              obatStatusArray[index] = uint8(allObatData[i].obatStatus);

              index++;
          }
      }

      return (
          obatIdArray,
          namaProdukArray,
          factoryInstanceNameArray,
          latestTimestampArray,
          obatStatusArray
      );
  }


  function getListObatById(string memory _obatId)
      public
      view
      returns (
          st_obatDetails memory obatDetails,
          address factoryAddress,
          string memory factoryInstanceName,
          string memory factoryUserName,
          address bpomAddress,
          string memory bpomInstanceName,
          string memory bpomUserName
      )
  {
      require(bytes(obatDetailsById[_obatId].obatId).length > 0, "No data found with this ID.");

      obatDetails = obatDetailsById[_obatId];
      factoryAddress = factoryAddresses[_obatId];
      factoryInstanceName = factoryInstanceNames[_obatId];
      factoryUserName = factoryUserNames[_obatId];
      bpomAddress = bpomAddresses[_obatId];
      bpomInstanceName = bpomInstanceNames[_obatId];
      bpomUserName = bpomUserNames[_obatId];

      return (
        obatDetails,
        factoryAddress,
        factoryInstanceName,
        factoryUserName,
        bpomAddress,
        bpomInstanceName,
        bpomUserName
      );
  }

  function getRole(address user) public view returns (en_roles, address) {
      return (userRoles[user], msg.sender);
  }
}