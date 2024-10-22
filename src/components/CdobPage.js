import { useState } from "react";
import { BrowserProvider, Contract } from "ethers";
import CdobRegistrationABI from "../artifacts/contracts/CdobRegistration.sol/CdobRegistration.json"; // Import ABI smart contract

const CdobRegistrationContract = "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318"; // Ganti dengan address smart contract

const addressAcc = {
  "0x70997970C51812dc3A010C7d01b50e0d17dc79C8": "BPOM",
  "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266": "Pabrik Axxz" 
}

function CpotbPage() {
  const [account, setAccount] = useState("");
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [pbfName, setPbfName] = useState("");
  const [requestId, setRequestId] = useState("");
  const [accountName, setAccountName] = useState("")

  function getNameFromAddress(address) {
    const lowercasedAddressAcc = Object.keys(addressAcc).reduce((newObj, key) => {
      const lowercasedKey = key.toLowerCase();
      newObj[lowercasedKey] = addressAcc[key];
      return newObj;
    }, {});

    const accAddress = address.toLowerCase()
    const accName = lowercasedAddressAcc[accAddress]
    console.log(accName);
    
    if(accName){
      setAccountName(accName)
    } else {
      console.log("User hasn't registered yet!")
    }

  }

  const connect_wallet = async () => {
    if (window.ethereum) {
      try {
        const prov = new BrowserProvider(window.ethereum);
        console.log(prov);

        const accounts = await prov.send("eth_requestAccounts", []);
        console.log("Accounts: ", accounts);

        const sign = await prov.getSigner();
        const contr = new Contract(
          CdobRegistrationContract, 
          CdobRegistrationABI.abi, 
          sign
        );

        getNameFromAddress(accounts[0])
        setAccount(accounts[0]); 
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

  const requestCdob = async () => {
    try {
      const id = Math.random().toString(36).slice(2, 9); 
      setRequestId(id); 
      console.log('ini req id: ', id);

      const tx = await contract.cdob_request(id, pbfName); 
      await tx.wait(); 
      console.log("receipt contract:", tx);
      console.log("pbf name: ", pbfName);
    } catch (error) {
      console.error("Error making request:", error);
    }
  };

  // fungsi getterr cpotb
  const getAllrequestCdob = async () => {
    try {
      const requestIds = await contract.get_all_cdob_request();
      const reqCdobData = []

      // console.log(requestIds);

      for(let i= 0;i < requestIds.length; i++ ){
        const tx = await contract.get_cdob_request_byId(requestIds[i])
        console.log(tx)
        reqCdobData.push({
            requestId: requestIds[i],
            pbfAddress: tx[0],
            pbfName: tx[1],
            timestampReq: new Date(Number(tx[2])*1000).toLocaleString(),
            timestampApprove: tx[3]? new Date(Number(tx[3])*1000).toLocaleString() : 0,
            cdobNumber: tx[4],
            bpomAddress: tx[5],
            statusCdob: tx[6]
          })
      }
      
      console.log(reqCdobData);
      renderGetAllCdob(reqCdobData)


    } catch (e){
      console.error(e)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    getAllrequestCdob(requestId);
  };

  // Fungsi untuk mengapprove request CPOTB
  const approveCdob = async () => {
    try {
      const randomDigits1 = Math.floor(1000 + Math.random() * 9000);
      const randomDigits2 = Math.floor(1000 + Math.random() * 9000);
      const today = new Date();
      const month = String(today.getMonth() + 1).padStart(2, '0');  
      const year = today.getFullYear(); 
      const nomorSurat = `CDOB${randomDigits1}/S/1-${randomDigits2}/${month}/${year}`;

      const tx = await contract.cdob_approve(requestId, nomorSurat); 
      await tx.wait(); // Tunggu transaksi selesai
      console.log("Approve CDOB receipt:", tx);
    } catch (error) {
      console.error("Error approving request:", error);
    }
  };

  function renderGetAllCdob(data) {
    const container = document.getElementById('getAllCdobData');
    container.innerHTML = '';

    data.forEach((item) => {
      const itemDiv = document.createElement('div');

      itemDiv.classList.add('item');

      // Isi div dengan data yang diinginkan
      itemDiv.innerHTML = `
          <p><strong>Request ID:</strong> ${item.requestId}</p>
          <p><strong>Nomor CDOB :</strong> ${item.cdobNumber}</p>
          <p><strong>Pabrik Address:</strong> ${item.pbfAddress}</p>
          <p><strong>Pabrik Name:</strong> ${item.pbfName}</p>
          <p><strong>Status Cpotb:</strong> ${item.statusCdob}</p>
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
      <h1>CDOB Registration</h1>
        {!account ? (
          <button onClick={connect_wallet}>Connect Wallet</button>
            ) : (
            <h2>Connected Account: {accountName}</h2>
            )
        }
      <div>
        <h2>Request CDOB</h2>
        <input
          type="text"
          placeholder="Nama PBF "
          value={pbfName}
          onChange={(e) => setPbfName(e.target.value)}
        />
        <button onClick={requestCdob}>Submit Request</button>
      </div>

      <div>
        <h2>Approve CDOB</h2>
        <input
          type="text"
          placeholder="Request ID"
          value={requestId}
          onChange={(e) => setRequestId(e.target.value)}
        />
        <button onClick={approveCdob}>Approve Request</button>
      </div>

      <div>
        <button onClick={handleSubmit}>getAllrequestCdob</button>
      </div>

      <div id='getAllCdobData'></div>
    </div>
  );
}

export default CpotbPage;
