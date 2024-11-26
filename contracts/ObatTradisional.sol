// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./RoleManager.sol";
import "./MainSupplyChain.sol";
 
contract ObatTradisional {

  RoleManager public roleManager;
  MainSupplyChain public mainSupplyChain; 

  constructor(address _roleManagerAddr, address _mainSupplyChainAddr) {
    roleManager = RoleManager(_roleManagerAddr);
    mainSupplyChain = MainSupplyChain(_mainSupplyChainAddr);
  }

  modifier onlyFactory() { 
    require(roleManager.hasRole(msg.sender, RoleManager.en_roles.Pabrik), "Access restricted to Pabrik role");
    _;
  } 

  modifier onlyPBF() {
    require(roleManager.hasRole(msg.sender, RoleManager.en_roles.PBF), "Access restricted to PBF role");
    _;
  }

  modifier onlyRetailer() {
    require(roleManager.hasRole(msg.sender, RoleManager.en_roles.Retailer), "Access restricted to Retailer role");
    _;
  }

  modifier onlyBPOM() {
    require(roleManager.hasRole(msg.sender, RoleManager.en_roles.BPOM), "Access restricted to BPOM role");
    _;
  }

  enum en_nieStatus { inLocalProduction, RequestedNIE, ApprovedNIE }
  enum en_orderStatus { OrderProcessed, OrderShipment, OrderCompleted }
  enum en_obatAvailability { ready, sold }
  enum en_roles { Pabrik, PBF, BPOM, Retailer }
  enum en_tipeProduk {obatTradisional, suplemenKesehatan}
  enum en_jenisSediaan { Tablet, Kapsul, KapsulLunak, SerbukOral, CairanOral, CairanObatDalam, CairanObatLuar, FilmStrip, Pil}

  struct st_obatDetails {
    string obatId;
    string merk;
    string namaProduk;
    string[] klaim;
    string kemasan; 
    string[] komposisi;
    en_tipeProduk tipeProduk;
    en_nieStatus obatStatus;      
    uint256 nieRequestDate;       
    uint256 nieApprovalDate;        
    string nieNumber; 
  }

  struct st_obatProduction {
    string batchName;
    string obatId; // untuk collect data pabrik, sm detail obat kyk nie, klaim dst
    string namaProduk;
    uint8 obatQuantity;
    string factoryInstanceNames;
    string[] obatIpfsHash;
  }

  struct st_orderObat {
    string orderId;
    string namaProduk;
    string obatIdProduk;
    uint8 orderQuantity;
    string instanceName;
    address instanceAddr;
    en_orderStatus orderStatus;
    uint latestTimestamp;
    string[] orderObatIpfsHash;
  }

  st_obatDetails[] public allObatData;
  st_obatProduction[] public allProducedObat;
  st_orderObat[] public allOrderedObat;

  mapping(string => address) public bpomAddresses;
  mapping(string => string) public bpomInstanceNames;
  mapping(string => string) public bpomUserNames;
  mapping(string => address) public factoryAddresses;
  mapping(string => string) public factoryInstanceNames;
  mapping(string => string) public factoryUserNames;

  mapping (address => en_roles) public userRoles;
  mapping (string => st_obatDetails) public obatDetailsById;
  mapping (string => st_obatProduction) public obatProductionDetailsById;

  mapping (string => st_orderObat) public orderObatById; 

  event evt_obatCreated(string namaProduk, string factoryInstanceNames, string factoryUserNames, address factoryAddresses, string kemasan, en_tipeProduk en_tipeProduk);
  event evt_nieRequested(string obatId, uint timestampRequested, string namaProduk);
  event evt_nieApproved(string nieNumber, string namaProduk);
  event evt_obatProduced(string namaProduk, uint8 quantity, string batchNamee);
  event evt_obatOrdered(string namaProduk, uint8 quantity, string orderId, string instanceName, address instanceAddress, uint latestTimestamp );

  function getJenisSediaanAvail(string memory _factoryInstanceName)
  public view returns(uint8[] memory) {
     uint8[] memory approvedJenisSediaan = mainSupplyChain.hasApprovedCpotb(_factoryInstanceName); 

     return approvedJenisSediaan;
  } 

  function createObat(
    string memory _obatId,
    string memory _merk,
    string memory _namaProduk,
    string[] memory _klaim,
    string memory _kemasan,
    string[] memory _komposisi,
    address _factoryAddr,
    string memory _factoryInstanceName,
    string memory _factoryUserName,
    en_tipeProduk _tipeProduk
  ) public onlyFactory {
    st_obatDetails memory newObatDetails = st_obatDetails({
      obatId: _obatId,
      merk: _merk,
      namaProduk: _namaProduk,
      klaim: _klaim, 
      kemasan: _kemasan,
      komposisi: _komposisi,
      tipeProduk: _tipeProduk,
      // obatStatus: en_nieStatus.inLocalProduction,
      obatStatus: en_nieStatus.ApprovedNIE,
      nieRequestDate: 0,
      nieApprovalDate: 0,  
      // nieNumber: ""
      nieNumber: "TETSDFSDF"
    });
 
    obatDetailsById[_obatId] = newObatDetails;
    allObatData.push(newObatDetails);

    // Save factory details
    factoryAddresses[_obatId] = _factoryAddr;
    factoryInstanceNames[_obatId] = _factoryInstanceName;
    factoryUserNames[_obatId] = _factoryUserName;
      
    st_obatProduction memory newProduction = st_obatProduction({
      batchName: "BN-20241125-PTPharmaIndo-X45A",
      obatId: _obatId, 
      namaProduk: _namaProduk, 
      obatQuantity: 15, 
      factoryInstanceNames: _factoryInstanceName,
      obatIpfsHash: new string[](15)
    });

    newProduction.obatIpfsHash[0] = "QmZpjQfDeDRPRSrH4W413GwD5Wbb9UMG5imqpfqsPsAxm2";
    newProduction.obatIpfsHash[1] = "QmXVUENczfcBarBtQ2wiDtLmZV2Pa78n2kmGDpj9dje1Yn";
    newProduction.obatIpfsHash[2] = "Qmd6Qvb1oXad1wzZu5J6XrYdnGp9Fj3tQueVss9bwGVHST";
    newProduction.obatIpfsHash[3] = "QmVU2UxMrJeqhrnQDPJirauFsWs6J7XLDiDQKix8HVdETs";
    newProduction.obatIpfsHash[4] = "QmdmR4Pfnn5gCD5XaawvrviXmE3JsiaxRF3eNrzhY1CBU7";
    newProduction.obatIpfsHash[5] = "QmQrTrfggKT76nRZV8rBjcaToWfHCMzWqY4yWRpW3SD6Yg";
    newProduction.obatIpfsHash[6] = "QmQXHXQEPP2PnFbQ66hSg2ZMNd6SSzfFKCJHAEisYu822V";
    newProduction.obatIpfsHash[7] = "QmUECiX7qHiH8h4kr2u4h6qaiG8fSj9ZMtcBGgEHCUym1L";
    newProduction.obatIpfsHash[8] = "QmUwZrt9bLjnhMLCi4CFcaTvYgZaWUJRcZDKqs9c3mqyHy";
    newProduction.obatIpfsHash[9] = "QmNNuwZAUH6gX8hTck6oha4NjMhEc75xvyGCq2LpFDtYCG";
    newProduction.obatIpfsHash[10] = "QmabhxtbKye1eoGPMfdazWC5mTJsKAtUcFbShf3ZcmcmWN";
    newProduction.obatIpfsHash[11] = "QmeRhokhkG61Bi3xemD9gcZAHK8k6cu8yCNATEcrUgs4Ty";
    newProduction.obatIpfsHash[12] = "QmamRkPNMBXtpnhuX4Esb8RQm9NNpwC3zdAMTarPwWriSe";
    newProduction.obatIpfsHash[13] = "QmVk7tgpUscPGV2giKwy5KAJyCNPnSDS5dMKC3mSF95zNo";
    newProduction.obatIpfsHash[14] = "QmTdsJND7BdPAKJZD8HJpp3sTEY7DtgWo6roTtktJqhsr2";
    
    allProducedObat.push(newProduction);   
    obatProductionDetailsById[_obatId] = newProduction;

    emit evt_obatCreated(_namaProduk, _factoryInstanceName, _factoryUserName, _factoryAddr, _kemasan, en_tipeProduk(_tipeProduk));
  }
 
  function requestNie(string memory _obatId) public onlyFactory {
    st_obatDetails storage obatDetails = obatDetailsById[_obatId];
    require(obatDetails.obatStatus == en_nieStatus.inLocalProduction, "Obat Tradisional status must be in local production!");

    obatDetails.nieRequestDate = block.timestamp;
    obatDetails.obatStatus = en_nieStatus.RequestedNIE;

    for(uint i=0; i<allObatData.length; i++){
      if (keccak256(abi.encodePacked(allObatData[i].obatId)) == keccak256(abi.encodePacked(_obatId))) {
        allObatData[i].nieRequestDate = block.timestamp;
        allObatData[i].obatStatus = en_nieStatus.RequestedNIE;

        break;
      }
    }

    emit evt_nieRequested(_obatId, block.timestamp, obatDetails.namaProduk);
  }

  function approveNie(
    string memory _obatId,
    address _bpomAddr,
    string memory _bpomInstanceName,
    string memory _bpomUserName,
    string memory _nieNumber
  ) public {
    st_obatDetails storage obatDetails = obatDetailsById[_obatId];
    require(obatDetails.obatStatus == en_nieStatus.RequestedNIE, "Obat Tradisional status must be RequestedNIE!");

    obatDetails.nieApprovalDate = block.timestamp;
    obatDetails.obatStatus = en_nieStatus.ApprovedNIE;
    obatDetails.nieNumber = _nieNumber;

    // Save BPOM details
    bpomAddresses[_obatId] = _bpomAddr;
    bpomInstanceNames[_obatId] = _bpomInstanceName;
    bpomUserNames[_obatId] = _bpomUserName;

    for(uint i=0; i<allObatData.length; i++){
      if (keccak256(abi.encodePacked(allObatData[i].obatId)) == keccak256(abi.encodePacked(_obatId))) {
        allObatData[i].nieApprovalDate = block.timestamp;
        allObatData[i].obatStatus = en_nieStatus.ApprovedNIE;
        allObatData[i].nieNumber = _nieNumber;

        break;  
      }
    } 

    // st_obatProduction memory newProduction = st_obatProduction({
    //   obatId: _obatId, 
    //   namaProduk: obatDetails.namaProduk, 
    //   obatQuantity: 0, 
    //   factoryInstanceNames: factoryInstanceNames[_obatId], 
    //   obatIpfsHash: new string[](0)
    // }); 
 
    // allProducedObat.push(newProduction); 

    emit evt_nieApproved(_nieNumber, obatDetails.namaProduk);
  }

  function getListObatByFactory(string memory _factoryInstanceName)
      public view returns (
        string[] memory, // obatId
        string[] memory, // namaProduk
        uint8[] memory,  // obatStatus
        uint8[] memory  // tipe produk
      )
  {
    uint count = 0;

    // First, count the number of matching records to initialize arrays
    for (uint i = 0; i < allObatData.length; i++) {
        if (keccak256(abi.encodePacked(factoryInstanceNames[allObatData[i].obatId])) == keccak256(abi.encodePacked(_factoryInstanceName))) {
            count++;
        }
    }

    // Initialize arrays with the correct size
    string[] memory obatIdArray = new string[](count);
    string[] memory namaProdukArray = new string[](count);
    uint8[] memory obatStatusArray = new uint8[](count);
    uint8[] memory tipeProdukArray = new uint8[](count);

    // Populate arrays with matching records
    uint index = 0;
    for (uint i = 0; i < allObatData.length; i++) {
        if (keccak256(abi.encodePacked(factoryInstanceNames[allObatData[i].obatId])) == keccak256(abi.encodePacked(_factoryInstanceName))) {
            obatIdArray[index] = allObatData[i].obatId;
            namaProdukArray[index] = allObatData[i].namaProduk;
            obatStatusArray[index] = uint8(allObatData[i].obatStatus);
            tipeProdukArray[index] = uint8(allObatData[i].tipeProduk);
            index++;
        }
    }

    return (
        obatIdArray,
        namaProdukArray,
        obatStatusArray, 
        tipeProdukArray
    );
  }

  // function untuk list obat NIE (yg bisa di mulai produksi) -> obatProducePage [belum dipake]
  // function getListObatApprovedNieByFactory(string memory _factoryInstanceName)
  //   public view returns (
  //     string[] memory,
  //     string[] memory,
  //     uint8[] memory
  //   )
  // { 
  //   uint count = 0;

  //   for (uint i = 0; i < allObatData.length; i++) {
  //       if (keccak256(abi.encodePacked(factoryInstanceNames[allObatData[i].obatId])) == keccak256(abi.encodePacked(_factoryInstanceName))) {
  //           count++;
  //       }
  //   }

  //   string[] memory obatIdArray = new string[](count);
  //   string[] memory namaProdukArray = new string[](count);
 
  //   uint index = 0;
  //   for (uint i = 0; i < allObatData.length; i++) {
  //       if (keccak256(abi.encodePacked(factoryInstanceNames[allObatData[i].obatId])) == keccak256(abi.encodePacked(_factoryInstanceName))) {
  //           obatIdArray[index] = allObatData[i].obatId;
  //           namaProdukArray[index] = allObatData[i].namaProduk;
  //           index++;
  //       }
  //   }

  //   return (
  //       obatIdArray,
  //       namaProdukArray
  //   );
  // } 

  function getListAllObatNie()
    public
    view
    returns (
        string[] memory,
        string[] memory,
        string[] memory, 
        uint256[] memory, 
        uint8[] memory 
    )
  {
    uint count = 0;
    for (uint i=0; i < allObatData.length; i++) {
        if (allObatData[i].obatStatus != en_nieStatus.inLocalProduction) {
            count++;
        }
    }

    string[] memory obatIdArray = new string[](count);
    string[] memory namaProdukArray = new string[](count);
    string[] memory factoryInstanceNameArray = new string[](count);
    uint256[] memory latestTimestampArray = new uint256[](count);
    uint8[] memory obatStatusArray = new uint8[](count);

    uint index = 0;
    for (uint i= 0; i < allObatData.length; i++) {
        if (allObatData[i].obatStatus != en_nieStatus.inLocalProduction) {
            obatIdArray[index] = allObatData[i].obatId;
            namaProdukArray[index] = allObatData[i].namaProduk;
            factoryInstanceNameArray[index] = factoryInstanceNames[allObatData[i].obatId];
            
            uint latest = allObatData[i].nieApprovalDate > allObatData[i].nieRequestDate
                ? allObatData[i].nieApprovalDate
                : allObatData[i].nieRequestDate;

            latestTimestampArray[index] = latest;
            obatStatusArray[index] = uint8(allObatData[i].obatStatus);

            index++;
        }
    }

    return (
        obatIdArray,
        namaProdukArray,
        factoryInstanceNameArray,
        latestTimestampArray,
        obatStatusArray
    );
  }

  function getListObatById(string memory _obatId)
    public
    view
    returns (
      st_obatDetails memory obatDetails,
      address factoryAddress,
      string memory factoryInstanceName,
      string memory factoryUserName,
      address bpomAddress,
      string memory bpomInstanceName,
      string memory bpomUserName
    )
  {
    require(bytes(obatDetailsById[_obatId].obatId).length > 0, "No data found with this ID.");

    obatDetails = obatDetailsById[_obatId];
    factoryAddress = factoryAddresses[_obatId];
    factoryInstanceName = factoryInstanceNames[_obatId];
    factoryUserName = factoryUserNames[_obatId];
    bpomAddress = bpomAddresses[_obatId];
    bpomInstanceName = bpomInstanceNames[_obatId];
    bpomUserName = bpomUserNames[_obatId];

    return (
      obatDetails,
      factoryAddress,
      factoryInstanceName,
      factoryUserName,
      bpomAddress,
      bpomInstanceName,
      bpomUserName
    );
  }

  function addQuantityObat(
    string memory _namaProduk,
    string memory _batchName,
    string memory _obatId,
    uint8 _obatQuantity,
    string  memory _factoryInstanceName,
    string[] memory _obatIpfsHash
  ) public onlyFactory {

    require (_obatQuantity == _obatIpfsHash.length, "Quantity does not match the number of IDs");

      if (keccak256(abi.encodePacked(obatProductionDetailsById[_obatId].namaProduk)) == keccak256(abi.encodePacked(_namaProduk))) {
          obatProductionDetailsById[_obatId].obatQuantity = _obatQuantity;
          obatProductionDetailsById[_obatId].obatIpfsHash = _obatIpfsHash;

          for(uint i=0; i<allProducedObat.length; i++){
            if (keccak256(abi.encodePacked(allProducedObat[i].obatId)) == keccak256(abi.encodePacked(_obatId))) {
              allProducedObat[i].obatQuantity = _obatQuantity;
              allProducedObat[i].obatIpfsHash = _obatIpfsHash; 
              break; 
          }
    } 
          
      } else {
          st_obatProduction memory newProduction = st_obatProduction({
            batchName: _batchName,
            obatId: _obatId,
            namaProduk: _namaProduk,
            obatQuantity: _obatQuantity,
            factoryInstanceNames: _factoryInstanceName,
            obatIpfsHash: _obatIpfsHash
          });
      
          obatProductionDetailsById[_obatId] = newProduction;  
          allProducedObat.push(newProduction); 
      }


    emit evt_obatProduced(_namaProduk, _obatQuantity, _batchName);
     
  } 

  function getListAllProducedObatByFactory( string memory _factoryInstanceName )
    public
    onlyFactory
    view
    returns (
        string[] memory,
        string[] memory,
        uint8[] memory
    )
  { 
      uint count = 0;
      for (uint i=0; i < allProducedObat.length; i++) {
        if (keccak256(abi.encodePacked(allProducedObat[i].factoryInstanceNames)) == keccak256(abi.encodePacked(_factoryInstanceName))) {
            count++;
        }
      }
      
      string[] memory obatIdArray = new string[](count);
      string[] memory namaProdukArray = new string[](count);
      uint8[] memory obatQuantityArray = new uint8[](count);

      uint index = 0;
      
      for (uint i= 0; i < allProducedObat.length; i++) {
        obatIdArray[index] = allProducedObat[i].obatId;
        namaProdukArray[index] = allProducedObat[i].namaProduk;
        obatQuantityArray[index] = allProducedObat[i].obatQuantity;

        index++;
      }  
   
      return ( 
        obatIdArray,
        namaProdukArray, 
        obatQuantityArray
      );
  }

  function getAllProducedObat() public view returns (st_obatProduction[] memory) {
  // untuk di list obat order pbf
    if(roleManager.hasRole(msg.sender, RoleManager.en_roles.PBF)) {
      st_obatProduction[] memory obatProductionClean = new st_obatProduction[](allProducedObat.length);

        for (uint256 i = 0; i < allProducedObat.length; i++) {
          obatProductionClean[i] = st_obatProduction({
            batchName: allProducedObat[i].batchName,
            obatId: allProducedObat[i].obatId,
            namaProduk: allProducedObat[i].namaProduk,
            obatQuantity: allProducedObat[i].obatQuantity,
            factoryInstanceNames: "", 
            obatIpfsHash: new string[](0)      
          });
        }
        return obatProductionClean;

    } else if (roleManager.hasRole(msg.sender, RoleManager.en_roles.Pabrik)){
      return allProducedObat;

    } 
  
    return new st_obatProduction[](0);
  }

  function getListAllProducedObat()
      public
      view
      returns (
          string[] memory obatIdArray,
          string[] memory namaProdukArray,
          uint8[] memory obatQuantityArray
      )
  { 
      uint256 count = allProducedObat.length;

      obatIdArray = new string[](count);
      namaProdukArray = new string[](count);
      obatQuantityArray = new uint8[](count);

      for (uint256 i = 0; i < count; i++) {
          obatIdArray[i] = allProducedObat[i].obatId;
          namaProdukArray[i] = allProducedObat[i].namaProduk;
          obatQuantityArray[i] = allProducedObat[i].obatQuantity;
      }

      return (
          obatIdArray,
          namaProdukArray,
          obatQuantityArray
      );
  }


  function getDetailProducedObatById(string memory _obatId) public view returns (uint8 obatQuantity, string[] memory obatIpfsHash) {
    require(bytes(obatProductionDetailsById[_obatId].obatId).length > 0, "No data found with this ID.");

    obatQuantity = obatProductionDetailsById[_obatId].obatQuantity;
    
    if (roleManager.hasRole(msg.sender, RoleManager.en_roles.PBF)) {
      obatIpfsHash = new string[](0);

    } else if (roleManager.hasRole(msg.sender, RoleManager.en_roles.Pabrik)) {
      obatIpfsHash = obatProductionDetailsById[_obatId].obatIpfsHash;

    }
    
    return (
      obatQuantity,
      obatIpfsHash
    );
  }

  function pbfOrder(
    string memory _obatIdProduk,
    string memory _orderId,
    string memory _namaProduk,
    uint8 _orderQuantity,
    address _pbfAddr,
    string memory _pbfInstanceName
  ) public onlyPBF {

    require(_orderQuantity >= 50, "Minimum order is 50 obat.");

    st_orderObat memory newOrderPbf = st_orderObat({
      orderId: _orderId, 
      namaProduk: _namaProduk,
      obatIdProduk: _obatIdProduk,
      orderQuantity: _orderQuantity,
      instanceName: _pbfInstanceName,
      instanceAddr: _pbfAddr,
      orderStatus: en_orderStatus.OrderProcessed,
      latestTimestamp: block.timestamp,
      orderObatIpfsHash: new string[](0)  
    });
    
    orderObatById[_orderId] = newOrderPbf;
    allOrderedObat.push(newOrderPbf);

    emit evt_obatOrdered(_namaProduk, _orderQuantity, _orderId, _pbfInstanceName, _pbfAddr, block.timestamp); 
  } 

  function retailerOrder(
    string memory _obatIdProduk,
    string memory _orderId,
    string memory _namaProduk,
    uint8 _orderQuantity,
    address _retailerAddr,
    string memory _retailerInstanceName,
    string[] memory _orderObatIpfsHash
  ) public onlyRetailer {

    require(_orderQuantity >= 50, "Minimum order is 50 obat.");

    string memory obatIdProduk;

    for(uint i=0; i<allObatData.length; i++){
      if(keccak256(abi.encodePacked(allObatData[i].obatId)) == keccak256(abi.encodePacked(_obatIdProduk))) {
        obatIdProduk = allObatData[i].obatId;
        break;
      } 
    }

    st_orderObat memory newOrderRetailer = st_orderObat({
        orderId: _orderId, 
        namaProduk: _namaProduk,
        obatIdProduk: obatIdProduk,
        orderQuantity: _orderQuantity,
        instanceName: _retailerInstanceName,
        instanceAddr: _retailerAddr,
        orderStatus: en_orderStatus.OrderProcessed,
        latestTimestamp: block.timestamp,
        orderObatIpfsHash: _orderObatIpfsHash  
    });
    
    orderObatById[_orderId] = newOrderRetailer;
    allOrderedObat.push(newOrderRetailer);

    emit evt_obatOrdered(_namaProduk, _orderQuantity, _orderId, _retailerInstanceName, _retailerAddr, block.timestamp); 

  } 

  // create function getListOrderObatbyPBF, getLIstOrderObatdri factory, get list order obat dri retailer
  // oh iya aku belum update ipfs hash nya (berarti aku harus hapus getAllproducedObat yg pbf ya, krn aku butuh ipfs lama buat dimasukin ke data ipfs baru)
}