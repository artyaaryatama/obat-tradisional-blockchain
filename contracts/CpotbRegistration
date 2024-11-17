// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CpotbRegistration {

  enum en_StatusCpotb{
    isPending,
    isApproved
  }
 
  // Setiap kali pabrik meminta CPOTB, data tersebut akan ditambahkan ke dalam array ini. Array ini bersifat publik, jadi siapa pun bisa melihat seluruh daftar request yang sudah masuk. 
  struct st_Cpotb {
    address pabrikAddress;
    string pabrikName;
    uint timestampReq;
    uint timestampApprove;
    string cpotbNumber;
    address bpomAddress;
    en_StatusCpotb statusCpotb;
  }

  string[] public reqIdCpotb; 

  // menyimpan request cpotb based on id
  mapping(string => st_Cpotb) public CpotbRequests; 

  // buat predefined address bpom sm pabrik (sementara kan ngga ada user sign up)
  // untuk melacak alamat mana yang merupakan pabrik dan mana yang merupakan bpom
  // mapping (address => bool) isPabrik;
  // mapping (address => bool) isBpom;

  // event ini bisa digunakan untuk memperbarui UI atau mencatat riwayat aktivitas.
  event evt_CpotbRequested(string indexed reqId, address indexed pabrik, string pabrikName);
  event evt_CpotbApproved(string indexed reqId, address indexed pabrik, string pabrikName, string cpotbNumber); 

  function cpotb_request(string memory _reqId, string memory _pabrikName) public {
    // cek di mapping isPabrik 
    require(bytes(_reqId).length > 0, 'Invalid Request ID'); 
   
    CpotbRequests[_reqId] = st_Cpotb({
      pabrikAddress: msg.sender,
      pabrikName: _pabrikName,
      timestampReq: block.timestamp,
      timestampApprove: 0,
      cpotbNumber: " ",
      bpomAddress: address(0),
      statusCpotb: en_StatusCpotb.isPending
    }); 

    reqIdCpotb.push(_reqId); 
    emit evt_CpotbRequested(_reqId, msg.sender, _pabrikName); 
  }

  function cpotb_approve(string memory _reqId, string memory _cpotbNumber) public {
  
    require(bytes(_reqId).length > 0, 'Invalid Request ID'); 

    // mengambil request cpotb based on id
    st_Cpotb storage certificate = CpotbRequests[_reqId];
    require(certificate.statusCpotb == en_StatusCpotb.isPending, "Request has already been processed");

    certificate.statusCpotb = en_StatusCpotb.isApproved;
    certificate.timestampApprove = block.timestamp;
    certificate.cpotbNumber = _cpotbNumber; 
    certificate.bpomAddress = msg.sender;

    emit evt_CpotbApproved(_reqId, certificate.pabrikAddress, certificate.pabrikName, _cpotbNumber); 
  }

  function get_cpotb_request_byId(string calldata _reqId) public view returns (
      address pabrikAddress,
      string memory pabrikName,
      uint timestampReq,
      uint timestampApprove,
      string memory cpotbNumber,
      address bpomAddress,
      en_StatusCpotb statusCpotb
  ) { 
      st_Cpotb memory request = CpotbRequests[_reqId]; // Ambil data dari mapping
      return (
          request.pabrikAddress, 
          request.pabrikName,
          request.timestampReq,
          request.timestampApprove,
          request.cpotbNumber, 
          request.bpomAddress,
          request.statusCpotb
      );
  }

  function get_all_cpotb_request() public view returns (string[] memory) { 
    return reqIdCpotb; 
  }

} 
