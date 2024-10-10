import { useState } from "react";
import { BrowserProvider, Contract } from "ethers";
import obatProductionABI from "../artifacts/contracts/ObatTradisional.sol/ObatTradisional.json"; 

const obatProductionContract = "0x610178dA211FEF7D417bC0e6FeD39F05609AD788"; 

const addressAcc = {
  "0x70997970C51812dc3A010C7d01b50e0d17dc79C8": "BPOM",
  "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266": "Pabrik Axxz" 
}

function CpotbPage() {
  const [account, setAccount] = useState("");
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  // const [pabrikName, setPabrikName] = useState("");
  const [obatId, setObatId] = useState("");
  const [obatName, setObatName] = useState("")
  const [obatKlaim,setObatKlaim] = useState("")
  const [obatMerk, setObatMerk] = useState("")
  const [obatKomposisi, setObatKomposisi] = useState("")
  const [obatKemasan, setObatKemasan] = useState("")
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
        const accounts = await prov.send("eth_requestAccounts", []);
        console.log("Accounts: ", accounts);
        console.log(prov);

        const sign = await prov.getSigner();
        const contr = new Contract(
          obatProductionContract, 
          obatProductionABI.abi, 
          sign
        );

        getNameFromAddress(accounts[0])
        setAccount(accounts[0]); 
        setProvider(prov);
        setSigner(sign);
        setContract(contr);

        console.log(accountName);
      } catch (err) {
        console.error("User denied account access", err);
      }
    } else {
      console.log("MetaMask is not installed");
    }
  };

  
  const obatProduction = async () => {
    try {
      const id = Math.random().toString(36).slice(2, 9); 
      setObatId(id); 
      console.log({obatId,
        accountName,
        obatName, 
        obatMerk,
        obatKlaim,
        obatKomposisi, 
      obatKemasan});

      const tx = await contract.obat_production(
                obatId,
                accountName,
                obatName, 
                obatMerk,
                obatKlaim,
                obatKomposisi,
                obatKemasan); 

      await tx.wait(); // Tunggu transaksi selesai
      console.log("receipt contract:", tx);
    } catch (error) {
      console.error("Error making request:", error);
    }
  };

  const getObatById = async (obatId) => {
    const obatIds = await contract.get_all_obat()

    const obatData = []
    console.log(obatIds);

    for(let i=0; i<obatIds.length; i++){
      const tx = await contract.get_obat_byId(obatIds[i])
      console.log(tx)
      obatData.push({
        pabrikAddress: tx[0], 
        bpomAddress: tx[1],
        pabrikName: tx[2],
        timestampReq: tx[3]? new Date(Number(tx[3])*1000).toLocaleString() : '-',
        timestampApprove: tx[4]? new Date(Number(tx[4])*1000).toLocaleString() : '-',
        obatName: tx[5],
        obatId: tx[6],
        obatMerk: tx[7],
        obatKlaim: tx[8],
        obatKomposisi: tx[9],
        obatKemasan: tx[10],
        numberNie: tx[11]? tx[11] : '-',
        statusObat: tx[12]

      })
    }

    renderGetAllObat(obatData)
    
  }

  function renderGetAllObat(data) {
    const container = document.getElementById('getAllObatData');
    container.innerHTML = '';

    data.forEach((item) => {
      const itemDiv = document.createElement('div');

      itemDiv.classList.add('item');

      itemDiv.innerHTML = `
        <p><strong>Pabrik Address:</strong> ${item.pabrikAddress}</p>
        <p><strong>BPOM Address:</strong> ${item.bpomAddress}</p>
        <p><strong>Pabrik Name:</strong> ${item.pabrikName}</p>
        <p><strong>Timestamp Dibuat:</strong> ${item.timestampReq}</p>
        <p><strong>Timestamp Approve:</strong> ${item.timestampApprove}</p>
        <p><strong>Obat Name:</strong> ${item.obatName}</p>
        <p><strong>Obat ID:</strong> ${item.obatId}</p>
        <p><strong>Obat Merk:</strong> ${item.obatMerk}</p>
        <p><strong>Obat Klaim:</strong> ${item.obatKlaim}</p>
        <p><strong>Obat Komposisi:</strong> ${item.obatKomposisi}</p>
        <p><strong>Obat Kemasan:</strong> ${item.obatKemasan}</p>
        <p><strong>Nomor NIE:</strong> ${item.numberNie}</p>
        <p><strong>Status Obat:</strong> ${item.statusObat}</p>
        <hr>
      `;
      container.appendChild(itemDiv);
    })
  }

  return (
    <div id="obatPage" className="App">
      <h1>CPOTB Registration</h1>
        {!account ? (
          <button onClick={connect_wallet}>Connect Wallet</button>
            ) : (
            <h2>Connected Account: {accountName}</h2>
            )
        }
      <div>
        <h2>Produksi Obat</h2>
        <input
          type="text"
          placeholder="Nama Obat"
          value={obatName}
          onChange={(e) => setObatName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Merk Obat"
          value={obatMerk}
          onChange={(e) => setObatMerk(e.target.value)}
        />
        <textarea
          type="text"
          placeholder="Klaim Obat"
          value={obatKlaim}
          onChange={(e) => setObatKlaim(e.target.value)}
        />
        <textarea
          type="text"
          placeholder="Komposisi Obat"
          value={obatKomposisi}
          onChange={(e) => setObatKomposisi(e.target.value)}
        />
        <textarea
          type="text"
          placeholder="Kemasan Obat"
          value={obatKemasan}
          onChange={(e) => setObatKemasan(e.target.value)}
        />
        <button onClick={obatProduction}>Submit Obat</button>
      </div>

        <button onClick={getObatById}>Get obat</button>

        <div id="getAllObatData"></div>
    </div>
  );
}

export default CpotbPage;
