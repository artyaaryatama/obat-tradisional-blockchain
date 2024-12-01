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
    require(roleManager.hasRole(msg.sender, RoleManager.en_roles.Pabrik), "Access restricted to Pabrik role");
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
  enum en_roles { Pabrik, PBF, BPOM, Retailer }
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
    uint256 nieRequestDate;       
    uint256 nieApprovalDate;        
    string nieNumber; 
  }

  struct st_obatProduction {
    en_obatAvailability statusStok;
    string batchName;
    string obatId; // untuk collect data pabrik, sm detail obat kyk nie, klaim dst
    string namaProduk;
    uint8 obatQuantity;
    string factoryInstanceNames;
    string[] obatIpfsHash;
  }

  struct st_orderObat {
    string orderId;
    string namaProduk;
    string obatIdProduk;
    uint8 orderQuantity;
    string senderInstanceName;
    address senderInstanceAddr;
    string targetInstanceName; // yg punya obatnya
    en_orderStatus statusOrder; 
    uint latestTimestamp;
    string[] orderObatIpfsHash;
  }

  st_obatDetails[] public allObatData;
  st_obatProduction[] public allProducedObat;
  st_orderObat[] public allOrderedObat;

  mapping(string => address) public bpomAddresses;
  mapping(string => string) public bpomInstanceNames;
  mapping(string => string) public bpomUserNames;
  mapping(string => address) public factoryAddresses;
  mapping(string => string) public factoryInstanceNames;
  mapping(string => string) public factoryUserNames;

  mapping (address => en_roles) public userRoles;
  mapping (string => st_obatDetails) public obatDetailsById;
  mapping (string => st_obatDetails) public obatDetailsByNameProduct;
  mapping (string => st_obatProduction) public obatProductionDetailsByBatchName;

  mapping (string => st_orderObat) public orderObatById; 

  event evt_obatCreated(string namaProduk, string factoryInstanceNames, string factoryUserNames, address factoryAddresses, string kemasan, en_tipeProduk en_tipeProduk);
  event evt_nieRequested(string obatId, uint timestampRequested, string namaProduk);
  event evt_nieApproved(string nieNumber, string namaProduk);
  event evt_obatProduced(string namaProduk, uint8 quantity, string batchNamee);
  event evt_obatOrdered(string namaProduk, uint8 quantity, string orderId, string senderInstanceName, address senderAddr, string targetInstanceName, uint latestTimestamp );

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
      // obatStatus: en_nieStatus.inLocalProduction,
      obatStatus: en_nieStatus.ApprovedNIE,
      nieRequestDate: 0,
      nieApprovalDate: 0,  
      // nieNumber: ""
      nieNumber: "TETSDFSDF"
    });
 
    obatDetailsById[_obatId] = newObatDetails;
    obatDetailsByNameProduct[_namaProduk] = newObatDetails;
    allObatData.push(newObatDetails);

    // Save factory details
    factoryAddresses[_obatId] = _factoryAddr;
    factoryInstanceNames[_obatId] = _factoryInstanceName;
    factoryUserNames[_obatId] = _factoryUserName;
      
    st_obatProduction memory newProduction = st_obatProduction({
      statusStok: en_obatAvailability.ready,
      batchName: "BN-20241125-sdfz-X45A",
      obatId: _obatId, 
      namaProduk: _namaProduk, 
      obatQuantity: 15, 
      factoryInstanceNames: _factoryInstanceName,
      obatIpfsHash: new string[](15)
    });

    newProduction.obatIpfsHash[0] = "QmZpjQfDeDRPRSrH4W413GwD5Wbb9UMG5imqpfqsPsAxm2";
    newProduction.obatIpfsHash[1] = "QmXVUENczfcBarBtQ2wiDtLmZV2Pa78n2kmGDpj9dje1Yn";
    newProduction.obatIpfsHash[2] = "Qmd6Qvb1oXad1wzZu5J6XrYdnGp9Fj3tQueVss9bwGVHST";
    newProduction.obatIpfsHash[3] = "QmVU2UxMrJeqhrnQDPJirauFsWs6J7XLDiDQKix8HVdETs";
    newProduction.obatIpfsHash[4] = "QmdmR4Pfnn5gCD5XaawvrviXmE3JsiaxRF3eNrzhY1CBU7";
    newProduction.obatIpfsHash[5] = "QmQrTrfggKT76nRZV8rBjcaToWfHCMzWqY4yWRpW3SD6Yg";
    newProduction.obatIpfsHash[6] = "QmQXHXQEPP2PnFbQ66hSg2ZMNd6SSzfFKCJHAEisYu822V";
    newProduction.obatIpfsHash[7] = "QmUECiX7qHiH8h4kr2u4h6qaiG8fSj9ZMtcBGgEHCUym1L";
    newProduction.obatIpfsHash[8] = "QmUwZrt9bLjnhMLCi4CFcaTvYgZaWUJRcZDKqs9c3mqyHy";
    newProduction.obatIpfsHash[9] = "QmNNuwZAUH6gX8hTck6oha4NjMhEc75xvyGCq2LpFDtYCG";
    newProduction.obatIpfsHash[10] = "QmabhxtbKye1eoGPMfdazWC5mTJsKAtUcFbShf3ZcmcmWN";
    newProduction.obatIpfsHash[11] = "QmeRhokhkG61Bi3xemD9gcZAHK8k6cu8yCNATEcrUgs4Ty";
    newProduction.obatIpfsHash[12] = "QmamRkPNMBXtpnhuX4Esb8RQm9NNpwC3zdAMTarPwWriSe";
    newProduction.obatIpfsHash[13] = "QmVk7tgpUscPGV2giKwy5KAJyCNPnSDS5dMKC3mSF95zNo";
    newProduction.obatIpfsHash[14] = "QmTdsJND7BdPAKJZD8HJpp3sTEY7DtgWo6roTtktJqhsr2";
    
    allProducedObat.push(newProduction);   
    obatProductionDetailsByBatchName[newProduction.batchName] = newProduction;

    emit evt_obatCreated(_namaProduk, _factoryInstanceName, _factoryUserName, _factoryAddr, _kemasan, en_tipeProduk(_tipeProduk));
  }
 
  function requestNie(string memory _obatId) public onlyFactory {
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

    emit evt_nieApproved(_nieNumber, obatDetails.namaProduk);
  }

  // menambahkan quantity agar bisa di ordder
  function addQuantityObat(
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


    emit evt_obatProduced(_namaProduk, _obatQuantity, _batchName);
     
  } 

  // untuk ditampilkan di halaman list NIE (karena di page ini yg ada nie sm nggak ada nie nya jdi satu)
  function getListObatByFactory(string memory _factoryInstanceName)
    public 
    view 
    returns (
      string[] memory, // obatId
      string[] memory, // namaProduk
      uint8[] memory,  // obatStatus
      uint8[] memory  // tipe produk
  ){
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
    factoryInstanceName = factoryInstanceNames[_obatId];
    factoryUserName = factoryUserNames[_obatId];
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
      string memory factoryInstanceName,
      string memory factoryUserName,
      address bpomAddress,
      string memory bpomInstanceName,
      string memory bpomUserName
  ) {
    require(bytes(obatDetailsByNameProduct[_namaProduk].obatId).length > 0, "No data found with this ID.");
 
    obatDetails = obatDetailsByNameProduct[_namaProduk];
    factoryAddress = factoryAddresses[_namaProduk];
    factoryInstanceName = factoryInstanceNames[_namaProduk];
    factoryUserName = factoryUserNames[_namaProduk];
    bpomAddress = bpomAddresses[_namaProduk];
    bpomInstanceName = bpomInstanceNames[_namaProduk];
    bpomUserName = bpomUserNames[_namaProduk];
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
            factoryInstanceNames: "",
            obatIpfsHash: new string[](0)       
            });
          index++;
        }
      }
      return obatProductionClean;

    } else if (roleManager.hasRole(msg.sender, RoleManager.en_roles.Pabrik)) {
        return allProducedObat;

    } else {
        return new st_obatProduction[](0);
    }
  
  }

  // untuk menampilkan quantity + ipfshash di modal order / produksi
  function getDetailProducedObat(string memory _batchName) 
    public 
    view 
    returns (
      uint8 obatQuantity, 
      string[] memory obatIpfsHash
  ) {
    require(bytes(obatProductionDetailsByBatchName[_batchName].obatId).length > 0, "No data found with this ID.");

    obatQuantity = obatProductionDetailsByBatchName[_batchName].obatQuantity;
    
    if (roleManager.hasRole(msg.sender, RoleManager.en_roles.PBF)) {
      obatIpfsHash = new string[](0);

    } else if (roleManager.hasRole(msg.sender, RoleManager.en_roles.Pabrik)) {
      obatIpfsHash = obatProductionDetailsByBatchName[_batchName].obatIpfsHash;
    }
  }

  // order dont need the ipfsHash, later after the order is accepted, we will added the ipfsfhash
  function orderObat(
    string memory _obatIdProduk,
    string memory _orderId,
    string memory _namaProduk,
    uint8 _orderQuantity,
    address _senderAddr,
    string memory _senderInstanceName,
    string memory _targetInstanceName
  ) public {

    st_orderObat memory newOrderPbf = st_orderObat({
      orderId: _orderId, 
      namaProduk: _namaProduk,
      obatIdProduk: _obatIdProduk,
      orderQuantity: _orderQuantity,
      senderInstanceName: _senderInstanceName,
      senderInstanceAddr: _senderAddr,
      targetInstanceName: _targetInstanceName,
      statusOrder: en_orderStatus.OrderPlaced,
      latestTimestamp: block.timestamp,
      orderObatIpfsHash: new string[](0)  
    });
    
    orderObatById[_orderId] = newOrderPbf;
    allOrderedObat.push(newOrderPbf);

    emit evt_obatOrdered(_namaProduk, _orderQuantity, _orderId, _senderInstanceName, _senderAddr, _targetInstanceName, block.timestamp); 
  } 

  // get lsit all ordered for pabrik and pbf
  function getListAllOrderedObatFromTarget(string memory _targetInstanceName) 
    public  
    view 
    returns (
    string[] memory orderIdArray,
    string[] memory namaProdukArray,
    uint8[] memory statusOrderArray,
    uint8[] memory obatQuantityArray, 
    string[] memory obatIdProdukArray
  ) {

    uint count = 0;

    for(uint i = 0; i < allOrderedObat.length; i++){
      if(keccak256(abi.encodePacked(allOrderedObat[i].targetInstanceName)) == keccak256(abi.encodePacked(_targetInstanceName))){
        count++; 
      }
    }

    orderIdArray = new string[](count);
    namaProdukArray = new string[](count);
    statusOrderArray = new uint8[](count);
    obatQuantityArray = new uint8[](count);
    obatIdProdukArray = new string[](count);

    uint index = 0; 

    for(uint i = 0; i<allOrderedObat.length; i++){
      if(keccak256(abi.encodePacked(allOrderedObat[i].targetInstanceName)) == keccak256(abi.encodePacked(_targetInstanceName))) {
        orderIdArray[index] = allOrderedObat[i].orderId;
        namaProdukArray[index] = allOrderedObat[i].namaProduk;
        statusOrderArray[index] = uint8(allOrderedObat[i].statusOrder);
        obatQuantityArray[index] = allOrderedObat[i].orderQuantity;
        obatIdProdukArray[index] = allOrderedObat[i].obatIdProduk;
 
        index++;
      }
    }
  }  

  // get lsit all ordered FROM retailer and pbf
  function getListAllOrderedObatFromSender(string memory _senderInstanceName) 
    public  
    view 
    returns (
    string[] memory orderIdArray,
    string[] memory namaProdukArray,
    uint8[] memory statusOrderArray,
    uint8[] memory obatQuantityArray,
    string[] memory obatIdProdukArray
  ) {

    uint count = 0;

    for(uint i = 0; i < allOrderedObat.length; i++){
      if(keccak256(abi.encodePacked(allOrderedObat[i].senderInstanceName)) == keccak256(abi.encodePacked(_senderInstanceName))){
        count++; 
      }
    }

    orderIdArray = new string[](count);
    namaProdukArray = new string[](count);
    statusOrderArray = new uint8[](count);
    obatQuantityArray = new uint8[](count);
    obatIdProdukArray = new string[](count);

    uint index = 0; 

    for(uint i = 0; i<allOrderedObat.length; i++){
      if(keccak256(abi.encodePacked(allOrderedObat[i].senderInstanceName)) == keccak256(abi.encodePacked(_senderInstanceName))) {
        orderIdArray[index] = allOrderedObat[i].orderId;
        namaProdukArray[index] = allOrderedObat[i].namaProduk;
        statusOrderArray[index] = uint8(allOrderedObat[i].statusOrder);
        obatQuantityArray[index] = allOrderedObat[i].orderQuantity;
        obatIdProdukArray[index] = allOrderedObat[i].obatIdProduk;
 
        index++;
      }
    }
  }

  // GET DETAIL PER ORDER ID ipfs and quantity
  function getDetailOrderedObat(string memory _orderId)
    public
    view
    returns(
      uint8 orderQuantity,
      string memory senderInstanceName,
      address senderInstanceAddr,
      uint8 statusOrder,
      uint latestTimestamp,
      string memory targetInstanceName,
      string[] memory orderObatIpfsHash

  ){
    require(bytes(orderObatById[_orderId].orderId).length > 0, "No data found with this ID.");

    orderQuantity = orderObatById[_orderId].orderQuantity;  
    senderInstanceName = orderObatById[_orderId].senderInstanceName; 
    senderInstanceAddr = orderObatById[_orderId].senderInstanceAddr; 
    latestTimestamp = orderObatById[_orderId].latestTimestamp;
    targetInstanceName = orderObatById[_orderId].targetInstanceName;
    statusOrder = uint8(orderObatById[_orderId].statusOrder);
    orderObatIpfsHash = orderObatById[_orderId].orderObatIpfsHash; 
  }   
 
  // create function getListOrderObatbyPBF, getLIstOrderObatdri factory, get list order obat dri retailer, acceptOrder
  // oh iya aku belum update ipfs hash nya (berarti aku harus hapus getAllproducedObat yg pbf ya, krn aku butuh ipfs lama buat dimasukin ke data ipfs baru)

  // create new function but return all data's order


}