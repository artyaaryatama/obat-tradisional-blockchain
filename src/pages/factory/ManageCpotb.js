import { useEffect, useState } from 'react';
import { BrowserProvider, Contract } from "ethers";
import contractData from '../../auto-artifacts/deployments.json';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc  } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import "../../styles/MainLayout.scss"
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import './../../styles/SweetAlert.scss';
import JenisSediaanTooltip from '../../components/TooltipJenisSediaan';

const MySwal = withReactContent(Swal);

function ManageCpotb() {
  const [contracts, setContracts] = useState(null);
  const navigate = useNavigate();

  const userdata = JSON.parse(sessionStorage.getItem('userdata')) || {};
  const [dataCpotb, setDataCpotb] = useState([]);

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
    2: "Rejected",
    3: "Renew Requested",
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
          const CertificateManager = new Contract(
            contractData.CertificateManager.address, 
            contractData.CertificateManager.abi, 
            signer
          );
            
          const RejectManager = new Contract(
            contractData.RejectManager.address,
            contractData.RejectManager.abi,
            signer
          );

          const RoleManager = new Contract(
            contractData.RoleManager.address,
            contractData.RoleManager.abi,
            signer
          );
          
          setContracts({
            certificateManager: CertificateManager,
            rejectManager: RejectManager,
            roleManager: RoleManager
          });
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
      if (contracts) {
        try {
          console.log(userdata.instanceName);
          const listAllCt = await contracts.certificateManager.getCpotbByInstance(userdata.instanceName);
          console.log(listAllCt);
          const reconstructedData = listAllCt.map((item) => {
            const cpotbId = item[0]; 
            let cpotbNumber = item[1] || 'TBA'; 

            if (item[4] === 2n) {
              cpotbNumber = null;
            }
          
            return {
              cpotbId: cpotbId,
              cpotbNumber: cpotbNumber,
              factoryInstance: item[2],
              jenisSediaan: jenisSediaanMap[item[3]],
              status: statusMap[item[4]]
            };
          });
          
          // Update state with reconstructed data
          setDataCpotb(reconstructedData);
          
  
        } catch (error) {
          console.error("Error loading data: ", error);
        }
      }
    };
  
    loadData();
  }, [contracts]);

  const handleEventCpotbRenewRequested = (_name, _userAddr, _jenisSediaan, _timestampRequest, txHash) => {
    const formattedTimestamp = new Date(Number(_timestampRequest) * 1000).toLocaleDateString('id-ID', options)

    MySwal.fire({
      title: "Success Request CPOTB",
      html: (
        <div className='form-swal'>
          <ul>
            <li className="label">
              <p>Factory Instance</p> 
            </li>
            <li className="input">
              <p>{_name}</p> 
            </li>
          </ul>
          <ul>
            <li className="label">
              <p>Factory Address</p> 
            </li>
            <li className="input">
              <p>{_userAddr}</p> 
            </li>
          </ul>
          <ul>
            <li className="label">
              <p>Jenis Sediaan</p> 
            </li>
            <li className="input">
              <p>{jenisSediaanMap[_jenisSediaan]}</p> 
            </li>
          </ul>
          <ul>
            <li className="label">
              <p>Tanggal Pengajuan</p> 
            </li>
            <li className="input">
              <p>{formattedTimestamp}</p> 
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
      const detailCpotbCt = await contracts.certificateManager.getCpotbDetails(id);
      const detailUserFactoryCt = await contracts.roleManager.getUserData(userdata.address);
      let typeFactory;
      console.log(detailUserFactoryCt);
 
      const [certDetails, cpotbDetails] = detailCpotbCt;     

      const [cpotbId, cpotbNumber, jenisSediaan, factoryType] = cpotbDetails;

      const [status, timestampRequest, timestampApprove, timestampRejected, timestampRenewRequest, factory, bpom, cpotbIpfs] = certDetails;

      const rejectMsg = await contracts.certificateManager.getRejectMsgCpotb(id);
      console.log(timestampRenewRequest);

      if (factoryType === "UMOT") {
        typeFactory = "Usaha Mikro Obat Tradisional (UMOT)"
      } else if (factoryType === "UKOT") {
        typeFactory = "Usaha Kecil Obat Tradisional (UKOT)"
      } else if (factoryType === "IOT") {
        typeFactory = "Industri Obat Tradisional (IOT)"
      }

      const detailCpotb = {
        cpotbId: cpotbId,
        cpotbNumber: cpotbNumber ? cpotbNumber : "-",
        senderName: factory[0],
        factoryAddr: factory[2],
        factoryName: factory[1],
        jenisSediaan: jenisSediaanMap[jenisSediaan], 
        status: statusMap[status], 
        timestampRequest: new Date(Number(timestampRequest) * 1000).toLocaleDateString('id-ID', options),
        timestampApprove: Number(timestampApprove) !== 0 ? new Date(Number(timestampApprove) * 1000).toLocaleDateString('id-ID', options): "-",
        timestampRenewRequest: parseInt(timestampRenewRequest) !== 0 ? new Date(Number(timestampRenewRequest) * 1000).toLocaleDateString('id-ID', options): "-",
        timestampRejected: parseInt(timestampRejected) !== 0 ? new Date(Number(timestampRejected) * 1000).toLocaleDateString('id-ID', options): "-",
        bpomName : bpom[0] ? bpom[0] : "-",
        bpomInstance: bpom[1] ? bpom[1] : "-",
        bpomAddr: bpom[2] === "0x0000000000000000000000000000000000000000" ? "-" : bpom[1],
        cpotbIpfs: cpotbIpfs ? cpotbIpfs : "-",
        factoryType: typeFactory,
        factoryNIB: detailUserFactoryCt[6],
        factoryNPWP: detailUserFactoryCt[7]
      };

      console.log(detailCpotb.status);

      if(detailCpotb.status === 'Rejected'){

        if(rejectMsg.includes("Jenis sediaan")) {
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
                        <p>{detailCpotb.factoryName} </p>
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
                        <p>Jenis Industri Farmasi</p>
                      </li>
                      <li className="input">
                        <p>{detailCpotb.factoryType}</p>
                      </li>
                    </ul>
                    <ul>
                      <li className="label">
                        <p>NIB Pabrik</p>
                      </li>
                      <li className="input">
                        <p>{detailCpotb.factoryNIB}</p>
                      </li>
                    </ul>
                    <ul>
                      <li className="label">
                        <p>NPWP Pabrik</p>
                      </li>
                      <li className="input">
                        <p>{detailCpotb.factoryNPWP}</p>
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
                        <p>Tanggal Ditolak</p> 
                      </li>
                      <li className="input">
                        <p>{ new Date(Number(timestampRejected) * 1000).toLocaleDateString('id-ID', options)}</p> 
                      </li>
                    </ul>
                    {timestampRenewRequest?
                    <ul>
                      <li className="label">
                        <p>Tanggal Pengajuan Ulang</p> 
                      </li>
                      <li className="input">
                        <p>{ detailCpotb.timestampRenewRequest}</p> 
                      </li>
                    </ul> 
                    : <div></div>
                    
                    }
  
  
                  </div>
                </div>
              
              </div>
            ),
            width: '620',
            showCloseButton: true,
            showCancelButton: false,
            showConfirmButton: false,
          })
        } else{
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
                        <p>{detailCpotb.factoryName} </p>
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
                        <p>Jenis Industri Farmasi</p>
                      </li>
                      <li className="input">
                        <p>{detailCpotb.factoryType}</p>
                      </li>
                    </ul>
                    <ul>
                      <li className="label">
                        <p>NIB Pabrik</p>
                      </li>
                      <li className="input">
                        <p>{detailCpotb.factoryNIB}</p>
                      </li>
                    </ul>
                    <ul>
                      <li className="label">
                        <p>NPWP Pabrik</p>
                      </li>
                      <li className="input">
                        <p>{detailCpotb.factoryNPWP}</p>
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
                        <p>Tanggal Ditolak</p> 
                      </li>
                      <li className="input">
                        <p>{ new Date(Number(timestampRejected) * 1000).toLocaleDateString('id-ID', options)}</p> 
                      </li>
                    </ul>
                    {timestampRenewRequest?
                    <ul>
                      <li className="label">
                        <p>Tanggal Pengajuan Ulang</p> 
                      </li>
                      <li className="input">
                        <p>{ detailCpotb.timestampRenewRequest}</p> 
                      </li>
                    </ul> 
                    : <div></div>
                    
                    }
  
  
                  </div>
                </div>
              
              </div>
            ),
            width: '620',
            showCloseButton: true,
            showCancelButton: false,
            showConfirmButton: true,
            confirmButtonText: 'Pengajuan Ulang CPOTB',
          }).then((result) => {
            const today = new Date();
            const formattedDate = today.toLocaleDateString('id-ID', options);
            if (result.isConfirmed) {
              MySwal.fire({
                title: "Pengajuan Ulang Sertifikat CPOTB",
                html: (
                  <div className='form-swal form'>
                    <div className="row">
                      <div className="col reject">
                        <ul>
                        <li className="label">
                            <label htmlFor="factoryInstanceName">Tanggal Pengajuan Ulang</label>
                          </li>
                          <li className="input">
                            <input
                              type="text"
                              id="factoryInstanceName"
                              value={formattedDate}
                              readOnly
                            />
                          </li>
                        </ul>
                        <ul>
                        <li className="label">
                          <label htmlFor="factoryInstanceName">Factory Instance</label>
                        </li>
                        <li className="input">
                          <input
                            type="text"
                            id="factoryInstanceName"
                            value={detailCpotb.factoryName}
                            readOnly
                          />
                        </li>
                        </ul>
                        <ul>
                          <li className="label">
                            <label htmlFor="factoryInstanceName">Jenis Sediaan</label>
                          </li>
                          <li className="input select">
                          <select
                            id="jenisSediaanDropdown"
                            className="form-select"
                            >
                            <option value="" disabled>
                              Pilih Jenis Sediaan
                            </option>
                            {Object.entries(jenisSediaanMap).map(([key, value]) => (
                              <option key={key} value={key}>
                                {value}
                              </option>
                            ))}
                          </select>
                          <JenisSediaanTooltip
                            jenisSediaan={detailCpotb.jenisSediaan}
                          />
                          </li>
                        </ul>
      
                      </div>
                    </div>
                  
                  </div>
                ),
                width: '620',
                showCloseButton: true,
                showCancelButton: false,
                showConfirmButton: true,
                confirmButtonText: 'Pengajuan Ulang CPOTB',
                preConfirm: async () => {
                  const jenisSediaan = document.getElementById("jenisSediaanDropdown").value;
                if (!jenisSediaan) {
                  MySwal.showValidationMessage("Pilih Jenis Sediaan!");
                }
  
                return jenisSediaan;
                }
              }).then(async (result) => {
                if (result.isConfirmed) {
                  console.log("Pengajuan ulang dengan data:", result.value);
  
                  MySwal.fire({
                    title:"Processing your request...",
                    text:"Your request is on its way. This won't take long. 🚀",
                    icon: 'info',
                    showCancelButton: false,
                    showConfirmButton: false,
                    allowOutsideClick: false,
                  })
  
                  renewRequestCpotb(id, parseInt(result.value));
                  
                }
              })
            }
          })
        }


      } else {
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
                      <p>Jenis Industri Farmasi</p>
                    </li>
                    <li className="input">
                      <p>{detailCpotb.factoryType}</p>
                    </li>
                  </ul>
                  <ul>
                    <li className="label">
                      <p>NIB Pabrik</p>
                    </li>
                    <li className="input">
                      <p>{detailCpotb.factoryNIB}</p>
                    </li>
                  </ul>
                  <ul>
                    <li className="label">
                      <p>NPWP Pabrik</p>
                    </li>
                    <li className="input">
                      <p>{detailCpotb.factoryNPWP}</p>
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
  
                  {
                    detailCpotb.cpotbIpfs === "-" ? <div></div> : 
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
                  }
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
  
                  {timestampRejected? 
                    <ul>
                      <li className="label">
                        <p>Tanggal Penolakan</p> 
                      </li>
                      <li className="input">
                        <p>{detailCpotb.timestampRejected}</p> 
                      </li>
                    </ul> 
                    : <div></div>
                  }
                  {rejectMsg? 
                    <ul className='rejectMsg'>
                      <li className="label">
                        <p>Alasan Penolakan</p> 
                      </li>
                      <li className="input">
                        <p>{rejectMsg}</p> 
                      </li>
                    </ul> 
                    : <div></div>
                  }
                  {timestampRenewRequest? 
                    <ul>
                      <li className="label">
                        <p>Tanggal Pengajuan Ulang</p> 
                      </li>
                      <li className="input">
                        <p>{detailCpotb.timestampRenewRequest}</p> 
                      </li>
                    </ul> 
                    : <div></div>
                  }
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
      }

    } catch (e) {
      errAlert(e, "Can't retrieve data")
    }
  }

  const renewRequestCpotb = async (id, jenisSediaan) => {
    try {
      const renewRequestCpotbCt = await contracts.certificateManager.renewCpotb([id, userdata.name, userdata.instanceName, userdata.address], jenisSediaan);
      console.log('Receipt:', renewRequestCpotbCt);
  
      if(renewRequestCpotbCt){
        writeCpotbFb( userdata.instanceName, jenisSediaanMap[jenisSediaan], renewRequestCpotbCt.hash );

        MySwal.update({
          title: "Processing your transaction...",
          text: "This may take a moment. Hang tight! ⏳"
        });
      }
  
      contracts.certificateManager.once("evt_certRenewRequest", (_name, _userAddr, _jenisSediaan, _timestampRenew) => {
        handleEventCpotbRenewRequested(_name, _userAddr, _jenisSediaan, _timestampRenew, renewRequestCpotbCt.hash);
      });
  
    } catch (err) {
      errAlert(err, "Error making request!");
    }
  }

  const writeCpotbFb = async (instanceName, jenisSediaan, cpotbHash) => {
    try {
      const documentId = `cpotb-lists`; 
      const factoryDocRef = doc(db, instanceName, documentId);

      await updateDoc(factoryDocRef, {
        [`${jenisSediaan}.renewRequestCpotb`]: cpotbHash,
        [`${jenisSediaan}.renewRequestTimestamp`]: Date.now(), 
      }); 
    } catch (err) {
      errAlert(err);
    }
  };

  return (
    <>
      <div id="CpotbPage" className='Layout-Menu layout-page'>
        <div className="title-menu">
          <h1>Data Sertifikat CPOTB</h1>
          <p>Di ajukan oleh {userdata.instanceName}</p>
        </div>
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
                    <p>
                      { item.cpotbNumber !== null ? `CPOTB Number: ${item.cpotbNumber}` : "CPOTB Number: Tidak Tersedia"}
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

export default ManageCpotb;