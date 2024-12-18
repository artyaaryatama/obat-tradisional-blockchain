// SPDX-License-Identifier: MIT
// pragma solidity ^0.8.0;

// import "./OrderManagement.sol";
// import "./ObatShared.sol";

// contract OrderShared {

//   ObatShared public obatShared;
//   OrderManagement public orderManagement;
  
//   constructor(address _obatShared, address _orderManagement) {
//     obatShared = ObatShared(_obatShared);
//     orderManagement = OrderManagement(_orderManagement);
//   }

//   struct st_obatOrder {
//     string orderId;
//     string obatId;
//     string namaProduk;
//     string batchName;
//     uint8 orderQuantity;
//     st_orderUser buyerUser;
//     st_orderUser sellerUser;
//     EnumsLibrary.OrderStatus statusOrder; 
//   }

//   struct st_obatOrderRetailer {
//     string prevOrderIdPbf;
//     string orderId;
//     string obatId;
//     string namaProduk;
//     string batchName;
//     uint8 orderQuantity;
//     st_orderUser buyerUser;
//     st_orderUser sellerUser;
//     EnumsLibrary.OrderStatus statusOrder; 
//   }

//   string[] public allOrderId;

//   mapping (string => string[]) orderIdbyInstanceBuyer;
//   mapping (string => string[]) orderIdbyInstanceSeller;

//   function getAllgetAllOrderFromBuyer(
//     string memory _buyerInstance,
//     string memory _orderId
//   ) external view returns(OrderManagement.st_obatOrder[] memory){

//   }
// }