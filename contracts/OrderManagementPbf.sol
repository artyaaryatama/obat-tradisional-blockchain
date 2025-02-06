// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./RoleManager.sol";
import "./ObatTradisional.sol";
import "./CdobCertificate.sol";
import "./EnumsLibrary.sol";
import "./ObatShared.sol";
import "./BaseOrderManagement.sol";

contract OrderManagementPbf is BaseOrderManagement{    

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

  modifier onlyPBF() {
    require(roleManager.hasRole(msg.sender, EnumsLibrary.Roles.PBF), "Only PBF can do this transaction!");
    _; 
  }

  modifier onlyFactory() { 
    require(roleManager.hasRole(msg.sender, EnumsLibrary.Roles.Factory), "Only Factory can do this transaction!");
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

  function getAvailableObatFromFactory ()
    public view onlyPBF returns (ObatTradisional.st_obatOutputBatch[] memory) {
      return obatTradisional.getAllBatchProductionReadyStock();
  }

  function createOrderPbf(
    string memory _orderId,
    string memory _obatId,
    string memory _batchName,
    string memory _namaProduk,
    string memory _buyerInstance,
    string memory _sellerInstance,
    uint8 _orderQuantity,
    string memory _cdobHash
  ) public onlyPBF{
    st_orderUser memory buyerUser = createOrderUser(_buyerInstance, msg.sender);
    st_orderUser memory sellerUser = createOrderUser(_sellerInstance, address(0));

    allOrderId.push(_orderId); 
    orderIdbyInstanceBuyer[_buyerInstance].push(_orderId);
    orderIdbyInstanceSeller[_sellerInstance].push(_orderId);

    createTimestamp(_orderId);

    obatShared.addCdobId(_obatId, _cdobHash);

    st_obatOrder memory orderData = st_obatOrder({ 
      orderId: _orderId,
      obatId: _obatId,
      namaProduk: _namaProduk,
      batchName: _batchName,
      orderQuantity: _orderQuantity,
      buyerUser: buyerUser,
      sellerUser: sellerUser,
      statusOrder: EnumsLibrary.OrderStatus.OrderPlaced,
      prevOrderIdPbf: ""
    });

    orderByOrderId[_orderId] = orderData;

    emit evt_orderUpdate(_batchName, _namaProduk, _buyerInstance, _sellerInstance, _orderQuantity, block.timestamp); 
  }

  function acceptOrderPbf(
    string memory _orderId,
    string[] memory _orderObatIpfs
  ) public onlyFactory{ 
    
    st_obatOrder memory obatOrder = orderByOrderId[_orderId];

    orderByOrderId[_orderId].sellerUser.instanceAddr = msg.sender;
    orderByOrderId[_orderId].statusOrder = EnumsLibrary.OrderStatus.OrderShipped;
    orderTimestampByOrderId[_orderId].timestampShipped = block.timestamp;

    delete orderIpfsByOrderId[_orderId];

    for (uint256 i = 0; i < _orderObatIpfs.length; i++) {
      orderIpfsByOrderId[_orderId].push(_orderObatIpfs[i]);
    }

    obatShared.updateBatchProduction(obatOrder.obatId, obatOrder.batchName, _orderObatIpfs);

    emit evt_orderUpdate(
      orderByOrderId[_orderId].batchName, 
      orderByOrderId[_orderId].namaProduk, 
      orderByOrderId[_orderId].buyerUser.instanceName,   
      orderByOrderId[_orderId].sellerUser.instanceName, 
      orderByOrderId[_orderId].orderQuantity,  
      block.timestamp);  
  }

  function completeOrderPbf(
    string memory _orderId,
    string[] memory _orderObatIpfs
  ) public onlyPBF{
   
    st_obatOrder memory obatOrder = orderByOrderId[_orderId];

    orderByOrderId[_orderId].statusOrder = EnumsLibrary.OrderStatus.OrderCompleted;
    orderTimestampByOrderId[_orderId].timestampComplete = block.timestamp;

    delete orderIpfsByOrderId[_orderId];

    for (uint256 i = 0; i < _orderObatIpfs.length; i++) {
      orderIpfsByOrderId[_orderId].push(_orderObatIpfs[i]);
    }

    obatShared.updateBatchProduction(obatOrder.obatId, obatOrder.batchName, _orderObatIpfs);

    obatShared.addObatPbf(obatOrder.obatId, _orderId, obatOrder.namaProduk, obatOrder.batchName, obatOrder.orderQuantity, _orderObatIpfs, obatOrder.buyerUser.instanceName);

    emit evt_orderUpdate(
      obatOrder.batchName, 
      obatOrder.namaProduk, 
      obatOrder.buyerUser.instanceName,   
      obatOrder.sellerUser.instanceName, 
      obatOrder.orderQuantity,  
      block.timestamp);  
  }

  // order masuk untuk pabrik
  function getOrdersForFactory(string memory _sellerInstance)
    public view returns(st_obatOrder[] memory) {
      uint256 count = orderIdbyInstanceSeller[_sellerInstance].length;

      st_obatOrder[] memory orders = new st_obatOrder[](count);

      for (uint i = 0; i < count; i++) {
        string memory orderId = orderIdbyInstanceSeller[_sellerInstance][i];

        orders[i] = orderByOrderId[orderId];
      }

      return orders;
  }

  function getAllOrderFromPbftoPabrik(string memory _buyerInstance)
    public view returns(st_obatOrder[] memory) {
      uint256 count = orderIdbyInstanceBuyer[_buyerInstance].length;

      st_obatOrder[] memory orders = new st_obatOrder[](count);

      for (uint i = 0; i < count; i++) {
        string memory orderId = orderIdbyInstanceBuyer[_buyerInstance][i];

        orders[i] = orderByOrderId[orderId];
      }

      return orders;
  }

  function getAllObatPbfReadyStock()
    public view returns (ObatShared.st_obatOutputStock[] memory){

      return obatShared.getAllObatPbfReadyStock();
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

  function getAllObatPbfByInstance(string memory _instanceName)
    public view returns (ObatShared.st_obatOutputStock[] memory){

      return obatShared.getAllObatPbfByInstance(_instanceName);
  }
}