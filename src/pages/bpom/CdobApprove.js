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
    0: "Dalam Proses Pengajuan",
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
    document.title = "CDOB List"; 
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
          const listAllCdob = await contracts.certificateManager.getAllCdob()
          console.log(listAllCdob);

          const reconstructedData = listAllCdob.map((item) => {
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
    if(status === 'Disetujui'){
      MySwal.fire({
        title: "Pengajuan CDOB disetujui",
        html: (
          <div className='form-swal event'>
            <ul>
              <li className="label">
                <p>Nomor CDOB</p> 
              </li>
              <li className="input">
                <p>{detail}</p> 
              </li>
            </ul>
            <ul>
              <li className="label">
                <p>Nama Instansi BPOM</p> 
              </li>
              <li className="input">
                <p>{bpomInstance}</p> 
              </li>
            </ul>
            <ul className='klaim'>
              <li className="label">
                <p>Alamat Akun BPOM (Pengguna)</p> 
              </li>
              <li className="input">
                <p>{bpomAddr}</p> 
              </li>
            </ul>
            <ul>
              <li className="label">
                <p>Tanggal Disetujui</p> 
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
        didOpen: () => {
          const actions = Swal.getActions();
          actions.style.justifyContent = "center";
      }
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.reload();
        }
      });
    } else {
      MySwal.fire({
        title: "Pengajuan CDOB Ditolak",
        html: (
          <div className='form-swal event'>
            <ul>
              <li className="label">
                <p>Nama Instansi BPOM</p> 
              </li>
              <li className="input">
                <p>{bpomInstance}</p> 
              </li>
            </ul>
            <ul className='klaim'>
              <li className="label">
                <p>Alamat Akun BPOM (Pengguna)</p> 
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
            <ul className='rejectMsg evt'>
              <li className="label">
                <p>Alasan Penolakan</p> 
              </li>
              <li className="input">
                <p>{detail}</p> 
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
        didOpen: () => {
          const actions = Swal.getActions();
          actions.style.justifyContent = "center";
        }
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.reload();
        }
      });
    }

  }

  const getDetailCdob = async (id) => {
    
    console.log(id); 
    let rejectMsg;
    
    try {
      const detailCdobCt = await contracts.certificateManager.getCdobDetails(id);

      const [certDetails, cdobDetails, docsAdministrasi, docsTeknis] = detailCdobCt; 
      const [surat_permohonan_cdob, bukti_pembayaran_pajak] = docsAdministrasi;
      const [surat_izin_cdob, denah_pbf, struktur_organisasi, daftar_personalia, daftar_peralatan, eksekutif_quality_management, surat_izin_apoteker, dokumen_self_assessment] = docsTeknis
      const [cdobId, cdobNumber, tipePermohonan] = cdobDetails
      const [status, timestampRequest, timestampApprove, timestampRejected, timestampRenewRequest, pbf, bpom, cdobIpfs] = certDetails

      const detailUserPbfCt = await contracts.roleManager.getUserData(pbf[2]);
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
        cdobIpfs: cdobIpfs ? cdobIpfs : "-",
        pbfNIB: detailUserPbfCt[6],
        pbfNPWP: detailUserPbfCt[7],
        dokumenAdministrasi: {
          surat_permohonan_cdob: surat_permohonan_cdob,
          bukti_pembayaran_pajak: bukti_pembayaran_pajak
        },
        dokumenTeknis: {
          surat_izin_cdob: surat_izin_cdob,
          denah_pbf: denah_pbf,
          struktur_organisasi: struktur_organisasi,
          daftar_personalia: daftar_personalia,
          daftar_peralatan: daftar_peralatan,
          eksekutif_quality_management: eksekutif_quality_management,
          surat_izin_apoteker: surat_izin_apoteker,
          dokumen_self_assessment: dokumen_self_assessment
        }
      };

      if(detailCdob.status === 'Disetujui'){
        MySwal.fire({
          title: "Detail Sertifikat CDOB",
          html: (
            <div className='form-swal order'>
              <div className="row2">
  
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
                    <ul className='rejectMsg klaim'>
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
                  <ul>
                    <li className="label">
                      <p>Nama Instansi PBF</p>
                    </li>
                    <li className="input">
                      <p>{detailCdob.pbfName}</p>
                    </li>
                  </ul>
  
                  <ul className='klaim'>
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
  
                  <ul className='klaim'>
                    <li className="label">
                      <p>Alamat Akun BPOM (Pengguna)</p> 
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
                        Liat data CDOB di IPFS
                        <i class="fa-solid fa-arrow-up-right-from-square"></i>
                      </a>
                    </li>
                  </ul>
                </div>
                <div className='col doku'>
                  <h5>Dokumen Administrasi</h5>
                  <ul>
                    <li className="label">
                      <p>Surat Permohonan CDOB</p>
                    </li>
                    <li className="input">
                      <a
                        href={`http://localhost:8080/ipfs/${detailCdob.dokumenAdministrasi.surat_permohonan_cdob}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Lihat surat permohonan CDOB
                        <i className="fa-solid fa-arrow-up-right-from-square"></i>
                      </a>
                    </li>
                  </ul>
                  <ul>
                    <li className="label">
                      <p>Bukti Pembayaran Pajak</p>
                    </li>
                    <li className="input">
                      <a
                        href={`http://localhost:8080/ipfs/${detailCdob.dokumenAdministrasi.bukti_pembayaran_pajak}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Lihat bukti pembayaran pajak
                        <i className="fa-solid fa-arrow-up-right-from-square"></i>
                      </a>
                    </li>
                  </ul>
                  <h5>Dokumen Teknis</h5>
                  <ul>
                    <li className="label">
                      <p>Surat Izin CDOB</p>
                    </li>
                    <li className="input">
                      <a
                        href={`http://localhost:8080/ipfs/${detailCdob.dokumenTeknis.surat_izin_cdob}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Lihat surat izin CDOB
                        <i className="fa-solid fa-arrow-up-right-from-square"></i>
                      </a>
                    </li>
                  </ul>
                  <ul>
                    <li className="label">
                      <p>Denah PBF</p>
                    </li>
                    <li className="input">
                      <a
                        href={`http://localhost:8080/ipfs/${detailCdob.dokumenTeknis.denah_pbf}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Lihat denah PBF
                        <i className="fa-solid fa-arrow-up-right-from-square"></i>
                      </a>
                    </li>
                  </ul>
                  <ul>
                    <li className="label">
                      <p>Struktur Organisasi</p>
                    </li>
                    <li className="input">
                      <a
                        href={`http://localhost:8080/ipfs/${detailCdob.dokumenTeknis.struktur_organisasi}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Lihat struktur organisasi
                        <i className="fa-solid fa-arrow-up-right-from-square"></i>
                      </a>
                    </li>
                  </ul>
                  <ul>
                    <li className="label">
                      <p>Daftar Personalia</p>
                    </li>
                    <li className="input">
                      <a
                        href={`http://localhost:8080/ipfs/${detailCdob.dokumenTeknis.daftar_personalia}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Lihat daftar personalia
                        <i className="fa-solid fa-arrow-up-right-from-square"></i>
                      </a>
                    </li>
                  </ul>
                  <ul>
                    <li className="label">
                      <p>Daftar Peralatan</p>
                    </li>
                    <li className="input">
                      <a
                        href={`http://localhost:8080/ipfs/${detailCdob.dokumenTeknis.daftar_peralatan}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Lihat daftar peralatan
                        <i className="fa-solid fa-arrow-up-right-from-square"></i>
                      </a>
                    </li>
                  </ul>
                  <ul>
                    <li className="label">
                      <p>Eksekutif Quality Management</p>
                    </li>
                    <li className="input">
                      <a
                        href={`http://localhost:8080/ipfs/${detailCdob.dokumenTeknis.eksekutif_quality_management}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Lihat eksekutif quality management
                        <i className="fa-solid fa-arrow-up-right-from-square"></i>
                      </a>
                    </li>
                  </ul>
                  <ul>
                    <li className="label">
                      <p>Surat Izin Apoteker</p>
                    </li>
                    <li className="input">
                      <a
                        href={`http://localhost:8080/ipfs/${detailCdob.dokumenTeknis.surat_izin_apoteker}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Lihat surat izin Apoteker
                        <i className="fa-solid fa-arrow-up-right-from-square"></i>
                      </a>
                    </li>
                  </ul>
                  <ul>
                    <li className="label">
                      <p>Dokumen Self Assesment</p>
                    </li>
                    <li className="input">
                      <a
                        href={`http://localhost:8080/ipfs/${detailCdob.dokumenTeknis.dokumen_self_assessment}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Lihat dokumen Self Assesment
                        <i className="fa-solid fa-arrow-up-right-from-square"></i>
                      </a>
                    </li>
                  </ul>
                </div>

              </div>
            
            </div>
          ),
          width: '1020',
          showCancelButton: false,
          showCloseButton: true,
          showConfirmButton: false,
          customClass: {
            htmlContainer: 'scrollable-modal'
          },
        })
      } else if (detailCdob.status === 'Tidak Disetujui'){
        MySwal.fire({
          title: "Detail Sertifikat CDOB",
          html: (
            <div className='form-swal order'>
              <div className="row2">
  
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
  
                  <ul className='rejectMsg klaim'>
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
                                    <ul>
                    <li className="label">
                      <p>Nama Instansi PBF</p>
                    </li>
                    <li className="input">
                      <p>{detailCdob.pbfName}</p>
                    </li>
                  </ul>
  
                  <ul className='klaim'>
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
  
                  <ul className='klaim'>
                    <li className="label">
                      <p>Alamat Akun BPOM (Pengguna)</p> 
                    </li>
                    <li className="input">
                      <p>{detailCdob.bpomAddr}</p> 
                    </li>
                  </ul>
                </div>

                <div className='col doku'>
                  <h5>Dokumen Administrasi</h5>
                  <ul>
                    <li className="label">
                      <p>Surat Permohonan CDOB</p>
                    </li>
                    <li className="input">
                      <a
                        href={`http://localhost:8080/ipfs/${detailCdob.dokumenAdministrasi.surat_permohonan_cdob}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Lihat surat permohonan CDOB
                        <i className="fa-solid fa-arrow-up-right-from-square"></i>
                      </a>
                    </li>
                  </ul>
                  <ul>
                    <li className="label">
                      <p>Bukti Pembayaran Pajak</p>
                    </li>
                    <li className="input">
                      <a
                        href={`http://localhost:8080/ipfs/${detailCdob.dokumenAdministrasi.bukti_pembayaran_pajak}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Lihat bukti pembayaran pajak
                        <i className="fa-solid fa-arrow-up-right-from-square"></i>
                      </a>
                    </li>
                  </ul>
                  <h5>Dokumen Teknis</h5>
                  <ul>
                    <li className="label">
                      <p>Surat Izin CDOB</p>
                    </li>
                    <li className="input">
                      <a
                        href={`http://localhost:8080/ipfs/${detailCdob.dokumenTeknis.surat_izin_cdob}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Lihat surat izin CDOB
                        <i className="fa-solid fa-arrow-up-right-from-square"></i>
                      </a>
                    </li>
                  </ul>
                  <ul>
                    <li className="label">
                      <p>Denah PBF</p>
                    </li>
                    <li className="input">
                      <a
                        href={`http://localhost:8080/ipfs/${detailCdob.dokumenTeknis.denah_pbf}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Lihat denah PBF
                        <i className="fa-solid fa-arrow-up-right-from-square"></i>
                      </a>
                    </li>
                  </ul>
                  <ul>
                    <li className="label">
                      <p>Struktur Organisasi</p>
                    </li>
                    <li className="input">
                      <a
                        href={`http://localhost:8080/ipfs/${detailCdob.dokumenTeknis.struktur_organisasi}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Lihat struktur organisasi
                        <i className="fa-solid fa-arrow-up-right-from-square"></i>
                      </a>
                    </li>
                  </ul>
                  <ul>
                    <li className="label">
                      <p>Daftar Personalia</p>
                    </li>
                    <li className="input">
                      <a
                        href={`http://localhost:8080/ipfs/${detailCdob.dokumenTeknis.daftar_personalia}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Lihat daftar personalia
                        <i className="fa-solid fa-arrow-up-right-from-square"></i>
                      </a>
                    </li>
                  </ul>
                  <ul>
                    <li className="label">
                      <p>Daftar Peralatan</p>
                    </li>
                    <li className="input">
                      <a
                        href={`http://localhost:8080/ipfs/${detailCdob.dokumenTeknis.daftar_peralatan}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Lihat daftar peralatan
                        <i className="fa-solid fa-arrow-up-right-from-square"></i>
                      </a>
                    </li>
                  </ul>
                  <ul>
                    <li className="label">
                      <p>Eksekutif Quality Management</p>
                    </li>
                    <li className="input">
                      <a
                        href={`http://localhost:8080/ipfs/${detailCdob.dokumenTeknis.eksekutif_quality_management}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Lihat eksekutif quality management
                        <i className="fa-solid fa-arrow-up-right-from-square"></i>
                      </a>
                    </li>
                  </ul>
                  <ul>
                    <li className="label">
                      <p>Surat Izin Apoteker</p>
                    </li>
                    <li className="input">
                      <a
                        href={`http://localhost:8080/ipfs/${detailCdob.dokumenTeknis.surat_izin_apoteker}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Lihat surat izin Apoteker
                        <i className="fa-solid fa-arrow-up-right-from-square"></i>
                      </a>
                    </li>
                  </ul>
                  <ul>
                    <li className="label">
                      <p>Dokumen Self Assesment</p>
                    </li>
                    <li className="input">
                      <a
                        href={`http://localhost:8080/ipfs/${detailCdob.dokumenTeknis.dokumen_self_assessment}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Lihat dokumen Self Assesment
                        <i className="fa-solid fa-arrow-up-right-from-square"></i>
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            
            </div>
          ),
          width: '1020',
          showCancelButton: false,
          showConfirmButton: false,
          showCloseButton: true,
          customClass: {
            htmlContainer: 'scrollable-modal'
          },
        })
      } else{
        MySwal.fire({
          title: "Detail Pengajuan CDOB",
          html: (
            <div className='form-swal order'>
              <div className="row2">
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
                  {rejectMsg? 
                    <ul className='rejectMsg klaim'>
                      <li className="label">
                        <p>Alasan Penolakan</p> 
                      </li>
                      <li className="input">
                        <p>{rejectMsg}</p> 
                      </li>
                    </ul> 
                    : <div></div>
                  }
                    <ul>
                    <li className="label">
                      <p>Nama Instansi PBF</p>
                    </li>
                    <li className="input">
                      <p>{detailCdob.pbfName}</p>
                    </li>
                  </ul>
  
                  <ul className='klaim'>
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
  
                  <ul className='klaim'>
                    <li className="label">
                      <p>Alamat Akun BPOM (Pengguna)</p> 
                    </li>
                    <li className="input">
                      <p>{detailCdob.bpomAddr}</p> 
                    </li>
                  </ul>
                </div>
                <div className='col doku'>
                  <h5>Dokumen Administrasi</h5>
                  <ul>
                    <li className="label">
                      <p>Surat Permohonan CDOB</p>
                    </li>
                    <li className="input">
                      <a
                        href={`http://localhost:8080/ipfs/${detailCdob.dokumenAdministrasi.surat_permohonan_cdob}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Lihat surat permohonan CDOB
                        <i className="fa-solid fa-arrow-up-right-from-square"></i>
                      </a>
                    </li>
                  </ul>
                  <ul>
                    <li className="label">
                      <p>Bukti Pembayaran Pajak</p>
                    </li>
                    <li className="input">
                      <a
                        href={`http://localhost:8080/ipfs/${detailCdob.dokumenAdministrasi.bukti_pembayaran_pajak}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Lihat bukti pembayaran pajak
                        <i className="fa-solid fa-arrow-up-right-from-square"></i>
                      </a>
                    </li>
                  </ul>
                  <h5>Dokumen Teknis</h5>
                  <ul>
                    <li className="label">
                      <p>Surat Izin CDOB</p>
                    </li>
                    <li className="input">
                      <a
                        href={`http://localhost:8080/ipfs/${detailCdob.dokumenTeknis.surat_izin_cdob}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Lihat surat izin CDOB
                        <i className="fa-solid fa-arrow-up-right-from-square"></i>
                      </a>
                    </li>
                  </ul>
                  <ul>
                    <li className="label">
                      <p>Denah PBF</p>
                    </li>
                    <li className="input">
                      <a
                        href={`http://localhost:8080/ipfs/${detailCdob.dokumenTeknis.denah_pbf}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Lihat denah PBF
                        <i className="fa-solid fa-arrow-up-right-from-square"></i>
                      </a>
                    </li>
                  </ul>
                  <ul>
                    <li className="label">
                      <p>Struktur Organisasi</p>
                    </li>
                    <li className="input">
                      <a
                        href={`http://localhost:8080/ipfs/${detailCdob.dokumenTeknis.struktur_organisasi}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Lihat struktur organisasi
                        <i className="fa-solid fa-arrow-up-right-from-square"></i>
                      </a>
                    </li>
                  </ul>
                  <ul>
                    <li className="label">
                      <p>Daftar Personalia</p>
                    </li>
                    <li className="input">
                      <a
                        href={`http://localhost:8080/ipfs/${detailCdob.dokumenTeknis.daftar_personalia}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Lihat daftar personalia
                        <i className="fa-solid fa-arrow-up-right-from-square"></i>
                      </a>
                    </li>
                  </ul>
                  <ul>
                    <li className="label">
                      <p>Daftar Peralatan</p>
                    </li>
                    <li className="input">
                      <a
                        href={`http://localhost:8080/ipfs/${detailCdob.dokumenTeknis.daftar_peralatan}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Lihat daftar peralatan
                        <i className="fa-solid fa-arrow-up-right-from-square"></i>
                      </a>
                    </li>
                  </ul>
                  <ul>
                    <li className="label">
                      <p>Eksekutif Quality Management</p>
                    </li>
                    <li className="input">
                      <a
                        href={`http://localhost:8080/ipfs/${detailCdob.dokumenTeknis.eksekutif_quality_management}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Lihat eksekutif quality management
                        <i className="fa-solid fa-arrow-up-right-from-square"></i>
                      </a>
                    </li>
                  </ul>
                  <ul>
                    <li className="label">
                      <p>Surat Izin Apoteker</p>
                    </li>
                    <li className="input">
                      <a
                        href={`http://localhost:8080/ipfs/${detailCdob.dokumenTeknis.surat_izin_apoteker}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Lihat surat izin Apoteker
                        <i className="fa-solid fa-arrow-up-right-from-square"></i>
                      </a>
                    </li>
                  </ul>
                  <ul>
                    <li className="label">
                      <p>Dokumen Self Assesment</p>
                    </li>
                    <li className="input">
                      <a
                        href={`http://localhost:8080/ipfs/${detailCdob.dokumenTeknis.dokumen_self_assessment}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Lihat dokumen Self Assesment
                        <i className="fa-solid fa-arrow-up-right-from-square"></i>
                      </a>
                    </li>
                  </ul>
                </div>

              </div>
            
            </div>
          ),
          width: '1020',
          showCloseButton: true,
          showCancelButton: false,
          confirmButtonText: 'Setujui',
          showDenyButton: true,
          denyButtonText: 'Tolak',
          customClass: {
            htmlContainer: 'scrollable-modal'
          },
        }).then((result) => {
  
          if(result.isConfirmed){
            const randomDigits1 = Math.floor(1000 + Math.random() * 9000);
            const randomDigits2 = Math.floor(1000 + Math.random() * 9000);
            const today = new Date();
            const month = String(today.getMonth() + 1).padStart(2, '0');  
            const year = today.getFullYear(); 
            const cdobNumber = `CDOB${randomDigits1}/S1-${randomDigits2}/${month}/${year}`;
            
            MySwal.fire({
              title: 'Setujui Pengajuan CDOB',
              html: (
                <div className="form-swal form">
                  <div className="row">
                    <div className="col">
                      <ul>
                        <li className="label">
                          <label htmlFor="pbfName">Nama Instansi PBF</label>
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
              
                      <ul className='klaim'>
                        <li className="label">
                          <label htmlFor="pbfAddr">Alamat Akun PBF (Pengguna)</label>
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
                          <label htmlFor="pbfAddr">NIB PBF</label>
                        </li>
                        <li className="input">
                          <input
                            type="text"
                            id="pbfAddr"
                            value={detailCdob.pbfNIB}
                            readOnly
                          />
                        </li>
                      </ul>
                      <ul>
                        <li className="label">
                          <label htmlFor="pbfAddr">NPWP PBF</label>
                        </li>
                        <li className="input">
                          <input
                            type="text"
                            id="pbfAddr"
                            value={detailCdob.pbfNPWP}
                            readOnly
                          />
                        </li>
                      </ul>
              
                      <ul>
                        <li className="label">
                          <label htmlFor="bpomInstance">Nama Instansi BPOM</label>
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
              
                      <ul className='klaim'>
                        <li className="label">
                          <label htmlFor="bpomAddr">Alamat Akun BPOM (Pengguna)</label>
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
              cancelButtonText: 'Batal',
              confirmButtonText: 'Setujui',
              confirmButtonColor: '#530AF7',
              cancelButtonColor: '#A6A6A6',
              allowOutsideClick: false,
              customClass: {
                htmlContainer: 'scrollable-modal-small'
              },
            }).then((result) => {

              if (result.isConfirmed) {
                MySwal.fire({
                  title: "Menunggu koneksi Metamask...",
                  text: "Jika proses ini memakan waktu terlalu lama, coba periksa koneksi Metamask Anda. 🚀",
                  icon: 'info',
                  showCancelButton: false,
                  showConfirmButton: false,
                  allowOutsideClick: false,
                });

                generateIpfs(cdobNumber, detailCdob)
              }
            })
          } else if (result.isDenied){
            MySwal.fire({
              title: 'Tolak Pengajuan Sertifikat CDOB',
              html: (
                <div className="form-swal form">
                  <div className="row">
                    <div className="col">
                      <ul>
                        <li className="label">
                          <label htmlFor="pbfName">Nama Instansi PBF</label>
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
              
                      <ul className='klaim'>
                        <li className="label">
                          <label htmlFor="pbfAddr">Alamat Akun PBF (Pengguna)</label>
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
                          <label htmlFor="bpomInstance">Nama Instansi BPOM</label>
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
              
                      <ul className='klaim'>
                        <li className="label">
                          <label htmlFor="bpomAddr">Alamat Akun BPOM (Pengguna)</label>
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
                          <label htmlFor="rejectReason">Alasan Reject</label>
                        </li>
                        <li className="input">
                          <select id="rejectReason" required onChange={(e) => handleRejectReasonChange(e)}>
                            <option value="">Pilih alasan</option>
                            <option value="Surat Permohonan CDOB tidak sesuai">Surat Permohonan CDOB tidak sesuai</option>
                            <option value="Bukti Pembayaran Pajak tidak sesuai">Bukti Pembayaran Pajak tidak sesuai</option>
                            <option value="Surat Izin tidak sesuai">Surat Izin tidak sesuai</option>
                            <option value="Denah Bangunan PBF tidak sesuai">Denah Bangunan PBF tidak sesuai</option>
                            <option value="Surat Izin Apoteker tidak sesuai">Surat Izin Apoteker tidak sesuai</option>
                            <option value="Dokumen Self Assessment tidak sesuai">Dokumen Self Assessment tidak sesuai</option>
                            <option value="Dokumen Teknis tidak lengkap">Dokumen Teknis tidak lengkap</option>
                            <option value="Dokumen Administratif tidak lengkap">Dokumen Administratif tidak lengkap</option>

                            <option value="Other">Other (specify manually)</option>
                          </select>
                        </li>
                      </ul>

                      <ul id="customRejectMsgWrapper" style={{ display: 'none' }}>
                        <li className="label">
                          <label htmlFor="customRejectMsg">Specify Reason</label>
                        </li>
                        <li className="input">
                          <textarea
                            id="customRejectMsg"
                            rows="3"
                            placeholder="Masukkan alasan manual di sini"
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
              width: '720',        
              icon: 'warning',
              showCancelButton: true,
              showCloseButton: true,
              confirmButtonText: 'Tolak',
              confirmButtonColor: '#E33333',
              cancelButtonColor: '#A6A6A6',
              allowOutsideClick: false,
              cancelButtonText: 'Batal',
              preConfirm: () => {
              const rejectReason = document.getElementById('rejectReason').value;
              const customRejectMsg = document.getElementById('customRejectMsg').value;

              if (!rejectReason) {
                Swal.showValidationMessage('Pilih alasan reject!');
              } else if (rejectReason === 'Other' && !customRejectMsg.trim()) {
                Swal.showValidationMessage('Masukkan alasan manual jika memilih "Lainnya"!');
              }

              return {
                rejectReason: rejectReason === 'Other' ? customRejectMsg : rejectReason,
              };
            },
            }).then((result) => {

              if (result.isConfirmed) {
                MySwal.fire({
                  title: "Menunggu koneksi Metamask...",
                  text: "Jika proses ini memakan waktu terlalu lama, coba periksa koneksi Metamask Anda. 🚀",
                  icon: 'info',
                  showCancelButton: false,
                  showConfirmButton: false,
                  allowOutsideClick: false,
                });

                rejectCdob(id, result.value.rejectReason, tipePermohonan, detailCdob.pbfName)
              }
            })
            
          }
        })

      }

    } catch (e) {
      errAlert(e, "Can't retrieve data")
    }
  }

  function handleRejectReasonChange(e) {
    const customMsgWrapper = document.getElementById('customRejectMsgWrapper');
    if (e.target.value === 'Other') {
      customMsgWrapper.style.display = 'flex';
    } else {
      customMsgWrapper.style.display = 'none';
    }
  }

  const generateIpfs = async (cdobNumber, detailCdob) => {

    console.log(detailCdob);
    console.log(cdobNumber);

    const date = new Date();
    const formattedDate = new Intl.DateTimeFormat('id-ID', options).format(date);
    
    MySwal.update({
      title: "Mengunggah semua data CDOB IPFS...",
      text: "Harap tunggu. Jika proses ini memakan waktu terlalu lama, coba periksa koneksi IPFS. 🚀",
    });

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
        senderNIB: detailCdob.pbfNIB,
        senderNPWP: detailCdob.pbfNPWP,
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

        MySwal.update({
          title: "Menunggu koneksi Metamask...",
          text: "Jika proses ini memakan waktu terlalu lama, coba periksa koneksi Metamask Anda. 🚀",
        });
        
        approveCdob(cdobNumber, detailCdob.cdobId, detailCdob.tipePermohonan, result.path, detailCdob.pbfName);
      }

    } catch (error) {
      errAlert(error, "Tidak bisa mengunggah data obat ke IPFS."); 
    }
  } 

  const approveCdob = async(certNumber, certTd, tp, cdobIpfs, pbfName) => {

    const tpMap = {
      "Obat Lain" : 0n,
      "Cold Chain Product (CCP)" : 1n
    }; 
    
    console.log(tp);
    
    try {
      const approveCt = await contracts.certificateManager.approveCdob([certNumber, certTd, userdata.name, userdata.instanceName, userdata.address], cdobIpfs, tpMap[tp])
      
      if(approveCt){
        updateCdobFb(pbfName, tpMap[tp], approveCt.hash, true)
        
        MySwal.update({
          title: "Memproses transaksi...",
          text: "Proses transaksi sedang berlangsung, harap tunggu. ⏳"
        });
      }
      
      contracts.certificateManager.once('CertApproved',  (bpomInstance, bpomAddr, tipePermohonan, cdobNumber, timestampApprove) => {
        handleEventCdob("Disetujui", bpomInstance, bpomAddr, tipePermohonan, cdobNumber, timestampApprove, approveCt.hash);
      });
    } catch (error) {
      errAlert(error, "Can't Approve CDOB")
    }
  } 
  
  const rejectCdob = async(cdobId, rejectMsg, tipePermohonan, pbfName) => {
    console.log(rejectMsg, tipePermohonan);

    try {
      const rejectCt = await contracts.certificateManager.rejectCdob( cdobId, rejectMsg, userdata.name, userdata.instanceName, tipePermohonan);

      if(rejectCt){
        updateCdobFb(pbfName, tipePermohonan, rejectCt.hash, false)

        MySwal.update({
          title: "Memproses transaksi...",
          text: "Proses transaksi sedang berlangsung, harap tunggu. ⏳"
        });
      }

      contracts.certificateManager.once("CertRejected", (_instanceName, _instanceAddr, _tipePermohonan, timestampRejected, _rejectMsg) => {
        handleEventCdob( "Tidak Disetujui", _instanceAddr, _instanceName, _tipePermohonan, _rejectMsg, timestampRejected, rejectCt.hash);
      });
    } catch (error) {
      errAlert(error, `Gagal menolak pengajuan CDOB ${pbfName} dengan Tipe Permohonan ${tipePermohonan}`)
    }
  }

  const updateCdobFb = async (instanceName, tipePermohonan, cdobHash, status) => {
    const tpMap = {
      0n: 'ObatLain',
      1n: 'CCP'
    }
    
    try {
      const documentId = `cdob-lists`; 
      const pbfDocRef = doc(db, instanceName, documentId);

      if(status){
        await updateDoc(pbfDocRef, {
          [`${tpMap[tipePermohonan]}.approvedCdob`]: cdobHash,
        [`${tpMap[tipePermohonan]}.approvedTimestamp`]: Date.now(),
        }); 
      } else {
        await updateDoc(pbfDocRef, {
          [`${tpMap[tipePermohonan]}.rejectedCdob`]: cdobHash,
        [`${tpMap[tipePermohonan]}.rejectedTimestamp`]: Date.now(),
        });  

      }
  
    } catch (err) {
      console.error("Error writing CDOB data:", err);
    }
  };

  return (
    <>
      <div id="CpotbPage" className='Layout-Menu layout-page'>
        <div className="title-menu">
          <h1>Data Pengajuan Sertifikat CDOB</h1>
          <p>Dikelola oleh {userdata.instanceName}</p>
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
    confirmButtonText: 'Coba Lagi',
    didOpen: () => {
      const actions = Swal.getActions();
      actions.style.justifyContent = "center";
    }
  });

  console.error(customMsg)
  console.error(errorObject);
}


export default CdobApprove;