import { useEffect, useState } from 'react';
import { BrowserProvider, Contract } from "ethers";
import contractMainSupplyChain from '../../auto-artifacts/MainSupplyChain.json';
import { useNavigate } from 'react-router-dom';

import "../../styles/MainLayout.scss";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import './../../styles/SweetAlert.scss';
import { Result } from 'ethers';

const MySwal = withReactContent(Swal);

function CpotbApprove() {

  const navigate = useNavigate();
  const [contract, setContract] = useState();
  const [loader, setLoader] = useState(false)
  
  const [isApproved, setIsApproved] = useState(false);
  const [cpotbNumber, setCpotbNumber] = useState("");
  const [dataCpotb, setDataCpotb] = useState([])
  const userdata = JSON.parse(sessionStorage.getItem('userdata'));

  const jenisSediaanMap = {
    0: "Tablet Non Betalaktam",
    1: "Kapsul Keras Non Betalaktam",
    2: "Serbuk Oral Non Betalaktam",
    3: "Cairan Oral Non Betalaktam"
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
    document.title = "CPOTB List"; 
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
          const [jenisSediaanArray, factoryNameArray, statusArray, latestTimestampArray, cpotbIdArray] = await contract.getListAllCpotb()

          const reconstructedData = jenisSediaanArray.map((jenisSediaan, index) => {
            const readableJenisSediaan = jenisSediaanMap[jenisSediaan];
            const readableStatus = statusMap[statusArray[index]];

            const timestampDate = new Date(Number(latestTimestampArray[index]) * 1000);;
            const formattedTimestamp = timestampDate.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric',});
  
            return {
              jenisSediaan: readableJenisSediaan,
              factoryName: factoryNameArray[index],
              status: readableStatus,
              latestTimestamp: formattedTimestamp,
              idCpotb: cpotbIdArray[index]
            };
          });

          console.log("Reconstructed Data:", reconstructedData);
  
          setDataCpotb(reconstructedData);
        } catch (e) {
          errAlert(e, "Can't Get The Data")
        }
      }
    }

    getAllCpotb()
  }, [contract])

  useEffect(() => {
    if (!contract) {
      console.error("Contract is undefined");
      return;
    }
  
    try {
      console.log('TRIGERRED evt_cpotbApproved listener');
      contract.on('evt_cpotbApproved',  (bpomAddr, receiverName, factoryName, cpotbNumber, timestampApprove) => {
        setCpotbNumber(cpotbNumber); // Store cpotbNumber in state
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
    if (isApproved && cpotbNumber) {
      Swal.fire({
        title: `CPOTB Approved!`,
        text: `Success approve CPOTB (${cpotbNumber})`,
        icon: 'success',
        showCancelButton: false,
        confirmButtonText: 'Ok',
        allowOutsideClick: true
      }).then((result) => {
        if (result.isConfirmed) {
          setCpotbNumber('')
          setIsApproved(false)
          window.location.reload();
        }
      });

    }
  }, [isApproved, cpotbNumber]);
  
  
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

      console.log(detailCpotb.timestampApprove);

      if(detailCpotb.status === 'Approved'){
        MySwal.fire({
          title: "Approve Sertifikat CPOTB",
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
          confirmButtonText: 'Ok',
          allowOutsideClick: true
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
          showCancelButton: true,
          confirmButtonText: 'Approve',
          confirmButtonColor: '#4CBE53', 
          allowOutsideClick: false
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
                          <label htmlFor="factoryName">Diajukan oleh</label>
                        </li>
                        <li className="input">
                          <input
                            type="text"
                            id="factoryName"
                            value={detailCpotb.factoryName}
                            readOnly
                          />
                        </li>
                      </ul>
              
                      <ul>
                        <li className="label">
                          <label htmlFor="factoryAddr">Address Pengirim</label>
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
                          <label htmlFor="senderName">Nama Pengirim</label>
                        </li>
                        <li className="input">
                          <input
                            type="text"
                            id="senderName"
                            value={detailCpotb.senderName}
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
                          <label htmlFor="cpotbNumber">Nomor CPOTB</label>
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
                  const tx =  await contract.approveCpotb(id, cpotbNumber, userdata.name)
                  console.log(id, cpotbNumber, userdata.name);
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
        </div>
        <div className="tab-menu">
          <ul>
            <li><button className='active'>List CPOTB</button></li>
            <li><button>List CDOB</button></li>
          </ul>
        </div>
        <div className="container-data">
          <div className="data-list">
            {dataCpotb.length > 0 ? (
              <ul>
                {dataCpotb.map((item, index) => (
                  <li key={index}>
                    <button className='title' onClick={() => getDetailCpotb(item.idCpotb)}>{item.factoryName}: {item.jenisSediaan}</button>
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


export default CpotbApprove;