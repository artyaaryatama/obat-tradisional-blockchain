import React, { useState } from "react";
import { BrowserProvider, Contract, ethers } from "ethers";
import CpotbRegistrationABI from "./artifacts/contracts/CpotbRegistration.sol/CpotbRegistration.json"; // Import ABI smart contract

const CpotbRegistrationContract = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; // Ganti dengan address smart contract

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
  const getRequestCpotb = async (requestId) => {
    try {
      const request = await contract.get_cpotb_rrequest(requestId)

      console.log(request);

      // Simpan hasilnya ke state
      // setCpotbData({
      //   pabrik: request.pabrik,
      //   pabrikName: request.pabrikName,
      //   // timestamp: new Date(request.timestamp * 1000).toLocaleString(), 
      //   timestamp: request.timestamp, 
      //   bpom: request.bpom,
      //   statusCpotb: request.statusCpotb,
      // });
    } catch (e){
      console.error(e)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    getRequestCpotb(requestId);
  };


  // Fungsi untuk mengapprove request CPOTB
  const approveCpotb = async () => {
    try {
      const tx = await contract.cpotb_approve(requestId); // Panggil fungsi approve di smart contract
      await tx.wait(); // Tunggu transaksi selesai
      console.log("Approve CPOTB berhasil:", tx);
    } catch (error) {
      console.error("Error approving request:", error);
    }
  };

  function cekTxreceipt() {
    // ini nggak bisa auto update receipt nya sihhh 
    console.log("receipt contract from btn:", receiptTx);
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

        <button onClick={cekTxreceipt}>cekTxreceipt</button>
        <button onClick={handleSubmit}>getRequestCpotb</button>
    </div>
  );
}

export default App;
