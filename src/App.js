import React, { useState } from "react";
import { BrowserProvider, Contract, ethers } from "ethers";
import CpotbRegistrationABI from "./artifacts/contracts/CpotbRegistration.sol/CpotbRegistration.json"; // Import ABI smart contract

const CpotbRegistrationContract = "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707"; // Ganti dengan address smart contract

function App() {
  const [pabrikName, setPabrikName] = useState("");
  const [requestId, setRequestId] = useState("");
  const [account, setAccount] = useState("");
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [receiptTx, setReceiptTx] = useState("");
  const [cpotbData, setCpotbData] = useState({
    pabrik: "",
    pabrikName: "",
    timestamp: "",
    bpom: "",
    statusCpotb: "",
  });

  // Fungsi untuk koneksi ke MetaMask dan setup provider, signer, dan contract
  const connect_wallet = async () => {
    if (window.ethereum) {
      try {
        // Menggunakan BrowserProvider di ethers.js v6
        const prov = new BrowserProvider(window.ethereum);
        console.log(prov);

        // Gunakan prov.send(), bukan provider.send()
        const accounts = await prov.send("eth_requestAccounts", []);
        console.log("Accounts: ", accounts);

        const sign = await prov.getSigner();
        const contr = new Contract(
          CpotbRegistrationContract, 
          CpotbRegistrationABI.abi, 
          sign
        );

        setAccount(accounts[0]); // Simpan akun yang terhubung
        setProvider(prov);
        setSigner(sign);
        setContract(contr);

        console.log("Connected to MetaMask: ", sign);
      } catch (err) {
        console.error("User denied account access", err);
      }
    } else {
      console.log("MetaMask is not installed");
    }
  };

  // Fungsi untuk membuat request CPOTB
  const requestCpotb = async () => {
    try {
      const id = Math.random().toString(36).slice(2, 9); // Generate random request ID
      setRequestId(id); // Simpan request ID di state
      console.log('ini req id: ', id);

      const tx = await contract.cpotb_request(id, pabrikName); // Panggil fungsi smart contract
      await tx.wait(); // Tunggu transaksi selesai
      console.log("receipt contract:", tx);
      console.log("pabrik name: ", pabrikName);
      setReceiptTx(tx)
    } catch (error) {
      console.error("Error making request:", error);
    }
  };

  // fungsi getterr cpotb
  const getAllRequestCpotb = async () => {
    try {
      const requestIds = await contract.getAllCpotbRequests();
      const reqCpotbData = []

      // console.log(requestIds);

      for(let i= 0;i < requestIds.length; i++ ){
        const request = await contract.get_cpotb_request(requestIds[i])

        reqCpotbData.push({
            requestId: requestIds[i],
            pabrikAddress: request[0],
            pabrikName: request[1],
            timestampReq: new Date(Number(request[2])*1000).toLocaleString(),
            timestampApprove: request[3]? new Date(Number(request[3])*1000).toLocaleString() : 0,
            cpotbNumber: request[4],
            bpomAddress: request[5],
            statusCpotb: request[6]
          })
      }
      
      console.log(reqCpotbData);
      renderGetAllCpotb(reqCpotbData)


    } catch (e){
      console.error(e)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    getAllRequestCpotb(requestId);
  };

  // Fungsi untuk mengapprove request CPOTB
  const approveCpotb = async () => {
    try {
      const prefix = "PW-S.01.3.331";
      const day = `${String(new Date().getMonth() + 1).padStart(2, '0')}.${String(new Date().getDate()).padStart(2, '0')}`;
      const randomString = String(Math.floor(1000 + Math.random() * 9000));
      const cpotbNumber = `${prefix}.${day}.${randomString}`

      const tx = await contract.cpotb_approve(requestId, cpotbNumber); // Panggil fungsi approve di smart contract
      await tx.wait(); // Tunggu transaksi selesai
      console.log("Approve CPOTB receipt:", tx);
    } catch (error) {
      console.error("Error approving request:", error);
    }
  };

  function renderGetAllCpotb(data) {
    const container = document.getElementById('getAllCpotbData');
    container.innerHTML = '';

    data.forEach((item) => {
      const itemDiv = document.createElement('div');

      itemDiv.classList.add('item');

      // Isi div dengan data yang diinginkan
      itemDiv.innerHTML = `
          <p><strong>Request ID:</strong> ${item.requestId}</p>
          <p><strong>Nomor CPOTB:</strong> ${item.cpotbNumber}</p>
          <p><strong>Pabrik Address:</strong> ${item.pabrikAddress}</p>
          <p><strong>Pabrik Name:</strong> ${item.pabrikName}</p>
          <p><strong>Status Cpotb:</strong> ${item.statusCpotb}</p>
          <p><strong>Timestamp Dibuat:</strong> ${item.timestampReq}</p>
          <p><strong>Timestamp Approve:</strong> ${item.timestampApprove}</p>
          <hr>
      `;

      // Tambahkan itemDiv ke dalam container
      container.appendChild(itemDiv);
    })
  }

  return (
    <div className="App">
      <h1>CPOTB Registration</h1>
        {!account ? (
          <button onClick={connect_wallet}>Connect Wallet</button>
            ) : (
            <h2>Connected Account: {account}</h2>
            )
        }
      <div>
        <h2>Request CPOTB</h2>
        <input
          type="text"
          placeholder="Nama Pabrik"
          value={pabrikName}
          onChange={(e) => setPabrikName(e.target.value)}
        />
        <button onClick={requestCpotb}>Submit Request</button>
      </div>

      <div>
        <h2>Approve CPOTB</h2>
        <input
          type="text"
          placeholder="Request ID"
          value={requestId}
          onChange={(e) => setRequestId(e.target.value)}
        />
        <button onClick={approveCpotb}>Approve Request</button>
      </div>

      <div>
        <button onClick={handleSubmit}>getAllRequestCpotb</button>
      </div>

      <div id='getAllCpotbData'></div>
    </div>
  );
}

export default App;
