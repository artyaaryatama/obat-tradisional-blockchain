// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library EnumsLibrary {
    enum NieStatus { inLocalProduction, RequestedNie, ApprovedNie } 
    enum OrderStatus { OrderPlaced, OrderShipped, OrderCompleted }
    enum StatusCertificate { Requested, Approved }
    enum ObatAvailability { Ready, Sold }
    enum Roles { Factory, PBF, BPOM, Retailer }
    // enum TipePermohonanCpotb { Tablet, Kapsul, KapsulLunak, SerbukOral, CairanOral, CairanObatDalam, CairanObatLuar, EdibleFilm, Pil }
    enum TipePermohonanCdob { ObatLain, CCP }
}