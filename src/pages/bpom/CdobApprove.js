import { useEffect, useState } from 'react';
import { BrowserProvider, Contract } from "ethers";
import contractData from '../../auto-artifacts/deployments.json';
import { useNavigate } from 'react-router-dom';

import "../../styles/MainLayout.scss";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import './../../styles/SweetAlert.scss';

const MySwal = withReactContent(Swal);

function CdobApprove() {

  const navigate = useNavigate();
  const [contract, setContract] = useState();
  const [loader, setLoader] = useState(false);
  
  const [isApproved, setIsApproved] = useState(false);
  const [numberCdob, setNumberCdob] = useState("");
  const [dataCdob, setDataCdob] = useState([]);
  const userdata = JSON.parse(sessionStorage.getItem('userdata'));

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
    timeZoneName: 'short'
  }

  useEffect(() => {
    document.title = "CDOB List"; 
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

    const getAllCdob = async () => {
      if(contract){
        try {
          const listAllCdob = await contract.getListAllCdob()
          console.log(listAllCdob);

          const reconstructedData = listAllCdob.map((item) => {
            const cdobNumber = item[1] ? item[1] : '-'

            return {
              cdobId: item[0],  
              cdobNumber: cdobNumber,
              pbfName: item[2], 
              tipePermohonan: tipePermohonanMap[item[4]],
              status: statusMap[item[5]],
            };
          })
  
          setDataCdob(reconstructedData);
        } catch (e) {
          errAlert(e, "Can't Get The Data")
        }
      }
    }

    getAllCdob()
  }, [contract])

  useEffect(() => {
    if (contract) {
      console.log('TRIGERRED evt_cpotbApproved listener');
      contract.on('evt_cdobApproved',  (bpomInstance, bpomAddr, tipePermohonan, cdobNumber, timestampApprove) => {
        
        const formattedTimestamp = new Date(Number(timestampApprove) * 1000).toLocaleDateString('id-ID', options)

        MySwal.fire({
          title: "Success Approve CPOTB",
          html: (
            <div className='form-swal'>
              <ul>
                <li className="label">
                  <p>CDOB Number</p> 
                </li>
                <li className="input">
                  <p>{cdobNumber}</p> 
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
                  <p>Tipe Permohonan</p> 
                </li>
                <li className="input">
                  <p>{tipePermohonanMap[tipePermohonan]}</p> 
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
        contract.removeAllListeners("evt_cdobApproved");
      };

    }
  }, [contract]);

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

      if(detailCdob.status === 'Approved'){
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

      } else{
        MySwal.fire({
          title: "Approve Sertifikat CDOB",
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
                    </li>
                    <li className="input">
                      <p className={detailCdob.status}>{detailCdob.status}</p>
                    </li>
                  </ul>
  
                  <ul>
                    <li className="label">
                      <p>Nomor CDOB</p>
                    </li>
                    <li className="input">
                      <p>{detailCdob.cdobNumber}</p> 
                    </li>
                  </ul>
  
                  <ul>
                    <li className="label">
                      <p>Tiper Permohonan</p>
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
          confirmButtonText: 'Approve',
          showCancelButton: true
        }).then((result) => {
  
          if(result.isConfirmed){
            const randomDigits1 = Math.floor(1000 + Math.random() * 9000);
            const randomDigits2 = Math.floor(1000 + Math.random() * 9000);
            const today = new Date();
            const month = String(today.getMonth() + 1).padStart(2, '0');  
            const year = today.getFullYear(); 
            const cdobNumber = `CDOB${randomDigits1}/S1-${randomDigits2}/${month}/${year}`;
            
            MySwal.fire({
              title: 'Approve Sertifikat CDOB',
              html: (
                <div className="form-swal form">
                  <div className="row">
                    <div className="col">
                      <ul>
                        <li className="label">
                          <label htmlFor="pbfName">PBF Instance</label>
                        </li>
                        <li className="input">
                          <input
                            type="text"
                            id="pbfName"
                            value={detailCdob.pbfName}
                            readOnly
                          />
                        </li>
                      </ul>
              
                      <ul>
                        <li className="label">
                          <label htmlFor="pbfAddr">PBF Address</label>
                        </li>
                        <li className="input">
                          <input
                            type="text"
                            id="pbfAddr"
                            value={detailCdob.pbfAddr}
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
                          <label htmlFor="cdobNumber">CDOB Number</label>
                        </li>
                        <li className="input">
                          <input
                            type="text"
                            id="cdobNumber"
                            value={cdobNumber}
                            readOnly
                          />
                        </li>
                      </ul>
              
                      <ul>
                        <li className="label">
                          <label htmlFor="tipePermohonan">Tipe Permohonan</label>
                        </li>
                        <li className="input">
                          <input
                            type="text"
                            id="tipePermohonan"
                            value={detailCdob.tipePermohonan}
                            readOnly
                          />
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              ),     
              width: '620',       
              icon: 'warning',
              showCancelButton: true,
              confirmButtonText: 'Yes, Approve!',
              cancelButtonText: 'Cancel',
              allowOutsideClick: false,
            }).then((result) => {

              if (result.isConfirmed) {
                MySwal.fire({
                  title:"Processing your request...",
                  text:"Your request is on its way. This won't take long. 🚀",
                  icon: 'info',
                  showCancelButton: false,
                  showConfirmButton: false,
                  allowOutsideClick: false
                })

                approveCdob(cdobNumber, cdobId, tipePermohonan)
              }
            })
          } 
        })

      }

    } catch (e) {
      errAlert(e, "Can't retrieve data")
    }
  }

  const approveCdob = async(certNumber, certTd, tp) => {

    try {
      const approveCt = await contract.approveCdob([certNumber, certTd, userdata.name, userdata.instanceName], tp)

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
          <h1>Data Sertifikat CDOB</h1>
        </div>
        <div className="tab-menu">
          <ul>
            <li><button onClick={() => navigate('/cpotb-approval')}>List CPOTB</button></li>
            <li><button className='active' onClick={() => navigate('/cdob-approval')}>List CDOB</button></li>
          </ul>
        </div>
        <div className="container-data">
          <div className="data-list">
            {dataCdob.length > 0 ? (
              <ul>
                {dataCdob.map((item, index) => (
                  <li key={index}>
                    <button className='title' onClick={() => getDetailCdob(item.cdobId)}>{item.pbfName}: {item.tipePermohonan}</button>
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


export default CdobApprove;