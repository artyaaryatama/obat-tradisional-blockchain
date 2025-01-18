import { useEffect, useState } from 'react';
import { BrowserProvider, Contract } from "ethers";
import contractData from '../../auto-artifacts/deployments.json';
import { useNavigate } from 'react-router-dom';
import { create } from 'ipfs-http-client';
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig"; 
import "../../styles/MainLayout.scss";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import './../../styles/SweetAlert.scss';
import JenisSediaanTooltip from '../../components/TooltipJenisSediaan';

const MySwal = withReactContent(Swal);
const client = create({ url: 'http://127.0.0.1:5001/api/v0' });

function CpotbApprove() {

  const navigate = useNavigate();
  const [contracts, setContracts] = useState(null);
  const [dataCpotb, setDataCpotb] = useState([])
  const userdata = JSON.parse(sessionStorage.getItem('userdata'));

  const jenisSediaanMap = {
    0n: "Cairan Obat Dalam",
    1n: "Rajangan",
    2n: "Serbuk",
    3n: "Serbuk Instan",
    4n: "Efervesen",
    5n: "Pil",
    6n: "Kapsul",
    7n: "Kapsul Lunak",
    8n: "Tablet atau Kaplet",
    9n: "Granul",
    10n: "Pastiles",
    11n: "Dodol atau Jenang",
    12n: "Film Strip",
    13n: "Cairan Obat Luar",
    14n: "Losio",
    15n: "Parem",
    16n: "Salep",
    17n: "Krim",
    18n: "Gel",
    19n: "Serbuk Obat Luar",
    20n: "Tapel",
    21n: "Pilis",
    22n: "Plaster atau Koyok",
    23n: "Supositoria",
    24n: "Rajangan Obat Luar"
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
    document.title = "CPOTB List"; 
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
          roleManager: RoleManager,
          rejectManager: RejectManager
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

    const getAllCpotb = async () => {
      if(contracts){
        try {
          const listAllCpotb = await contracts.mainSupplyChain.getListAllCpotb()
          console.log(listAllCpotb);

          const reconstructedData = listAllCpotb.map((item) => {
            let cpotbNumber = item[1] ? item[1] : 'TBA';

            if(item[5] === 2n){
              cpotbNumber= null
            }

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
  }, [contracts])

  const handleEventCpotb = (status, bpomAddr, bpomInstance, jenisSediaan, detail, timestamp, txHash) => {

    const formattedTimestamp = new Date(Number(timestamp) * 1000).toLocaleDateString('id-ID', options)
    
    // detail can be the cpotb number or rejectMsg
    if(status === 'Approved'){
      MySwal.fire({
        title: "Success Approve CPOTB",
        html: (
          <div className='form-swal'>
            <ul>
              <li className="label">
                <p>CPOTB Number</p> 
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
    } else {
      MySwal.fire({
        title: "CPOTB Rejected",
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
                <p>Jenis Sediaan</p> 
              </li>
              <li className="input">
                <p>{jenisSediaanMap[jenisSediaan]}</p> 
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
  
  const getDetailCpotb = async (id) => {
    
    console.log(id); 
    
    try {
      const detailCpotbCt = await contracts.mainSupplyChain.detailCpotb(id);

      const [cpotbId, cpotbNumber, cpotbDetail, jenisSediaan, factoryType ] = detailCpotbCt

      const [status, timestampRequest, timestampApprove, sender, bpom, cpotbIpfs] = cpotbDetail

      const detailCpotb = {
        cpotbId: cpotbId,
        cpotbNumber: cpotbNumber ? cpotbNumber : "(TBA)",
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
        cpotbIpfs: cpotbIpfs ? cpotbIpfs : "-",
        factoryType: factoryType
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
                      <p>{detailCpotb.factoryInstanceName} </p>
                    </li>
                  </ul>
  
                  <ul>
                    <li className="label">
                      <p>Factory Type</p> 
                    </li>
                    <li className="input">
                      <p>{detailCpotb.factoryType}</p> 
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
                    <li className="input colJenisSediaan">
                      <p>{detailCpotb.jenisSediaan}</p> 
                      <JenisSediaanTooltip
                        jenisSediaan={detailCpotb.jenisSediaan}
                      />
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
      } else if(detailCpotb.status === 'Rejected'){
        const detailCpotbRejected = await contracts.rejectManager.rejectedDetails(id);

        const [rejectMsg, bpomName, bpomInstanceName, jenisSediaanRejected, bpomAddr, timestampRejected] = detailCpotbRejected

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
                      <p>{detailCpotb.factoryInstanceName} </p>
                    </li>
                  </ul>
  
                  <ul>
                    <li className="label">
                      <p>Factory Type</p> 
                    </li>
                    <li className="input">
                      <p>{detailCpotb.factoryType}</p> 
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
                  <ul className='status'>
                    <li className="label">
                      <p>Status Sertifikasi</p>
                    </li>
                    <li className="input">
                      <p className={detailCpotb.status}>{detailCpotb.status}</p>
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
                    <li className="label">
                      <p>Jenis Sediaan</p>
                    </li>
                    <li className="input colJenisSediaan">
                      <p>{detailCpotb.jenisSediaan}</p> 
                      <JenisSediaanTooltip
                        jenisSediaan={detailCpotb.jenisSediaan}
                      />
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
                      <p>Factory Type</p> 
                    </li>
                    <li className="input">
                      <p>{detailCpotb.factoryType}</p> 
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
                    <li className="input colJenisSediaan">
                      <p>{detailCpotb.jenisSediaan}</p> 
                      <JenisSediaanTooltip
                        jenisSediaan={detailCpotb.jenisSediaan}
                      />
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
          showCloseButton: true,
          showCancelButton: false,
          confirmButtonText: 'Approve',
          showDenyButton: true,
          denyButtonText: 'Reject'
        }).then((result) => {
  
          if(result.isConfirmed){
            const prefix = "PW-S.01.3.331";
            const day = `${String(new Date().getMonth() + 1).padStart(2, '0')}.${String(new Date().getDate()).padStart(2, '0')}`;
            const randomString = String(Math.floor(1000 + Math.random() * 9000));
            const cpotbNumber = `${prefix}.${day}.${randomString}`
            
            MySwal.fire({
              title: 'Approve Pengajuan Sertifikat CPOTB',
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
          } else if (result.isDenied){
            MySwal.fire({
              title: 'Reject Pengajuan Sertifikat CPOTB',
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
              showCancelButton: false,
              showCloseButton: true,
              confirmButtonText: 'Reject',
              confirmButtonColor: '#E33333',
              allowOutsideClick: false,
              preConfirm: () => {
                const rejectMsgInput = document.getElementById('rejectMsg').value;
                if (!rejectMsgInput) {
                  Swal.showValidationMessage('Alasan Reject is required!');
                }
                return { rejectMsgInput };
              },
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

                rejectCpotb(id, result.value.rejectMsgInput, jenisSediaan, detailCpotb.factoryInstanceName)
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

      const userFactoryCt = await contracts.roleManager.getUserData(detailCpotb.factoryAddr)
      const userBpomCt = await contracts.roleManager.getUserData(userdata.address)

      const cpotbData = {
        certName: "CPOTB",
        tipePermohonan: detailCpotb.jenisSediaan,
        certNumber: cpotbNumber,
        timestampRequest: detailCpotb.timestampRequest, 
        timestampApprove: formattedDate,
        senderInstance: detailCpotb.factoryInstanceName,
        senderAddress: detailCpotb.factoryAddr,
        factoryType: detailCpotb.factoryType,
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
        approveCpotb(cpotbNumber, detailCpotb.cpotbId, detailCpotb.jenisSediaan, result.path, detailCpotb.factoryInstanceName);
      }

    } catch (error) {
      errAlert(error, "Can't upload Data Obat to IPFS."); 
    }
  } 

  const approveCpotb = async(certNumber, certTd, jenisSediaan, cpotbIpfs, factoryInstanceName) => {

    const jenisMap = {
      "Cairan Obat Dalam": 0n,
      "Rajangan": 1n,
      "Serbuk": 2n,
      "Serbuk Instan": 3n,
      "Efervesen": 4n,
      "Pil": 5n,
      "Kapsul": 6n,
      "Kapsul Lunak": 7n,
      "Tablet atau Kaplet": 8n,
      "Granul": 9n,
      "Pastiles": 10n,
      "Dodol atau Jenang": 11n,
      "Film Strip": 12n,
      "Cairan Obat Luar": 13n,
      "Losio": 14n,
      "Parem": 15n,
      "Salep": 16n,
      "Krim": 17n,
      "Gel": 18n,
      "Serbuk Obat Luar": 19n,
      "Tapel": 20n,
      "Pilis": 21n,
      "Plaster atau Koyok": 22n,
      "Supositoria": 23n,
      "Rajangan Obat Luar": 24n,
    };

    console.log(certNumber, certTd, jenisMap[jenisSediaan]);
    console.log(jenisSediaan);

    try {
      
      const approveCt = await contracts.mainSupplyChain.approveCpotb(
        [certNumber, certTd, userdata.name, userdata.instanceName], 
        cpotbIpfs,
        jenisMap[jenisSediaan])
      console.log(approveCt);

      if(approveCt){

        updateCpotbFb( factoryInstanceName, jenisSediaan, approveCt.hash, true );

        MySwal.update({
          title: "Processing your transaction...",
          text: "This may take a moment. Hang tight! ⏳"
        });
      }

      contracts.mainSupplyChain.on('evt_cpotbApproved',  (bpomAddr, bpomInstance, jenisSediaan, cpotbNumber, timestampApprove) => {
        handleEventCpotb("Approved", bpomAddr, bpomInstance, jenisSediaan, cpotbNumber, timestampApprove, approveCt.hash);
      });
    } catch (error) {
      errAlert(error, "Can't Approve CPOTB")
    }
  }

  const rejectCpotb = async(id, rejectMsg, jenisSediaan, factoryInstanceName) => {
    console.log(rejectMsg);

    try {
      const rejectCt = await contracts.rejectManager.rejectedByBpom(rejectMsg, userdata.name, userdata.instanceName, id, "cpotb", jenisSediaan);

      if(rejectCt){
        updateCpotbFb( factoryInstanceName, jenisSediaanMap[jenisSediaan], rejectCt.hash, false);
        MySwal.update({
          title: "Processing your transaction...",
          text: "This may take a moment. Hang tight! ⏳"
        });
      }

      contracts.rejectManager.once("evt_cpotbRejected", (_instanceName, _instanceAddr, _jenisSediaan, timestampRejected, _rejectMsg) => {
        handleEventCpotb( "Rejected", _instanceAddr, _instanceName, _jenisSediaan, _rejectMsg, timestampRejected, rejectCt.hash);
      });
    } catch (error) {
      errAlert(error, `Can't reject CPOTB ${factoryInstanceName} dengan Jenis Sediaan ${jenisSediaan}`)
    }
  }

  const updateCpotbFb = async (instanceName, jenisSediaan, cpotbHash, status) => {
    try {
      const documentId = `cpotb-lists`; 
      const factoryDocRef = doc(db, instanceName, documentId);

      if(status){
        await updateDoc(factoryDocRef, {
          [`${jenisSediaan}.approvedCpotb`]: cpotbHash,
          [`${jenisSediaan}.approvedTimestamp`]: Date.now(), 
        }); 
      } else {
        await updateDoc(factoryDocRef, {
          [`${jenisSediaan}.rejectedCpotb`]: cpotbHash,
          [`${jenisSediaan}.rejectedTimestamp`]: Date.now(),
        });  

      }
  
    } catch (err) {
      errAlert(err);
    }
  };

  return (
    <>
      <div id="CpotbPage" className='Layout-Menu layout-page'>
        <div className="title-menu">
          <h1>Data Sertifikat CPOTB</h1>
          <p>Dikelola oleh {userdata.instanceName}</p>
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
                    <p>
                      { item.cpotbNumber !== null ? `CPOTB Number : ${item.cpotbNumber}` : "Not Available"}
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


export default CpotbApprove;