import { useEffect, useState } from 'react';
import { BrowserProvider, Contract } from "ethers";
import contractData from '../../auto-artifacts/deployments.json';
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