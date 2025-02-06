// // SPDX-License-Identifier: MIT
// pragma solidity ^0.8.0;

// import "./OrderManagement.sol";

// contract OrderReaderExtend is OrderManagement {
//   // status: 200ok
//   function getAllOrderFromBuyer(string memory _buyerInstance)
//     public view override returns(st_obatOrder[] memory) {
//       uint256 count = orderIdbyInstanceBuyer[_buyerInstance].length;

//       st_obatOrder[] memory orders = new st_obatOrder[](count);

//       for (uint i = 0; i < count; i++) {
//         string memory orderId = orderIdbyInstanceBuyer[_buyerInstance][i];

//         orders[i] = orderByOrderId[orderId];
//       }

//       return orders;
//   }

//   // status: 200ok
//   function getAllOrderFromSeller(string memory _sellerInstance)
//     public view override returns(st_obatOrder[] memory) {
//       uint256 count = orderIdbyInstanceSeller[_sellerInstance].length;

//       st_obatOrder[] memory orders = new st_obatOrder[](count);

//       for (uint i = 0; i < count; i++) {
//         string memory orderId = orderIdbyInstanceSeller[_sellerInstance][i];

//         orders[i] = orderByOrderId[orderId];
//       }

//       return orders;
//   }

//   // status: 200ok
//   function detailOrder(string memory _orderId)
//     public view override returns (st_obatOrder memory){
//       return orderByOrderId[_orderId];
//   }
   
//   // status: 200ok
//   function orderTimestamp(string memory _orderId)
//     public view override returns (st_orderTimestamp memory){
//       return orderTimestampByOrderId[_orderId];
//   }
  
//   // status: 200ok
//   function obatIpfs(string memory _orderId)
//     public view override returns (string[] memory){
//       return orderIpfsByOrderId[_orderId];
//   }
// }
