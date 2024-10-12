// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CdobRegistration {

  enum en_StatusCdob{
    isPending,
    isApproved
  }
 
  struct st_Cdob {
    address pbfAddress;
    string pbfName;
    uint timestampReq;
    uint timestampApprove;
    string cdobNumber; 
    address bpomAddress;
    en_StatusCdob statusCdob;
  }

  string[] public reqIdCdob; 

  mapping(string => st_Cdob) public CdobRequests; 

  event evt_CdobRequested(string indexed reqId, address indexed pbf, string pbfName);
  event evt_CdobApproved(string indexed reqId, address indexed pbf, string pbfName, string CdobNumber); 

  function cdob_request(string memory _reqId, string memory _pbfName) public {

    require(bytes(_reqId).length > 0, 'Invalid Request ID'); 
    
    CdobRequests[_reqId] = st_Cdob({ 
      pbfAddress: msg.sender,
      pbfName: _pbfName,
      timestampReq: block.timestamp,
      timestampApprove: 0,
      cdobNumber: "-",
      bpomAddress: address(0),
      statusCdob: en_StatusCdob.isPending
    }); 

    reqIdCdob.push(_reqId); 
    emit evt_CdobRequested(_reqId, msg.sender, _pbfName); 
  }

  function cdob_approve(string memory _reqId, string memory _cdobNumber) public {
  
    require(bytes(_reqId).length > 0, 'Invalid Request ID'); 

    st_Cdob storage certificate = CdobRequests[_reqId];
    require(certificate.statusCdob == en_StatusCdob.isPending, "Request has already been processed");

    certificate.statusCdob = en_StatusCdob.isApproved;
    certificate.timestampApprove = block.timestamp;
    certificate.cdobNumber = _cdobNumber;  
    certificate.bpomAddress = msg.sender;

    emit evt_CdobApproved(_reqId, certificate.pbfAddress, certificate.pbfName, _cdobNumber); 
  }

  function get_cdob_request_byId(string calldata _reqId) public view returns (
      address pbfAddress,
      string memory pbfName,
      uint timestampReq,
      uint timestampApprove,
      string memory cdobNumber,
      address bpomAddress,
      en_StatusCdob statusCdob
  ) { 
      st_Cdob memory request = CdobRequests[_reqId]; 
      return (
          request.pbfAddress, 
          request.pbfName,
          request.timestampReq,
          request.timestampApprove,
          request.cdobNumber, 
          request.bpomAddress,
          request.statusCdob
      );
  }

  function get_all_cdob_request() public view returns (string[] memory) { 
    return reqIdCdob; 
  }

} 
