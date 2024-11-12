import { useEffect, useState } from 'react';
import { BrowserProvider, Contract } from "ethers";
import contractMainSupplyChain from '../../auto-artifacts/MainSupplyChain.json';
import { useNavigate } from 'react-router-dom';

import "../../styles/MainLayout.scss"
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import './../../styles/SweetAlert.scss';

const MySwal = withReactContent(Swal);

function CdobPage() {
  const [contract, setContract] = useState();
  const navigate = useNavigate();

  const userData = JSON.parse(sessionStorage.getItem('userdata')) || {};
  const [dataCdob, setDataCdob] = useState([]);

  const tipePermohonanMap = {
    0: "Obat Lain",
    1: "CCP (Cold Chain Product)",
  };

  const statusMap = {
    0: "Pending",
    1: "Approved"
  };

  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }

  useEffect(() => {
    document.title = "CDOB Certification"; 
  }, []);

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

  useEffect(() => {
    const loadData = async () => {
      if (contract && userData.instanceName) {
        try {
          const tx = await contract.getListCdobByPbf(userData.instanceName);
          console.log(tx);
          const [tipePermohonanArray, statusArray, latestTimestampArray, idArray] = tx;
          console.log(tx[1]);

          const reconstructedData = tipePermohonanArray.map((tipePermohonan, index) => {
            const readableTipePermohonan = tipePermohonanMap[tipePermohonan];
            const readableStatus = statusMap[statusArray[index]];

            const timestampDate = new Date(Number(latestTimestampArray[index]) * 1000);;
            const formattedTimestamp = timestampDate.toLocaleDateString('id-ID', options);
  
            return {
              tipePermohonan: readableTipePermohonan,
              status: readableStatus,
              latestTimestamp: formattedTimestamp,
              idCdob: idArray[index]
            };
          });
  
          // Log the transformed data
          console.log("Reconstructed Data:", reconstructedData);
  
          setDataCdob(reconstructedData);
  
        } catch (error) {
          console.error("Error loading data: ", error);
        }
      }
    };
  
    loadData();
  }, [contract, userData.instanceName]);

  const getDetailCdob = async (id) => {
    
    console.log(id);

    try {
      const tx = await contract.getListCdobById(id);

      const detailCdob = {
        cpotbId: tx.cdobId,
        senderName: tx.senderName,
        pbfAddr: tx.pbfAddr,
        pbfName: tx.pbfName,
        tipePermohonan: tipePermohonanMap[tx.tipePermohonan], 
        status: statusMap[tx.status], 
        timestampRequest: new Date(Number(tx.timestampRequest) * 1000).toLocaleDateString('id-ID', options), 
        timestampApprove: Number(tx.timestampApprove) > 0 ? new Date(Number(tx.timestampApprove) * 1000).toLocaleDateString('id-ID', options): "-",
        cdobNumber: tx.cdobNumber ? tx.cdobNumber : "-",
        bpomAddr: tx.bpomAddr === "0x0000000000000000000000000000000000000000" ? "-" : tx.bpomAddr,
        receiverName: tx.receiverName ? tx.receiverName : "-"
      };
      
      MySwal.fire({
        title: "Sertifikat CPOTB",
        html: (
          <div className='form-swal'>
            <div className="row">
              <div className="col">
                <ul>
                  <li className="label">
                    <p>Diajukan oleh</p>
                  </li>
                  <li className="input">
                    <p>{detailCdob.pbfName}</p>
                  </li>
                </ul>

                <ul>
                  <li className="label">
                    <p>Address Pengirim</p> 
                  </li>
                  <li className="input">
                    <p>{detailCdob.pbfAddr}</p> 
                  </li>
                </ul>

                <ul>
                  <li className="label">
                    <p>Nama Pengirim</p> 
                  </li>
                  <li className="input">
                    <p>{detailCdob.senderName}</p> 
                  </li>
                </ul>

                <ul>
                  <li className="label">
                    <p>Address BPOM</p> 
                  </li>
                  <li className="input">
                    <p>{detailCdob.bpomAddr}</p> 
                  </li>
                </ul>

                <ul>
                  <li className="label">
                    <p>Nama Penyutuju</p> 
                  </li>
                  <li className="input">
                    <p>{detailCdob.receiverName}</p> 
                  </li>
                </ul>
              </div>

              <div className="col">
                <ul>
                  <li className="label">
                    <p>Status Sertifikasi</p>
                    <label htmlFor="statusCpotb"></label>
                  </li>
                  <li className="input">
                    <p className={detailCdob.status}>{detailCdob.status}</p>
                  </li>
                </ul>

                <ul>
                  <li className="label">
                    <p>Nomor CDOB</p>
                    <label htmlFor="nomorCpotb"></label>
                  </li>
                  <li className="input">
                    <p>{detailCdob.cdobNumber}</p> 
                  </li>
                </ul>

                <ul>
                  <li className="label">
                    <p>Jenis Sediaan</p>
                  </li>
                  <li className="input">
                    <p>{detailCdob.tipePermohonan}</p> 
                  </li>
                </ul>

                <ul>
                  <li className="label">
                    <p>Tanggal Pengajuan</p> 
                  </li>
                  <li className="input">
                    <p>{detailCdob.timestampRequest}</p> 
                  </li>
                </ul>

                <ul>
                  <li className="label">
                    <p>Tanggal Disertifikasi</p> 
                  </li>
                  <li className="input">
                    <p>{detailCdob.timestampApprove}</p> 
                  </li>
                </ul>
              </div>
            </div>
          
          </div>
        ),
        width: '720',
        showCancelButton: false,
        confirmButtonText: 'Oke',
      })

      console.log(detailCdob);

    } catch (e) {
      errAlert(e, "Can't retrieve data")
    }
  }

  return (
    <>
      <div id="CpotbPage" className='Layout-Menu layout-page'>
        <div className="title-menu">
          <h1>Data Sertifikat CDOB</h1>
          <p>Di ajukan oleh {userData.instanceName}</p>
        </div>
        {/* <div className="tab-menu">
          <ul>
            <li><button className='active'>Pengajuan CPOTB</button></li>
            <li><button>Add new request</button></li>
          </ul>
        </div> */}
        <div className="container-data">
          <div className="menu-data">
            <div className="btn">
              <button className='btn-menu' onClick={() => navigate('/request-cdob')}>
                <i className="fa-solid fa-plus"></i>
                Add new data
              </button>
            </div>
          </div>
          <div className="data-list">
            {dataCdob.length > 0 ? (
              <ul>
                {dataCdob.map((item, index) => ( 
                  <li key={index}>
                    <button className='title' onClick={() => getDetailCdob(item.idCdob)}>{item.tipePermohonan}</button>
                    <p>Tanggal Pengajuan: {item.latestTimestamp}</p>
                    <button className={`statusPengajuan ${item.status}`}>
                      {item.status}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <h2 className='small'>No Records Found</h2>
            )}
        </div>
        </div>
      </div>
    </>
  );
}

function errAlert(err, customMsg){
  
  const errorObject = {
    message: err.reason || err.message || customMsg || "Unknown error",
    data: err.data || {},
    transactionHash: err.transactionHash || null
  };
  
  MySwal.fire({
    title: errorObject.message,
    text: customMsg,
    icon: 'error',
    confirmButtonText: 'Try Again'
  });

  console.error(customMsg)
  console.error(errorObject);
}

export default CdobPage;


// import { useState } from "react";
// import { BrowserProvider, Contract } from "ethers";
// import CdobRegistrationABI from "../artifacts/contracts/CdobRegistration.sol/CdobRegistration.json"; // Import ABI smart contract

// const CdobRegistrationContract = "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318"; // Ganti dengan address smart contract

// const addressAcc = {
//   "0x70997970C51812dc3A010C7d01b50e0d17dc79C8": "BPOM",
//   "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266": "Pabrik Axxz" 
// }

// function CpotbPage() {
//   const [account, setAccount] = useState("");
//   const [provider, setProvider] = useState(null);
//   const [signer, setSigner] = useState(null);
//   const [contract, setContract] = useState(null);
//   const [pbfName, setPbfName] = useState("");
//   const [requestId, setRequestId] = useState("");
//   const [accountName, setAccountName] = useState("")

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

//   const connect_wallet = async () => {
//     if (window.ethereum) {
//       try {
//         const prov = new BrowserProvider(window.ethereum);
//         console.log(prov);

//         const accounts = await prov.send("eth_requestAccounts", []);
//         console.log("Accounts: ", accounts);

//         const sign = await prov.getSigner();
//         const contr = new Contract(
//           CdobRegistrationContract, 
//           CdobRegistrationABI.abi, 
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

//   const requestCdob = async () => {
//     try {
//       const id = Math.random().toString(36).slice(2, 9); 
//       setRequestId(id); 
//       console.log('ini req id: ', id);

//       const tx = await contract.cdob_request(id, pbfName); 
//       await tx.wait(); 
//       console.log("receipt contract:", tx);
//       console.log("pbf name: ", pbfName);
//     } catch (error) {
//       console.error("Error making request:", error);
//     }
//   };

//   // fungsi getterr cpotb
//   const getAllrequestCdob = async () => {
//     try {
//       const requestIds = await contract.get_all_cdob_request();
//       const reqCdobData = []

//       // console.log(requestIds);

//       for(let i= 0;i < requestIds.length; i++ ){
//         const tx = await contract.get_cdob_request_byId(requestIds[i])
//         console.log(tx)
//         reqCdobData.push({
//             requestId: requestIds[i],
//             pbfAddress: tx[0],
//             pbfName: tx[1],
//             timestampReq: new Date(Number(tx[2])*1000).toLocaleString(),
//             timestampApprove: tx[3]? new Date(Number(tx[3])*1000).toLocaleString() : 0,
//             cdobNumber: tx[4],
//             bpomAddress: tx[5],
//             statusCdob: tx[6]
//           })
//       }
      
//       console.log(reqCdobData);
//       renderGetAllCdob(reqCdobData)


//     } catch (e){
//       console.error(e)
//     }
//   }

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     getAllrequestCdob(requestId);
//   };

//   // Fungsi untuk mengapprove request CPOTB
//   const approveCdob = async () => {
//     try {
//       const randomDigits1 = Math.floor(1000 + Math.random() * 9000);
//       const randomDigits2 = Math.floor(1000 + Math.random() * 9000);
//       const today = new Date();
//       const month = String(today.getMonth() + 1).padStart(2, '0');  
//       const year = today.getFullYear(); 
//       const nomorSurat = `CDOB${randomDigits1}/S/1-${randomDigits2}/${month}/${year}`;

//       const tx = await contract.cdob_approve(requestId, nomorSurat); 
//       await tx.wait(); // Tunggu transaksi selesai
//       console.log("Approve CDOB receipt:", tx);
//     } catch (error) {
//       console.error("Error approving request:", error);
//     }
//   };

//   function renderGetAllCdob(data) {
//     const container = document.getElementById('getAllCdobData');
//     container.innerHTML = '';

//     data.forEach((item) => {
//       const itemDiv = document.createElement('div');

//       itemDiv.classList.add('item');

//       // Isi div dengan data yang diinginkan
//       itemDiv.innerHTML = `
//           <p><strong>Request ID:</strong> ${item.requestId}</p>
//           <p><strong>Nomor CDOB :</strong> ${item.cdobNumber}</p>
//           <p><strong>Pabrik Address:</strong> ${item.pbfAddress}</p>
//           <p><strong>Pabrik Name:</strong> ${item.pbfName}</p>
//           <p><strong>Status Cpotb:</strong> ${item.statusCdob}</p>
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
//       <h1>CDOB Registration</h1>
//         {!account ? (
//           <button onClick={connect_wallet}>Connect Wallet</button>
//             ) : (
//             <h2>Connected Account: {accountName}</h2>
//             )
//         }
//       <div>
//         <h2>Request CDOB</h2>
//         <input
//           type="text"
//           placeholder="Nama PBF "
//           value={pbfName}
//           onChange={(e) => setPbfName(e.target.value)}
//         />
//         <button onClick={requestCdob}>Submit Request</button>
//       </div>

//       <div>
//         <h2>Approve CDOB</h2>
//         <input
//           type="text"
//           placeholder="Request ID"
//           value={requestId}
//           onChange={(e) => setRequestId(e.target.value)}
//         />
//         <button onClick={approveCdob}>Approve Request</button>
//       </div>

//       <div>
//         <button onClick={handleSubmit}>getAllrequestCdob</button>
//       </div>

//       <div id='getAllCdobData'></div>
//     </div>
//   );
// }

// export default CpotbPage;
