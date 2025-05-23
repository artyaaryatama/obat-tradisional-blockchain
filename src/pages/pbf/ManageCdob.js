import { useEffect, useState } from 'react';
import { BrowserProvider, Contract } from "ethers";
import contractData from '../../auto-artifacts/deployments.json';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc, setDoc  } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import "../../styles/MainLayout.scss"
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import './../../styles/SweetAlert.scss';
import JenisSediaanTooltip from '../../components/TooltipJenisSediaan';
import Loader from '../../components/Loader';
import imgSad from '../../assets/images/3.png'

const MySwal = withReactContent(Swal);

function ManageCdob() {
  const [contracts, setContracts] = useState(null);
  const navigate = useNavigate();
  const userdata = JSON.parse(sessionStorage.getItem('userdata'));
  const [dataCdob, setDataCdob] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fadeClass, setFadeClass] = useState('fade-in');
  const [fadeOutLoader, setFadeOutLoader] = useState(false);

  const tipePermohonanMap = {
    0: "Obat Lain",
    1: "Cold Chain Product (CCP)"
  };

  const statusMap = {
    0: "Dalam Proses Pengajuan",
    1: "Disetujui",
    2: "Tidak Disetujui",
    3: "Pengajuan Ulang",
    4: "Sertifikat Kadaluarsa",
    5: "Pengajuan Perpanjangan CDOB",
    6: "Penyetujuan Perpanjangan CDOB",
    7: "Pengajuan Perpanjangan CDOB Ditolak",
    8: "Pengajuan Perpanjangan Ulang CDOB"
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
    document.title = "CDOB List - PBF"; 
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
            let cdobNumber = item[1] || 'Belum Tersedia'; 

            if (item[4] === 2n) {
              cdobNumber = null;
            }
          
            let statusCert;
            
            if (item[4] === 1n || item[4] === 6n) {
              if (Math.floor(Date.now() / 1000) > Number(item[6])) {
                statusCert = statusMap[4n];  
              } else {
                statusCert = statusMap[item[4]]; 
              }
            } else if (item[4] === 5n) {
              statusCert = statusMap[5];
            } else {
              statusCert = statusMap[item[4]];
            }

            return {
              cdobId: cdobId,
              cdobNumber: cdobNumber,
              pbfName: item[2],
              tipePermohonan: tipePermohonanMap[item[3]],
              status: statusCert
            };
          })

          setDataCdob(reconstructedData);
  
        } catch (error) {
          console.error("Error loading data: ", error);
        } finally {
          setLoading(false);
        }
      }
    };
  
    loadData();
  }, [contracts]);

  useEffect(() => {
    if (!loading) {
      setFadeOutLoader(true);
  
      setTimeout(() => {
        setFadeClass('fade-in');
      }, 400);
    }
  }, [loading]);

  const handleEventCdob = (pbfAddr, timestamp, txHash, certNumber) => {

    const formattedTimestamp = new Date(Number(timestamp) * 1000).toLocaleDateString('id-ID', options)
  
    MySwal.fire({
      title: "Permintaan perpanjangan CDOB terkirim",
      html: (
        <div className='form-swal event'>
          <ul className='klaim'>
            <li className="label">
              <p>Nomor CDOB</p> 
            </li>
            <li className="input">
              <p>{certNumber}</p> 
            </li>
          </ul>
          <ul>
            <li className="label">
              <p>Nama Instansi PBF</p> 
            </li>
            <li className="input">
              <p>{userdata.instanceName}</p> 
            </li>
          </ul>
          <ul className='klaim'>
            <li className="label">
              <p>Alamat Akun PBF (Pengguna)</p> 
            </li>
            <li className="input">
              <p>{pbfAddr}</p> 
            </li>
          </ul>
          <ul>
            <li className="label">
              <p>Tanggal Dikirim Perpanjangan</p> 
            </li>
            <li className="input">
              <p>{formattedTimestamp}</p> 
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
  
  const getDetailCdob = async (id) => {
    
    console.log(id);

    try {
      const detailCdobCt = await contracts.certificateManager.getCdobDetails(id);
      const detailUserPbfCt = await contracts.roleManager.getUserData(userdata.address);

      const [certDetails, cdobDetails, docsAdministrasi, docsTeknis, docsReSertifikasi] = detailCdobCt; 
      const [surat_permohonan_cdob, bukti_pembayaran_pajak] = docsAdministrasi;
      const [surat_izin_cdob, denah_pbf, struktur_organisasi, daftar_personalia, daftar_peralatan, eksekutif_quality_management, surat_izin_apoteker, dokumen_self_assessment] = docsTeknis
      const [cdobId, cdobNumber, tipePermohonan] = cdobDetails
      const [status, timestampRequest, timestampApprove, timestampRejected, timestampRenewRequest, timestampExpired, timestampExtendRequest, timestampExtendApprove,timestampExtendReject, timestampExtendRenew, pbf, bpom, cdobIpfs] = certDetails
;

      const rejectMsg = await contracts.certificateManager.getRejectMsgCdob(id);
      console.log(2);

      let statusCert;
      if (status=== 1n || status=== 6n) {
        if (Math.floor(Date.now() / 1000) > Number(timestampExpired)) {
          statusCert = statusMap[4n];  
        } else {
          statusCert = statusMap[status]; 
        }
      } else if (status=== 5n) {
        statusCert = statusMap[5];
      } else {
        statusCert = statusMap[status];
      }

      let detailCdob;

      if(docsReSertifikasi[0] !== ''){
        detailCdob = {
         cdobId: cdobId,
         cdobNumber: cdobNumber ? cdobNumber : "-",
         pbfUserName: pbf[0],
         pbfName: pbf[1],
         pbfAddr: pbf[2],
         tipePermohonan: tipePermohonanMap[tipePermohonan], 
         status: statusCert, 
         timestampRequest: new Date(Number(timestampRequest) * 1000).toLocaleDateString('id-ID', options),
         timestampApprove: Number(timestampApprove) > 0 ? new Date(Number(timestampApprove) * 1000).toLocaleDateString('id-ID', options): "-",
         timestampRenewRequest: parseInt(timestampRenewRequest) !== 0 ? new Date(Number(timestampRenewRequest) * 1000).toLocaleDateString('id-ID', options): "-",
         timestampRejected: parseInt(timestampRejected) !== 0 ? new Date(Number(timestampRejected) * 1000).toLocaleDateString('id-ID', options): "-",
         timestampExpired: parseInt(timestampExpired) !== 0 ? new Date(Number(timestampExpired) * 1000).toLocaleDateString('id-ID', options): "-",
         timestampExtendRequest: parseInt(timestampExtendRequest) !== 0 ? new Date(Number(timestampExtendRequest) * 1000).toLocaleDateString('id-ID', options): "-",
         timestampExtendApprove: parseInt(timestampExtendApprove) !== 0 ? new Date(Number(timestampExtendApprove) * 1000).toLocaleDateString('id-ID', options): "-",
         timestampExtendReject: parseInt(timestampExtendReject) !== 0 ? new Date(Number(timestampExtendReject) * 1000).toLocaleDateString('id-ID', options): "-",
         timestampExtendRenew: parseInt(timestampExtendRenew) !== 0 ? new Date(Number(timestampExtendRenew) * 1000).toLocaleDateString('id-ID', options): "-",
         bpomName : bpom[0] ? bpom[0] : "-",
         bpomInstance: bpom[1] ? bpom[1] : "-",
         bpomAddr: bpom[2] === "0x0000000000000000000000000000000000000000" ? "-" : bpom[2],
         cdobIpfs: cdobIpfs,
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
         }, 
         docsResertifikasi: {
          suratPernyataanPimpinan :docsReSertifikasi[0],
          dokumenInspeksiDiri : docsReSertifikasi[1],
          dokumenPerbaikan : docsReSertifikasi[2]
         }
       };

      } else {
        detailCdob = {
         cdobId: cdobId,
         cdobNumber: cdobNumber ? cdobNumber : "-",
         pbfUserName: pbf[0],
         pbfName: pbf[1],
         pbfAddr: pbf[2],
         tipePermohonan: tipePermohonanMap[tipePermohonan], 
         status: statusCert, 
         timestampRequest: new Date(Number(timestampRequest) * 1000).toLocaleDateString('id-ID', options),
         timestampApprove: Number(timestampApprove) > 0 ? new Date(Number(timestampApprove) * 1000).toLocaleDateString('id-ID', options): "-",
         timestampRenewRequest: parseInt(timestampRenewRequest) !== 0 ? new Date(Number(timestampRenewRequest) * 1000).toLocaleDateString('id-ID', options): "-",
         timestampRejected: parseInt(timestampRejected) !== 0 ? new Date(Number(timestampRejected) * 1000).toLocaleDateString('id-ID', options): "-",
         timestampExpired: parseInt(timestampExpired) !== 0 ? new Date(Number(timestampExpired) * 1000).toLocaleDateString('id-ID', options): "-",
         timestampExtendRequest: parseInt(timestampExtendRequest) !== 0 ? new Date(Number(timestampExtendRequest) * 1000).toLocaleDateString('id-ID', options): "-",
         timestampExtendApprove: parseInt(timestampExtendApprove) !== 0 ? new Date(Number(timestampExtendApprove) * 1000).toLocaleDateString('id-ID', options): "-",
         timestampExtendReject: parseInt(timestampExtendReject) !== 0 ? new Date(Number(timestampExtendReject) * 1000).toLocaleDateString('id-ID', options): "-",
         timestampExtendRenew: parseInt(timestampExtendRenew) !== 0 ? new Date(Number(timestampExtendRenew) * 1000).toLocaleDateString('id-ID', options): "-",
         bpomName : bpom[0] ? bpom[0] : "-",
         bpomInstance: bpom[1] ? bpom[1] : "-",
         bpomAddr: bpom[2] === "0x0000000000000000000000000000000000000000" ? "-" : bpom[2],
         cdobIpfs: cdobIpfs,
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

      }


      console.log(detailCdob);

      if(detailCdob.status === 'Tidak Disetujui'){

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
          showCloseButton: true,
          confirmButtonText: 'Pengajuan Ulang CDOB',
          customClass: {
            htmlContainer: 'scrollable-modal'
          },
        }).then((result) => {
          if (result.isConfirmed) {
            sessionStorage.setItem("idCdob", JSON.stringify(id))
            navigate('/renew-request-cdob');
          }           
        })

      } else if(detailCdob.status === 'Sertifikat Kadaluarsa') {
        MySwal.fire({
          title: "Detail Sertifikat CDOB",
          html: (
            <div className='form-swal order'>
              <div className="row2">
                <div className="col">
                  <ul className='status'>
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
                      <a
                        href={`http://localhost:3000/public/certificate/${detailCdob.cdobIpfs}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {detailCdob.cdobNumber}
                        <i class="fa-solid fa-arrow-up-right-from-square"></i>
                      </a>
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
                      <p>CDOB Berlaku Sampai</p> 
                    </li>
                    <li className="input">
                      <p>{Math.floor(Date.now() / 1000) > Number(timestampExpired)
                        ? `${detailCdob.timestampExpired} (Kadaluarsa)`
                        : detailCdob.timestampExpired}
                      </p> 
                    </li>
                  </ul>
                  <ul>
                    <li className="label">
                      <p>Tanggal Pengajuan Perpanjangan CDOB</p> 
                    </li>
                    <li className="input">
                      <p>{detailCdob.timestampExtendRequest}</p> 
                    </li>
                  </ul>
                  <ul>
                    <li className="label">
                      <p>Tanggal Penyetujuan Perpanjangan CDOB</p> 
                    </li>
                    <li className="input">
                      <p>{detailCdob.timestampExtendApprove}</p> 
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
  
                  <ul className='klaim'>
                    <li className="label">
                      <p>Alamat Akun PBF (Pengguna)</p> 
                    </li>
                    <li className="input">
                      <p>{detailCdob.pbfName}</p> 
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

                <div className='.row4'>
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


                  {
                    docsReSertifikasi[0] !== '' ?
                      <div className='col doku'>
                        <h5>Dokumen Re-sertifikasi</h5>
                        <ul>
                          <li className="label">
                            <p>Surat Pernyataan Pimpinan</p>
                          </li>
                          <li className="input">
                            <a
                              href={`http://localhost:8080/ipfs/${detailCdob.docsResertifikasi.suratPernyataanPimpinan}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Lihat Surat Pernyataan Pimpinan
                              <i className="fa-solid fa-arrow-up-right-from-square"></i>
                            </a>
                          </li>
                        </ul>
                        <ul>
                          <li className="label">
                            <p>Dokumen Inspeksi Diri</p>
                          </li>
                          <li className="input">
                            <a
                              href={`http://localhost:8080/ipfs/${detailCdob.docsResertifikasi.dokumenInspeksiDiri}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Lihat Dokumen Inspeksi Diri
                              <i className="fa-solid fa-arrow-up-right-from-square"></i>
                            </a>
                          </li>
                        </ul>
                        <ul>
                          <li className="label">
                            <p> Riwayat tindakan perbaikan dan pencegahan berdasarkan hasil pengawasan CDOB dalam 4 (empat) tahun terakhir.</p>
                          </li>
                          <li className="input">
                            <a
                              href={`http://localhost:8080/ipfs/${detailCdob.docsResertifikasi.dokumenPerbaikan}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Lihat Dokumen Riwayat Perbaikan
                              <i className="fa-solid fa-arrow-up-right-from-square"></i>
                            </a>
                          </li>
                        </ul>
                      </div>
                    : null
                  }
                </div>

                
              </div>
            
            </div>
          ),
          width: '1020',
          showCloseButton: true,
          showCancelButton: false,
          showConfirmButton: true,
          confirmButtonText: 'Perpanjangan Sertifkat'
        }).then((result) => {
          if(result.isConfirmed){
            const cdobData = {
              cdobId: id,
              cdobNumber: cdobNumber,
              cdobIpfs: cdobIpfs,
              extTimestamp: timestampExpired.toString(),
              tipePermohonan: detailCdob.tipePermohonan
            }
            sessionStorage.setItem("cdobDataExt", JSON.stringify(cdobData))
            navigate('/extend-request-cdob')

          }
        })
      } else if(detailCdob.status === 'Pengajuan Perpanjangan CDOB Ditolak') {
        MySwal.fire({
          title: "Detail Sertifikat CDOB",
          html: (
            <div className='form-swal order'>
              <div className="row2">
                <div className="col">
                  <ul className='status'>
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
                      <a
                        href={`http://localhost:3000/public/certificate/${detailCdob.cdobIpfs}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {detailCdob.cdobNumber}
                        <i class="fa-solid fa-arrow-up-right-from-square"></i>
                      </a>
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
                      <p>CDOB Berlaku Sampai</p> 
                    </li>
                    <li className="input">
                      <p>{Math.floor(Date.now() / 1000) > Number(timestampExpired)
                        ? `${detailCdob.timestampExpired} (Kadaluarsa)`
                        : detailCdob.timestampExpired}
                      </p> 
                    </li>
                  </ul>
                  <ul>
                    <li className="label">
                      <p>Tanggal Pengajuan Perpanjangan CDOB</p> 
                    </li>
                    <li className="input">
                      <p>{detailCdob.timestampExtendRequest}</p> 
                    </li>
                  </ul>
                  <ul>
                    <li className="label">
                      <p>Tanggal Penyetujuan Perpanjangan CDOB</p> 
                    </li>
                    <li className="input">
                      <p>{detailCdob.timestampExtendApprove}</p> 
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
  
                  <ul className='klaim'>
                    <li className="label">
                      <p>Alamat Akun PBF (Pengguna)</p> 
                    </li>
                    <li className="input">
                      <p>{detailCdob.pbfName}</p> 
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

                <div className='.row4'>
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


                  {
                    docsReSertifikasi[0] !== '' ?
                      <div className='col doku'>
                        <h5>Dokumen Re-sertifikasi</h5>
                        <ul>
                          <li className="label">
                            <p>Surat Pernyataan Pimpinan</p>
                          </li>
                          <li className="input">
                            <a
                              href={`http://localhost:8080/ipfs/${detailCdob.docsResertifikasi.suratPernyataanPimpinan}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Lihat Surat Pernyataan Pimpinan
                              <i className="fa-solid fa-arrow-up-right-from-square"></i>
                            </a>
                          </li>
                        </ul>
                        <ul>
                          <li className="label">
                            <p>Dokumen Inspeksi Diri</p>
                          </li>
                          <li className="input">
                            <a
                              href={`http://localhost:8080/ipfs/${detailCdob.docsResertifikasi.dokumenInspeksiDiri}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Lihat Dokumen Inspeksi Diri
                              <i className="fa-solid fa-arrow-up-right-from-square"></i>
                            </a>
                          </li>
                        </ul>
                        <ul>
                          <li className="label">
                            <p> Riwayat tindakan perbaikan dan pencegahan berdasarkan hasil pengawasan CDOB dalam 4 (empat) tahun terakhir.</p>
                          </li>
                          <li className="input">
                            <a
                              href={`http://localhost:8080/ipfs/${detailCdob.docsResertifikasi.dokumenPerbaikan}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Lihat Dokumen Riwayat Perbaikan
                              <i className="fa-solid fa-arrow-up-right-from-square"></i>
                            </a>
                          </li>
                        </ul>
                      </div>
                    : null
                  }
                </div>

                
              </div>
            
            </div>
          ),
          width: '1020',
          showCloseButton: true,
          showCancelButton: false,
          showConfirmButton: true,
          confirmButtonText: 'Pengajuan Ulang Perpanjangan CDOB'
        }).then((result) => {
          if(result.isConfirmed){
            const cdobData = {
              cdobId: id,
              cdobNumber: cdobNumber,
              cdobIpfs: cdobIpfs,
              extTimestamp: timestampExpired.toString(),
              tipePermohonan: detailCdob.tipePermohonan,
              rejectExtendMsg: rejectMsg[1]
            }
            sessionStorage.setItem("cdobDataExt", JSON.stringify(cdobData))
            navigate('/extend-renew-request-cdob')

          }
        })
      }  

      else { 
        MySwal.fire({
          title: "Detail Sertifikat CDOB",
          html: (
            <div className='form-swal order'>
              <div className="row2">
  
                <div className="col">
                  <ul className='status'>
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
                      {timestampApprove?
                        <a
                          href={`http://localhost:3000/public/certificate/${detailCdob.cdobIpfs}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {detailCdob.cdobNumber}
                          <i class="fa-solid fa-arrow-up-right-from-square"></i>
                        </a>
                      
                        : <p>{detailCdob.cdobNumber}</p>
                      }
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
                  {timestampApprove? 
                    <ul>
                      <li className="label">
                        <p>CDOB Berlaku Sampai</p> 
                      </li>
                      <li className="input">
                        <p>{Math.floor(Date.now() / 1000) > Number(timestampExpired)
                          ? `${detailCdob.timestampExpired} (Kadaluarsa)`
                          : detailCdob.timestampExpired}
                        </p> 
                      </li>
                    </ul>
                  
                : null}
                  {timestampApprove? 
                    <ul>
                      <li className="label">
                        <p>Tanggal Pengajuan Perpanjangan CDOB</p> 
                      </li>
                      <li className="input">
                        <p>{detailCdob.timestampExtendRequest}</p> 
                      </li>
                    </ul>

                    : null
                  }
                  {rejectMsg[1]? 
                    <ul>
                      <li className="label">
                        <p>Tanggal Penolakan Pengajuan Perpanjangan CDOB</p> 
                      </li>
                      <li className="input">
                        <p>{detailCdob.timestampExtendReject}</p> 
                      </li>
                    </ul>
                    : null
                  }
                  {rejectMsg[1]? 
                    <ul className='rejectMsg klaim'>
                      <li className="label">
                        <p>Alasan Penolakan Perpanjangan</p> 
                        </li>
                      <li className="input">
                      <p>{rejectMsg[1]}</p> 
                      </li>
                    </ul> 
                    : null
                  }
                  {rejectMsg[1]? 
                    <ul>
                      <li className="label">
                        <p>Tanggal Pengajuan Ulang Perpanjangan CPOTB</p> 
                      </li>
                      <li className="input">
                        <p>{detailCdob.timestampExtendRenew}</p> 
                      </li>
                    </ul>
                    : null
                  }
                  {timestampApprove? 
                    <ul>
                      <li className="label">
                        <p>Tanggal Penyetujuan Perpanjangan CDOB</p> 
                      </li>
                      <li className="input">
                        <p>{detailCdob.timestampExtendApprove}</p> 
                      </li>
                    </ul>

                    : null
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
                <div className='.row4'>
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
                  {
                    docsReSertifikasi[0] !== '' ?
                      <div className='col doku'>
                        <h5>Dokumen Re-sertifikasi</h5>
                        <ul>
                          <li className="label">
                            <p>Surat Pernyataan Pimpinan</p>
                          </li>
                          <li className="input">
                            <a
                              href={`http://localhost:8080/ipfs/${detailCdob.docsResertifikasi.suratPernyataanPimpinan}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Lihat Surat Pernyataan Pimpinan
                              <i className="fa-solid fa-arrow-up-right-from-square"></i>
                            </a>
                          </li>
                        </ul>
                        <ul>
                          <li className="label">
                            <p>Dokumen Inspeksi Diri</p>
                          </li>
                          <li className="input">
                            <a
                              href={`http://localhost:8080/ipfs/${detailCdob.docsResertifikasi.dokumenInspeksiDiri}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Lihat Dokumen Inspeksi Diri
                              <i className="fa-solid fa-arrow-up-right-from-square"></i>
                            </a>
                          </li>
                        </ul>
                        <ul>
                          <li className="label">
                            <p> Riwayat tindakan perbaikan dan pencegahan berdasarkan hasil pengawasan CDOB dalam 4 (empat) tahun terakhir.</p>
                          </li>
                          <li className="input">
                            <a
                              href={`http://localhost:8080/ipfs/${detailCdob.docsResertifikasi.dokumenPerbaikan}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Lihat Dokumen Riwayat Perbaikan
                              <i className="fa-solid fa-arrow-up-right-from-square"></i>
                            </a>
                          </li>
                        </ul>
                      </div>
                    : null
                  }
                </div>
              </div>
            </div>
          ),
          width: '1020',
          showCloseButton: true,
          showCancelButton: false,
          showConfirmButton: false,
          customClass: {
            htmlContainer: 'scrollable-modal'
          },
        })

      }

    } catch (e) {
      errAlert(e, "Can't retrieve data")
    }
  }

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

          <div className="fade-container">
            <div className={`fade-layer loader-layer ${fadeOutLoader ? 'fade-out' : 'fade-in'}`}>
              <Loader />
            </div>

            <div className={`fade-layer content-layer ${!loading ? 'fade-in' : 'fade-out'}`}>
              {dataCdob.length > 0 ? (
                <ul>
                {dataCdob.map((item, index) => ( 
                  <li key={index}>
                    <button className='title' onClick={() => getDetailCdob(item.cdobId)}>{item.tipePermohonan}</button>
                    <p>
                      { item.cdobNumber !== null ? `CDOB Number: ${item.cdobNumber}` : "Nomor CDOB: Not Available"}
                    </p>
                    <button className={`statusPengajuan ${item.status}`}>
                      {item.status}
                    </button>
                  </li>
                ))}
              </ul>
              ) : (
                <div className="image">
                  <img src={imgSad}/>
                  <p className='small'>Maaf, belum ada data sertifikat yang tersedia.</p>
                </div>
              )}
            </div>
          </div>

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

export default ManageCdob;