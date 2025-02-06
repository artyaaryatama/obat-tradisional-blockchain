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

  mapping (string => st_orderTimestamp) orderTimestampByOrderId;

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

  function orderTimestamp(string memory _orderId)
    public view returns (st_orderTimestamp memory){
      return orderTimestampByOrderId[_orderId];
  }
}