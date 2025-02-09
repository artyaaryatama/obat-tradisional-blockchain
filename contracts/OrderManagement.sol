// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./RoleManager.sol";
// import "./ObatTradisional.sol";
import "./CdobCertificate.sol";
import "./EnumsLibrary.sol";
import "./ObatShared.sol";
 
contract OrderManagement is ReentrancyGuard {

  // ObatTradisional public immutable obatTradisional;
  RoleManager public immutable roleManager;
  ObatShared public immutable obatShared;
  CdobCertificate public immutable cdobCertificate;
 
  constructor(address roleManagerAddr, address obatSharedAddr, address cdobCertificateAddr) {
    roleManager = RoleManager(roleManagerAddr);
    // obatTradisional = ObatTradisional(obatTradisionalAddr); 
    obatShared = ObatShared(obatSharedAddr);
    cdobCertificate = CdobCertificate(cdobCertificateAddr);
  }

  using EnumsLibrary for EnumsLibrary.Roles;
  using EnumsLibrary for EnumsLibrary.OrderStatus;
  using EnumsLibrary for EnumsLibrary.ObatAvailability;

  struct OrderUser {
    string instanceName;
    address instanceAddr;
  }

  struct OrderDetail {
    string orderId;
    string obatId;
    string namaProduk;
    string batchName;
    uint8 orderQuantity;
    OrderUser buyerUser;
    OrderUser sellerUser;
    EnumsLibrary.OrderStatus statusOrder; 
    string prevOrderIdPbf;
  }

  struct OrderTimestamp {
    uint256 timestampOrder;
    uint256 timestampShipped;
    uint256 timestampComplete;  
  }
  
  string[] public allOrderIds;

  mapping (string => string[]) obatOrderIpfsById;
  mapping (string => OrderDetail) orderDetailById;
  mapping (string => OrderTimestamp) orderTimestampById;
  mapping (string => string[]) orderInstanceBuyerById;
  mapping (string => string[]) orderInstanceSellerById;

  event OrderUpdate (
    string batchName, 
    string namaProduk, 
    string buyerInstanceName, 
    string sellerInstanceName, 
    uint8 orderQuantity, 
    uint256 timestamp
  ); 
  
  modifier onlyFactory() { 
    require(roleManager.hasRole(msg.sender, EnumsLibrary.Roles.Factory), "Pabrik access only");
    _;
  } 

  modifier onlyRetailer() { 
    require(roleManager.hasRole(msg.sender, EnumsLibrary.Roles.Retailer), "Retailer access only");
    _;
  } 

  modifier onlyPBF() {
    require(roleManager.hasRole(msg.sender, EnumsLibrary.Roles.PBF), "PBF access only");
    _;
  }

  function createOrder (
    string memory prevOrderIdPbf,
    string memory orderId,
    string memory obatId,
    string memory batchName,
    string memory namaProduk,
    string memory buyerInstance,
    string memory sellerInstance,
    uint8 orderQuantity,
    string memory cdobHash
  ) public nonReentrant {


    allOrderIds.push(orderId); 
    orderInstanceBuyerById[buyerInstance].push(orderId);
    orderInstanceSellerById[sellerInstance].push(orderId);

    if ((roleManager.hasRole(
      msg.sender, 
      EnumsLibrary.Roles.PBF
    ))){
      obatShared.addCdobId(
        obatId, 
        cdobHash
      );
    }

    createTimestamp(orderId);

    OrderUser memory buyerUser = createOrderUser(
      buyerInstance, 
      msg.sender
    );

    OrderUser memory sellerUser = createOrderUser(
      sellerInstance, 
      address(0)
    );

    orderDetailById[orderId] = OrderDetail({ 
      orderId: orderId,
      obatId: obatId,
      namaProduk: namaProduk,
      batchName: batchName,
      orderQuantity: orderQuantity,
      buyerUser: buyerUser,
      sellerUser: sellerUser,
      statusOrder: EnumsLibrary.OrderStatus.OrderPlaced,
      prevOrderIdPbf: prevOrderIdPbf 
    });

    emitOrderUpdate(orderId);
  }

  function acceptOrderPbf(
    string memory orderId,
    string[] memory orderObatIpfs
  ) 
    public 
    onlyFactory
    nonReentrant 
  { 
      uint256 length = orderObatIpfs.length;
      OrderDetail storage orderData = orderDetailById[orderId];

      orderData.sellerUser.instanceAddr = msg.sender;
      orderData.statusOrder = EnumsLibrary.OrderStatus.OrderShipped;
      orderTimestampById[orderId].timestampShipped = block.timestamp;

      delete obatOrderIpfsById[orderId];

      for (uint256 i = 0; i < length; i++) {
        obatOrderIpfsById[orderId].push(orderObatIpfs[i]);
      }

      obatShared.updateBatchProduction(
        orderData.obatId, 
        orderData.batchName, 
        EnumsLibrary.ObatAvailability.Sold
      );

      obatShared.updateObatIpfs(
        orderData.batchName,
        orderObatIpfs 
      ); 

      emitOrderUpdate(orderId);
  }
  
  function acceptOrderRetailer(
    string memory orderId,
    string[] memory orderObatIpfs
  ) 
    public 
    onlyPBF
    nonReentrant 
  { 
 
    uint256 length = orderObatIpfs.length;
    OrderDetail storage orderData = orderDetailById[orderId];

    orderData.sellerUser.instanceAddr = msg.sender;
    orderData.statusOrder = EnumsLibrary.OrderStatus.OrderShipped;
    orderTimestampById[orderId].timestampShipped = block.timestamp;

    delete obatOrderIpfsById[orderDetailById[orderId].prevOrderIdPbf];
    delete obatOrderIpfsById[orderId];

    for (uint256 i = 0; i < length; i++) {
      obatOrderIpfsById[orderDetailById[orderId].prevOrderIdPbf].push(orderObatIpfs[i]);
      obatOrderIpfsById[orderId].push(orderObatIpfs[i]);
    }  

    obatShared.updateBatchProduction(
      orderData.obatId,  
      orderData.batchName, 
      EnumsLibrary.ObatAvailability.Sold
    );

    obatShared.updateObatPbf(
      orderData.batchName,
      EnumsLibrary.ObatAvailability.Sold 
    ); 

    obatShared.updateObatIpfs(
      orderData.batchName,
      orderObatIpfs 
    ); 

    emitOrderUpdate(orderId);
  }

  function completeOrderPbf(
    string memory orderId,
    string[] memory orderObatIpfs
  ) 
    public 
    onlyPBF
    nonReentrant 
  {
    uint256 length = orderObatIpfs.length;
    OrderDetail storage orderData = orderDetailById[orderId];

    orderData.statusOrder = EnumsLibrary.OrderStatus.OrderCompleted;
    orderTimestampById[orderId].timestampComplete = block.timestamp;

    delete obatOrderIpfsById[orderId];

    for (uint256 i = 0; i < length; i++) {
      obatOrderIpfsById[orderId].push(orderObatIpfs[i]);
    }

    obatShared.updateBatchProduction( 
      orderData.obatId, 
      orderData.batchName, 
      EnumsLibrary.ObatAvailability.Sold
    );

    obatShared.updateObatIpfs(
      orderData.batchName,
      orderObatIpfs 
    ); 

    obatShared.addObatPbf(
      orderData.obatId, 
      orderId,  
      orderData.namaProduk, 
      orderData.batchName, 
      orderData.orderQuantity, 
      orderData.buyerUser.instanceName 
    );

    emitOrderUpdate(orderId);
  }

  function completeOrderRetailer(
    string memory orderId,
    string[] memory orderObatIpfs
  ) 
    public 
    onlyRetailer
    nonReentrant 
  {
    uint256 length = orderObatIpfs.length;
    OrderDetail storage orderData = orderDetailById[orderId];  

    orderData.statusOrder = EnumsLibrary.OrderStatus.OrderCompleted;
    orderTimestampById[orderId].timestampComplete = block.timestamp;

    delete obatOrderIpfsById[orderData.prevOrderIdPbf];
    delete obatOrderIpfsById[orderId];

    for (uint256 i = 0; i < length; i++) {
      obatOrderIpfsById[orderData.prevOrderIdPbf].push(orderObatIpfs[i]); 
      obatOrderIpfsById[orderId].push(orderObatIpfs[i]);
    } 

    obatShared.updateObatPbf(
      orderData.batchName, 
      EnumsLibrary.ObatAvailability.Sold
    );  

    obatShared.updateBatchProduction(
      orderData.obatId, 
      orderData.batchName, 
      EnumsLibrary.ObatAvailability.Sold
    );
    
    obatShared.updateObatIpfs(
      orderData.batchName,
      orderObatIpfs 
    ); 

    emitOrderUpdate(orderId);
  }
  
  function getAllOrderFromBuyer(string memory buyerInstance) public view returns(OrderDetail[] memory) {
    uint256 count = orderInstanceBuyerById[buyerInstance].length;

    OrderDetail[] memory orders = new OrderDetail[](count);

    for (uint i = 0; i < count; i++) {
      string memory orderId = orderInstanceBuyerById[buyerInstance][i];

      orders[i] = orderDetailById[orderId];
    }

    return orders;
  }

  function getAllOrderFromSeller(string memory sellerInstance) public view returns(OrderDetail[] memory) {
    uint256 count = orderInstanceSellerById[sellerInstance].length;

    OrderDetail[] memory orders = new OrderDetail[](count);

    for (uint i = 0; i < count; i++) {
      string memory orderId = orderInstanceSellerById[sellerInstance][i];

      orders[i] = orderDetailById[orderId];
    }

    return orders;
  }

  function detailOrder(string memory orderId) public view returns (OrderDetail memory){
    return orderDetailById[orderId];
  }
  
  function orderTimestamp(string memory orderId) public view returns (OrderTimestamp memory){
    
    return orderTimestampById[orderId];
  }
  
  function obatIpfs(string memory orderId) public view returns (string[] memory){
    
    return obatOrderIpfsById[orderId];
  }

  function getAllObatPbfReadyStock() public view returns (ObatShared.ObatOutputStok[] memory){ 

      return obatShared.getAllObatPbfReadyStock();
  } 

  function getAllObatPbfByInstance(string memory instanceName) public view returns (ObatShared.ObatOutputStok[] memory){

      return obatShared.getAllObatPbfByInstance(instanceName);
  }

  function getAllObatRetailerByInstance(string memory instanceName) public view returns (ObatShared.ObatOutputStok[] memory){

    return obatShared.getAllObatRetailerByInstance(instanceName);
  }

  function emitOrderUpdate(string memory orderId) internal {

    OrderDetail memory order;      
    order = orderDetailById[orderId];

    emit OrderUpdate(
      order.batchName,
      order.namaProduk, 
      order.buyerUser.instanceName, 
      order.sellerUser.instanceName,
      order.orderQuantity,
      block.timestamp
    );
  }

  function createOrderUser (
    string memory instanceName,
    address instanceAddr
  ) 
    internal 
    pure 
    returns (
      OrderUser memory
  ){
    
    return OrderUser({  
      instanceName: instanceName,
      instanceAddr: instanceAddr
    });
  }

  function createTimestamp (
    string memory orderId
  ) internal {

    OrderTimestamp memory newTimestamp = OrderTimestamp({
      timestampOrder: block.timestamp,
      timestampShipped: 0,
      timestampComplete: 0
    });

    orderTimestampById[orderId] = newTimestamp;
  }
}