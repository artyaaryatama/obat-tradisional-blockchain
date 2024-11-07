import React, { useEffect } from 'react';
import { useUser } from '../UserContext'; 

function CpotbPage() {
  const { userDetails } = useUser(); 

  useEffect(() => {
    console.log("User details from context:", userDetails);
  }, [userDetails]);

  console.log(typeof(userDetails.role));

  const roles = {
    '0': "Factory",
    1n: "PBF", 
    '2': "BPOM",
    3n: "Retailer",
    4n: "Guest"
  }

  return (
    <div>
      <h2>CPOTB Page</h2>
      <p>User Address: {userDetails.address}</p>
      <p>User Name: {userDetails.name}</p>
      <p>User Role: {roles[userDetails.role]}</p>
    </div>
  );
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
