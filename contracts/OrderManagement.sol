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

  enum en_orderStatus { OrderPlaced , OrderShipped , OrderCompleted  }
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

  struct st_obatPbf {
    string orderId;
    string batchName;
    string obatIdProduk;
    string namaProduk;
    en_obatAvailability statusStok;
    uint8 obatQuantity;
    string[] obatIpfsHash;
    string ownerInstanceName;
  }

  struct st_obatRetailer {
    string orderId;
    string batchName;
    string obatIdProduk;
    string namaProduk;
    en_obatAvailability statusStok;
    uint8 obatQuantity;
    string[] obatIpfsHash;
    string ownerInstanceName;
  }

  st_orderObat[] public allOrderedObat;
  st_obatPbf[] public allObatPbf;
  st_obatRetailer[] public allObatRetailer;

  // mapping ini bisa akupakai juga buat lihat sender isntance pbf sama retailer, jadi aku harus simpan orderid juga di ipfs, its cheaper than creating new mapping for storing the address dan malah bikin makin mbulet wkwk
  mapping (string => st_orderObat) public orderObatById;
  mapping (string => st_obatPbf) public obatPbfByIdProduk;
  mapping (string => st_obatRetailer) public obatRetailerByIdProduk;
  mapping (string => address[]) public orderSenderInstanceAddress;
  mapping (string => address[]) public orderRetailerInstanceAddress;
  mapping (string => string) public orderHistoryPbfByBatchName; // buat menampilkan order id di ipfs

  event evt_obatOrdered(string namaProduk, uint8 quantity, string orderId, string senderInstanceName, string targetInstanceName, uint latestTimestamp );
  event evt_updateOrder(string namaProduk, string batchName, string targetInstance, string senderInstance, uint8 quantity, uint latestTimestamp);

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

    st_orderObat memory newOrder;
    if (roleManager.hasRole(msg.sender, RoleManager.en_roles.PBF)){
      newOrder = st_orderObat({
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
      
    } else if (roleManager.hasRole(msg.sender, RoleManager.en_roles.Retailer)){
      newOrder = st_orderObat({
        orderId: _orderId, 
        namaProduk: _namaProduk,
        obatIdProduk: _obatIdProduk,
        batchName: obatPbfByIdProduk[_obatIdProduk].batchName,
        orderQuantity: _orderQuantity,
        senderInstanceName: _senderInstanceName,
        targetInstanceName: _targetInstanceName,
        statusOrder: en_orderStatus.OrderPlaced,
        timestampOrder: block.timestamp,
        timestampShipped: 0,
        timestampComplete: 0,
        orderObatIpfsHash: new string[](0)  
      });



    }
 
    allOrderedObat.push(newOrder);  
    orderObatById[_orderId] = newOrder;
    orderSenderInstanceAddress[_senderInstanceName].push(_senderInstanceAddr);

    emit evt_obatOrdered(_namaProduk, _orderQuantity, _orderId, _senderInstanceName, _targetInstanceName, block.timestamp); 
  } 

  function acceptOrderFactory(
    string memory _batchName, 
    string memory _orderId,
    string[] memory _obatIpfsHash
  ) public {
    require(abi.encodePacked(obatTradisional.getObatProductionDetailsByBatchName(_batchName).obatId).length > 0, "No data found with this ID.");
 
    ObatTradisional.st_obatProduction memory obatProduced = obatTradisional.getObatProductionDetailsByBatchName(_batchName);

    ObatTradisional.st_obatProduction[] memory allProducedObat = obatTradisional.getAllProducedObatArray();

    st_orderObat storage obatOrdered = orderObatById[_orderId];

    obatOrdered.orderObatIpfsHash = _obatIpfsHash;
    obatOrdered.batchName = _batchName;
    obatOrdered.statusOrder = en_orderStatus.OrderShipped;
    obatOrdered.timestampShipped = block.timestamp;

    obatProduced.statusStok = ObatTradisional.en_obatAvailability.sold;
    obatProduced.obatIpfsHash = _obatIpfsHash;

    // untuk detail history order buat ipfs
    orderHistoryPbfByBatchName[_batchName] = _orderId;

    for(uint i=0; i < allOrderedObat.length; i++){
      if(keccak256(abi.encodePacked(allOrderedObat[i].orderId)) == keccak256(abi.encodePacked(_orderId))){
        allOrderedObat[i].orderObatIpfsHash = _obatIpfsHash;
        allOrderedObat[i].batchName = _batchName;
        allOrderedObat[i].statusOrder = en_orderStatus.OrderShipped;
        allOrderedObat[i].timestampShipped = block.timestamp;

        break;
      }
    }

    for(uint i=0; i < allProducedObat.length; i++){
      if(keccak256(abi.encodePacked(allProducedObat[i].batchName)) == keccak256(abi.encodePacked(_batchName))){
        allProducedObat[i].obatIpfsHash = _obatIpfsHash;
        allProducedObat[i].statusStok = ObatTradisional.en_obatAvailability.sold;

        break;
      }
    }

    emit evt_updateOrder(obatOrdered.namaProduk, obatProduced.batchName, obatOrdered.targetInstanceName, obatOrdered.senderInstanceName, obatOrdered.orderQuantity, block.timestamp);
   
  }

  function acceptOrderPbf(
    string memory _batchName, 
    string memory _orderId,
    string memory _obatId,
    string[] memory _obatIpfsHash
  ) public {
    require(abi.encodePacked(obatPbfByIdProduk[_obatId].obatIdProduk).length > 0, "No data found with this ID.");

    st_obatPbf memory obatPbf = obatPbfByIdProduk[_orderId];
    st_orderObat storage obatOrdered = orderObatById[_orderId];

    // update ipfs
    ObatTradisional.st_obatProduction memory obatProduced = obatTradisional.getObatProductionDetailsByBatchName(_batchName);
    ObatTradisional.st_obatProduction[] memory allProducedObat = obatTradisional.getAllProducedObatArray();

    obatOrdered.orderObatIpfsHash = _obatIpfsHash;
    obatOrdered.batchName = _batchName;
    obatOrdered.statusOrder = en_orderStatus.OrderShipped;
    obatOrdered.timestampShipped = block.timestamp;

    obatPbf.obatIpfsHash = _obatIpfsHash;
    obatPbf.statusStok = en_obatAvailability.sold;

    obatProduced.obatIpfsHash = _obatIpfsHash;

    for(uint i=0; i < allOrderedObat.length; i++){
      if(keccak256(abi.encodePacked(allOrderedObat[i].orderId)) == keccak256(abi.encodePacked(_orderId))){
        allOrderedObat[i].orderObatIpfsHash = obatPbf.obatIpfsHash;
        allOrderedObat[i].batchName = _batchName;
        allOrderedObat[i].statusOrder = en_orderStatus.OrderShipped;
        allOrderedObat[i].timestampShipped = block.timestamp;

        break;
      }
    }

    for(uint i=0; i < allObatPbf.length; i++){
      if(keccak256(abi.encodePacked(allObatPbf[i].batchName)) == keccak256(abi.encodePacked(_batchName))){
        allObatPbf[i].obatIpfsHash = _obatIpfsHash;
        allObatPbf[i].statusStok = en_obatAvailability.sold;

        break;
      }
    }

    for(uint i=0; i < allProducedObat.length; i++){
      if(keccak256(abi.encodePacked(allProducedObat[i].batchName)) == keccak256(abi.encodePacked(_batchName))){
        allProducedObat[i].obatIpfsHash = _obatIpfsHash;

        break;
      }
    }

    emit evt_updateOrder(obatOrdered.namaProduk, obatOrdered.batchName, obatOrdered.targetInstanceName, obatOrdered.senderInstanceName, obatOrdered.orderQuantity, block.timestamp);

  }

  function completeOrder(
    string memory _orderId,
    string[] memory _obatIpfsHash
  ) public {

    require(abi.encodePacked(orderObatById[_orderId].orderId).length > 0, "No data found with this ID."); 
    st_orderObat storage obatOrdered = orderObatById[_orderId];

    obatOrdered.statusOrder = en_orderStatus.OrderCompleted;
    obatOrdered.timestampComplete = block.timestamp;
    obatOrdered.orderObatIpfsHash = _obatIpfsHash;
 
    for(uint i=0; i < allOrderedObat.length; i++){
      if(keccak256(abi.encodePacked(allOrderedObat[i].orderId)) == keccak256(abi.encodePacked(_orderId))){
        allOrderedObat[i].statusOrder = en_orderStatus.OrderCompleted;
        allOrderedObat[i].timestampComplete = block.timestamp;
        allOrderedObat[i].orderObatIpfsHash = _obatIpfsHash;
        break;
      }
    }

    if (roleManager.hasRole(msg.sender, RoleManager.en_roles.PBF)){
      st_obatPbf memory obatPbf = st_obatPbf({
        orderId: _orderId,
        batchName: obatOrdered.batchName,
        obatIdProduk: obatOrdered.obatIdProduk,
        namaProduk: obatOrdered.namaProduk,
        statusStok: en_obatAvailability.ready,
        obatQuantity: obatOrdered.orderQuantity,
        obatIpfsHash: _obatIpfsHash,
        ownerInstanceName: obatOrdered.senderInstanceName
      }); 

      obatPbfByIdProduk[obatPbf.obatIdProduk] = obatPbf;
      allObatPbf.push(obatPbf);
      
    } else if (roleManager.hasRole(msg.sender, RoleManager.en_roles.Retailer)){
      st_obatRetailer memory obatRetailer = st_obatRetailer({
        orderId: _orderId,
        batchName: obatOrdered.batchName,
        obatIdProduk: obatOrdered.obatIdProduk,
        namaProduk: obatOrdered.namaProduk,
        statusStok: en_obatAvailability.ready,
        obatQuantity: obatOrdered.orderQuantity,
        obatIpfsHash: _obatIpfsHash,
        ownerInstanceName: obatOrdered.senderInstanceName
      }); 

      obatRetailerByIdProduk[obatRetailer.obatIdProduk] = obatRetailer;  
      allObatRetailer.push(obatRetailer);

    }

    emit evt_updateOrder(obatOrdered.namaProduk, obatOrdered.batchName, obatOrdered.targetInstanceName, obatOrdered.senderInstanceName, obatOrdered.orderQuantity, block.timestamp);
  }

  // get lsit all ordered for Factory and pbf
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

  // GET DETAIL PER ORDER ID 
  function getDetailOrderedObat(string memory _orderId)
    public
    view
    returns(
      st_orderObat memory 
  ){
    require(abi.encodePacked(orderObatById[_orderId].orderId).length > 0, "No data found with this ID.");

    return orderObatById[_orderId];
  }   

  function getListAllReadyObatPbf(string memory _instanceName)
    public
    view
    returns (
      string[] memory obatIdProduk,
      string[] memory namaProduk,
      uint8[] memory obatQuantity, 
      string[] memory batchName
  ){
    uint countObatInstance = 0;

    // First, count how many entries match the conditions for PBF or non-PBF in one pass
    for (uint256 i = 0; i < allObatPbf.length; i++) {
      bool isValid = false;

      if (roleManager.hasRole(msg.sender, RoleManager.en_roles.PBF)) {
        // If the role is PBF, check instance name and status
        if (keccak256(abi.encodePacked(allObatPbf[i].ownerInstanceName)) == keccak256(abi.encodePacked(_instanceName)) 
          && allObatPbf[i].statusStok == en_obatAvailability.ready) {
            isValid = true;
        }
      } else {
        // If not PBF, only check the ready status
        if (allObatPbf[i].statusStok == en_obatAvailability.ready) {
          isValid = true;
        }
      }

      if (isValid) {
        countObatInstance++; // Increment count for matching entries
      }
    }

    // Allocate memory for arrays based on count
    obatIdProduk = new string[](countObatInstance);
    namaProduk = new string[](countObatInstance);
    obatQuantity = new uint8[](countObatInstance);
    batchName = new string[](countObatInstance);

    // Fill the arrays in a single loop
    uint index = 0;
    for (uint256 i = 0; i < allObatPbf.length; i++) {
      bool isValid = false;

      if (roleManager.hasRole(msg.sender, RoleManager.en_roles.PBF)) {
        if (keccak256(abi.encodePacked(allObatPbf[i].ownerInstanceName)) == keccak256(abi.encodePacked(_instanceName)) 
          && allObatPbf[i].statusStok == en_obatAvailability.ready) {
            isValid = true;
        }
      } else {
        if (allObatPbf[i].statusStok == en_obatAvailability.ready) {
          isValid = true;
        }
      }

      if (isValid) {
        obatIdProduk[index] = allObatPbf[i].obatIdProduk;
        namaProduk[index] = allObatPbf[i].namaProduk;
        obatQuantity[index] = allObatPbf[i].obatQuantity;
        batchName[index] = allObatPbf[i].batchName;
        index++;
      }
    }
  }

  function getListAllReadyObatRetailer(string memory _instanceName)
    public
    view
    returns (
      string[] memory obatIdProduk,
      string[] memory namaProduk,
      uint8[] memory obatQuantity, 
      string[] memory batchName
  ){
    uint countObatInstance = 0;

    // First, count how many entries match the conditions for PBF or non-PBF in one pass
    for (uint256 i = 0; i < allObatRetailer.length; i++) {
      bool isValid = false;

      if (roleManager.hasRole(msg.sender, RoleManager.en_roles.Retailer)) {
        // If the role is PBF, check instance name and status
        if (keccak256(abi.encodePacked(allObatRetailer[i].ownerInstanceName)) == keccak256(abi.encodePacked(_instanceName)) 
          && allObatRetailer[i].statusStok == en_obatAvailability.ready) {
            isValid = true;
        }
      } else {
        // If not PBF, only check the ready status
        if (allObatRetailer[i].statusStok == en_obatAvailability.ready) {
          isValid = true;
        }
      }

      if (isValid) {
        countObatInstance++; // Increment count for matching entries
      }
    }

    // Allocate memory for arrays based on count
    obatIdProduk = new string[](countObatInstance);
    namaProduk = new string[](countObatInstance);
    obatQuantity = new uint8[](countObatInstance);
    batchName = new string[](countObatInstance);

    // Fill the arrays in a single loop
    uint index = 0;
    for (uint256 i = 0; i < allObatRetailer.length; i++) {
      bool isValid = false;

      if (roleManager.hasRole(msg.sender, RoleManager.en_roles.Retailer)) {
        if (keccak256(abi.encodePacked(allObatRetailer[i].ownerInstanceName)) == keccak256(abi.encodePacked(_instanceName)) 
          && allObatRetailer[i].statusStok == en_obatAvailability.ready) {
            isValid = true;
        }
      } else {
        if (allObatRetailer[i].statusStok == en_obatAvailability.ready) {
          isValid = true;
        }
      }

      if (isValid) {
        obatIdProduk[index] = allObatRetailer[i].obatIdProduk;
        namaProduk[index] = allObatRetailer[i].namaProduk;
        obatQuantity[index] = allObatRetailer[i].obatQuantity;
        batchName[index] = allObatRetailer[i].batchName;
        index++;
      }
    }
  }

  function getDetailPbfObat(
    string memory _obatId,
    string memory _userInstanceName
  )
    public
    view
    returns(
      st_obatPbf memory
  ){
    require(bytes(obatPbfByIdProduk[_obatId].obatIdProduk).length > 0, "No data found with this ID." );

    if (keccak256(abi.encodePacked(obatPbfByIdProduk[_obatId].ownerInstanceName)) == keccak256(abi.encodePacked(_userInstanceName))) {
      return obatPbfByIdProduk[_obatId];

    } else {
      st_obatPbf memory detailObatPbf = obatPbfByIdProduk[_obatId];

      detailObatPbf.orderId = ""; 
      detailObatPbf.obatIpfsHash = new string[](0);
        
      return detailObatPbf;
    }
  }

  function getDetailRetailerObat(
    string memory _obatId,
    string memory _userInstanceName
  )
    public
    view
    returns(
      st_obatRetailer memory
  ){
    require(bytes(obatRetailerByIdProduk[_obatId].obatIdProduk).length > 0, "No data found with this ID." );

    if (keccak256(abi.encodePacked(obatRetailerByIdProduk[_obatId].ownerInstanceName)) == keccak256(abi.encodePacked(_userInstanceName))) {
      return obatRetailerByIdProduk[_obatId];

    } else {
      st_obatRetailer memory detailObatRetailer = obatRetailerByIdProduk[_obatId];

      detailObatRetailer.orderId = ""; 
      detailObatRetailer.obatIpfsHash = new string[](0);
        
      return detailObatRetailer;
    }
  }

  function getHistoryOrderObatPbf(string memory _batchName)
    public
    view 
    returns (
      uint orderQuantity,
      string memory senderInstanceName,
      string memory targetInstanceName,
      uint timestampOrder,
      uint timestampShipped,
      uint timestampComplete
    ) {
      require(abi.encodePacked(orderHistoryPbfByBatchName[_batchName]).length > 0, "No data found with this ID.");

      string memory orderIdPbf = orderHistoryPbfByBatchName[_batchName];

      orderQuantity = orderObatById[orderIdPbf].orderQuantity;
      senderInstanceName = orderObatById[orderIdPbf].senderInstanceName;
      targetInstanceName = orderObatById[orderIdPbf].targetInstanceName;
      timestampOrder = orderObatById[orderIdPbf].timestampOrder;
      timestampShipped = orderObatById[orderIdPbf].timestampShipped;
      timestampComplete = orderObatById[orderIdPbf].timestampComplete;

  }
  

  // for pbf per instance only
  // function detailQuantityReadyObat(
  //   string memory _obatId,
  //   string memory _userInstanceName
  // )
  //   public
  //   view
  //   returns (
  //     uint8 obatQuantity,
  //     string memory batchName,
  //     string[] memory obatIpfsHash
  // ){
  //   require(bytes(obatPbfByIdProduk[_obatId].obatIdProduk).length > 0, "No data found with this ID." );

  //   obatQuantity = obatPbfByIdProduk[_obatId].obatQuantity;

  //   if (roleManager.hasRole(msg.sender, RoleManager.en_roles.PBF)){
  //     if(keccak256(abi.encodePacked(obatPbfByIdProduk[_obatId].ownerInstanceName)) == keccak256(abi.encodePacked(_userInstanceName))) {
  //       obatIpfsHash = obatPbfByIdProduk[_obatId].obatIpfsHash;
  //       batchName = obatPbfByIdProduk[_obatId].batchName;
  //     }

  //   } else {
  //     batchName = "";
  //     obatIpfsHash = new string[](0);
  //   }
  // }

 
  // create function getListOrderObatbyPBF, getLIstOrderObatdri factory, get list order obat dri retailer, acceptOrder
  // oh iya aku belum update ipfs hash nya (berarti aku harus hapus getAllProducedObatArray yg pbf ya, krn aku butuh ipfs lama buat dimasukin ke data ipfs baru)

  // create new function but return all data's order


}