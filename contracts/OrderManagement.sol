// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

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

  modifier onlyRole(EnumsLibrary.Roles role) {
    require(roleManager.hasRole(msg.sender, role), "Unauthorized");
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
    string prevOrderIdPbf;
  }

  struct st_orderTimestamp {
    uint256 timestampOrder;
    uint256 timestampShipped;
    uint256 timestampComplete;  
  }
  
  string[] public allOrderId;

  mapping (string => string[]) orderIpfsByOrderId;
  mapping (string => st_obatOrder) orderByOrderId;
  mapping (string => st_orderTimestamp) orderTimestampByOrderId;
  mapping (string => string[]) orderIdbyInstanceBuyer;
  mapping (string => string[]) orderIdbyInstanceSeller;

  event evt_orderUpdate (string batchName, string namaProduk, string buyerInstanceName, string sellerInstanceName, uint8 orderQuantity, uint256 timestamp); 

  function hasRole(address user, EnumsLibrary.Roles role) internal view returns (bool) {
    return roleManager.hasRole(user, role);
  }


  // status: 200ok
  function getAvailableObatFromFactory ()
    public view onlyRole(EnumsLibrary.Roles.PBF) returns (ObatTradisional.st_obatOutputBatch[] memory) {
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
      st_orderUser memory buyerUser = createOrderUser(_buyerInstance, msg.sender);
      st_orderUser memory sellerUser = createOrderUser(_sellerInstance, address(0));

      allOrderId.push(_orderId); 
      orderIdbyInstanceBuyer[_buyerInstance].push(_orderId);
      orderIdbyInstanceSeller[_sellerInstance].push(_orderId);

      createTimestamp(_orderId);

      if ((roleManager.hasRole(msg.sender, EnumsLibrary.Roles.PBF))) {
        obatShared.addCdobId(_obatId, _cdobHash);
      }

      st_obatOrder memory orderData = st_obatOrder({ 
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

      orderByOrderId[_orderId] = orderData;

      emitOrderUpdate(_orderId);
  }

  // status: 200ok
  function emitOrderUpdate(string memory _orderId)
    internal {

      st_obatOrder memory order;      
      
      order = orderByOrderId[_orderId];

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
  ) public onlyRole(EnumsLibrary.Roles.Factory){ 
    
      st_obatOrder memory obatOrder = orderByOrderId[_orderId];

      orderByOrderId[_orderId].sellerUser.instanceAddr = msg.sender;
      orderByOrderId[_orderId].statusOrder = EnumsLibrary.OrderStatus.OrderShipped;
      orderTimestampByOrderId[_orderId].timestampShipped = block.timestamp;

      delete orderIpfsByOrderId[_orderId];

      for (uint256 i = 0; i < _orderObatIpfs.length; i++) {
        orderIpfsByOrderId[_orderId].push(_orderObatIpfs[i]);
      }

      obatShared.updateBatchProduction(obatOrder.obatId, obatOrder.batchName, _orderObatIpfs);

      emitOrderUpdate(_orderId);
  }
  
  // status: 200ok
  function acceptOrderRetailer(
    string memory _orderId,
    string[] memory _orderObatIpfs
  ) public onlyRole(EnumsLibrary.Roles.PBF){

      st_obatOrder memory obatOrder = orderByOrderId[_orderId];  
 
      orderByOrderId[_orderId].sellerUser.instanceAddr = msg.sender;
      orderByOrderId[_orderId].statusOrder = EnumsLibrary.OrderStatus.OrderShipped;
      orderTimestampByOrderId[_orderId].timestampShipped = block.timestamp;

      delete orderIpfsByOrderId[orderByOrderId[_orderId].prevOrderIdPbf];
      delete orderIpfsByOrderId[_orderId];

      for (uint256 i = 0; i < _orderObatIpfs.length; i++) {
        orderIpfsByOrderId[orderByOrderId[_orderId].prevOrderIdPbf].push(_orderObatIpfs[i]);
        orderIpfsByOrderId[_orderId].push(_orderObatIpfs[i]);
      }  

      obatShared.updateBatchProduction(obatOrder.obatId, obatOrder.batchName, _orderObatIpfs);
      
      obatShared.updateObatPbf(obatOrder.batchName, _orderObatIpfs);

      emitOrderUpdate(_orderId);
  }

  // status: 200ok
  function completeOrderPbf(
    string memory _orderId,
    string[] memory _orderObatIpfs
  ) public onlyRole(EnumsLibrary.Roles.PBF){
   
    st_obatOrder memory obatOrder = orderByOrderId[_orderId];

    orderByOrderId[_orderId].statusOrder = EnumsLibrary.OrderStatus.OrderCompleted;
    orderTimestampByOrderId[_orderId].timestampComplete = block.timestamp;

    delete orderIpfsByOrderId[_orderId];

    for (uint256 i = 0; i < _orderObatIpfs.length; i++) {
      orderIpfsByOrderId[_orderId].push(_orderObatIpfs[i]);
    }

    obatShared.updateBatchProduction(obatOrder.obatId, obatOrder.batchName, _orderObatIpfs);

    obatShared.addObatPbf(obatOrder.obatId, _orderId, obatOrder.namaProduk, obatOrder.batchName, obatOrder.orderQuantity, _orderObatIpfs, obatOrder.buyerUser.instanceName);

    emitOrderUpdate(_orderId);
  }

  // status: 200ok
  function completeOrderRetailer(
    string memory _orderId,
    string[] memory _orderObatIpfs
  ) public onlyRole(EnumsLibrary.Roles.Retailer){

      st_obatOrder memory obatOrder = orderByOrderId[_orderId];  

      orderByOrderId[_orderId].statusOrder = EnumsLibrary.OrderStatus.OrderCompleted;
      orderTimestampByOrderId[_orderId].timestampComplete = block.timestamp;

      delete orderIpfsByOrderId[obatOrder.prevOrderIdPbf];
      delete orderIpfsByOrderId[_orderId];

      for (uint256 i = 0; i < _orderObatIpfs.length; i++) {
        orderIpfsByOrderId[obatOrder.prevOrderIdPbf].push(_orderObatIpfs[i]); 
        orderIpfsByOrderId[_orderId].push(_orderObatIpfs[i]);
      } 

      obatShared.updateBatchProduction(obatOrder.obatId, obatOrder.batchName, _orderObatIpfs);

      obatShared.updateObatPbf(obatOrder.batchName, _orderObatIpfs); 

      obatShared.addObatRetailer(obatOrder.obatId, _orderId, obatOrder.namaProduk, obatOrder.batchName, obatOrder.orderQuantity, _orderObatIpfs, obatOrder.buyerUser.instanceName);

      emitOrderUpdate(_orderId);
  }
  
  // status: 200ok
  function getAllOrderFromBuyer(string memory _buyerInstance)
    public view returns(st_obatOrder[] memory) {
      uint256 count = orderIdbyInstanceBuyer[_buyerInstance].length;

      st_obatOrder[] memory orders = new st_obatOrder[](count);

      for (uint i = 0; i < count; i++) {
        string memory orderId = orderIdbyInstanceBuyer[_buyerInstance][i];

        orders[i] = orderByOrderId[orderId];
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

        orders[i] = orderByOrderId[orderId];
      }

      return orders;
  }

  // status: 200ok
  function detailOrder(string memory _orderId)
    public view returns (st_obatOrder memory){
      return orderByOrderId[_orderId];
  }
  
  // status: 200ok
  function orderTimestamp(string memory _orderId)
    public view returns (st_orderTimestamp memory){
      return orderTimestampByOrderId[_orderId];
  }
  
  // status: 200ok
  function obatIpfs(string memory _orderId)
    public view returns (string[] memory){
      return orderIpfsByOrderId[_orderId];
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