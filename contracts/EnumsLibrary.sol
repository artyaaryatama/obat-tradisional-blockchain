// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library EnumsLibrary {
  enum NieStatus { 
    inLocalProduction, 
    RequestedNie, 
    ApprovedNie, 
    RejectedNie, 
    RenewRequestNie,
    ExpiredNie,
    ExtendRequestNie,
    extendedNie
  } 

  enum OrderStatus { 
    OrderPlaced, 
    OrderShipped, 
    OrderCompleted 
  }

  enum StatusCertificate { 
    Requested, 
    Approved, 
    Rejected, 
    RenewRequest, 
    Expired,
    ExtendRequest, 
    Extended
  }

  enum ObatAvailability { 
    Ready, 
    Sold 
  }

  enum Roles { 
    Factory, 
    PBF, 
    BPOM, 
    Retailer 
  }

  enum TipePermohonanCdob { 
    ObatLain, 
    CCP 
  }
}