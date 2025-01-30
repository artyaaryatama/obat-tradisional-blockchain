// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library EnumsLibrary {
    enum NieStatus { inLocalProduction, RequestedNie, ApprovedNie, RejectedNie, RenewRequestNie } 
    enum OrderStatus { OrderPlaced, OrderShipped, OrderCompleted }
    enum StatusCertificate { Requested, Approved, Rejected, RenewRequest }
    enum ObatAvailability { Ready, Sold }
    enum Roles { Factory, PBF, BPOM, Retailer }
    enum TipePermohonanCdob { ObatLain, CCP }
}