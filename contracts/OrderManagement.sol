// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./RoleManager.sol";
import "./ObatTradisional.sol";
 
contract OrderManagement {

  ObatTradisional public obatTradisional;
  RoleManager public roleManager;

  constructor(address _obatTradisionalAddr, address _roleManagerAddr) {
    roleManager = RoleManager(_roleManagerAddr);
    obatTradisional = ObatTradisional(_obatTradisionalAddr);
  }

  enum en_orderStatus { OrderPlaced , OrderShipped , OrderDelivered  }
  enum en_obatAvailability { ready, sold }

  struct st_orderObat {
    string orderId;
    string namaProduk;
    string obatIdProduk;
    string batchName;
    uint8 orderQuantity;
    string senderInstanceName;
    string targetInstanceName;
    en_orderStatus statusOrder; 
    uint timestampOrder;
    uint timestampShipped;
    uint timestampComplete;
    string[] orderObatIpfsHash;
  }

  st_orderObat[] public allOrderedObat;

  // mapping ini bisa akupakai juga buat lihat sender isntance pbf sama retailer, jadi aku harus simpan orderid juga di ipfs, its cheaper than creating new mapping for storing the address dan malah bikin makin mbulet wkwk
  mapping (string => st_orderObat) public orderObatById;
  mapping(string => address[]) public orderSenderInstanceAddress;
  mapping(string => address[]) public orderRetailerInstanceAddress;

  event evt_obatOrdered(string namaProduk, uint8 quantity, string orderId, string senderInstanceName, string targetInstanceName, uint latestTimestamp );
  event evt_updateOrder(string namaProduk, string batchName, string targetInstance, string senderInstance, uint8 quantity, uint latestTimestamp);

  
  function getListAllProducedObatByFactory( string memory _factoryInstanceName )
    public
    view
    returns (
      string[] memory obatIdArray,
      string[] memory namaProdukArray,
      uint8[] memory obatQuantityArray,
      string[] memory batchNameArray
    ) { 
      ObatTradisional.st_obatProduction[] memory allProducedObat = obatTradisional.getAllProducedObatArray();

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
  function getAllProducedObatArray() 
    public 
    view 
    returns (
      ObatTradisional.st_obatProduction[] memory 
  ) {

    ObatTradisional.st_obatProduction[] memory allProducedObat = obatTradisional.getAllProducedObatArray();

    if (roleManager.hasRole(msg.sender, RoleManager.en_roles.PBF)) {
      ObatTradisional.st_obatProduction[] memory obatProductionClean;
      uint count = 0;

      for (uint256 i = 0; i < allProducedObat.length; i++) {
        if (allProducedObat[i].statusStok == ObatTradisional.en_obatAvailability.ready) {
          count++;
        } 
      }

      obatProductionClean = new ObatTradisional.st_obatProduction[](count);
      uint index = 0;

      for (uint256 i = 0; i < allProducedObat.length; i++) {
        if (allProducedObat[i].statusStok == ObatTradisional.en_obatAvailability.ready) {
          obatProductionClean[index] = ObatTradisional.st_obatProduction({
            statusStok: allProducedObat[i].statusStok,
            batchName: allProducedObat[i].batchName, 
            obatId: allProducedObat[i].obatId,
            namaProduk:allProducedObat[i].namaProduk,
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
        return new ObatTradisional.st_obatProduction[](0);
    }
  
  }

  // order dont need the ipfsHash, later after the order is accepted, we will added the ipfsfhash
  function createOrder(
    string memory _obatIdProduk,
    string memory _orderId,
    string memory _namaProduk,
    uint8 _orderQuantity,
    string memory _senderInstanceName,
    address _senderInstanceAddr,
    string memory _targetInstanceName
  ) public {

    st_orderObat memory newOrderPbf = st_orderObat({
      orderId: _orderId, 
      namaProduk: _namaProduk,
      obatIdProduk: _obatIdProduk,
      batchName: "",
      orderQuantity: _orderQuantity,
      senderInstanceName: _senderInstanceName,
      targetInstanceName: _targetInstanceName,
      statusOrder: en_orderStatus.OrderPlaced,
      timestampOrder: block.timestamp,
      timestampShipped: 0,
      timestampComplete: 0,
      orderObatIpfsHash: new string[](0)  
    });

    orderObatById[_orderId] = newOrderPbf;
    orderSenderInstanceAddress[_senderInstanceName].push(_senderInstanceAddr);
    allOrderedObat.push(newOrderPbf);

    emit evt_obatOrdered(_namaProduk, _orderQuantity, _orderId, _senderInstanceName, _targetInstanceName, block.timestamp); 
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
    string[] memory obatIdProdukArray,
    string[] memory batchNameArray
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
    batchNameArray = new string[](count);

    uint index = 0; 

    for(uint i = 0; i<allOrderedObat.length; i++){
      if(keccak256(abi.encodePacked(allOrderedObat[i].targetInstanceName)) == keccak256(abi.encodePacked(_targetInstanceName))) {
        orderIdArray[index] = allOrderedObat[i].orderId;
        namaProdukArray[index] = allOrderedObat[i].namaProduk;
        statusOrderArray[index] = uint8(allOrderedObat[i].statusOrder);
        obatQuantityArray[index] = allOrderedObat[i].orderQuantity;
        obatIdProdukArray[index] = allOrderedObat[i].obatIdProduk;
        batchNameArray[index] = allOrderedObat[i].batchName;
  
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
    string[] memory obatIdProdukArray,
    string[] memory batchNameArray
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
    batchNameArray = new string[](count);

    uint index = 0; 

    for(uint i = 0; i<allOrderedObat.length; i++){
      if(keccak256(abi.encodePacked(allOrderedObat[i].senderInstanceName)) == keccak256(abi.encodePacked(_senderInstanceName))) {
        orderIdArray[index] = allOrderedObat[i].orderId;
        namaProdukArray[index] = allOrderedObat[i].namaProduk;
        statusOrderArray[index] = uint8(allOrderedObat[i].statusOrder);
        obatQuantityArray[index] = allOrderedObat[i].orderQuantity;
        obatIdProdukArray[index] = allOrderedObat[i].obatIdProduk;
        batchNameArray[index] = allOrderedObat[i].batchName;
 
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
      uint8 statusOrder,
      string memory targetInstanceName,
      string[] memory orderObatIpfsHash,
      uint timestampOrder,
      uint timestampShipped,
      uint timestampComplete

  ){
    require(bytes(orderObatById[_orderId].orderId).length > 0, "No data found with this ID.");

    orderQuantity = orderObatById[_orderId].orderQuantity;  
    senderInstanceName = orderObatById[_orderId].senderInstanceName;  
    targetInstanceName = orderObatById[_orderId].targetInstanceName;  
    statusOrder = uint8(orderObatById[_orderId].statusOrder);
    orderObatIpfsHash = orderObatById[_orderId].orderObatIpfsHash;
    timestampOrder = orderObatById[_orderId].timestampOrder;
    timestampShipped = orderObatById[_orderId].timestampShipped;
    timestampComplete = orderObatById[_orderId].timestampComplete;
  }   

  function acceptOrder(
    string memory _batchName, 
    string memory _orderId,
    string[] memory _obatIpfsHash
  ) public {
    require(bytes(obatTradisional.getObatProductionDetailsByBatchName(_batchName).obatId).length > 0, "No data found with this ID.");

    // ObatTradisional.st_obatProduction storage obatProduced = obatTradisional.getObatProductionDetailsByBatchName(_batchName); 
    // ObatTradisional.st_obatProduction memory obatProduced = obatTradisional.getObatProductionDetailsByBatchName(_batchName);

    ObatTradisional.st_obatProduction memory obatProduced = obatTradisional.getObatProductionDetailsByBatchName(_batchName);

    ObatTradisional.st_obatProduction[] memory allProducedObat = obatTradisional.getAllProducedObatArray();

    st_orderObat storage obatOrdered = orderObatById[_orderId];

    obatOrdered.orderObatIpfsHash = _obatIpfsHash;
    obatOrdered.batchName = _batchName;
    obatOrdered.statusOrder = en_orderStatus.OrderShipped;
    obatOrdered.timestampShipped = block.timestamp;

    obatProduced.obatIpfsHash = new string[](0);
    obatProduced.obatQuantity = 0; 
    obatProduced.statusStok = ObatTradisional.en_obatAvailability.sold;

    for(uint i=0; i < allOrderedObat.length; i++){
      if(keccak256(abi.encodePacked(allOrderedObat[i].orderId)) == keccak256(abi.encodePacked(_orderId))){
        allOrderedObat[i].orderObatIpfsHash = obatProduced.obatIpfsHash;
        allOrderedObat[i].batchName = _batchName;
        allOrderedObat[i].statusOrder = en_orderStatus.OrderShipped;
        allOrderedObat[i].timestampShipped = block.timestamp;
 
        break;
      }
    }

    for(uint i=0; i < allProducedObat.length; i++){
      if(keccak256(abi.encodePacked(allProducedObat[i].batchName)) == keccak256(abi.encodePacked(_batchName))){
        allProducedObat[i].obatQuantity = 0;
        allProducedObat[i].obatIpfsHash = new string[](0);
        allProducedObat[i].statusStok = ObatTradisional.en_obatAvailability.sold;

        break;
      }
    }

    emit evt_updateOrder(obatOrdered.namaProduk, obatProduced.batchName, obatOrdered.targetInstanceName, obatOrdered.senderInstanceName, obatOrdered.orderQuantity, block.timestamp);
  }

  function completeOrder(
    string memory _orderId
  ) public {
    require(bytes(orderObatById[_orderId].orderId).length > 0, "No data found with this ID."); 

    st_orderObat storage obatOrdered = orderObatById[_orderId];

    obatOrdered.statusOrder = en_orderStatus.OrderDelivered;
    obatOrdered.timestampComplete = block.timestamp;

    for(uint i=0; i < allOrderedObat.length; i++){
      if(keccak256(abi.encodePacked(allOrderedObat[i].orderId)) == keccak256(abi.encodePacked(_orderId))){
        allOrderedObat[i].statusOrder = en_orderStatus.OrderDelivered;
        allOrderedObat[i].timestampComplete = block.timestamp;

        break;
      }
    }

    emit evt_updateOrder(obatOrdered.namaProduk, obatOrdered.batchName, obatOrdered.targetInstanceName, obatOrdered.senderInstanceName, obatOrdered.orderQuantity, block.timestamp);
  }

 
  // create function getListOrderObatbyPBF, getLIstOrderObatdri factory, get list order obat dri retailer, acceptOrder
  // oh iya aku belum update ipfs hash nya (berarti aku harus hapus getAllProducedObatArray yg pbf ya, krn aku butuh ipfs lama buat dimasukin ke data ipfs baru)

  // create new function but return all data's order


}