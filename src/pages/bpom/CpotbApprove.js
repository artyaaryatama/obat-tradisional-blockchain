import { useEffect, useState } from 'react';
import { BrowserProvider, Contract } from "ethers";
import contractData from '../../auto-artifacts/deployments.json';
import { useNavigate } from 'react-router-dom';

import "../../styles/MainLayout.scss";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import './../../styles/SweetAlert.scss';

const MySwal = withReactContent(Swal);

function CpotbApprove() {

  const navigate = useNavigate();
  const [contract, setContract] = useState();
  const [loader, setLoader] = useState(false)
  
  const [isApproved, setIsApproved] = useState(false);
  const [dataCpotb, setDataCpotb] = useState([])
  const userdata = JSON.parse(sessionStorage.getItem('userdata'));

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
    document.title = "CPOTB List"; 
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
          console.error("User access denied!");
          errAlert(err, "User access denied!");
        }
      } else {
        console.error("MetaMask is not installed");
      }
    }
    connectWallet();
  }, []);

  useEffect(() => {

    const getAllCpotb = async () => {
      if(contract){
        try {
          const listAllCpotb = await contract.getListAllCpotb()
          console.log(listAllCpotb);

          const reconstructedData = listAllCpotb.map((item) => {
            const cpotbNumber = item[1] ? item[1] : '-'

            return {
              cpotbId: item[0],  
              cpotbNumber: cpotbNumber,
              factoryInstanceName: item[2], 
              jenisSediaan: jenisSediaanMap[item[4]],
              status: statusMap[item[5]],
            };
          })

          console.log(reconstructedData);
      
          setDataCpotb(reconstructedData);
        } catch (e) {
          errAlert(e, "Can't Get The Data")
        }
      }
    }

    getAllCpotb()
  }, [contract])

  useEffect(() => {
    if (contract) {
      console.log('TRIGERRED evt_cpotbApproved listener');
      contract.on('evt_cpotbApproved',  (bpomAddr, bpomInstance, jenisSediaan, cpotbNumber, timestampApprove) => {
  
        const formattedTimestamp = new Date(Number(timestampApprove) * 1000).toLocaleDateString('id-ID', options)
        
        MySwal.fire({
          title: "Success Approve CPOTB",
          html: (
            <div className='form-swal'>
              <ul>
                <li className="label">
                  <p>CPOTB Number</p> 
                </li>
                <li className="input">
                  <p>{cpotbNumber}</p> 
                </li>
              </ul>
              <ul>
                <li className="label">
                  <p>BPOM Instance</p> 
                </li>
                <li className="input">
                  <p>{bpomInstance}</p> 
                </li>
              </ul>
              <ul>
                <li className="label">
                  <p>BPOM Address</p> 
                </li>
                <li className="input">
                  <p>{bpomAddr}</p> 
                </li>
              </ul>
              <ul>
                <li className="label">
                  <p>Tanggal Penyetujuan</p> 
                </li>
                <li className="input">
                  <p>{formattedTimestamp}</p> 
                </li>
              </ul>
              <ul>
                <li className="label">
                  <p>Jenis Sediaan</p> 
                </li>
                <li className="input">
                  <p>{jenisSediaanMap[jenisSediaan]}</p> 
                </li>
              </ul>
            </div>
          ),
          icon: 'success',
          width: '560',
          showCancelButton: false,
          confirmButtonText: 'Oke',
          allowOutsideClick: true,
        }).then((result) => {
          if (result.isConfirmed) {
            window.location.reload();
          }
        });
      });

      return () => {
        console.log("Removing evt_cpotbRequested listener");
        contract.removeAllListeners("evt_cpotbApproved");
      };
    }
  }, [contract]);
  
  const getDetailCpotb = async (id) => {
    
    console.log(id); 
    
    try {
      const detailCpotbCt = await contract.detailCpotb(id);

      const [cpotbId, cpotbNumber, cpotbDetail, jenisSediaan] = detailCpotbCt

      const [status, timestampRequest, timestampApprove, sender, bpom] = cpotbDetail

      const detailCpotb = {
        cpotbId: cpotbId,
        cpotbNumber: cpotbNumber ? cpotbNumber : "-",
        factoryUserName: sender[0],
        factoryAddr: sender[1],
        factoryInstanceName: sender[2],
        jenisSediaan: jenisSediaanMap[jenisSediaan], 
        status: statusMap[status], 
        timestampRequest: new Date(Number(timestampRequest) * 1000).toLocaleDateString('id-ID', options),
        timestampApprove: Number(timestampApprove) > 0 ? new Date(Number(timestampApprove) * 1000).toLocaleDateString('id-ID', options): "-",
        bpomUserName : bpom[0] ? bpom[0] : "-",
        bpomInstance: bpom[2] ? bpom[2] : "-",
        bpomAddr: bpom[1] === "0x0000000000000000000000000000000000000000" ? "-" : bpom[1],
      };

      if(detailCpotb.status === 'Approved'){
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
                      <p>{detailCpotb.factoryInstanceName}</p>
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
      } else{
        MySwal.fire({
          title: "Approve Sertifikat CPOTB",
          html: (
            <div className='form-swal'>
              <div className="row">
                <div className="col">
                  <ul>
                    <li className="label">
                      <p>Factory Instance</p>
                    </li>
                    <li className="input">
                      <p>{detailCpotb.factoryInstanceName}</p>
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
          showCancelButton: true,
          confirmButtonText: 'Approve',
        }).then((result) => {
  
          if(result.isConfirmed){
            const prefix = "PW-S.01.3.331";
            const day = `${String(new Date().getMonth() + 1).padStart(2, '0')}.${String(new Date().getDate()).padStart(2, '0')}`;
            const randomString = String(Math.floor(1000 + Math.random() * 9000));
            const cpotbNumber = `${prefix}.${day}.${randomString}`
            
            MySwal.fire({
              title: 'Approve Sertifikat CPOTB',
              html: (
                <div className="form-swal form">
                  <div className="row">
                    <div className="col">
                      <ul>
                        <li className="label">
                          <label htmlFor="factoryInstanceName">factory Instance</label>
                        </li>
                        <li className="input">
                          <input
                            type="text"
                            id="factoryInstanceName"
                            value={detailCpotb.factoryInstanceName}
                            readOnly
                          />
                        </li>
                      </ul>
              
                      <ul>
                        <li className="label">
                          <label htmlFor="factoryAddr">Factory Address</label>
                        </li>
                        <li className="input">
                          <input
                            type="text"
                            id="factoryAddr"
                            value={detailCpotb.factoryAddr}
                            readOnly
                          />
                        </li>
                      </ul>

                      <ul>
                        <li className="label">
                          <label htmlFor="bpomInstance">BPOM Instance</label>
                        </li>
                        <li className="input">
                          <input
                            type="text"
                            id="bpomInstance"
                            value={userdata.instanceName}
                            readOnly
                          />
                        </li>
                      </ul>
              
                      <ul>
                        <li className="label">
                          <label htmlFor="bpomAddr">BPOM Address</label>
                        </li>
                        <li className="input">
                          <input
                            type="text"
                            id="bpomAddr"
                            value={userdata.address}
                            readOnly
                          />
                        </li>
                      </ul>
                    </div>
              
                    <div className="col">
                      <ul>
                        <li className="label">
                          <label htmlFor="cpotbNumber">CPOTB Number</label>
                        </li>
                        <li className="input">
                          <input
                            type="text"
                            id="cpotbNumber"
                            value={cpotbNumber}
                            readOnly
                          />
                        </li>
                      </ul>
              
                      <ul>
                        <li className="label">
                          <label htmlFor="jenisSediaan">Jenis Sediaan</label>
                        </li>
                        <li className="input">
                          <input
                            type="text"
                            id="jenisSediaan"
                            value={detailCpotb.jenisSediaan}
                            readOnly
                          />
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              ),     
              width: '660',       
              icon: 'warning',
              showCancelButton: true,
              confirmButtonText: 'Yes, Approve!',
              confirmButtonColor: '#4CBE53',
              cancelButtonText: 'Cancel',
              allowOutsideClick: false,
            }).then((result) => {

              if(result.isConfirmed){

                MySwal.fire({
                  title:"Processing your request...",
                  text:"Your request is on its way. This won't take long. 🚀",
                  icon: 'info',
                  showCancelButton: false,
                  showConfirmButton: false,
                  allowOutsideClick: false
                })

                approveCpotb(cpotbNumber, id, detailCpotb.jenisSediaan)
              }
            })
          } 
        })

      }
      
    } catch (e) {
      errAlert(e, "Can't retrieve data")
    }
  }

  const approveCpotb = async(certNumber, certTd, jenisSediaan) => {

    const jenisMap = {
      "Tablet": 0n,
      "Kapsul": 1n,
      "Kapsul Lunak": 2n,
      "Serbuk Oral": 3n,
      "Cairan Oral": 4n,
      "Cairan Obat Dalam": 5n,
      "Cairan Obat Luar": 6n,
      "Film Strip / Edible Film": 7n,
      "Pil": 8n
    };
    console.log(certNumber, certTd, jenisMap[jenisSediaan]);

    try {
      const jenis = jenisMap[jenisSediaan];
      const approveCt = await contract.approveCpotb([certNumber, certTd, userdata.name, userdata.instanceName], jenis)

      if(approveCt){
        MySwal.update({
          title: "Processing your transaction...",
          text: "This may take a moment. Hang tight! ⏳"
        });
      }
    } catch (error) {
      errAlert(error, "Can't Approve CPOTB")
    }
  }

  return (
    <>
      <div id="CpotbPage" className='Layout-Menu layout-page'>
        <div className="title-menu">
          <h1>Data Sertifikat CPOTB</h1>
        </div>
        <div className="tab-menu">
          <ul>
            <li><button className='active' onClick={() => navigate('/cpotb-approval')}>List CPOTB</button></li>
            <li><button onClick={() => navigate('/cdob-approval')}>List CDOB</button></li>
          </ul>
        </div>
        <div className="container-data">
          <div className="data-list">
            {dataCpotb.length > 0 ? (
              <ul>
                {dataCpotb.map((item, index) => (
                  <li key={index}>
                    <button className='title' onClick={() => getDetailCpotb(item.cpotbId)}>{item.factoryInstanceName}: {item.jenisSediaan}</button>
                    <p>CPOTB Number : {item.cpotbNumber}</p>
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


export default CpotbApprove;