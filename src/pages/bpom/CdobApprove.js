import { useEffect, useState } from 'react';
import { BrowserProvider, Contract } from "ethers";
import contractData from '../../auto-artifacts/deployments.json';
import { useNavigate } from 'react-router-dom';
import { create } from 'ipfs-http-client';

import "../../styles/MainLayout.scss";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import './../../styles/SweetAlert.scss';
import JenisSediaanTooltip from '../../components/TooltipJenisSediaan';

const client = create({ url: 'http://127.0.0.1:5001/api/v0' });
const MySwal = withReactContent(Swal);

function CdobApprove() {

  const navigate = useNavigate();
  const [contracts, setContracts] = useState(null);
  const [dataCdob, setDataCdob] = useState([]);
  const userdata = JSON.parse(sessionStorage.getItem('userdata'));

  const tipePermohonanMap = {
    0: "Obat Lain",
    1: "Cold Chain Product (CCP)"
  };

  const statusMap = {
    0: "Pending",
    1: "Approved",
    2: "Rejected"
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
          const MainSupplyChain = new Contract(
            contractData.MainSupplyChain.address,
            contractData.MainSupplyChain.abi,
            signer
          );

          const RoleManager = new Contract(
            contractData.RoleManager.address,
            contractData.RoleManager.abi,
            signer
          );
            
          const RejectManager = new Contract(
            contractData.RejectManager.address,
            contractData.RejectManager.abi,
            signer
          );
          
          setContracts({
            mainSupplyChain: MainSupplyChain,
            rejectManager: RejectManager,
            roleManager: RoleManager
          });
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

    const getAllCdob = async () => {
      if(contracts){
        try {
          const listAllCdob = await contracts.mainSupplyChain.getListAllCdob()
          console.log(listAllCdob);

          const reconstructedData = listAllCdob.map((item) => {
            let cdobNumber = item[1] ? item[1] : 'TBA';

            if(item[5] === 2n){
              cdobNumber= null
            }
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
  }, [contracts])

  const handleEventCdob = (status, bpomAddr, bpomInstance, tipePermohonan, detail, timestamp, txHash) => {

    const formattedTimestamp = new Date(Number(timestamp) * 1000).toLocaleDateString('id-ID', options)
  
    // detail can be the cpotb number or rejectMsg
    if(status === 'Approved'){
      MySwal.fire({
        title: "Success Approve CDOB",
        html: (
          <div className='form-swal'>
            <ul>
              <li className="label">
                <p>CDOB Number</p> 
              </li>
              <li className="input">
                <p>{detail}</p> 
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
    } else {
      MySwal.fire({
        title: "CDOB Rejected",
        html: (
          <div className='form-swal'>
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
                <p>Tanggal Penolakan</p> 
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
            <ul className='rejectMsg'>
              <li className="label">
                <p>Alasan Penolakan</p> 
              </li>
              <li className="input">
                <p>{detail}</p> 
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

  }

  const getDetailCdob = async (id) => {
    
    console.log(id); 
    
    try {
      const detailCdobCt = await contracts.mainSupplyChain.detailCdob(id);

      const [cdobId, cdobNumber, cdobDetail, tipePermohonan] = detailCdobCt

      const [status, timestampRequest, timestampApprove, sender, bpom, cdobIpfs] = cdobDetail

      const detailCdob = {
        cdobId: cdobId,
        cdobNumber: cdobNumber ? cdobNumber : "(TBA)",
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
        cdobIpfs: cdobIpfs ? cdobIpfs : "-"
      };

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

                  <ul>
                    <li className="label">
                      <p>IPFS CDOB</p> 
                    </li>
                    <li className="input">
                      <a
                        href={`http://localhost:3000/public/certificate/${detailCdob.cdobIpfs}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View CDOB on IPFS
                        <i class="fa-solid fa-arrow-up-right-from-square"></i>
                      </a>
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
                    <li className="label ">
                      <p>Tipe Permohonan</p>
                    </li>
                    <li className="input colJenisSediaan">
                      <p>{detailCdob.tipePermohonan}</p> 
                      <JenisSediaanTooltip
                        jenisSediaan={detailCdob.tipePermohonan}
                      />
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
      } else if (detailCdob.status === 'Rejected'){

        const detailCpotbRejected = await contracts.rejectManager.rejectedDetails(id);

        const [rejectMsg, bpomName, bpomInstanceName, jenisSediaanRejected, bpomAddr, timestampRejected] = detailCpotbRejected

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
                      <p>{bpomInstanceName}</p> 
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
  
                  <ul className='rejectMsg'>
                    <li className="label">
                      <p>Alasan Penolakan</p> 
                    </li>
                    <li className="input">
                      <p>{rejectMsg}</p> 
                    </li>
                  </ul>
  
                  <ul>
                    <li className="label ">
                      <p>Tipe Permohonan</p>
                    </li>
                    <li className="input colJenisSediaan">
                      <p>{detailCdob.tipePermohonan}</p> 
                      <JenisSediaanTooltip
                        jenisSediaan={detailCdob.tipePermohonan}
                      />
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
                      <p>Tanggal Penolakan</p> 
                    </li>
                    <li className="input">
                      <p>{ new Date(Number(timestampRejected) * 1000).toLocaleDateString('id-ID', options)}</p> 
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
                      <p>Tipe Permohonan</p>
                    </li>
                    <li className="input colJenisSediaan">
                      <p>{detailCdob.tipePermohonan}</p> 
                      <JenisSediaanTooltip
                        jenisSediaan={detailCdob.tipePermohonan}
                      />
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
                </div>
              </div>
            
            </div>
          ),
          width: '620',
          showCloseButton: true,
          showCancelButton: false,
          confirmButtonText: 'Approve',
          showDenyButton: true,
          denyButtonText: 'Reject'
        }).then((result) => {
  
          if(result.isConfirmed){
            const randomDigits1 = Math.floor(1000 + Math.random() * 9000);
            const randomDigits2 = Math.floor(1000 + Math.random() * 9000);
            const today = new Date();
            const month = String(today.getMonth() + 1).padStart(2, '0');  
            const year = today.getFullYear(); 
            const cdobNumber = `CDOB${randomDigits1}/S1-${randomDigits2}/${month}/${year}`;
            
            MySwal.fire({
              title: 'Approve Pengajuan Sertifikat CDOB',
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

                generateIpfs(cdobNumber, detailCdob)
              }
            })
          } else if (result.isDenied){
            MySwal.fire({
              title: 'Reject Pengajuan Sertifikat CDOB',
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

                      <ul>
                        <li className="label">
                          <label htmlFor="rejectMsg">Alasan Reject</label>
                        </li>
                        <li className="input">
                          <textarea 
                            type="text" 
                            id="rejectMsg"
                            rows="3"
                            required
                          />
                        </li>
                      </ul>
                    </div>
              
                    <div className="col">
              
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
              preConfirm: () => {
                const rejectMsgInput = document.getElementById('rejectMsg').value;
                if (!rejectMsgInput) {
                  Swal.showValidationMessage('Alasan Reject is required!');
                }
                return { rejectMsgInput };
              },
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

                rejectCdob(id, result.value.rejectMsgInput, tipePermohonan, detailCdob.pbfName)
              }
            })
            
          }
        })

      }

    } catch (e) {
      errAlert(e, "Can't retrieve data")
    }
  }

  const generateIpfs = async (cdobNumber, detailCdob) => {

    console.log(detailCdob);
    console.log(cdobNumber);

    const date = new Date();
    const formattedDate = new Intl.DateTimeFormat('id-ID', options).format(date);
    
    try {

      const userPbfCt = await contracts.roleManager.getUserData(detailCdob.pbfAddr)

      const cdobData = {
        certName: "CDOB",
        tipePermohonan: detailCdob.tipePermohonan,
        certNumber: cdobNumber,
        timestampRequest: detailCdob.timestampRequest, 
        timestampApprove: formattedDate,
        senderInstance: detailCdob.pbfName,
        senderAddress: detailCdob.pbfAddr,
        senderInstanceAddress: userPbfCt[4],
        bpomInstance: userdata.instanceName,
        bpomAddress: userdata.address,
        bpomInstanceAddress: userdata.location
      }

      console.log(cdobData);

      const result = await client.add(JSON.stringify(cdobData), 
        { progress: (bytes) => 
          console.log(`Uploading data CDOB: ${bytes} bytes uploaded`) }
      );

      if (result.path) {
        console.log("IPFS Hash:", result.path);
        
        approveCdob(cdobNumber, detailCdob.cdobId, detailCdob.tipePermohonan, result.path);
      }

    } catch (error) {
      errAlert(error, "Can't upload Data Obat to IPFS."); 
    }
  } 

  const approveCdob = async(certNumber, certTd, tp, cdobIpfs) => {

    const tpMap = {
      "Obat Lain" : 0,
      "Cold Chain Product (CCP)" : 1
    }; 

    try {
      const approveCt = await contracts.mainSupplyChain.approveCdob([certNumber, certTd, userdata.name, userdata.instanceName], cdobIpfs, tpMap[tp])

      if(approveCt){
        MySwal.update({
          title: "Processing your transaction...",
          text: "This may take a moment. Hang tight! ⏳"
        });
      }

      contracts.mainSupplyChain.once('evt_cdobApproved',  (bpomInstance, bpomAddr, tipePermohonan, cdobNumber, timestampApprove) => {
        handleEventCdob("Approved", bpomInstance, bpomAddr, tipePermohonan, cdobNumber, timestampApprove, approveCt.hash);
      });
    } catch (error) {
      errAlert(error, "Can't Approve CDOB")
    }
  } 

  const rejectCdob = async(cdobId, rejectMsg, tipePermohonan, pbfName) => {
    try {
      const rejectCt = await contracts.rejectManager.rejectedByBpom(rejectMsg, userdata.name, userdata.instanceName, cdobId, "cdob", tipePermohonan);

      if(rejectCt){
        MySwal.update({
          title: "Processing your transaction...",
          text: "This may take a moment. Hang tight! ⏳"
        });
      }

      contracts.rejectManager.once("evt_cdobRejected", (_instanceName, _instanceAddr, _jenisSediaan, timestampRejected, _rejectMsg) => {
        handleEventCdob( "Rejected", _instanceAddr, _instanceName, _jenisSediaan, _rejectMsg, timestampRejected, rejectCt.hash);
      });
    } catch (error) {
      errAlert(error, `Can't reject CDOB ${pbfName} dengan Tipe Permohonan ${tipePermohonan}`)
    }
  }

  return (
    <>
      <div id="CpotbPage" className='Layout-Menu layout-page'>
        <div className="title-menu">
          <h1>Data Sertifikat CDOB</h1>
          <p>Dikelola oleh {userdata.instanceName}</p>
        </div>
        <div className="tab-menu">
          <ul>
            <li><button onClick={() => navigate('/cpotb-approval')}>List CDOB</button></li>
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
                    <p>
                      { item.cdobNumber !== null ? `CDOB Number : ${item.cdobNumber}` : "Not Available"}
                      
                    </p>
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