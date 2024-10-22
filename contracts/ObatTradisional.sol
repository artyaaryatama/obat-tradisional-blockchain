// SPDX-License-Identifier: MIT
// pragma solidity ^0.8;

// contract ObatTradisional {

//   address public immutable ownerAddr;
//   address public immutable obatId;     

//   enum en_statusObat{ 
//     inProduction,
//     nieRegister,
//     nieApproved,
//     atPabrik,
//     atPbf,
//     atPharmacy
//   }

//   struct st_detailObat{
//     bytes namaProduk;
//     bytes klaim;
//     bytes komposisi;
//     bytes merk;
//     bytes kemasan;
//     bytes namaPabrik;
//     address pabrik;
//   }

//   st_detailObat public detailObat;
//   en_statusObat public statusObat;
  
//   constructor(
//     address _pabrikAddress, 
//     address _obatId,
//     address _pbfAddress,
//     address _bpomAddress,
//     address _apotekAddress,
//   ) {
//     require(
//       _pabrikAddress != address(0) &&
//       _obatId != address(0)
//     ); 

//     ownerAddr = _pabrikAddress;
    
//   }
// }