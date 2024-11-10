import { useEffect, useState } from 'react';
import { BrowserProvider, Contract } from "ethers";
import contractMainSupplyChain from '../../auto-artifacts/MainSupplyChain.json';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import "../../styles/MainLayout.scss"

function CpotbPage() {
  // const { userDetails } = useUser(); 
  const [contract, setContract] = useState();
  const [jenisSediaan, setJenisSediaan] = useState();
  const [userdata, setUserdata] = useState();

  const userData = JSON.parse(sessionStorage.getItem('userdata')) || {};

  useEffect(() => {
    async function connectWallet() {
      if (window.ethereum) {
        try {
          const provider = new BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const contr = new Contract(
            contractMainSupplyChain.address, 
            contractMainSupplyChain.abi, 
            signer
          );
            
          setContract(contr);
          const user = JSON.parse(sessionStorage.getItem(('userdata')));
          setUserdata(user)
          // console.log(user)
          
        } catch (err) {
          console.error("User access denied!")
          errAlert(err, "User access denied!")
        }
      } else {
        console.error("MetaMask is not installed");
      }
    }
    connectWallet();
  }, []);
  
  // useEffect(() => {
  //   console.log("User details from context:", userDetails);
  // }, [userDetails]);

  useEffect(() => {
    if(contract) {
      contract.on('evt_cpotbRequested', (_userAddr, _fatoryName, _jenisSediaan, _cpotbID, _timestampRequest) => {
        console.log("Cpotb Requested Event: ", _userAddr, _fatoryName, _jenisSediaan, _cpotbID, _timestampRequest)
      })

      contract.on('evt_cpotbApproved', (_userAddr, _fatoryName, _cpotbNUmber, _timestampApprove) => {
        console.log("Cpotb Approved Event: ", _userAddr, _fatoryName, _cpotbNUmber, _timestampApprove)
      })
    }

    return () => {
      if(contract) {
        contract.removeAllListeners("evt_cpotbRequested");
        contract.removeAllListeners("evt_cpotbApproved");
      }
    };
  }, [contract])

  const requestCpotb = async () => {
    console.log(userdata)

    if(!jenisSediaan){      
      alert("All fields are required");
      console.log(jenisSediaan);
      return
    }

    try{
      const id = Math.random().toString(36).slice(2, 9); 
      console.log('ini req id: ', id);

      const tx = await contract.requestCpotb(userdata.name, id, jenisSediaan)
      await tx.wait();
      console.log('Receipt: ', tx)

    } catch(err) {
      errAlert(err, "Error making request cpotb!")
    }
  }

  const handleOptionJenisSediaan = (e) => {
    const js = {
      "TabletNonbetalaktam": 0n,
      "KapsulKerasNonbetalaktam": 1n,
      "SerbukOralNonbetalaktam": 2n,
      "CairanOralNonbetalaktam": 3n
    }

    setJenisSediaan(js[e.target.value])
    console.log(js[e.target.value]);
    console.log(e.target.value);
  }

  return (
    <>
      <div id="CpotbPage" className='Layout-Menu layout-page'>
        <div className="title-menu">
          <h1>Data Sertifikat CPOTB</h1>
          <p>Di ajukan oleh {userData.instanceName}</p>
        </div>
        <div className="tab-menu">
          <ul>
            <li><button className='active'>Pengajuan CPOTB</button></li>
            <li><button>Sertifikasi CPOTB</button></li>
          </ul>
        </div>
        <div className="container-data">
          <div className="menu-data">
            <div className="btn">
              <button className='btn-menu'>
                <i className="fa-solid fa-plus"></i>
                Add new data
              </button>
            </div>
          </div>
          <div className="data-list">
            <ul>
              <li>
                <button className='title'>Tablet Non Betalakam</button>
                <p>Tanggal Pengajuan: 12 September 2024</p>
                <button className='statusPengajuan pending'>Pending</button>
              </li>
              <li>
                <button className='title'>Tablet Non Betalakam</button>
                <p>Tanggal Pengajuan: 12 September 2024</p>
                <button className='statusPengajuan pending'>Pending</button>
              </li>
              <li>
                <button className='title'>Tablet Non Betalakam</button>
                <p>Tanggal Pengajuan: 12 September 2024</p>
                <button className='statusPengajuan pending'>Pending</button>
              </li>
              <li>
                <button className='title'>Tablet Non Betalakam</button>
                <p>Tanggal Pengajuan: 12 September 2024</p>
                <button className='statusPengajuan pending'>Pending</button>
              </li>
              <li>
                <button className='title'>Tablet Non Betalakam</button>
                <p>Tanggal Pengajuan: 12 September 2024</p>
                <button className='statusPengajuan pending'>Pending</button>
              </li>
            </ul>
          </div>
        </div>

        <label htmlFor="jenisSediaan"> Jenis Sediaan</label>
        <select name="jenisSediaan" id="jenisSediaan" value={jenisSediaan} onChange={handleOptionJenisSediaan}>
          <option value="" disabled>Select Jenis Sediaan</option>
          <option value="TabletNonbetalaktam">Tablet Non Betalaktam</option>
          <option value="KapsulKerasNonbetalaktam">Kapsul Keras Non Betalaktam</option>
          <option value="SerbukOralNonbetalaktam">Serbuk Oral Non Betalaktam</option>
          <option value="CairanOralNonbetalaktam">Cairan Oral Non Betalaktam</option>
        </select>
 
        <button onClick={requestCpotb}>Send Request</button>
      </div>
    </>
  );
}

function errAlert(err, customMsg){

  const errorObject = {
    message: err.reason || err.message || "Unknown error",
    data: err.data || {},
    transactionHash: err.transactionHash || null
  };

  console.error(customMsg)
  console.error(errorObject);
}

export default CpotbPage;

// import { useEffect, useState } from "react";
// import { BrowserProvider, Contract } from "ethers";
// import contractABI from "../artifacts/contracts/MainSupplyChain.sol/MainSupplyChain.json";

// function CpotbPage() {
//   const [factoryname, setFactoryName] = useState("");
//   const [factry]

// }

// function eCpotbPage() {

//   function getNameFromAddress(address) {
//     const lowercasedAddressAcc = Object.keys(addressAcc).reduce((newObj, key) => {
//       const lowercasedKey = key.toLowerCase();
//       newObj[lowercasedKey] = addressAcc[key];
//       return newObj;
//     }, {});

//     const accAddress = address.toLowerCase()
//     const accName = lowercasedAddressAcc[accAddress]
//     console.log(accName);
    
//     if(accName){
//       setAccountName(accName)
//     } else {
//       console.log("User hasn't registered yet!")
//     }

//   }


//   // Fungsi untuk koneksi ke MetaMask dan setup provider, signer, dan contract
//   const connect_wallet = async () => {
//     if (window.ethereum) {
//       try {
//         // Menggunakan BrowserProvider di ethers.js v6
//         const prov = new BrowserProvider(window.ethereum);
//         console.log(prov);

//         // Gunakan prov.send(), bukan provider.send()
//         const accounts = await prov.send("eth_requestAccounts", []);
//         console.log("Accounts: ", accounts);

//         const sign = await prov.getSigner();
//         const contr = new Contract(
//           CpotbRegistrationContract, 
//           CpotbRegistrationABI.abi, 
//           sign
//         );

//         getNameFromAddress(accounts[0])
//         setAccount(accounts[0]); 
//         setProvider(prov);
//         setSigner(sign);
//         setContract(contr);

//         console.log("Connected to MetaMask: ", sign);
//       } catch (err) {
//         console.error("User denied account access", err);
//       }
//     } else {
//       console.log("MetaMask is not installed");
//     }
//   };

//   // Fungsi untuk membuat request CPOTB
//   const requestCpotb = async () => {
//     try {
//       const id = Math.random().toString(36).slice(2, 9); // Generate random request ID
//       setRequestId(id); // Simpan request ID di state
//       console.log('ini req id: ', id);

//       const tx = await contract.cpotb_request(id, pabrikName); // Panggil fungsi smart contract
//       await tx.wait(); // Tunggu transaksi selesai
//       console.log("receipt contract:", tx);
//       console.log("pabrik name: ", pabrikName);
//     } catch (error) {
//       console.error("Error making request:", error);
//     }
//   };

//   // fungsi getterr cpotb
//   const getAllRequestCpotb = async () => {
//     try {
//       const requestIds = await contract.get_all_cpotb_request();
//       const reqCpotbData = []

//       // console.log(requestIds);

//       for(let i= 0;i < requestIds.length; i++ ){
//         const tx = await contract.get_cpotb_request_byId(requestIds[i])
//         console.log(tx)
//         reqCpotbData.push({
//             requestId: requestIds[i],
//             pabrikAddress: tx[0],
//             pabrikName: tx[1],
//             timestampReq: new Date(Number(tx[2])*1000).toLocaleString(),
//             timestampApprove: tx[3]? new Date(Number(tx[3])*1000).toLocaleString() : 0,
//             cpotbNumber: tx[4],
//             bpomAddress: tx[5],
//             statusCpotb: tx[6]
//           })
//       }
      
//       console.log(reqCpotbData);
//       renderGetAllCpotb(reqCpotbData)


//     } catch (e){
//       console.error(e)
//     }
//   }

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     getAllRequestCpotb(requestId);
//   };

//   // Fungsi untuk mengapprove request CPOTB
//   const approveCpotb = async () => {
//     try {
//       const day = `${String(new Date().getMonth() + 1).padStart(2, '0')}.${String(new Date().getDate()).padStart(2, '0')}`;
//       const randomString = String(Math.floor(1000 + Math.random() * 9000));
//       const cpotbNumber = `PW-S.01.3.331.${day}.${randomString}`

//       const tx = await contract.cpotb_approve(requestId, cpotbNumber); // Panggil fungsi approve di smart contract
//       await tx.wait(); // Tunggu transaksi selesai
//       console.log("Approve CPOTB receipt:", tx);
//     } catch (error) {
//       console.error("Error approving request:", error);
//     }
//   };

//   function renderGetAllCpotb(data) {
//     const container = document.getElementById('getAllCpotbData');
//     container.innerHTML = '';

//     data.forEach((item) => {
//       const itemDiv = document.createElement('div');

//       itemDiv.classList.add('item');

//       // Isi div dengan data yang diinginkan
//       itemDiv.innerHTML = `
//           <p><strong>Request ID:</strong> ${item.requestId}</p>
//           <p><strong>Nomor CPOTB:</strong> ${item.cpotbNumber}</p>
//           <p><strong>Pabrik Address:</strong> ${item.pabrikAddress}</p>
//           <p><strong>Pabrik Name:</strong> ${item.pabrikName}</p>
//           <p><strong>Status Cpotb:</strong> ${item.statusCpotb}</p>
//           <p><strong>Timestamp Dibuat:</strong> ${item.timestampReq}</p>
//           <p><strong>Timestamp Approve:</strong> ${item.timestampApprove}</p>
//           <hr>
//       `;

//       // Tambahkan itemDiv ke dalam container
//       container.appendChild(itemDiv);
//     })
//   }

//   return (
//     <div className="App">
//       <h1>CPOTB Registration</h1>
//         {!account ? (
//           <button onClick={connect_wallet}>Connect Wallet</button>
//             ) : (
//             <h2>Connected Account: {accountName}</h2>
//             )
//         }
//       <div>
//         <h2>Request CPOTB</h2>
//         <input
//           type="text"
//           placeholder="Nama Pabrik"
//           value={pabrikName}
//           onChange={(e) => setPabrikName(e.target.value)}
//         />
//         <button onClick={requestCpotb}>Submit Request</button>
//       </div>

//       <div>
//         <h2>Approve CPOTB</h2>
//         <input
//           type="text"
//           placeholder="Request ID"
//           value={requestId}
//           onChange={(e) => setRequestId(e.target.value)}
//         />
//         <button onClick={approveCpotb}>Approve Request</button>
//       </div>

//       <div>
//         <button onClick={handleSubmit}>getAllRequestCpotb</button>
//       </div>

//       <div id='getAllCpotbData'></div>
//     </div>
//   );
// }

// export default CpotbPage;
