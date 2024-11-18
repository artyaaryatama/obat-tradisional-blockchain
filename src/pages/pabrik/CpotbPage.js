import { useEffect, useState } from 'react';
import { BrowserProvider, Contract } from "ethers";
import contractData from '../../auto-artifacts/deployments.json';
import { useNavigate } from 'react-router-dom';

import "../../styles/MainLayout.scss"
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import './../../styles/SweetAlert.scss';

const MySwal = withReactContent(Swal);

function CpotbPage() {
  const [contract, setContract] = useState();
  const navigate = useNavigate();

  const userData = JSON.parse(sessionStorage.getItem('userdata')) || {};
  const [dataCpotb, setDataCpotb] = useState([]);

  const jenisSediaanMap = {
    0n: "Tablet",
    1n: "Kapsul",
    2n: "Kapsul Lunak",
    3n: "Serbuk Oral",
    4n: "Cairan Oral",
    5n: "Cairan Obat Dalam",
    6n: "Cairan Obat Luar",
    7n: "Film Strip / Edible Film",
    8n: "Pil"
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
    document.title = "CPOTB Certification"; 
  }, []);

  useEffect(() => {
    async function connectWallet() {
      if (window.ethereum) {
        try {
          const provider = new BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const contr = new Contract(
            contractData.MainSupplyChain.address, 
            contractData.MainSupplyChain.abi, 
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
          const tx = await contract.getListCpotbByFactory(userData.instanceName);
          console.log(tx);
          const [jenisSediaanArray, statusArray, latestTimestampArray, idArray] = tx;
          console.log(tx[1]);

          const reconstructedData = jenisSediaanArray.map((jenisSediaan, index) => {
            const readableJenisSediaan = jenisSediaanMap[jenisSediaan];
            const readableStatus = statusMap[statusArray[index]];

            const timestampDate = new Date(Number(latestTimestampArray[index]) * 1000);;
            const formattedTimestamp = timestampDate.toLocaleDateString('id-ID', options);
  
            return {
              jenisSediaan: readableJenisSediaan,
              status: readableStatus,
              latestTimestamp: formattedTimestamp,
              idCpotb: idArray[index]
            };
          });
  
          // Log the transformed data
          console.log("Reconstructed Data:", reconstructedData);
  
          setDataCpotb(reconstructedData);
  
        } catch (error) {
          console.error("Error loading data: ", error);
        }
      }
    };
  
    loadData();
  }, [contract, userData.instanceName]);

  const getDetailCpotb = async (id) => {
    
    console.log(id);

    try {
      const tx = await contract.getListCpotbById(id);

      const detailCpotb = {
        cpotbId: tx.cpotbId,
        senderName: tx.senderName,
        factoryAddr: tx.factoryAddr,
        factoryName: tx.factoryName,
        jenisSediaan: jenisSediaanMap[tx.jenisSediaan], 
        status: statusMap[tx.status], 
        timestampRequest: new Date(Number(tx.timestampRequest) * 1000).toLocaleDateString('id-ID', options), 
        timestampApprove: Number(tx.timestampApprove) > 0 ? new Date(Number(tx.timestampApprove) * 1000).toLocaleDateString('id-ID', options): "-",
        cpotbNumber: tx.cpotbNumber ? tx.cpotbNumber : "-",
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
                    <p>{detailCpotb.factoryName}</p>
                  </li>
                </ul>

                <ul>
                  <li className="label">
                    <p>Address Pengirim</p> 
                  </li>
                  <li className="input">
                    <p>{detailCpotb.factoryAddr}</p> 
                  </li>
                </ul>

                <ul>
                  <li className="label">
                    <p>Nama Pengirim</p> 
                  </li>
                  <li className="input">
                    <p>{detailCpotb.senderName}</p> 
                  </li>
                </ul>

                <ul>
                  <li className="label">
                    <p>Address BPOM</p> 
                  </li>
                  <li className="input">
                    <p>{detailCpotb.bpomAddr}</p> 
                  </li>
                </ul>

                <ul>
                  <li className="label">
                    <p>Nama Penyutuju</p> 
                  </li>
                  <li className="input">
                    <p>{detailCpotb.receiverName}</p> 
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
                    <p className={detailCpotb.status}>{detailCpotb.status}</p>
                  </li>
                </ul>

                <ul>
                  <li className="label">
                    <p>Nomor CPOTB</p>
                    <label htmlFor="nomorCpotb"></label>
                  </li>
                  <li className="input">
                    <p>{detailCpotb.cpotbNumber}</p> 
                  </li>
                </ul>

                <ul>
                  <li className="label">
                    <p>Jenis Sediaan</p>
                  </li>
                  <li className="input">
                    <p>{detailCpotb.jenisSediaan}</p> 
                  </li>
                </ul>

                <ul>
                  <li className="label">
                    <p>Tanggal Pengajuan</p> 
                  </li>
                  <li className="input">
                    <p>{detailCpotb.timestampRequest}</p> 
                  </li>
                </ul>

                <ul>
                  <li className="label">
                    <p>Tanggal Disertifikasi</p> 
                  </li>
                  <li className="input">
                    <p>{detailCpotb.timestampApprove}</p> 
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

      console.log(detailCpotb);

    } catch (e) {
      errAlert(e, "Can't retrieve data")
    }
  }

  return (
    <>
      <div id="CpotbPage" className='Layout-Menu layout-page'>
        <div className="title-menu">
          <h1>Data Sertifikat CPOTB</h1>
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
              <button className='btn-menu' onClick={() => navigate('/request-cpotb')}>
                <i className="fa-solid fa-plus"></i>
                Add new data
              </button>
            </div>
          </div>
          <div className="data-list">
            {dataCpotb.length > 0 ? (
              <ul>
                {dataCpotb.map((item, index) => (
                  <li key={index}>
                    <button className='title' onClick={() => getDetailCpotb(item.idCpotb)}>{item.jenisSediaan}</button>
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

export default CpotbPage;