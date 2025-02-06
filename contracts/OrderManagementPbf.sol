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
  
  struct st_updateInfo {
    string batchName;
    string namaProduk;
    string buyerInstanceName;
    string sellerInstanceName;
    uint8 orderQuantity;
    string obatId;
  }

  using EnumsLibrary for EnumsLibrary.Roles;
  using EnumsLibrary for EnumsLibrary.OrderStatus;
  using EnumsLibrary for EnumsLibrary.ObatAvailability;

  // string[] public allOrderId; 

  // mapping (string => string[]) orderIpfsByOrderId; 
  // mapping (string => st_obatOrder) orderByOrderId;
  // mapping (string => string[]) orderIdbyInstanceBuyer;
  // mapping (string => string[]) orderIdbyInstanceSeller;
  mapping (string => st_updateInfo) updateInfoByOrderId;

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

    createOrder(_orderId, _obatId, _batchName, _namaProduk, _buyerInstance, _sellerInstance, _orderQuantity, "");   

    obatShared.addCdobId(_obatId, _cdobHash);

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

  function acceptOrderPbf(
    string memory _orderId,
    string[] memory _orderObatIpfs
  ) public onlyFactory{ 
    
    acceptOrderPbfFromPabrik(_orderId, _orderObatIpfs);

    obatShared.updateBatchProduction(
      updateInfoByOrderId[_orderId].obatId, 
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

  function completeOrderPbf(
    string memory _orderId,
    string[] memory _orderObatIpfs
  ) public onlyPBF{

    completeOrderPbfFromPabrik(_orderId, _orderObatIpfs);

    obatShared.updateBatchProduction(
      updateInfoByOrderId[_orderId].obatId, 
      updateInfoByOrderId[_orderId].batchName,
       EnumsLibrary.ObatAvailability.Sold
       );

    obatShared.addObatPbf(
      updateInfoByOrderId[_orderId].obatId, 
      _orderId, 
      updateInfoByOrderId[_orderId].namaProduk, 
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

  // order masuk untuk pabrik
  function getOrdersForFactory(string memory _sellerInstance)
    public view returns(st_obatOrder[] memory) {
      return getAllOrderFromSeller(_sellerInstance);
  } 

  function getAllOrderFromPbftoPabrik(string memory _buyerInstance)
    public view returns(st_obatOrder[] memory) {
      return getAllOrderFromBuyer(_buyerInstance);
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
      return detailOrders(_orderId);
  }

  function obatIpfs(string memory _orderId)
    public view returns (string[] memory){
      return detailObatIpfs(_orderId);
  } 

  function getAllObatPbfByInstance(string memory _instanceName)
    public view returns (ObatShared.st_obatOutputStock[] memory){
      return obatShared.getAllObatPbfByInstance(_instanceName);
  }
}