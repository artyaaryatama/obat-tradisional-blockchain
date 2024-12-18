// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./RoleManager.sol";
import "./ObatTradisional.sol";
import "./EnumsLibrary.sol";
import "./ObatShared.sol";
 
contract OrderManagement {

  ObatTradisional public obatTradisional;
  RoleManager public roleManager;
  ObatShared public obatShared;

  constructor(address _obatTradisionalAddr, address _roleManagerAddr, address _obatSharedAddr) {
    roleManager = RoleManager(_roleManagerAddr);
    obatTradisional = ObatTradisional(_obatTradisionalAddr);
    obatShared = ObatShared(_obatSharedAddr);
  }

  modifier onlyFactory() { 
    require(roleManager.hasRole(msg.sender, EnumsLibrary.Roles.Factory), "Only Factory");
    _;
  } 

  modifier onlyPBF() {
    require(roleManager.hasRole(msg.sender, EnumsLibrary.Roles.PBF), "Only PBF");
    _;
  }

  using EnumsLibrary for EnumsLibrary.Roles;
  using EnumsLibrary for EnumsLibrary.OrderStatus;
  using EnumsLibrary for EnumsLibrary.ObatAvailability;

  struct st_orderUser {
    string instanceName;
    address instanceAddr;
  }

  struct st_obatOrder {
    string orderId;
    string obatId;
    string namaProduk;
    string batchName;
    uint8 orderQuantity;
    st_orderUser buyerUser;
    st_orderUser sellerUser;
    EnumsLibrary.OrderStatus statusOrder; 
  }

  struct st_obatOrderRetailer {
    string prevOrderIdPbf;
    string orderId;
    string obatId;
    string namaProduk;
    string batchName;
    uint8 orderQuantity;
    st_orderUser buyerUser;
    st_orderUser sellerUser;
    EnumsLibrary.OrderStatus statusOrder; 
  }

  struct st_orderTimestamp {
    uint256 timestampOrder;
    uint256 timestampShipped;
    uint256 timestampComplete;  
  }

  struct st_obatPbf {
    string obatId;
    string orderId;
    EnumsLibrary.ObatAvailability statusStok;
  }
  
  string[] public allOrderId;

  mapping (string => string[]) orderPbfObatIpfsByOrderId;
  mapping (string => string[]) orderRetailerObatIpfsByOrderId;
  mapping (string => st_obatOrder) orderPbfByOrderId;
  mapping (string => st_obatOrderRetailer) orderRetailerById;
  mapping (string => st_orderTimestamp) orderTimestampByOrderId;
  mapping (string => string[]) orderIdbyInstanceBuyer;
  mapping (string => string[]) orderIdbyInstanceSeller;

  event evt_orderUpdate (string batchName, string namaProduk, string buyerInstanceName, string sellerInstanceName, uint8 orderQuantity, uint256 timestamp);

  // status: 200ok
  function getAvailableObatFromFactory ()
    public view onlyPBF returns (ObatTradisional.st_obatOutputBatch[] memory) {
      return obatTradisional.getAllBatchProductionReadyStock();
  }

  // status: 200ok
  function createOrderUser (
    string memory _instanceName,
    address _instanceAddr
  ) internal pure returns (st_orderUser memory){
      return st_orderUser({  
        instanceName: _instanceName,
        instanceAddr: _instanceAddr
      });
  }

  // status: 200ok
  function createTimestamp (
    string memory _orderId
  ) internal {

    st_orderTimestamp memory newTimestamp = st_orderTimestamp({
      timestampOrder: block.timestamp,
      timestampShipped: 0,
      timestampComplete: 0
    });

    orderTimestampByOrderId[_orderId] = newTimestamp;
  }

  // status: 200ok
  function createOrderPbf (
    string memory _orderId,
    string memory _obatId,
    string memory _batchName,
    string memory _namaProduk,
    string memory _buyerInstance,
    string memory _sellerInstance,
    uint8 _orderQuantity
  ) public {
      st_orderUser memory buyerUser = createOrderUser(_buyerInstance, msg.sender);
      st_orderUser memory sellerUser = createOrderUser(_sellerInstance, address(0));

      orderPbfByOrderId[_orderId] = st_obatOrder({
        orderId: _orderId,
        obatId: _obatId,
        namaProduk: _namaProduk,
        batchName: _batchName,
        orderQuantity: _orderQuantity,
        buyerUser: buyerUser,
        sellerUser: sellerUser,
        statusOrder: EnumsLibrary.OrderStatus.OrderPlaced
      });
 
      allOrderId.push(_orderId); 
    
      orderIdbyInstanceBuyer[_buyerInstance].push(_orderId);
      orderIdbyInstanceSeller[_sellerInstance].push(_orderId);

      createTimestamp(_orderId);
      emitOrderPbfUpdate(_orderId);
  }

  // status: 200ok
  function createOrderRetailer (
    string memory _prevOrderIdPbf,
    string memory _orderId,
    string memory _obatId,
    string memory _batchName,
    string memory _namaProduk,
    string memory _buyerInstance,
    string memory _sellerInstance,
    uint8 _orderQuantity
  ) public {

    st_orderUser memory buyerUser = createOrderUser(_buyerInstance, msg.sender);
    st_orderUser memory sellerUser = createOrderUser(_sellerInstance, address(0));

    orderRetailerById[_orderId] = st_obatOrderRetailer({
      prevOrderIdPbf: _prevOrderIdPbf,
      orderId: _orderId,
      obatId: _obatId,
      namaProduk: _namaProduk,
      batchName: _batchName,
      orderQuantity: _orderQuantity,
      buyerUser: buyerUser,
      sellerUser: sellerUser,
      statusOrder: EnumsLibrary.OrderStatus.OrderPlaced
    });

    allOrderId.push(_orderId); 
  
    orderIdbyInstanceBuyer[_buyerInstance].push(_orderId);
    orderIdbyInstanceSeller[_sellerInstance].push(_orderId);

    createTimestamp(_orderId);
    emitOrderRetailerUpdate(_orderId);
  }

  // status: 200ok
  function emitOrderPbfUpdate(string memory _orderId)
    internal {
      st_obatOrder memory order = orderPbfByOrderId[_orderId];

      emit evt_orderUpdate(
        order.batchName,
        order.namaProduk, 
        order.buyerUser.instanceName, 
        order.sellerUser.instanceName,
        order.orderQuantity,
        block.timestamp
      );
  }

  // status: 200ok
  function emitOrderRetailerUpdate(string memory _orderId)
    internal {
      st_obatOrderRetailer memory order = orderRetailerById[_orderId];

      emit evt_orderUpdate(
        order.batchName,
        order.namaProduk, 
        order.buyerUser.instanceName, 
        order.sellerUser.instanceName,
        order.orderQuantity,
        block.timestamp
      );
  }
  
  // status: 200ok
  function acceptOrderPbf(
    string memory _orderId,
    string[] memory _orderObatIpfs
  ) public {
    
      st_obatOrder memory obatOrder = orderPbfByOrderId[_orderId];

      orderPbfByOrderId[_orderId].sellerUser.instanceAddr = msg.sender;
      orderPbfByOrderId[_orderId].statusOrder = EnumsLibrary.OrderStatus.OrderShipped;
      orderTimestampByOrderId[_orderId].timestampShipped = block.timestamp;

      delete orderPbfObatIpfsByOrderId[_orderId];

      for (uint256 i = 0; i < _orderObatIpfs.length; i++) {
        orderPbfObatIpfsByOrderId[_orderId].push(_orderObatIpfs[i]);
      }

      obatShared.updateBatchProduction(obatOrder.obatId, obatOrder.batchName, _orderObatIpfs);

      emitOrderPbfUpdate(_orderId);

  }
  
  // status: 200ok
  function acceptOrderRetailer(
    string memory _orderId,
    string[] memory _orderObatIpfs
  ) public {

      string memory orderIdPrevPbf = orderRetailerById[_orderId].prevOrderIdPbf;
      st_obatOrderRetailer memory obatOrder = orderRetailerById[_orderId]; 

      orderRetailerById[_orderId].sellerUser.instanceAddr = msg.sender;
      orderRetailerById[_orderId].statusOrder = EnumsLibrary.OrderStatus.OrderShipped;
      orderTimestampByOrderId[_orderId].timestampShipped = block.timestamp;

      delete orderRetailerObatIpfsByOrderId[_orderId];
      delete orderPbfObatIpfsByOrderId[orderIdPrevPbf];

      for (uint256 i = 0; i < _orderObatIpfs.length; i++) {
        orderRetailerObatIpfsByOrderId[_orderId].push(_orderObatIpfs[i]);
        orderPbfObatIpfsByOrderId[orderIdPrevPbf].push(_orderObatIpfs[i]);
      } 

      obatShared.updateBatchProduction(obatOrder.obatId, obatOrder.batchName, _orderObatIpfs);
      
      obatShared.updateObatPbf(obatOrder.batchName, _orderObatIpfs);

      emitOrderRetailerUpdate(_orderId);
  }

  // status: 200ok
  function completeOrderPbf(
    string memory _orderId,
    string[] memory _orderObatIpfs
  ) public {
   
    st_obatOrder memory obatOrder = orderPbfByOrderId[_orderId];

    orderPbfByOrderId[_orderId].statusOrder = EnumsLibrary.OrderStatus.OrderCompleted;
    orderTimestampByOrderId[_orderId].timestampComplete = block.timestamp;

    delete orderPbfObatIpfsByOrderId[_orderId];

    for (uint256 i = 0; i < _orderObatIpfs.length; i++) {
      orderPbfObatIpfsByOrderId[_orderId].push(_orderObatIpfs[i]);
    }

    obatShared.updateBatchProduction(obatOrder.obatId, obatOrder.batchName, _orderObatIpfs);

    obatShared.addObatPbf(obatOrder.obatId, _orderId, obatOrder.namaProduk, obatOrder.batchName, obatOrder.orderQuantity, _orderObatIpfs, obatOrder.buyerUser.instanceName);

    emitOrderPbfUpdate(_orderId);
  }

  // status: 200ok
  function completeOrderRetailer(
    string memory _orderId,
    string[] memory _orderObatIpfs
  ) public {


      string memory orderIdPrevPbf = orderRetailerById[_orderId].prevOrderIdPbf;
      st_obatOrderRetailer memory obatOrder = orderRetailerById[_orderId]; 

      orderRetailerById[_orderId].statusOrder = EnumsLibrary.OrderStatus.OrderCompleted;
      orderTimestampByOrderId[_orderId].timestampComplete = block.timestamp;

      delete orderRetailerObatIpfsByOrderId[_orderId];
      delete orderPbfObatIpfsByOrderId[orderIdPrevPbf];

      for (uint256 i = 0; i < _orderObatIpfs.length; i++) {
        orderRetailerObatIpfsByOrderId[_orderId].push(_orderObatIpfs[i]); 
        orderPbfObatIpfsByOrderId[orderIdPrevPbf].push(_orderObatIpfs[i]);
      } 

      obatShared.updateBatchProduction(obatOrder.obatId, obatOrder.batchName, _orderObatIpfs);

      obatShared.updateObatPbf(obatOrder.batchName, _orderObatIpfs); 

      obatShared.addObatRetailer(obatOrder.obatId, _orderId, obatOrder.namaProduk, obatOrder.batchName, obatOrder.orderQuantity, _orderObatIpfs, obatOrder.buyerUser.instanceName);

      emitOrderRetailerUpdate(_orderId);
  }
  
  // status: 200ok
  function getAllOrderFromBuyer(string memory _buyerInstance)
    public view returns(st_obatOrder[] memory) {
      uint256 count = orderIdbyInstanceBuyer[_buyerInstance].length;

      st_obatOrder[] memory orders = new st_obatOrder[](count);

      for (uint i = 0; i < count; i++) {
        string memory orderId = orderIdbyInstanceBuyer[_buyerInstance][i];

        orders[i] = orderPbfByOrderId[orderId];
      }

      return orders;
  }

  // status: 200ok
  function getAllOrderFromBuyerRetailer(string memory _buyerInstance)
    public view returns(st_obatOrderRetailer[] memory) {
      uint256 count = orderIdbyInstanceBuyer[_buyerInstance].length;

      st_obatOrderRetailer[] memory orders = new st_obatOrderRetailer[](count);

      for (uint i = 0; i < count; i++) {
        string memory orderId = orderIdbyInstanceBuyer[_buyerInstance][i];

        orders[i] = orderRetailerById[orderId]; 
      }

      return orders; 
  }

  // status: 200ok
  function getAllOrderFromSellerRetailer(string memory _sellerInstance)
    public view returns(st_obatOrderRetailer[] memory) {
      uint256 count = orderIdbyInstanceSeller[_sellerInstance].length;

      st_obatOrderRetailer[] memory orders = new st_obatOrderRetailer[](count);

      for (uint i = 0; i < count; i++) {
        string memory orderId = orderIdbyInstanceSeller[_sellerInstance][i];

        orders[i] = orderRetailerById[orderId];
      }

      return orders;
  }

  // status: 200ok
  function getAllOrderFromSeller(string memory _sellerInstance)
    public view returns(st_obatOrder[] memory) {
      uint256 count = orderIdbyInstanceSeller[_sellerInstance].length;

      st_obatOrder[] memory orders = new st_obatOrder[](count);

      for (uint i = 0; i < count; i++) {
        string memory orderId = orderIdbyInstanceSeller[_sellerInstance][i];

        orders[i] = orderPbfByOrderId[orderId];
      }

      return orders;
  }

  // status: 200ok
  function detailOrder(string memory _orderId)
    public view returns(
      st_obatOrder memory,
      st_orderTimestamp memory,
      string[] memory
    ) {
      return (
        orderPbfByOrderId[_orderId], 
        orderTimestampByOrderId[_orderId], 
        orderPbfObatIpfsByOrderId[_orderId]
      ); 
  }
 
  // status: 200ok
  function detailOrderRetailer(string memory _orderId)
    public view returns(
      st_obatOrderRetailer memory,
      st_orderTimestamp memory,
      string[] memory
    ) {
      return (
        orderRetailerById[_orderId], 
        orderTimestampByOrderId[_orderId], 
        orderRetailerObatIpfsByOrderId[_orderId] 
      ); 
  }

  // status: 200ok
  function getAllObatPbfReadyStock()
    public view returns (ObatShared.st_obatOutputStock[] memory){

      return obatShared.getAllObatPbfReadyStock();
  }

  // status: 200ok
  function getAllObatPbfByInstance(string memory _instanceName)
    public view returns (ObatShared.st_obatOutputStock[] memory){

      return obatShared.getAllObatPbfByInstance(_instanceName);
  }

  // status: 200ok
  function getAllObatRetailerByInstance(string memory _instanceName)
    public view returns (ObatShared.st_obatOutputStock[] memory){

      return obatShared.getAllObatRetailerByInstance(_instanceName);
  }
}