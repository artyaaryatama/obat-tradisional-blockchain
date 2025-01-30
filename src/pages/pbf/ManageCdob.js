import { useEffect, useState } from 'react';
import { BrowserProvider, Contract } from "ethers";
import contractData from '../../auto-artifacts/deployments.json';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig"; 
import "../../styles/MainLayout.scss"
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import './../../styles/SweetAlert.scss';
import JenisSediaanTooltip from '../../components/TooltipJenisSediaan';

const MySwal = withReactContent(Swal);

function ManageCdob() {
  const [contracts, setContracts] = useState(null);
  const navigate = useNavigate();

  const userdata = JSON.parse(sessionStorage.getItem('userdata'));
  const [dataCdob, setDataCdob] = useState([]);

  const tipePermohonanMap = {
    0: "Obat Lain",
    1: "Cold Chain Product (CCP)"
  };

  const statusMap = {
    0: "Dalam Proses",
    1: "Disetujui",
    2: "Tidak Disetujui",
    3: "Pengajuan Ulang",
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
          const CertificateManager = new Contract(
            contractData.CertificateManager.address,
            contractData.CertificateManager.abi,
            signer
          );

          const RoleManager = new Contract(
            contractData.RoleManager.address,
            contractData.RoleManager.abi,
            signer
          );
          
          setContracts({
            certificateManager: CertificateManager,
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
      if (contracts && userdata.instanceName) {
        try {
          const listAllCt = await contracts.certificateManager.getCdobByInstance(userdata.instanceName);
          console.log(listAllCt);
          const reconstructedData = listAllCt.map((item) => {
            const cdobId = item[0]; 
            let cdobNumber = item[1] || 'TBA'; 

            if (item[4] === 2n) {
              cdobNumber = null;
            }
          
            return {
              cdobId: cdobId,
              cdobNumber: cdobNumber,
              pbfName: item[2],
              tipePermohonan: tipePermohonanMap[item[3]],
              status: statusMap[item[4]]
            };
          })

          setDataCdob(reconstructedData);
  
        } catch (error) {
          console.error("Error loading data: ", error);
        }
      }
    };
  
    loadData();
  }, [contracts]);

  const handleEventCdobRenewRequested = (bpomInstance, bpomAddr, tipePermohonan, timestamp, txHash) => {

    const formattedTimestamp = new Date(Number(timestamp) * 1000).toLocaleDateString('id-ID', options)
  
    // detail can be the cpotb number or rejectMsg
    MySwal.fire({
      title: "Success Renew Request CDOB",
      html: (
        <div className='form-swal'>
          <ul>
            <li className="label">
              <p>Nama Instansi BPOM</p> 
            </li>
            <li className="input">
              <p>{bpomInstance}</p> 
            </li>
          </ul>
          <ul>
            <li className="label">
              <p>Alamat Akun BPOM (Pengguna)</p> 
            </li>
            <li className="input">
              <p>{bpomAddr}</p> 
            </li>
          </ul>
          <ul>
            <li className="label">
              <p>Tanggal Pengajuan Ulang</p> 
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
              <p>Hash Transaksi</p>
            </li>
            <li className="input">
              <a
                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noreferrer"
              >
                Lihat transaksi di Etherscan
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

  const getDetailCdob = async (id) => {
    
    console.log(id);
    let rejectMsg;

    try {
      const detailCdobCt = await contracts.certificateManager.getCdobDetails(id);
      const detailUserPbfCt = await contracts.roleManager.getUserData(userdata.address);

      const [certDetails, cdobDetails] = detailCdobCt; 

      const [cdobId, cdobNumber, tipePermohonan] = cdobDetails

      const [status, timestampRequest, timestampApprove, timestampRejected, timestampRenewRequest, pbf, bpom, cdobIpfs] = certDetails

      if (timestampRejected !== 0n) {
        const rejectMsgCt = await contracts.certificateManager.getRejectMsgCdob(id);
        rejectMsg = rejectMsgCt;  
      } 

      const detailCdob = {
        cdobId: cdobId,
        cdobNumber: cdobNumber ? cdobNumber : "-",
        pbfUserName: pbf[0],
        pbfName: pbf[1],
        pbfAddr: pbf[2],
        tipePermohonan: tipePermohonanMap[tipePermohonan], 
        status: statusMap[status], 
        timestampRequest: new Date(Number(timestampRequest) * 1000).toLocaleDateString('id-ID', options),
        timestampApprove: Number(timestampApprove) > 0 ? new Date(Number(timestampApprove) * 1000).toLocaleDateString('id-ID', options): "-",
        timestampRenewRequest: parseInt(timestampRenewRequest) !== 0 ? new Date(Number(timestampRenewRequest) * 1000).toLocaleDateString('id-ID', options): "-",
        timestampRejected: parseInt(timestampRejected) !== 0 ? new Date(Number(timestampRejected) * 1000).toLocaleDateString('id-ID', options): "-",
        bpomName : bpom[0] ? bpom[0] : "-",
        bpomInstance: bpom[1] ? bpom[1] : "-",
        bpomAddr: bpom[2] === "0x0000000000000000000000000000000000000000" ? "-" : bpom[2],
        cdobIpfs: cdobIpfs,
        pbfNIB: detailUserPbfCt[6],
        pbfNPWP: detailUserPbfCt[7]
      };

      console.log(detailCdob.timestampApprove);

      if(detailCdob.status === 'Tidak Disetujui'){

        MySwal.fire({
          title: "Detail Sertifikat CDOB",
          html: (
            <div className='form-swal'>
              <div className="row">
                <div className="col">
                  <ul>
                    <li className="label">
                      <p>Nama Instansi PBF</p>
                    </li>
                    <li className="input">
                      <p>{detailCdob.pbfName}</p>
                    </li>
                  </ul>
  
                  <ul>
                    <li className="label">
                      <p>Alamat Akun PBF (Pengguna)</p> 
                    </li>
                    <li className="input">
                      <p>{detailCdob.pbfAddr}</p> 
                    </li>
                  </ul>
  
                  <ul>
                    <li className="label">
                      <p>NIB PBF</p> 
                    </li>
                    <li className="input">
                      <p>{detailCdob.pbfNIB}</p> 
                    </li>
                  </ul>
  
                  <ul>
                    <li className="label">
                      <p>NPWP PBF</p> 
                    </li>
                    <li className="input">
                      <p>{detailCdob.pbfNPWP}</p> 
                    </li>
                  </ul>
  
                  <ul>
                    <li className="label">
                      <p>Nama Instansi BPOM</p> 
                    </li>
                    <li className="input">
                      <p>{detailCdob.bpomInstance}</p> 
                    </li>
                  </ul>
  
                  <ul>
                    <li className="label">
                      <p>Alamat Akun BPOM (Pengguna)</p> 
                    </li>
                    <li className="input">
                      <p>{detailCdob.bpomAddr}</p> 
                    </li>
                  </ul>
                </div>
  
                <div className="col">
                  <ul className='status'>
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
  
                  <ul>
                    <li className="label">
                      <p>Tanggal Penolakan</p> 
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
                      <p>{ detailCdob.timestampRenewRequest}</p> 
                    </li>
                  </ul> 
                  : <div></div>
                  
                  }
                </div>
              </div>
            
            </div>
          ),
          width: '620',
          showCancelButton: false,
          showCloseButton: true,
          confirmButtonText: 'Pengajuan Ulang CDOB',
        }).then((result) => {
          const today = new Date();
          const formattedDate = today.toLocaleDateString('id-ID', options);
          if (result.isConfirmed) {
            MySwal.fire({
              title: "Pengajuan Ulang Sertifikat CDOB",
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
                        <label htmlFor="factoryInstanceName">Nama Instansi PBF</label>
                      </li>
                      <li className="input">
                        <input
                          type="text"
                          id="factoryInstanceName"
                          value={detailCdob.pbfName}
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
                          id="tipePermohonan"
                          className="form-select"
                          >
                          <option value="" disabled>
                            Pilih Jenis Sediaan
                          </option>         
                          <option value="1">Cold Chain Product (CCP)</option>
                          <option value="0">Obat Lain</option>
                          
                        </select>
                        <JenisSediaanTooltip
                          jenisSediaan={detailCdob.tipePermohonan}
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
              confirmButtonText: 'Pengajuan Ulang CDOB',
              preConfirm: async () => {
                const tipePermohonan = document.getElementById("tipePermohonan").value;
              if (!tipePermohonan) {
                MySwal.showValidationMessage("Pilih Tipe Permohonan!");
              }

              return tipePermohonan;
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

                renewRequestCdob(id, parseInt(result.value));
                
              }
            })
          }
        })

      } else {
        MySwal.fire({
          title: "Detail Sertifikat CDOB",
          html: (
            <div className='form-swal'>
              <div className="row">
              <div className="col">
                  <ul>
                    <li className="label">
                      <p>Nama Instansi PBF</p>
                    </li>
                    <li className="input">
                      <p>{detailCdob.pbfName}</p>
                    </li>
                  </ul>
  
                  <ul>
                    <li className="label">
                      <p>Alamat Akun PBF (Pengguna)</p> 
                    </li>
                    <li className="input">
                      <p>{detailCdob.pbfAddr}</p> 
                    </li>
                  </ul>
  
                  <ul>
                    <li className="label">
                      <p>NIB PBF</p> 
                    </li>
                    <li className="input">
                      <p>{detailCdob.pbfNIB}</p> 
                    </li>
                  </ul>
  
                  <ul>
                    <li className="label">
                      <p>NPWP PBF</p> 
                    </li>
                    <li className="input">
                      <p>{detailCdob.pbfNPWP}</p> 
                    </li>
                  </ul>
  
                  <ul>
                    <li className="label">
                      <p>Nama Instansi BPOM</p> 
                    </li>
                    <li className="input">
                      <p>{detailCdob.bpomInstance}</p> 
                    </li>
                  </ul>
  
                  <ul>
                    <li className="label">
                      <p>Alamat Akun BPOM (Pengguna)</p> 
                    </li>
                    <li className="input">
                      <p>{detailCdob.bpomAddr}</p> 
                    </li>
                  </ul>
                </div>
  
                <div className="col">
                <ul className='status'>
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
                  {timestampRejected? 
                      <ul>
                        <li className="label">
                          <p>Tanggal Penolakan</p> 
                        </li>
                        <li className="input">
                          <p>{detailCdob.timestampRejected}</p> 
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
                        <p>{detailCdob.timestampRenewRequest}</p> 
                      </li>
                    </ul> 
                    : <div></div>
                  }
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

      }

    } catch (e) {
      errAlert(e, "Can't retrieve data")
    }
  }

  const renewRequestCdob = async (id, tipePermohonanMap) => {
    try {
      const renewRequestCdobCt = await contracts.certificateManager.renewCdob([id, userdata.name, userdata.instanceName, userdata.address], tipePermohonanMap);
      console.log('Receipt:', renewRequestCdobCt);
  
      if(renewRequestCdobCt){
        writeCpotbFb( userdata.instanceName, tipePermohonanMap[tipePermohonanMap], renewRequestCdobCt.hash );

        MySwal.update({
          title: "Memproses transaksi...",
          text: "Proses ini mungkin memerlukan sedikit waktu. Harap tunggu. ⏳"
        });
      }
  
      contracts.certificateManager.once("evt_certRenewRequest", (_instance, _userAddr, _tipePermohonan, _timestampRenew) => {
        handleEventCdobRenewRequested(_instance, _userAddr, _tipePermohonan, _timestampRenew, renewRequestCdobCt.hash);
      });
  
    } catch (err) {
      errAlert(err, "Error making request!");
    }
  }

  const writeCpotbFb = async (instanceName, tipePermohonanMap, cdobHash) => {
    try {
      const documentId = `cdob-lists`; 
      const pbfDocRef = doc(db, instanceName, documentId);

      await updateDoc(pbfDocRef, {
        [`${tipePermohonanMap}.RenewRequestCdob`]: cdobHash,
      [`${tipePermohonanMap}.RenewRequestTimestamp`]: Date.now(),
      });
    } catch (err) {
      errAlert(err);
    }
  };


  return (
    <>
      <div id="CpotbPage" className='Layout-Menu layout-page'>
        <div className="title-menu">
          <h1>Data Sertifikat CDOB</h1>
          <p>Di ajukan oleh {userdata.instanceName}</p>
        </div>
        <div className="container-data">
          <div className="menu-data">
            <div className="btn">
              <button className='btn-menu' onClick={() => navigate('/request-cdob')}>
                <i className="fa-solid fa-plus"></i>
                Tambah data baru
              </button>
            </div>
          </div>
          <div className="data-list">
            {dataCdob.length > 0 ? (
              <ul>
                {dataCdob.map((item, index) => ( 
                  <li key={index}>
                    <button className='title' onClick={() => getDetailCdob(item.cdobId)}>{item.tipePermohonan}</button>
                    <p>
                      { item.cdobNumber !== null ? `CDOB Number: ${item.cdobNumber}` : "CDOB Number: Not Available"}
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
    confirmButtonText: 'Try Again',
    didOpen: () => {
      const actions = Swal.getActions();
      actions.style.justifyContent = "center";
    }
  });

  console.error(customMsg)
  console.error(errorObject);
}

export default ManageCdob;