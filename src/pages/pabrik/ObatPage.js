import { useEffect, useState } from 'react';
import { BrowserProvider, Contract } from "ethers";
import contractObatTradisional from '../../auto-artifacts/ObatTradisional.json';
import { useNavigate } from 'react-router-dom';

import "../../styles/MainLayout.scss"
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import './../../styles/SweetAlert.scss';

const MySwal = withReactContent(Swal);

function ObatPage() {
  const [contract, setContract] = useState();
  const navigate = useNavigate();

  const userData = JSON.parse(sessionStorage.getItem('userdata')) || {};
  const [dataObat, setDataObat] = useState([]);

  const obatStatusMap = {
    0: "In Local Production",
    1: "Requested NIE",
    2: "Approved NIE"
  };

  const tipeProdukMap = {
    0: "Obat Tradisional",
    1: "Suplemen Kesehatan"
  };

  useEffect(() => {
    document.title = "Obat Tradisional"; 
  }, []);

  useEffect(() => {
    async function connectWallet() {
      if (window.ethereum) {
        try {
          const provider = new BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const contr = new Contract(
            contractObatTradisional.address, 
            contractObatTradisional.abi, 
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
          const tx = await contract.getListObatByFactory(userData.instanceName);
          console.log(tx);
          const [obatIdArray, namaProdukArray, obatStatusArray, tipeProdukArray] = tx;
          console.log(tx[1]);

          const reconstructedData = obatStatusArray.map((obatStatus, index) => {
            const readableObatStatus = obatStatusMap[obatStatus];
            const readableTipeProduk = tipeProdukMap[tipeProdukArray[index]];
  
            return {
              NamaObat : namaProdukArray[index],
              tipeProduk: readableTipeProduk,
              ObatStatus: readableObatStatus,
              idObat: obatIdArray[index]
            };
          });
  
          // Log the transformed data
          console.log("Reconstructed Data:", reconstructedData);
  
          setDataObat(reconstructedData);
  
        } catch (error) {
          console.error("Error loading data: ", error);
        }
      }
    };
  
    loadData();
  }, [contract, userData.instanceName]);

  // const getDetailObat = async (id) => {
    
  //   console.log(id);

  //   try {
  //     const tx = await contract.getListCpotbById(id);

  //     const detailCpotb = {
  //       cpotbId: tx.cpotbId,
  //       senderName: tx.senderName,
  //       factoryAddr: tx.factoryAddr,
  //       factoryName: tx.factoryName,
  //       jenisSediaan: jenisSediaanMap[tx.jenisSediaan], 
  //       status: statusMap[tx.status], 
  //       timestampRequest: new Date(Number(tx.timestampRequest) * 1000).toLocaleDateString('id-ID', options), 
  //       timestampApprove: Number(tx.timestampApprove) > 0 ? new Date(Number(tx.timestampApprove) * 1000).toLocaleDateString('id-ID', options): "-",
  //       cpotbNumber: tx.cpotbNumber ? tx.cpotbNumber : "-",
  //       bpomAddr: tx.bpomAddr === "0x0000000000000000000000000000000000000000" ? "-" : tx.bpomAddr,
  //       receiverName: tx.receiverName ? tx.receiverName : "-"
  //     };
      
  //     MySwal.fire({
  //       title: "Sertifikat CPOTB",
  //       html: (
  //         <div className='form-swal'>
  //           <div className="row">
  //             <div className="col">
  //               <ul>
  //                 <li className="label">
  //                   <p>Diajukan oleh</p>
  //                 </li>
  //                 <li className="input">
  //                   <p>{detailCpotb.factoryName}</p>
  //                 </li>
  //               </ul>

  //               <ul>
  //                 <li className="label">
  //                   <p>Address Pengirim</p> 
  //                 </li>
  //                 <li className="input">
  //                   <p>{detailCpotb.factoryAddr}</p> 
  //                 </li>
  //               </ul>

  //               <ul>
  //                 <li className="label">
  //                   <p>Nama Pengirim</p> 
  //                 </li>
  //                 <li className="input">
  //                   <p>{detailCpotb.senderName}</p> 
  //                 </li>
  //               </ul>

  //               <ul>
  //                 <li className="label">
  //                   <p>Address BPOM</p> 
  //                 </li>
  //                 <li className="input">
  //                   <p>{detailCpotb.bpomAddr}</p> 
  //                 </li>
  //               </ul>

  //               <ul>
  //                 <li className="label">
  //                   <p>Nama Penyutuju</p> 
  //                 </li>
  //                 <li className="input">
  //                   <p>{detailCpotb.receiverName}</p> 
  //                 </li>
  //               </ul>
  //             </div>

  //             <div className="col">
  //               <ul>
  //                 <li className="label">
  //                   <p>Status Sertifikasi</p>
  //                   <label htmlFor="statusCpotb"></label>
  //                 </li>
  //                 <li className="input">
  //                   <p className={detailCpotb.status}>{detailCpotb.status}</p>
  //                 </li>
  //               </ul>

  //               <ul>
  //                 <li className="label">
  //                   <p>Nomor CPOTB</p>
  //                   <label htmlFor="nomorCpotb"></label>
  //                 </li>
  //                 <li className="input">
  //                   <p>{detailCpotb.cpotbNumber}</p> 
  //                 </li>
  //               </ul>

  //               <ul>
  //                 <li className="label">
  //                   <p>Jenis Sediaan</p>
  //                 </li>
  //                 <li className="input">
  //                   <p>{detailCpotb.jenisSediaan}</p> 
  //                 </li>
  //               </ul>

  //               <ul>
  //                 <li className="label">
  //                   <p>Tanggal Pengajuan</p> 
  //                 </li>
  //                 <li className="input">
  //                   <p>{detailCpotb.timestampRequest}</p> 
  //                 </li>
  //               </ul>

  //               <ul>
  //                 <li className="label">
  //                   <p>Tanggal Disertifikasi</p> 
  //                 </li>
  //                 <li className="input">
  //                   <p>{detailCpotb.timestampApprove}</p> 
  //                 </li>
  //               </ul>
  //             </div>
  //           </div>
          
  //         </div>
  //       ),
  //       width: '720',
  //       showCancelButton: false,
  //       confirmButtonText: 'Oke',
  //     })

  //     console.log(detailCpotb);

  //   } catch (e) {
  //     errAlert(e, "Can't retrieve data")
  //   }
  // }

  return (
    <>
      <div id="ObatPage" className='Layout-Menu layout-page'>
        <div className="title-menu">
          <h1>Data Obat Tradisional</h1>
          <p>Di produksi oleh {userData.instanceName}</p>
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
              <button className='btn-menu' onClick={() => {navigate('/create-obat')}}>
                <i className="fa-solid fa-plus"></i>
                Add new data
              </button>
            </div>
          </div>
          <div className="data-list">
            {dataObat.length > 0 ? (
              <ul>
                {dataObat.map((item, index) => (
                  <li key={index}>
                    {/* <button className='title' onClick={() => getDetailObat(item.idObat)}>{item.jenisSediaan}</button> */}
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

export default ObatPage;