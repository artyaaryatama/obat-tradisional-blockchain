import { useEffect, useState } from 'react';
import { BrowserProvider, Contract } from "ethers";
import contractData from '../../auto-artifacts/deployments.json';
import { useNavigate } from 'react-router-dom';

import "../../styles/MainLayout.scss"
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import './../../styles/SweetAlert.scss';

const MySwal = withReactContent(Swal);

function ManageCdob() {
  const [contract, setContract] = useState();
  const navigate = useNavigate();

  const userData = JSON.parse(sessionStorage.getItem('userdata'));
  const [dataCdob, setDataCdob] = useState([]);

  const tipePermohonanMap = {
    0: "Obat Lain",
    1: "CCP (Cold Chain Product)",
    2: "Narkotika"
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

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", () => {
        connectWallet();
        window.location.reload(); 
      });
    }
  
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("accountsChanged", connectWallet);
      }
    };
  }, []);

  useEffect(() => {
    const loadData = async () => {
      if (contract && userData.instanceName) {
        try {
          const listAllCt = await contract.getListAllCertificateByInstance(userData.instanceName);
          console.log(listAllCt);
          const reconstructedData = listAllCt.map((item, index) => {
            const cdobNumber = item[1] ? item[1] : 'TBA'

            return {
              cdobId: item[0], 
              cdobNumber: cdobNumber,
              pbfName: item[2],
              tipePermohonan: tipePermohonanMap[item[4]],
              status: statusMap[item[5]],
            };
          })

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
      const detailCdobCt = await contract.detailCdob(id);

      const [cdobId, cdobNumber, cdobDetail, tipePermohonan] = detailCdobCt

      const [status, timestampRequest, timestampApprove, sender, bpom] = cdobDetail

      const detailCdob = {
        cdobId: cdobId,
        cdobNumber: cdobNumber ? cdobNumber : "-",
        pbfUserName: sender[0],
        pbfAddr: sender[1],
        pbfName: sender[2],
        tipePermohonan: tipePermohonanMap[tipePermohonan], 
        status: statusMap[status], 
        timestampRequest: new Date(Number(timestampRequest) * 1000).toLocaleDateString('id-ID', options),
        timestampApprove: Number(timestampApprove) > 0 ? new Date(Number(timestampApprove) * 1000).toLocaleDateString('id-ID', options): "-",
        bpomName : bpom[0] ? bpom[0] : "-",
        bpomInstance: bpom[2] ? bpom[2] : "-",
        bpomAddr: bpom[1] === "0x0000000000000000000000000000000000000000" ? "-" : bpom[1],
      };

      console.log(detailCdob.timestampApprove);

      MySwal.fire({
        title: "Detail Sertifikat CDOB",
        html: (
          <div className='form-swal'>
            <div className="row">
              <div className="col">
                <ul>
                  <li className="label">
                    <p>PBF Instance</p>
                  </li>
                  <li className="input">
                    <p>{detailCdob.pbfName}</p>
                  </li>
                </ul>

                <ul>
                  <li className="label">
                    <p>PBF Address</p> 
                  </li>
                  <li className="input">
                    <p>{detailCdob.pbfAddr}</p> 
                  </li>
                </ul>

                <ul>
                  <li className="label">
                    <p>BPOM Instance</p> 
                  </li>
                  <li className="input">
                    <p>{detailCdob.bpomInstance}</p> 
                  </li>
                </ul>

                <ul>
                  <li className="label">
                    <p>BPOM Address</p> 
                  </li>
                  <li className="input">
                    <p>{detailCdob.bpomAddr}</p> 
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
                    <p>Tipe Permohonan</p>
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
        width: '620',
        showCancelButton: false,
        confirmButtonText: 'Ok',
      })
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
                    <button className='title' onClick={() => getDetailCdob(item.cdobId)}>{item.tipePermohonan}</button>
                    <p>CDOB Number: {item.cdobNumber}</p>
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

export default ManageCdob;