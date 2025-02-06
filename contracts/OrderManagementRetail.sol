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

  struct st_updateInfo {
    string batchName;
    string namaProduk;
    string buyerInstanceName;
    string sellerInstanceName;
    uint8 orderQuantity;
    string obatId;
  }

  mapping (string => st_updateInfo) updateInfoByOrderId;

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
    
    createOrder(_orderId, _obatId, _batchName, _namaProduk, _buyerInstance, _sellerInstance, _orderQuantity, _prevOrderIdPbf);  

    updateInfoByOrderId[_orderId] = st_updateInfo({
      batchName: _batchName,
      namaProduk: _namaProduk,
      buyerInstanceName: _buyerInstance,
      sellerInstanceName: _sellerInstance,
      orderQuantity: _orderQuantity,
      obatId: _obatId
    }); 

    emit evt_orderUpdate(_batchName, _namaProduk, _buyerInstance, _sellerInstance, _orderQuantity, block.timestamp); 
  }

  function acceptOrderRetailer(
    string memory _orderId,
    string[] memory _orderObatIpfs
  ) public onlyPBF{

    acceptOrderRetailerFromPbf( _orderId, block.timestamp);  

    updateOrderIpfs(_orderId, _orderObatIpfs);

    obatShared.updateObatPbf(
      updateInfoByOrderId[_orderId].batchName,
      EnumsLibrary.ObatAvailability.Sold 
      );  
    obatShared.updateObatIpfs(
      updateInfoByOrderId[_orderId].batchName,
      _orderObatIpfs
      ); 
    
    emit evt_orderUpdate(
      updateInfoByOrderId[_orderId].batchName, 
      updateInfoByOrderId[_orderId].namaProduk, 
      updateInfoByOrderId[_orderId].buyerInstanceName,   
      updateInfoByOrderId[_orderId].sellerInstanceName, 
      updateInfoByOrderId[_orderId].orderQuantity,  
      block.timestamp);  
  }

  function completeOrderRetailer(
    string memory _orderId,
    string[] memory _orderObatIpfs
  ) public onlyRetail{

    completeOrderRetailerFromPbf(_orderId, block.timestamp);
    updateOrderIpfs(_orderId, _orderObatIpfs);

    obatShared.updateObatPbf(
      updateInfoByOrderId[_orderId].batchName,
      EnumsLibrary.ObatAvailability.Sold 
      ); 

    obatShared.updateObatIpfs(
      updateInfoByOrderId[_orderId].batchName,
      _orderObatIpfs
      ); 

    obatShared.addObatRetailer(
      updateInfoByOrderId[_orderId].obatId, 
      _orderId, updateInfoByOrderId[_orderId].namaProduk, 
      updateInfoByOrderId[_orderId].batchName, 
      updateInfoByOrderId[_orderId].orderQuantity,
      updateInfoByOrderId[_orderId].buyerInstanceName); 

    obatShared.updateObatIpfs(
      updateInfoByOrderId[_orderId].batchName,
      _orderObatIpfs
      ); 

    emit evt_orderUpdate(
      updateInfoByOrderId[_orderId].batchName, 
      updateInfoByOrderId[_orderId].namaProduk, 
      updateInfoByOrderId[_orderId].buyerInstanceName,   
      updateInfoByOrderId[_orderId].sellerInstanceName, 
      updateInfoByOrderId[_orderId].orderQuantity,  
      block.timestamp);  
  }

  // order masuk untuk pbf
  function getOrdersForPbf(string memory _sellerInstance)
    public view returns(st_obatOrder[] memory) {
      return getAllOrderFromSeller(_sellerInstance);
  }

  function getAllOrderRetailByInstance(string memory _buyerInstance)
    public view  returns(st_obatOrder[] memory) {
      return getAllOrderFromBuyer(_buyerInstance);
  }

  function detailTimestamp(string memory _orderId)
    public view returns (st_orderTimestamp memory){
      return orderTimestamp(_orderId);
  }

  function detailOrder(string memory _orderId)
    public view returns (st_obatOrder memory){
      return detailOrders(_orderId);
  }

  function obatIpfs(string memory _orderId)
    public view returns (string[] memory){
      return detailObatIpfs(_orderId);
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