// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ObatTradisional {

  enum en_StatusObat{
    inProduction,
    NiePending,
    NieApproved
  }

  struct st_Obat{
    address pabrikAddress;
    address bpomAddress;
    string pabrikName;
    uint timestampReq;
    uint timestampApprove;
    string obatName;
    string obatId;
    string obatMerk; 
    string obatKlaim;
    string obatKomposisi;
    string obatKemasan;
    string numberNie;
    en_StatusObat statusObat;
  }

  string[] public idObat;

  mapping(string => st_Obat) public obatData;

  event evt_obatProduction(string indexed obatId, address indexed pabrikAddress, string obatName);
  event evt_ObatRequested(string indexed obatId, address indexed pabrikAddress);

  function obat_production(
    string calldata _obatId, 
    string calldata _pabrikName, 
    string calldata _obatName, 
    string calldata _obatMerk,
    string calldata _obatKlaim,
    string calldata _obatKomposisi,
    string calldata _obatKemasan) public {

    require(bytes(_obatId).length > 0, 'Invalid Request ID'); 

    obatData[_obatId] = st_Obat({
      pabrikAddress: msg.sender,
      bpomAddress: address(0),
      pabrikName: _pabrikName,
      timestampReq: 0,
      timestampApprove: 0,
      obatName: _obatName,
      obatId: _obatId,
      obatKlaim: _obatKlaim,
      obatMerk: _obatMerk,
      obatKomposisi: _obatKomposisi, 
      obatKemasan: _obatKemasan,
      numberNie: " ",
      statusObat: en_StatusObat.inProduction
    });  

    idObat.push(_obatId); 
    emit evt_obatProduction(_obatId, msg.sender, _obatName); 
  }  

  function get_obat_byId(string calldata _obatId) public view returns (
    address pabrikAddress,
    address bpomAddress,
    string memory pabrikName,
    uint timestampReq,
    uint timestampApprove,
    string memory obatName,
    string memory obatId,
    string memory obatMerk,
    string memory obatKlaim,
    string memory obatKomposisi,
    string memory obatKemasan,
    string memory numberNie,
    en_StatusObat statusObat
  ) {
    st_Obat memory obatDatas = obatData[_obatId];
    return (
      obatDatas.pabrikAddress,
      obatDatas.bpomAddress,
      obatDatas.pabrikName, 
      obatDatas.timestampReq,
      obatDatas.timestampApprove,
      obatDatas.obatName,
      obatDatas.obatId,
      obatDatas.obatMerk,
      obatDatas.obatKlaim,
      obatDatas.obatKomposisi, 
      obatDatas.obatKemasan,
      obatDatas.numberNie,
      obatDatas.statusObat
    );  
  }

  function get_all_obat() public view returns (string[] memory) {
    return idObat; 
  }
}