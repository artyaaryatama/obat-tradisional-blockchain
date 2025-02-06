// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./RoleManager.sol";
import "./EnumsLibrary.sol";
import "./ObatShared.sol";
import "./BaseOrderManagement.sol";

contract OrderManagementRetail is BaseOrderManagement{    

  RoleManager public roleManager;
  ObatShared public obatShared;
 
  constructor(address _roleManagerAddr, address _obatSharedAddr) {
    roleManager = RoleManager(_roleManagerAddr);
    obatShared = ObatShared(_obatSharedAddr);
  }

  modifier onlyPBF() {
    require(roleManager.hasRole(msg.sender, EnumsLibrary.Roles.PBF), "Only PBF can do this transaction!");
    _; 
  }

  modifier onlyRetail() { 
    require(roleManager.hasRole(msg.sender, EnumsLibrary.Roles.Retailer), "Only Retailer can do this transaction!");
    _;
  } 

  using EnumsLibrary for EnumsLibrary.Roles;
  using EnumsLibrary for EnumsLibrary.OrderStatus;
  using EnumsLibrary for EnumsLibrary.ObatAvailability;

  string[] public allOrderId;

  mapping (string => string[]) orderIpfsByOrderId;
  mapping (string => st_obatOrder) orderByOrderId;
  mapping (string => string[]) orderIdbyInstanceBuyer;
  mapping (string => string[]) orderIdbyInstanceSeller;

  event evt_orderUpdate (string batchName, string namaProduk, string buyerInstanceName, string sellerInstanceName, uint8 orderQuantity, uint256 timestamp); 

  function createOrderRetail(
    string memory _prevOrderIdPbf,
    string memory _orderId,
    string memory _obatId,
    string memory _batchName,
    string memory _namaProduk,
    string memory _buyerInstance,
    string memory _sellerInstance,
    uint8 _orderQuantity
  ) public onlyRetail{
    st_orderUser memory buyerUser = createOrderUser(_buyerInstance, msg.sender);
    st_orderUser memory sellerUser = createOrderUser(_sellerInstance, address(0));

    allOrderId.push(_orderId); 
    orderIdbyInstanceBuyer[_buyerInstance].push(_orderId);
    orderIdbyInstanceSeller[_sellerInstance].push(_orderId);

    createTimestamp(_orderId);

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

    emit evt_orderUpdate(_batchName, _namaProduk, _buyerInstance, _sellerInstance, _orderQuantity, block.timestamp); 
  }

  function acceptOrderRetailer(
    string memory _orderId,
    string[] memory _orderObatIpfs
  ) public onlyPBF{

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

    emit evt_orderUpdate(
      obatOrder.batchName, 
      obatOrder.namaProduk, 
      obatOrder.buyerUser.instanceName,   
      obatOrder.sellerUser.instanceName, 
      obatOrder.orderQuantity,  
      block.timestamp);  
  }

  function completeOrderRetailer(
    string memory _orderId,
    string[] memory _orderObatIpfs
  ) public onlyRetail{

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

      emit evt_orderUpdate(
        obatOrder.batchName, 
        obatOrder.namaProduk, 
        obatOrder.buyerUser.instanceName,   
        obatOrder.sellerUser.instanceName, 
        obatOrder.orderQuantity,  
        block.timestamp);  
  }

  // order masuk untuk pbf
  function getOrdersForPbf(string memory _sellerInstance)
    public view returns(st_obatOrder[] memory) {
      uint256 count = orderIdbyInstanceSeller[_sellerInstance].length;

      st_obatOrder[] memory orders = new st_obatOrder[](count);

      for (uint i = 0; i < count; i++) {
        string memory orderId = orderIdbyInstanceSeller[_sellerInstance][i];

        orders[i] = orderByOrderId[orderId];
      }

      return orders;
  }

  function getAllOrderRetailByInstance(string memory _buyerInstance)
    public view  returns(st_obatOrder[] memory) {
      uint256 count = orderIdbyInstanceBuyer[_buyerInstance].length;

      st_obatOrder[] memory orders = new st_obatOrder[](count);

      for (uint i = 0; i < count; i++) {
        string memory orderId = orderIdbyInstanceBuyer[_buyerInstance][i];

        orders[i] = orderByOrderId[orderId];
      }

      return orders;
  }

  function detailTimestamp(string memory _orderId)
    public view returns (st_orderTimestamp memory){
      return orderTimestamp(_orderId);
  }

  function detailOrder(string memory _orderId)
    public view returns (st_obatOrder memory){
      return orderByOrderId[_orderId];
  }

  function obatIpfs(string memory _orderId)
    public view returns (string[] memory){
      return orderIpfsByOrderId[_orderId];
  }

  function getAllObatPbfReadyStock()
    public view returns (ObatShared.st_obatOutputStock[] memory){

      return obatShared.getAllObatPbfReadyStock();
  } 

  function getAllObatRetailerByInstance(string memory _instanceName)
    public view returns (ObatShared.st_obatOutputStock[] memory){

      return obatShared.getAllObatRetailerByInstance(_instanceName);
  }

}