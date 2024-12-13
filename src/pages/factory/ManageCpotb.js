import { useEffect, useState } from 'react';
import { BrowserProvider, Contract } from "ethers";
import contractData from '../../auto-artifacts/deployments.json';
import { useNavigate } from 'react-router-dom';

import "../../styles/MainLayout.scss"
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import './../../styles/SweetAlert.scss';

const MySwal = withReactContent(Swal);

function ManageCpotb() {
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
    timeZoneName: 'short'
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
      if (contract) {
        try {
          console.log(userData.instanceName);
          const listAllCt = await contract.getListAllCertificateByInstance(userData.instanceName);
          console.log(listAllCt);
          const reconstructedData = listAllCt.map((item, index) => {
            const cpotbNumber = item[1] ? item[1] : '-'

            return {
              cpotbId: item[0], 
              cpotbNumber: cpotbNumber,
              factoryName: item[2],
              jenisSediaan: jenisSediaanMap[item[4]],
              status: statusMap[item[5]],
            };
          })

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
      const detailCpotbCt = await contract.detailCpotb(id);
      console.log(detailCpotbCt);

      const [cpotbId, cpotbNumber, cpotbDetail, jenisSediaan] = detailCpotbCt

      const [status, timestampRequest, timestampApprove, sender, bpom] = cpotbDetail

      const detailCpotb = {
        cpotbId: cpotbId,
        cpotbNumber: cpotbNumber ? cpotbNumber : "-",
        senderName: sender[0],
        factoryAddr: sender[1],
        factoryName: sender[2],
        jenisSediaan: jenisSediaanMap[jenisSediaan], 
        status: statusMap[status], 
        timestampRequest: new Date(Number(timestampRequest) * 1000).toLocaleDateString('id-ID', options),
        timestampApprove: Number(timestampApprove) > 0 ? new Date(Number(timestampApprove) * 1000).toLocaleDateString('id-ID', options): "-",
        bpomName : bpom[0] ? bpom[0] : "-",
        bpomInstance: bpom[2] ? bpom[2] : "-",
        bpomAddr: bpom[1] === "0x0000000000000000000000000000000000000000" ? "-" : bpom[1],
      };
      
      MySwal.fire({
        title: "Detail Sertifikat CPOTB",
        html: (
          <div className='form-swal'>
            <div className="row">
              <div className="col">
                <ul>
                  <li className="label">
                    <p>Factory Instance</p>
                  </li>
                  <li className="input">
                    <p>{detailCpotb.factoryName}</p>
                  </li>
                </ul>

                <ul>
                  <li className="label">
                    <p>Factory Address</p> 
                  </li>
                  <li className="input">
                    <p>{detailCpotb.factoryAddr}</p> 
                  </li>
                </ul>

                <ul>
                  <li className="label">
                    <p>BPOM Instance</p> 
                  </li>
                  <li className="input">
                    <p>{detailCpotb.bpomInstance}</p> 
                  </li>
                </ul>

                <ul>
                  <li className="label">
                    <p>BPOM Address</p> 
                  </li>
                  <li className="input">
                    <p>{detailCpotb.bpomAddr}</p> 
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
        width: '620',
        showCloseButton: true,
        showCancelButton: false,
        showConfirmButton: false
      })

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
                    <button className='title' onClick={() => getDetailCpotb(item.cpotbId)}>{item.jenisSediaan}</button>
                    <p>CPOTB Number: {item.cpotbNumber}</p>
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

export default ManageCpotb;