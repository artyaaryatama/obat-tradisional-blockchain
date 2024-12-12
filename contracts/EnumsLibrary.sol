// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library EnumsLibrary {
    enum NieStatus { inLocalProduction, RequestedNIE, ApprovedNIE } 
    enum OrderStatus { OrderPlaced, OrderShipped, OrderCompleted }
    enum StatusCertificate { Requested, Approved }
    enum ObatAvailability { ready, sold }
    enum Roles { Factory, PBF, BPOM, Retailer }
    enum TipeProduk { obatTradisional, suplemenKesehatan }
    enum TipePermohonanCpotb { Tablet, Kapsul, KapsulLunak, SerbukOral, CairanOral, CairanObatDalam, CairanObatLuar, EdibleFilm, Pil }
    enum TipePermohonanCdob { ObatLain, CCP }
}