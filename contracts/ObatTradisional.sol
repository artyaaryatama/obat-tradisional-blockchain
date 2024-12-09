// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./RoleManager.sol";
import "./MainSupplyChain.sol";
 
contract ObatTradisional {

  RoleManager public roleManager;
  MainSupplyChain public mainSupplyChain; 

  constructor(address _roleManagerAddr, address _mainSupplyChainAddr) {
    roleManager = RoleManager(_roleManagerAddr);
    mainSupplyChain = MainSupplyChain(_mainSupplyChainAddr);
  }

  modifier onlyFactory() { 
    require(roleManager.hasRole(msg.sender, RoleManager.en_roles.Factory), "Access restricted to Factory role");
    _;
  } 

  modifier onlyPBF() {
    require(roleManager.hasRole(msg.sender, RoleManager.en_roles.PBF), "Access restricted to PBF role");
    _;
  }

  modifier onlyRetailer() {
    require(roleManager.hasRole(msg.sender, RoleManager.en_roles.Retailer), "Access restricted to Retailer role");
    _;
  }

  modifier onlyBPOM() {
    require(roleManager.hasRole(msg.sender, RoleManager.en_roles.BPOM), "Access restricted to BPOM role");
    _;
  }

  enum en_nieStatus { inLocalProduction, RequestedNIE, ApprovedNIE }
  enum en_orderStatus { OrderPlaced , OrderShipped , OrderDelivered  }
  enum en_obatAvailability { ready, sold }
  enum en_roles { Factory, PBF, BPOM, Retailer }
  enum en_tipeProduk {obatTradisional, suplemenKesehatan}
  enum en_jenisSediaan { Tablet, Kapsul, KapsulLunak, SerbukOral, CairanOral, CairanObatDalam, CairanObatLuar, FilmStrip, Pil}

  struct st_obatDetails {
    string obatId;
    string merk;
    string namaProduk;
    string[] klaim;
    string kemasan; 
    string[] komposisi;
    en_tipeProduk tipeProduk;
    en_nieStatus obatStatus;   
    uint256 productionTimestamp;
    uint256 nieRequestDate;       
    uint256 nieApprovalDate;        
    string nieNumber; 
    string factoryInstanceName;
  }

  struct st_obatProduction {
    en_obatAvailability statusStok;
    string batchName;
    string obatId; // untuk collect data Factory, sm detail obat kyk nie, klaim dst
    string namaProduk;
    uint8 obatQuantity;
    string factoryInstanceNames;
    string[] obatIpfsHash;
  }

  st_obatDetails[] public allObatData;
  st_obatProduction[] public allProducedObat;

  mapping(string => address) public bpomAddresses;
  mapping(string => string) public bpomInstanceNames;
  mapping(string => string) public bpomUserNames;
  mapping(string => address) public factoryAddresses;
  mapping(string => string) public factoryUserNames;

  mapping (address => en_roles) public userRoles;
  mapping (string => st_obatDetails) public obatDetailsById;
  mapping (string => st_obatDetails) public obatDetailsByNameProduct;
  mapping (string => st_obatProduction) public obatProductionDetailsByBatchName;

  event evt_obatCreated(string namaProduk, string factoryInstanceNames, string factoryUserNames, address factoryAddresses, string kemasan, en_tipeProduk en_tipeProduk);
  event evt_nieRequested(string obatId, uint timestampRequested, string namaProduk);
  event evt_nieApproved(string nieNumber, string namaProduk, uint timestampApproved);
  event evt_addObatQuantity(string namaProduk, uint8 quantity, string batchName);

  function getJenisSediaanAvail(string memory _factoryInstanceName)
    public 
    view 
    returns(
      uint8[] memory
  ) {
     uint8[] memory approvedJenisSediaan = mainSupplyChain.hasApprovedCpotb(_factoryInstanceName); 

     return approvedJenisSediaan;
  } 

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
      obatStatus: en_nieStatus.inLocalProduction,
      // obatStatus: en_nieStatus.ApprovedNIE,
      productionTimestamp: block.timestamp,
      nieRequestDate: 0,
      nieApprovalDate: 0,  
      nieNumber: "", 
      // nieNumber: "TETSDFSDF", 
      factoryInstanceName: _factoryInstanceName
    });
 
    obatDetailsById[_obatId] = newObatDetails;
    obatDetailsByNameProduct[_namaProduk] = newObatDetails;
    allObatData.push(newObatDetails);

    // Save factory details
    factoryAddresses[_obatId] = _factoryAddr;
    factoryUserNames[_obatId] = _factoryUserName;

    emit evt_obatCreated(_namaProduk, _factoryInstanceName, _factoryUserName, _factoryAddr, _kemasan, en_tipeProduk(_tipeProduk));
  }
 
  function requestNie(string memory _obatId) 
    public onlyFactory {
    st_obatDetails storage obatDetails = obatDetailsById[_obatId];
    require(obatDetails.obatStatus == en_nieStatus.inLocalProduction, "Obat Tradisional status must be in local production!");

    obatDetails.nieRequestDate = block.timestamp;
    obatDetails.obatStatus = en_nieStatus.RequestedNIE;

    for(uint i=0; i<allObatData.length; i++){
      if (keccak256(abi.encodePacked(allObatData[i].obatId)) == keccak256(abi.encodePacked(_obatId))) {
        allObatData[i].nieRequestDate = block.timestamp;
        allObatData[i].obatStatus = en_nieStatus.RequestedNIE;

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
  ) public onlyBPOM{
    st_obatDetails storage obatDetails = obatDetailsById[_obatId];
    require(obatDetails.obatStatus == en_nieStatus.RequestedNIE, "Obat Tradisional status must be RequestedNIE!");

    obatDetails.nieApprovalDate = block.timestamp;
    obatDetails.obatStatus = en_nieStatus.ApprovedNIE;
    obatDetails.nieNumber = _nieNumber;

    // Save BPOM details
    bpomAddresses[_obatId] = _bpomAddr;
    bpomInstanceNames[_obatId] = _bpomInstanceName;
    bpomUserNames[_obatId] = _bpomUserName;

    for(uint i=0; i<allObatData.length; i++){
      if (keccak256(abi.encodePacked(allObatData[i].obatId)) == keccak256(abi.encodePacked(_obatId))) {
        allObatData[i].nieApprovalDate = block.timestamp;
        allObatData[i].obatStatus = en_nieStatus.ApprovedNIE;
        allObatData[i].nieNumber = _nieNumber;

        break;  
      }
    } 

    emit evt_nieApproved(_nieNumber, obatDetails.namaProduk, block.timestamp);
  }

  function addObatQuantity (
    string memory _obatId,
    string memory _batchName,
    string memory _factoryInstanceName,
    uint8 _obatQuantity,
    string[] memory _obatIpfsHash
  ) public onlyFactory
  {
    st_obatProduction memory newProduction = st_obatProduction({
      statusStok: en_obatAvailability.ready,
      batchName: _batchName,
      obatId: _obatId, 
      namaProduk: obatDetailsById[_obatId].namaProduk, 
      obatQuantity: _obatQuantity,  
      factoryInstanceNames: _factoryInstanceName,
      obatIpfsHash: _obatIpfsHash
    });

    allProducedObat.push(newProduction);   
    obatProductionDetailsByBatchName[newProduction.batchName] = newProduction;

    emit evt_addObatQuantity(newProduction.namaProduk, _obatQuantity, _batchName);
  }

  function getListAllObatNie()
    public
    view
    onlyBPOM
    returns (
      string[] memory obatIdArray,
      string[] memory namaProdukArray,
      string[] memory factoryInstanceArray,
      uint256[] memory latestTimestampArray, 
      uint8[] memory obatStatusArray 
    )
  {
    uint count = 0;
    for (uint i=0; i < allObatData.length; i++) {
      if (allObatData[i].obatStatus != en_nieStatus.inLocalProduction) {
        count++;
      }
    }

    obatIdArray = new string[](count);
    namaProdukArray = new string[](count);
    factoryInstanceArray = new string[](count);
    latestTimestampArray = new uint256[](count);
    obatStatusArray = new uint8[](count);

    uint index = 0;
    for (uint i= 0; i < allObatData.length; i++) {
      if (allObatData[i].obatStatus != en_nieStatus.inLocalProduction) {
        obatIdArray[index] = allObatData[i].obatId;
        namaProdukArray[index] = allObatData[i].namaProduk;
        factoryInstanceArray[index] = allObatData[i].factoryInstanceName;

        uint latest = allObatData[i].nieApprovalDate > allObatData[i].nieRequestDate
            ? allObatData[i].nieApprovalDate
            : allObatData[i].nieRequestDate;

        latestTimestampArray[index] = latest;
        obatStatusArray[index] = uint8(allObatData[i].obatStatus);

        index++;
      }
    }
  }

  function getListObatByFactory(string memory _factoryInstanceName)
    public 
    view 
    returns (
      string[] memory obatIdArray, // obatId
      string[] memory namaProdukArray, // namaProduk
      uint8[] memory obatStatusArray,  // obatStatus
      uint8[] memory tipeProdukArray  // tipe produk
  ){
    uint count = 0;

    // First, count the number of matching records to initialize arrays
    for (uint i = 0; i < allObatData.length; i++) {
        if (keccak256(abi.encodePacked(allObatData[i].factoryInstanceName)) == keccak256(abi.encodePacked(_factoryInstanceName))) {
            count++;
        }
    }

    // Initialize arrays with the correct size
    obatIdArray = new string[](count);
    namaProdukArray = new string[](count);
    obatStatusArray = new uint8[](count);
    tipeProdukArray = new uint8[](count);

    // Populate arrays with matching records
    uint index = 0;
    for (uint i = 0; i < allObatData.length; i++) {
        if (keccak256(abi.encodePacked(allObatData[i].factoryInstanceName)) == keccak256(abi.encodePacked(_factoryInstanceName))) {
          obatIdArray[index] = allObatData[i].obatId;
          namaProdukArray[index] = allObatData[i].namaProduk;
          obatStatusArray[index] = uint8(allObatData[i].obatStatus);
          tipeProdukArray[index] = uint8(allObatData[i].tipeProduk);
          index++;
        }
    }
  }

  // detail obat
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
  ){
    require(bytes(obatDetailsById[_obatId].obatId).length > 0, "No data found with this ID.");

    obatDetails = obatDetailsById[_obatId];
    factoryAddress = factoryAddresses[_obatId];
    factoryUserName = factoryUserNames[_obatId];
    factoryInstanceName = obatDetailsById[_obatId].factoryInstanceName;
    bpomAddress = bpomAddresses[_obatId];
    bpomInstanceName = bpomInstanceNames[_obatId];
    bpomUserName = bpomUserNames[_obatId];
  }

  function getListObatByNameProduct(string memory _namaProduk)
    public
    view
    returns (
      st_obatDetails memory obatDetails,
      address factoryAddress,
      string memory factoryUserName,
      address bpomAddress,
      string memory bpomInstanceName,
      string memory bpomUserName
  ) {
    require(bytes(obatDetailsByNameProduct[_namaProduk].obatId).length > 0, "No data found with this ID.");
 
    obatDetails = obatDetailsByNameProduct[_namaProduk];
    factoryAddress = factoryAddresses[_namaProduk];
    factoryUserName = factoryUserNames[_namaProduk]; 
    bpomAddress = bpomAddresses[_namaProduk];
    bpomInstanceName = bpomInstanceNames[_namaProduk];
    bpomUserName = bpomUserNames[_namaProduk];
  }

  // untuk create add obat quantity
  function getListAllApprovedObatNie(string memory _factoryInstanceName)
    public
    view
    onlyFactory
    returns(
      string[] memory obatIdArray,
      string[] memory namaProdukArray 
  ) {
      uint count = 0;
      for (uint i=0; i < allObatData.length; i++) {
        if (keccak256(abi.encodePacked(allObatData[i].factoryInstanceName)) == keccak256(abi.encodePacked(_factoryInstanceName))) {
          if (allObatData[i].obatStatus == en_nieStatus.ApprovedNIE) {
            count++;
          }

        }
      }

      obatIdArray = new string[](count);
      namaProdukArray = new string[](count);

      uint index = 0;
      for (uint i= 0; i < allObatData.length; i++) {
        if (keccak256(abi.encodePacked(allObatData[i].factoryInstanceName)) == keccak256(abi.encodePacked(_factoryInstanceName))) {
          if (allObatData[i].obatStatus == en_nieStatus.ApprovedNIE) {
            obatIdArray[index] = allObatData[i].obatId;
            namaProdukArray[index] = allObatData[i].namaProduk;

            index++;
          }
        }
      }

    }
 
  // menambahkan quantity agar bisa di ordder ADA BUG DISINI CEK NOTION!! 
  // producedObat nama functionnya
  function getListProducedObat(
    string memory _namaProduk,
    string memory _batchName,
    string memory _obatId,
    uint8 _obatQuantity, 
    string  memory _factoryInstanceName,
    string[] memory _obatIpfsHash
  ) public onlyFactory {

    require (_obatQuantity == _obatIpfsHash.length, "Quantity does not match the number of IDs");

      if (keccak256(abi.encodePacked(obatProductionDetailsByBatchName[_batchName].namaProduk)) == keccak256(abi.encodePacked(_namaProduk))) {
          obatProductionDetailsByBatchName[_batchName].obatQuantity = _obatQuantity;
          obatProductionDetailsByBatchName[_batchName].obatIpfsHash = _obatIpfsHash;

          for(uint i=0; i<allProducedObat.length; i++){
            if (keccak256(abi.encodePacked(allProducedObat[i].obatId)) == keccak256(abi.encodePacked(_obatId))) {
              allProducedObat[i].obatQuantity = _obatQuantity;
              allProducedObat[i].obatIpfsHash = _obatIpfsHash; 
              break; 
          }
    } 
          
      } else {
          st_obatProduction memory newProduction = st_obatProduction({
            statusStok: en_obatAvailability.ready, 
            batchName: _batchName,
            obatId: _obatId,
            namaProduk: _namaProduk,
            obatQuantity: _obatQuantity,
            factoryInstanceNames: _factoryInstanceName,
            obatIpfsHash: _obatIpfsHash
          });
      
          obatProductionDetailsByBatchName[_batchName] = newProduction;  
          allProducedObat.push(newProduction); 
      }


    emit evt_addObatQuantity(_namaProduk, _obatQuantity, _batchName);
     
  } 

  function getListAllProducedObatByFactory( string memory _factoryInstanceName )
    public
    onlyFactory
    view
    returns (
      string[] memory obatIdArray,
      string[] memory namaProdukArray,
      uint8[] memory obatQuantityArray,
      string[] memory batchNameArray
    ) { 
      uint count = 0;
      for (uint i=0; i < allProducedObat.length; i++) {
        if (keccak256(abi.encodePacked(allProducedObat[i].factoryInstanceNames)) == keccak256(abi.encodePacked(_factoryInstanceName))) {
            count++;
        }
      }
      
      obatIdArray = new string[](count);
      namaProdukArray = new string[](count);
      obatQuantityArray = new uint8[](count);
      batchNameArray = new string[](count);


      uint index = 0;
      
      for (uint i= 0; i < allProducedObat.length; i++) {
        if (keccak256(abi.encodePacked(allProducedObat[i].factoryInstanceNames)) == keccak256(abi.encodePacked(_factoryInstanceName))){

        obatIdArray[index] = allProducedObat[i].obatId;
        namaProdukArray[index] = allProducedObat[i].namaProduk;
        obatQuantityArray[index] = allProducedObat[i].obatQuantity;
        batchNameArray[index] = allProducedObat[i].batchName;
        index++;
        }
      }  
   
  }

  // untuk di list obat yg bisa di order pbf -> harusnya punya status sold sm ready stock
  // supaya ketika pbf udh bbeli obat produced obatnya pindah ke halaman lain (untuk pbf)
  function getAllProducedObat() 
    public 
    view 
    returns (
      st_obatProduction[] memory
  ) {

    if (roleManager.hasRole(msg.sender, RoleManager.en_roles.PBF)) {
      st_obatProduction[] memory obatProductionClean;
      uint count = 0;

      for (uint256 i = 0; i < allProducedObat.length; i++) {
        if (allProducedObat[i].statusStok == en_obatAvailability.ready) {
          count++;
        }
      }

      obatProductionClean = new st_obatProduction[](count);
      uint index = 0;

      for (uint256 i = 0; i < allProducedObat.length; i++) {
        if (allProducedObat[i].statusStok == en_obatAvailability.ready) {
          obatProductionClean[index] = st_obatProduction({
            statusStok: allProducedObat[i].statusStok,
            batchName: allProducedObat[i].batchName,
            obatId: allProducedObat[i].obatId,
            namaProduk: allProducedObat[i].namaProduk,
            obatQuantity: allProducedObat[i].obatQuantity,
            factoryInstanceNames: allProducedObat[i].factoryInstanceNames, 
            obatIpfsHash: new string[](0)       
            });
          index++;
        }
      }
      return obatProductionClean;

    } else if (roleManager.hasRole(msg.sender, RoleManager.en_roles.Factory)) {
        return allProducedObat;

    } else {
        return new st_obatProduction[](0);
    }
  
  }

  function getDetailProducedObat(string memory _batchName) 
    public 
    view 
    returns (
      uint8 obatQuantity, 
      string[] memory obatIpfsHash,
      uint8 statusStok
  ) {
    require(bytes(obatProductionDetailsByBatchName[_batchName].obatId).length > 0, "No data found with this ID.");

    obatQuantity = obatProductionDetailsByBatchName[_batchName].obatQuantity;
    statusStok = uint8(obatProductionDetailsByBatchName[_batchName].statusStok);
    
    if (roleManager.hasRole(msg.sender, RoleManager.en_roles.PBF)) {
      obatIpfsHash = new string[](0);

    } else if (roleManager.hasRole(msg.sender, RoleManager.en_roles.Factory)) {
      obatIpfsHash = obatProductionDetailsByBatchName[_batchName].obatIpfsHash;
    }
  }

  function updateObatProductionDetails(string memory _batchName, string[] memory _obatIpfsHash) 
    public {
    obatProductionDetailsByBatchName[_batchName].statusStok = ObatTradisional.en_obatAvailability.sold;
    obatProductionDetailsByBatchName[_batchName].obatIpfsHash = _obatIpfsHash;

    for(uint i=0; i < allProducedObat.length; i++){
      if(keccak256(abi.encodePacked(allProducedObat[i].batchName)) == keccak256(abi.encodePacked(_batchName))){
        allProducedObat[i].obatIpfsHash = _obatIpfsHash;
        allProducedObat[i].statusStok = ObatTradisional.en_obatAvailability.sold;

        break;
      }
    }
  }



}