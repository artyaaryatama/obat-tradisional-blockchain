// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./RoleManager.sol";
import "./ObatTradisional.sol";
import "./CdobCertificate.sol";
import "./EnumsLibrary.sol";
import "./ObatShared.sol";
 
contract OrderManagement {

  ObatTradisional public obatTradisional;
  RoleManager public roleManager;
  ObatShared public obatShared;
  CdobCertificate public cdobCertificate;
 
  constructor(address _obatTradisionalAddr, address _roleManagerAddr, address _obatSharedAddr, address _cdobCertificateAddr) {
    roleManager = RoleManager(_roleManagerAddr);
    obatTradisional = ObatTradisional(_obatTradisionalAddr);
    obatShared = ObatShared(_obatSharedAddr);
    cdobCertificate = CdobCertificate(_cdobCertificateAddr);
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
  
  string[] public AllOrderIds;

  mapping (string => string[]) ObatOrderIpfsById;
  mapping (string => OrderDetail) OrderDetailById;
  mapping (string => OrderTimestamp) OrderTimestampById;
  mapping (string => string[]) OrderInstanceBuyerById;
  mapping (string => string[]) OrderInstanceSellerById;

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
    string memory _prevOrderIdPbf,
    string memory _orderId,
    string memory _obatId,
    string memory _batchName,
    string memory _namaProduk,
    string memory _buyerInstance,
    string memory _sellerInstance,
    uint8 _orderQuantity,
    string memory _cdobHash
  ) public{

      OrderUser memory buyerUser = createOrderUser(
        _buyerInstance, 
        msg.sender
      );
      OrderUser memory sellerUser = createOrderUser(
        _sellerInstance, 
        address(0)
      );

      AllOrderIds.push(_orderId); 
      OrderInstanceBuyerById[_buyerInstance].push(_orderId);
      OrderInstanceSellerById[_sellerInstance].push(_orderId);

      createTimestamp(_orderId);

      if ((roleManager.hasRole(
        msg.sender, 
        EnumsLibrary.Roles.PBF
      ))){

        obatShared.addCdobId(
          _obatId, 
          _cdobHash
        );
      }

      OrderDetail memory orderData = OrderDetail({ 
        orderId: _orderId,
        obatId: _obatId,
        namaProduk: _namaProduk,
        batchName: _batchName,
        orderQuantity: _orderQuantity,
        buyerUser: buyerUser,
        sellerUser: sellerUser,
        statusOrder: EnumsLibrary.OrderStatus.OrderPlaced,
        prevOrderIdPbf: _prevOrderIdPbf 
      });

      OrderDetailById[_orderId] = orderData;

      emitOrderUpdate(_orderId);
  }

  function acceptOrderPbf(
    string memory _orderId,
    string[] memory _orderObatIpfs
  ) 
    public 
    onlyFactory
  { 
      OrderDetail storage orderData = OrderDetailById[_orderId];

      orderData.sellerUser.instanceAddr = msg.sender;
      orderData.statusOrder = EnumsLibrary.OrderStatus.OrderShipped;
      OrderTimestampById[_orderId].timestampShipped = block.timestamp;

      delete ObatOrderIpfsById[_orderId];

      for (uint256 i = 0; i < _orderObatIpfs.length; i++) {
        ObatOrderIpfsById[_orderId].push(_orderObatIpfs[i]);
      }

      obatShared.updateBatchProduction(
        orderData.obatId, 
        orderData.batchName, 
        EnumsLibrary.ObatAvailability.Sold
      );

      obatShared.updateObatIpfs(
        orderData.batchName,
        _orderObatIpfs 
      ); 

      emitOrderUpdate(_orderId);
  }
  
  function acceptOrderRetailer(
    string memory _orderId,
    string[] memory _orderObatIpfs
  ) 
    public 
    onlyPBF
  { 
 
    OrderDetail storage orderData = OrderDetailById[_orderId];

    orderData.sellerUser.instanceAddr = msg.sender;
    orderData.statusOrder = EnumsLibrary.OrderStatus.OrderShipped;
    OrderTimestampById[_orderId].timestampShipped = block.timestamp;

    delete ObatOrderIpfsById[OrderDetailById[_orderId].prevOrderIdPbf];
    delete ObatOrderIpfsById[_orderId];

    for (uint256 i = 0; i < _orderObatIpfs.length; i++) {
      ObatOrderIpfsById[OrderDetailById[_orderId].prevOrderIdPbf].push(_orderObatIpfs[i]);
      ObatOrderIpfsById[_orderId].push(_orderObatIpfs[i]);
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
      _orderObatIpfs 
    ); 

    emitOrderUpdate(_orderId);
  }

  function completeOrderPbf(
    string memory _orderId,
    string[] memory _orderObatIpfs
  ) 
    public 
    onlyPBF
  {

    OrderDetail storage orderData = OrderDetailById[_orderId];

    orderData.statusOrder = EnumsLibrary.OrderStatus.OrderCompleted;
    OrderTimestampById[_orderId].timestampComplete = block.timestamp;

    delete ObatOrderIpfsById[_orderId];

    for (uint256 i = 0; i < _orderObatIpfs.length; i++) {
      ObatOrderIpfsById[_orderId].push(_orderObatIpfs[i]);
    }

    obatShared.updateBatchProduction( 
      orderData.obatId, 
      orderData.batchName, 
      EnumsLibrary.ObatAvailability.Sold
    );

    obatShared.updateObatIpfs(
      orderData.batchName,
      _orderObatIpfs 
    ); 

    obatShared.addObatPbf(
      orderData.obatId, 
      _orderId,  
      orderData.namaProduk, 
      orderData.batchName, 
      orderData.orderQuantity, 
      orderData.buyerUser.instanceName 
    );

    emitOrderUpdate(_orderId);
  }

  function completeOrderRetailer(
    string memory _orderId,
    string[] memory _orderObatIpfs
  ) 
    public 
    onlyRetailer
  {

    OrderDetail storage orderData = OrderDetailById[_orderId];  

    orderData.statusOrder = EnumsLibrary.OrderStatus.OrderCompleted;
    OrderTimestampById[_orderId].timestampComplete = block.timestamp;

    delete ObatOrderIpfsById[orderData.prevOrderIdPbf];
    delete ObatOrderIpfsById[_orderId];

    for (uint256 i = 0; i < _orderObatIpfs.length; i++) {
      ObatOrderIpfsById[orderData.prevOrderIdPbf].push(_orderObatIpfs[i]); 
      ObatOrderIpfsById[_orderId].push(_orderObatIpfs[i]);
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
      _orderObatIpfs 
    ); 

    emitOrderUpdate(_orderId);
  }
  
  function getAllOrderFromBuyer(string memory _buyerInstance) public view returns(OrderDetail[] memory) {
    uint256 count = OrderInstanceBuyerById[_buyerInstance].length;

    OrderDetail[] memory orders = new OrderDetail[](count);

    for (uint i = 0; i < count; i++) {
      string memory orderId = OrderInstanceBuyerById[_buyerInstance][i];

      orders[i] = OrderDetailById[orderId];
    }

    return orders;
  }

  function getAllOrderFromSeller(string memory _sellerInstance) public view returns(OrderDetail[] memory) {
    uint256 count = OrderInstanceSellerById[_sellerInstance].length;

    OrderDetail[] memory orders = new OrderDetail[](count);

    for (uint i = 0; i < count; i++) {
      string memory orderId = OrderInstanceSellerById[_sellerInstance][i];

      orders[i] = OrderDetailById[orderId];
    }

    return orders;
  }

  function detailOrder(string memory _orderId) public view returns (OrderDetail memory){
    return OrderDetailById[_orderId];
  }
  
  function orderTimestamp(string memory _orderId) public view returns (OrderTimestamp memory){
    
    return OrderTimestampById[_orderId];
  }
  
  function obatIpfs(string memory _orderId) public view returns (string[] memory){
    
    return ObatOrderIpfsById[_orderId];
  }

  function getAllObatPbfReadyStock() public view returns (ObatShared.ObatOutputStok[] memory){ 

      return obatShared.getAllObatPbfReadyStock();
  } 

  function getAllObatPbfByInstance(string memory _instanceName) public view returns (ObatShared.ObatOutputStok[] memory){

      return obatShared.getAllObatPbfByInstance(_instanceName);
  }

  function getAllObatRetailerByInstance(string memory _instanceName) public view returns (ObatShared.ObatOutputStok[] memory){

    return obatShared.getAllObatRetailerByInstance(_instanceName);
  }

  function emitOrderUpdate(string memory _orderId) internal {

    OrderDetail memory order;      
    order = OrderDetailById[_orderId];

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
    string memory _instanceName,
    address _instanceAddr
  ) 
    internal 
    pure 
    returns (
      OrderUser memory
  ){
    
    return OrderUser({  
      instanceName: _instanceName,
      instanceAddr: _instanceAddr
    });
  }

  function createTimestamp (
    string memory _orderId
  ) internal {

    OrderTimestamp memory newTimestamp = OrderTimestamp({
      timestampOrder: block.timestamp,
      timestampShipped: 0,
      timestampComplete: 0
    });

    OrderTimestampById[_orderId] = newTimestamp;
  }
}