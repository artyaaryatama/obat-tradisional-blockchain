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

  mapping (string => string[]) orderObatIpfsByOrderId;
  mapping (string => st_obatOrder) orderObatByOrderId;
  mapping (string => st_orderTimestamp) orderTimestampByOrderId;
  mapping (string => string[]) orderIdbyInstanceBuyer;
  mapping (string => string[]) orderIdbyInstanceSeller;
  mapping (string => string[]) obatPbfbyObatId;

  event evt_orderUpdate (string namaProduk, string buyerInstanceName, string sellerInstanceName, uint8 orderQuantity, uint256 timestamp);

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
  function createOrder (
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

    st_obatOrder memory newOrder = st_obatOrder({
      orderId: _orderId,
      obatId: _obatId,
      namaProduk: _namaProduk,
      batchName: _batchName,
      orderQuantity: _orderQuantity,
      buyerUser: buyerUser,
      sellerUser: sellerUser,
      statusOrder: EnumsLibrary.OrderStatus.OrderPlaced
    });

    orderObatByOrderId[_orderId] = newOrder;
    allOrderId.push(_orderId); 
  
    orderIdbyInstanceBuyer[_buyerInstance].push(_orderId);
    orderIdbyInstanceSeller[_sellerInstance].push(_orderId);

    createTimestamp(_orderId);
    emitOrderUpdate(_orderId);
  }

  // status: 200ok
  function emitOrderUpdate(string memory _orderId)
    internal {
      st_obatOrder memory order = orderObatByOrderId[_orderId];

      emit evt_orderUpdate(
        order.namaProduk, 
        order.buyerUser.instanceName, 
        order.sellerUser.instanceName,
        order.orderQuantity,
        block.timestamp
      );
  }
  
  // status: 200ok
  function acceptOrder(
    string memory _orderId,
    string[] memory _orderObatIpfs
  ) public {

    require(bytes(orderObatByOrderId[_orderId].orderId).length > 0, "ID Invalid");

    string memory obatId = orderObatByOrderId[_orderId].obatId;

    orderObatByOrderId[_orderId].sellerUser.instanceAddr = msg.sender;
    orderObatByOrderId[_orderId].statusOrder = EnumsLibrary.OrderStatus.OrderShipped;
    orderTimestampByOrderId[_orderId].timestampShipped = block.timestamp;

    delete orderObatIpfsByOrderId[_orderId];

    for (uint256 i = 0; i < _orderObatIpfs.length; i++) {
      orderObatIpfsByOrderId[_orderId].push(_orderObatIpfs[i]);
    }

    obatShared.updateBatchProduction(obatId, orderObatByOrderId[_orderId].batchName, _orderObatIpfs);

    emitOrderUpdate(_orderId);
  }

  function completeOrder(
    string memory _orderId,
    string[] memory _orderObatIpfs
  ) public {
    require(bytes(orderObatByOrderId[_orderId].orderId).length > 0, "ID Invalid");
   
    st_obatOrder memory obatOrder = orderObatByOrderId[_orderId];

    orderObatByOrderId[_orderId].statusOrder = EnumsLibrary.OrderStatus.OrderCompleted;
    orderTimestampByOrderId[_orderId].timestampComplete = block.timestamp;

    delete orderObatIpfsByOrderId[_orderId];
    for (uint256 i = 0; i < _orderObatIpfs.length; i++) {
      orderObatIpfsByOrderId[_orderId].push(_orderObatIpfs[i]);
    }

    obatShared.updateBatchProduction(obatOrder.obatId, obatOrder.batchName, _orderObatIpfs);

    obatShared.addObatPbf(obatOrder.obatId, obatOrder.namaProduk, obatOrder.batchName, obatOrder.orderQuantity, _orderObatIpfs, obatOrder.buyerUser.instanceName);

    emitOrderUpdate(_orderId);
  }
  
  // status: 200ok
  function getAllOrderFromBuyer(string memory _buyerInstance)
    public view returns(st_obatOrder[] memory) {
      uint256 count = orderIdbyInstanceBuyer[_buyerInstance].length;

      st_obatOrder[] memory orders = new st_obatOrder[](count);

      for (uint i = 0; i < count; i++) {
        string memory orderId = orderIdbyInstanceBuyer[_buyerInstance][i];

        orders[i] = orderObatByOrderId[orderId];
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

        orders[i] = orderObatByOrderId[orderId];
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
      return (orderObatByOrderId[_orderId], orderTimestampByOrderId[_orderId], orderObatIpfsByOrderId[_orderId]); 
  }

  function getAllObatPbfReadyStock()
    public view returns (ObatShared.st_obatOutputStock[] memory){

      return obatShared.getAllObatPbfReadyStock();

  }
}