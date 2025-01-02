import { useEffect, useState } from 'react';
import { BrowserProvider, Contract } from "ethers";
import contractData from '../../auto-artifacts/deployments.json';
import { useNavigate } from 'react-router-dom';
import { create } from 'ipfs-http-client';

import "../../styles/MainLayout.scss";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import './../../styles/SweetAlert.scss';

const MySwal = withReactContent(Swal);
const client = create({ url: 'http://127.0.0.1:5001/api/v0' });

function CpotbApprove() {

  const navigate = useNavigate();
  const [contract, setContract] = useState();
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

  const handleEventCpotbApproved = (bpomAddr, bpomInstance, jenisSediaan, cpotbNumber, timestampApprove, txHash) => {

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
          <ul className="txHash">
            <li className="label">
              <p>Transaction Hash</p>
            </li>
            <li className="input">
              <a
                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noreferrer"
              >
                View Transaction on Etherscan
              </a>
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
  }
  
  const getDetailCpotb = async (id) => {
    
    console.log(id); 
    
    try {
      const detailCpotbCt = await contract.detailCpotb(id);

      const [cpotbId, cpotbNumber, cpotbDetail, jenisSediaan] = detailCpotbCt

      const [status, timestampRequest, timestampApprove, sender, bpom, cpotbIpfs] = cpotbDetail

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
        cpotbIpfs: cpotbIpfs ? cpotbIpfs : "-"
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

                  <ul>
                    <li className="label">
                      <p>IPFS CPOTB</p> 
                    </li>
                    <li className="input">
                      <a
                        href={`http://localhost:3000/public/certificate/${detailCpotb.cpotbIpfs}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View CPOTB on IPFS
                        <i class="fa-solid fa-arrow-up-right-from-square"></i>
                      </a>
                    </li>
                  </ul>
                </div>
  
                <div className="col">
                  <ul className='status'>
                    <li className="label">
                      <p>Status Sertifikasi</p>
                    </li>
                    <li className="input">
                      <p className={detailCpotb.status}>{detailCpotb.status}</p>
                    </li>
                  </ul>
  
                  <ul>
                    <li className="label">
                      <p>Nomor CPOTB</p>
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
  
                  {/* <ul>
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
                  </ul> */}
                </div>
  
                <div className="col">
                  <ul className='status'>
                    <li className="label">
                      <p>Status Sertifikasi</p>
                      <label htmlFor="statusCpotb"></label>
                    </li>
                    <li className="input">
                      <p className={detailCpotb.status}>{detailCpotb.status}</p>
                    </li>
                  </ul>
  
                  {/* <ul>
                    <li className="label">
                      <p>Nomor CPOTB</p>
                      <label htmlFor="nomorCpotb"></label>
                    </li>
                    <li className="input">
                      <p>{detailCpotb.cpotbNumber}</p> 
                    </li>
                  </ul> */}
  
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
  
                  {/* <ul>
                    <li className="label">
                      <p>Tanggal Disertifikasi</p> 
                    </li>
                    <li className="input">
                      <p>{detailCpotb.timestampApprove}</p> 
                    </li>
                  </ul> */}
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
                          <label htmlFor="factoryInstanceName">Factory Instance</label>
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

                generateIpfs(cpotbNumber, detailCpotb)
              }
            })
          } 
        })

      }
      
    } catch (e) {
      errAlert(e, "Can't retrieve data")
    }
  }

  const generateIpfs = async (cpotbNumber, detailCpotb) => {

    console.log(detailCpotb);
    console.log(cpotbNumber);

    const date = new Date();
    const formattedDate = new Intl.DateTimeFormat('id-ID', options).format(date);

    try {

      const userFactoryCt = await contract.getRegisteredUser(detailCpotb.factoryAddr)
      const userBpomCt = await contract.getRegisteredUser(userdata.address)

      const cpotbData = {
        certName: "CPOTB",
        tipePermohonan: detailCpotb.jenisSediaan,
        certNumber: cpotbNumber,
        timestampRequest: detailCpotb.timestampRequest, 
        timestampApprove: formattedDate,
        senderInstance: detailCpotb.factoryInstanceName,
        senderAddress: detailCpotb.factoryAddr,
        senderInstanceAddress: userFactoryCt[4],
        bpomInstance: userdata.instanceName,
        bpomAddress: userdata.address,
        bpomInstanceAddress: userBpomCt[4]
      }

    console.log(cpotbData);

      const result = await client.add(JSON.stringify(cpotbData), 
        { progress: (bytes) => 
          console.log(`Uploading data CPOTB: ${bytes} bytes uploaded`) }
      );

      if (result.path) {
        console.log("IPFS Hash:", result.path);
        approveCpotb(cpotbNumber, detailCpotb.cpotbId, detailCpotb.jenisSediaan, result.path);
      }

    } catch (error) {
      errAlert(error, "Can't upload Data Obat to IPFS."); 
    }
  } 

  const approveCpotb = async(certNumber, certTd, jenisSediaan, cpotbIpfs) => {

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
      
      const approveCt = await contract.approveCpotb(
        [certNumber, certTd, userdata.name, userdata.instanceName], 
        cpotbIpfs,
        jenisMap[jenisSediaan])
      console.log(approveCt);

      if(approveCt){
        MySwal.update({
          title: "Processing your transaction...",
          text: "This may take a moment. Hang tight! ⏳"
        });
      }

      contract.on('evt_cpotbApproved',  (bpomAddr, bpomInstance, jenisSediaan, cpotbNumber, timestampApprove) => {
        handleEventCpotbApproved(bpomAddr, bpomInstance, jenisSediaan, cpotbNumber, timestampApprove, approveCt.hash);
      });
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