// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./EnumsLibrary.sol";

contract BaseOrderManagement{
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


  struct st_test{
    string orderId;
    string[] ipfs;
  }  
  event testBatch_pbf (st_test, st_test);
  event testOrderId(string _orderId,string  prevId); 


  mapping (string => st_orderTimestamp) orderTimestampByOrderId;
  mapping (string => string[]) orderIpfsByOrderId;
  mapping (string => st_obatOrder) orderByOrderId;
  mapping (string => string[]) orderIdbyInstanceBuyer;
  mapping (string => string[]) orderIdbyInstanceSeller;

  function createOrderUser (
    string memory _instanceName,
    address _instanceAddr
  ) internal pure returns (st_orderUser memory){
      return st_orderUser({  
        instanceName: _instanceName,
        instanceAddr: _instanceAddr
      });
  }

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

  function createOrder(
    string memory _orderId, 
    string memory _obatId,
    string memory _batchName,
    string memory _namaProduk,
    string memory _buyerInstance,
    string memory _sellerInstance,
    uint8 _orderQuantity,
    string memory _prevOrderPbf
  ) internal {
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
      prevOrderIdPbf: _prevOrderPbf
    });

    orderByOrderId[_orderId] = orderData;
  }

  function acceptOrderPbfFromPabrik(
    string memory _orderId,
    string[] memory _orderObatIpfs
  ) internal { 

    emit test ('INI KEPANGGIL COMPLETE DRI BASE ORDER');

    orderByOrderId[_orderId].sellerUser.instanceAddr = msg.sender;
    orderByOrderId[_orderId].statusOrder = EnumsLibrary.OrderStatus.OrderShipped;
    orderTimestampByOrderId[_orderId].timestampShipped = block.timestamp;

    delete orderIpfsByOrderId[_orderId];

    for (uint256 i = 0; i < _orderObatIpfs.length; i++) {
      orderIpfsByOrderId[_orderId].push(_orderObatIpfs[i]);
    } 
  }

  function completeOrderPbfFromPabrik(
    string memory _orderId,
    string[] memory _orderObatIpfs 
  ) internal {

    emit test ('INI KEPANGGIL COMPLETE DRI BASE ORDER');

    orderByOrderId[_orderId].statusOrder = EnumsLibrary.OrderStatus.OrderCompleted;
    orderTimestampByOrderId[_orderId].timestampComplete = block.timestamp;

    delete orderIpfsByOrderId[_orderId];

    for (uint256 i = 0; i < _orderObatIpfs.length; i++) {
      orderIpfsByOrderId[_orderId].push(_orderObatIpfs[i]);
    } 
  } 

  function acceptOrderRetailerFromPbf(
    string memory _orderId,
    uint256 _timestampAccept,
    string[] memory _orderObatIpfs
  ) internal {
    emit test ('INI KEPANGGIL COMPLETE DRI BASE ORDER');

    orderByOrderId[_orderId].statusOrder = EnumsLibrary.OrderStatus.OrderShipped;
    orderTimestampByOrderId[_orderId].timestampShipped = _timestampAccept; 

     st_test memory batchpbf = st_test({
      orderId: orderByOrderId[_orderId].prevOrderIdPbf,
      ipfs: _orderObatIpfs
    });

    st_test memory batchret= st_test({ 
      orderId: _orderId,
      ipfs: _orderObatIpfs
    });
     
    delete orderIpfsByOrderId[orderByOrderId[_orderId].prevOrderIdPbf];
    delete orderIpfsByOrderId[_orderId];

    for (uint256 i = 0; i < _orderObatIpfs.length; i++) {
      orderIpfsByOrderId[orderByOrderId[_orderId].prevOrderIdPbf].push(_orderObatIpfs[i]);
      orderIpfsByOrderId[_orderId].push(_orderObatIpfs[i]);
    }   

    emit testBatch_pbf(batchpbf, batchret);
    emit testOrderId(_orderId, orderByOrderId[_orderId].prevOrderIdPbf); 
  } 
  event test (string msg);
  function completeOrderRetailerFromPbf(
    string memory _orderId,
    uint256 _timestamp, 
    string[] memory _orderObatIpfs 
  ) internal{
    emit test ('INI KEPANGGIL COMPLETE DRI BASE ORDER');
    orderByOrderId[_orderId].statusOrder = EnumsLibrary.OrderStatus.OrderCompleted;
    orderTimestampByOrderId[_orderId].timestampComplete = _timestamp;  

     st_test memory batchpbf = st_test({
      orderId: orderByOrderId[_orderId].prevOrderIdPbf,
      ipfs: _orderObatIpfs 
    });

    st_test memory batchret= st_test({ 
      orderId: _orderId,
      ipfs: _orderObatIpfs
    });
    
    delete orderIpfsByOrderId[orderByOrderId[_orderId].prevOrderIdPbf];
    delete orderIpfsByOrderId[_orderId];

    for (uint256 i = 0; i < _orderObatIpfs.length; i++) {
      orderIpfsByOrderId[orderByOrderId[_orderId].prevOrderIdPbf].push(_orderObatIpfs[i]);
      orderIpfsByOrderId[_orderId].push(_orderObatIpfs[i]);
    }   

    emit testBatch_pbf(batchpbf, batchret);
    emit testOrderId(_orderId, orderByOrderId[_orderId].prevOrderIdPbf);
  }
 
 function updateOrderIpfs(
    string memory _orderId,
    string[] memory _orderObatIpfs
  ) public {

    st_test memory batchpbf = st_test({
      orderId: orderByOrderId[_orderId].prevOrderIdPbf,
      ipfs: _orderObatIpfs
    });

    st_test memory batchret= st_test({ 
      orderId: _orderId,
      ipfs: _orderObatIpfs
    });

    emit testBatch_pbf(batchpbf, batchret);
    emit testOrderId(_orderId, orderByOrderId[_orderId].prevOrderIdPbf); 
    
    delete orderIpfsByOrderId[orderByOrderId[_orderId].prevOrderIdPbf];
    delete orderIpfsByOrderId[_orderId];

    for (uint256 i = 0; i < _orderObatIpfs.length; i++) {
      orderIpfsByOrderId[orderByOrderId[_orderId].prevOrderIdPbf].push(_orderObatIpfs[i]);
      orderIpfsByOrderId[_orderId].push(_orderObatIpfs[i]);
    }   

  }

  function getAllOrderFromSeller(string memory _sellerInstance)
    internal view returns(st_obatOrder[] memory) {
      uint256 count = orderIdbyInstanceSeller[_sellerInstance].length;
 
      st_obatOrder[] memory orders = new st_obatOrder[](count);

      for (uint i = 0; i < count; i++) {
        string memory orderId = orderIdbyInstanceSeller[_sellerInstance][i];

        orders[i] = orderByOrderId[orderId];
      }

      return orders;
  }

  function getAllOrderFromBuyer(string memory _buyerInstance)
    internal view returns(st_obatOrder[] memory) {
      uint256 count = orderIdbyInstanceBuyer[_buyerInstance].length;

      st_obatOrder[] memory orders = new st_obatOrder[](count);

      for (uint i = 0; i < count; i++) {
        string memory orderId = orderIdbyInstanceBuyer[_buyerInstance][i];

        orders[i] = orderByOrderId[orderId];
      }

      return orders;
  }

  function detailOrders(string memory _orderId)
    internal view returns (st_obatOrder memory){
      return orderByOrderId[_orderId];
  }

  function orderTimestamp(string memory _orderId)
    internal view returns (st_orderTimestamp memory){
      return orderTimestampByOrderId[_orderId];
  }

  function detailObatIpfs(string memory _orderId)
    internal view returns (string[] memory){
      return orderIpfsByOrderId[_orderId];
  } 
} 