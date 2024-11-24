import { useEffect, useState } from 'react';
import { BrowserProvider, Contract } from "ethers";
import contractData from '../../auto-artifacts/deployments.json';
import { useNavigate } from 'react-router-dom';

import "../../styles/MainLayout.scss";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import './../../styles/SweetAlert.scss';
import { Result } from 'ethers';

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
    second: '2-digit',
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
          const [tipePermohonanArray, pbfNameArray, statusArray, latestTimestampArray, cdobIdArray] = await contract.getListAllCdob()

          const reconstructedData = tipePermohonanArray.map((tipePermohonan, index) => {
            const readableTipePermohonan = tipePermohonanMap[tipePermohonan];
            const readableStatus = statusMap[statusArray[index]];

            const timestampDate = new Date(Number(latestTimestampArray[index]) * 1000);;
            const formattedTimestamp = timestampDate.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric',});
  
            return {
              tipePermohonan: readableTipePermohonan,
              pbfName: pbfNameArray[index],
              status: readableStatus,
              latestTimestamp: formattedTimestamp,
              idCdob: cdobIdArray[index]
            };
          });

          console.log("Reconstructed Data:", reconstructedData);
  
          setDataCdob(reconstructedData);
        } catch (e) {
          errAlert(e, "Can't Get The Data")
        }
      }
    }

    getAllCdob()
  }, [contract])

  useEffect(() => {
    if (!contract) {
      console.error("Contract is undefined");
      return;
    }
  
    try {
      console.log('TRIGERRED evt_cpotbApproved listener');
      contract.on('evt_cpotbApproved',  (bpomAddr, receiverName, pbfName, cdobNumber, timestampApprove) => {
        console.log('ini inside contract',{bpomAddr, receiverName, pbfName, cdobNumber, timestampApprove});
        setNumberCdob(cdobNumber); // Store cdobNumber in state
        setIsApproved(true);         // Trigger isApproved to show the alert
      });
  
      return () => {
        console.log("Removing evt_cpotbApproved listener");
        contract.removeAllListeners("evt_cpotbApproved");
      };
    } catch (error) {
      console.error(error);
      errAlert(error);
    }
  }, [contract]);

  useEffect(() => {
    if (isApproved && numberCdob) {
      Swal.fire({
        title: `CDOB Approved!`,
        text: `Success approve CDOB (${numberCdob})`,
        icon: 'success',
        showCancelButton: false,
        confirmButtonText: 'Ok',
        allowOutsideClick: true
      }).then((result) => {
        if (result.isConfirmed) {
          setNumberCdob('')
          setIsApproved(false)
          window.location.reload();
        }
      });

    }
  }, [isApproved, numberCdob]);
  
  
  const getDetailCdob = async (id) => {
    
    console.log(id); 
    
    try {
      const tx = await contract.getListCdobById(id);
      console.log(tx);

      const detailCdob = {
        cdobId: tx.cdobId,
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

      console.log(detailCdob.timestampApprove);

      if(detailCdob.status === 'Approved'){
        MySwal.fire({
          title: "Approve Sertifikat CDOB",
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
          width: '720',
          showCancelButton: false,
          confirmButtonText: 'Ok',
          allowOutsideClick: true
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
          width: '720',
          showCancelButton: true,
          confirmButtonText: 'Approve',
          confirmButtonColor: '#4CBE53', 
          allowOutsideClick: false
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
                          <label htmlFor="pbfName">Diajukan oleh</label>
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
                          <label htmlFor="pbfAddr">Address Pengirim</label>
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
                          <label htmlFor="senderName">Nama Pengirim</label>
                        </li>
                        <li className="input">
                          <input
                            type="text"
                            id="senderName"
                            value={detailCdob.senderName}
                            readOnly
                          />
                        </li>
                      </ul>
              
                      <ul>
                        <li className="label">
                          <label htmlFor="bpomAddr">Address BPOM</label>
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
              
                      <ul>
                        <li className="label">
                          <label htmlFor="receiverName">Nama Penyutuju</label>
                        </li>
                        <li className="input">
                          <input
                            type="text"
                            id="receiverName"
                            value={userdata.name}
                            readOnly
                          />
                        </li>
                      </ul>
                    </div>
              
                    <div className="col">
                      <ul>
                        <li className="label">
                          <label htmlFor="cdobNumber">Nomor CDOB</label>
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
              width: '720',       
              icon: 'warning',
              showCancelButton: true,
              confirmButtonText: 'Yes, Approve!',
              confirmButtonColor: '#4CBE53',
              cancelButtonText: 'Cancel',
              allowOutsideClick: false,
              preConfirm: async () => {
                try {
                  console.log(userdata.address);
                  const tx =  await contract.approveCdob(id, cdobNumber, userdata.name)
                  console.log(id, cdobNumber, userdata.name);
                  console.log(tx);
                  return tx;
                } catch (error) {
                  errAlert(error);
                  return null;
                }
              }
            }).then((result) => {

              if (result.isConfirmed && result.value) {
                MySwal.fire({
                  title:"Processing your request...",
                  text:"Your request is on its way. This won't take long. 🚀",
                  icon: 'info',
                  showCancelButton: false,
                  showConfirmButton: false,
                  allowOutsideClick: false
                })
                // setIsApproved(true)
              }
            })
          } 
        })

      }
      

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
        </div>
        <div className="tab-menu">
          <ul>
            <li><button onClick={() => navigate('/cpotb-bpom')}>List CPOTB</button></li>
            <li><button className='active' onClick={() => navigate('/cdob-bpom')}>List CDOB</button></li>
          </ul>
        </div>
        <div className="container-data">
          <div className="data-list">
            {dataCdob.length > 0 ? (
              <ul>
                {dataCdob.map((item, index) => (
                  <li key={index}>
                    <button className='title' onClick={() => getDetailCdob(item.idCdob)}>{item.pbfName}: {item.tipePermohonan}</button>
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


export default CdobApprove;