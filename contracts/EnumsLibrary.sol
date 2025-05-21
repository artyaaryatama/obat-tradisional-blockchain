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
    ExtendApproveNie,
    ExtendRejectNIE,
    ExtendRenewNie
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
    ExtendApprove,
    ExtendReject,
    ExtendRenew
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