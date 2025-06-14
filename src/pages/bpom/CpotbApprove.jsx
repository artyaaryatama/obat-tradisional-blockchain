import { useEffect, useState } from 'react';
import { BrowserProvider, Contract } from "ethers";
import contractData from '../../auto-artifacts/deployments.json';
import { useNavigate } from 'react-router-dom';
import { create } from 'ipfs-http-client';
import { doc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig"; 
import "../../styles/MainLayout.scss";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import './../../styles/SweetAlert.scss';
import JenisSediaanTooltip from '../../components/TooltipJenisSediaan';
import Loader from '../../components/Loader';
import imgSad from '../../assets/images/3.png'

const MySwal = withReactContent(Swal);
const client = create({ url: 'http://127.0.0.1:5001/api/v0' });

function CpotbApprove() {

  const navigate = useNavigate();
  const [contracts, setContracts] = useState(null);
  const [dataCpotb, setDataCpotb] = useState([])
  const userdata = JSON.parse(sessionStorage.getItem('userdata'));
  const [loading, setLoading] = useState(true);
  const [fadeClass, setFadeClass] = useState('fade-in');
  const [fadeOutLoader, setFadeOutLoader] = useState(false);

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
    0: "Dalam Proses Pengajuan",
    1: "Disetujui",
    2: "Tidak Disetujui",
    3: "Pengajuan Ulang",
    4: "Sertifikat Kadaluarsa",
    5: "Pengajuan Perpanjangan CPOTB",
    6: "Perpanjangan CPOTB",
    7: "Pengajuan Perpanjangan CPOTB Ditolak",
    8: "Pengajuan Perpanjangan Ulang CPOTB"
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
    document.title = "CPOTB List - BPOM"; 
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
            roleManager: RoleManager,
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
      window.ethereum.once("accountsChanged", () => {
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
          const listAllCpotb = await contracts.certificateManager.getAllCpotb()

          console.log(listAllCpotb);
          
          const reconstructedData = listAllCpotb.map((item) => {
            const cpotbId = item[0]; 
            
            let cpotbNumber = item[1] || 'Belum Tersedia'; 
            
            if (item[4] === 2n) {
              cpotbNumber = null;
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
          
            console.log(statusCert);
            return {
              cpotbId: cpotbId,
              cpotbNumber: cpotbNumber,
              factoryInstance: item[2],
              jenisSediaan: jenisSediaanMap[item[3]],
              status: statusCert
            };
          })
          
          setDataCpotb(reconstructedData);
          console.log(reconstructedData);

        } catch (e) {
          errAlert(e, "Can't Get The Data")
        } finally{
          setLoading(false);
        }
        
      }
    }

    getAllCpotb()
  }, [contracts])

  useEffect(() => {
    if (!loading) {
      setFadeOutLoader(true);
  
      setTimeout(() => {
        setFadeClass('fade-in');
      }, 400);
    }
  }, [loading]);

  const handleEventCpotb = (status, jenisSediaan, detail, timestamp, txHash, certNumberReject) => {

    const formattedTimestamp = new Date(Number(timestamp) * 1000).toLocaleDateString('id-ID', options)
    
    // detail can be the cpotb number or rejectMsg
    if(status === 'Disetujui'){
      MySwal.fire({
        title: "Pengajuan CPOTB disetujui",
        html: (
          <div className='form-swal event'>
            <ul>
              <li className="label">
                <p>Nomor CPOTB</p> 
              </li>
              <li className="input">
                <p>{detail}</p> 
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
                <p>Jenis Sediaan</p> 
              </li>
              <li className="input">
                <p>{jenisSediaan}</p> 
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
    } else if(status === 'Perpanjangan'){
      MySwal.fire({
        title: "Perpanjangan CPOTB disetujui",
        html: (
          <div className='form-swal event'>
            <ul className='klaim'>
              <li className="label">
                <p>Nomor CPOTB</p> 
              </li>
              <li className="input">
                <p>{detail}</p> 
              </li>
            </ul>
            <ul className='klaim'>
              <li className="label">
                <p>Jenis Sediaan</p> 
              </li>
              <li className="input">
                <p>{jenisSediaan}</p> 
              </li>
            </ul>
            <ul>
              <li className="label">
                <p>Tanggal Diperpanjang</p> 
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

    } else if(status === 'Tolak Perpanjangan'){
      MySwal.fire({
        title: "Perpanjangan CPOTB Ditolak",
        html: (
          <div className='form-swal event'>
            <ul className='klaim'>
              <li className="label">
                <p>Nomor CPOTB</p> 
              </li>
              <li className="input">
                <p>{certNumberReject}</p> 
              </li>
            </ul>
            <ul className='klaim'>
              <li className="label">
                <p>Jenis Sediaan</p> 
              </li>
              <li className="input">
                <p>{jenisSediaan}</p> 
              </li>
            </ul>
            <ul>
              <li className="label">
                <p>Tanggal perpanjangan ditolak</p> 
              </li>
              <li className="input">
                <p>{formattedTimestamp}</p> 
              </li>
            </ul>
            <ul>
              <li className="label">
                <p>Alasan penolakan perpanjangan</p> 
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
    else {
      MySwal.fire({
        title: "Pengajuan CPOTB Ditolak",
        html: (
          <div className='form-swal event'>
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
                <p>{jenisSediaan}</p> 
              </li>
            </ul>
            <ul className='rejectMsg klaim'>
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
  
  const getDetailCpotb = async (id) => {
    
    console.log(id); 
    
    try {
      const detailCpotbCt = await contracts.certificateManager.getCpotbDetails(id);
      let typeFactory;
      
      const [certDetails, cpotbDetails, docsAdministrasi, docsTeknis, docsReSertifikasi] = detailCpotbCt; 
      const [suratPermohonan, buktiPembayaranNegaraBukanPajak, suratKomitmen] = docsAdministrasi;
      const [denahBangunan, sistemMutu] = docsTeknis
      const [cpotbId, cpotbNumber, jenisSediaan, factoryType] = cpotbDetails;
      
      const [status, timestampRequest, timestampApprove, timestampRejected, timestampRenewRequest, timestampExpired, timestampExtendRequest, timestampExtendApprove, timestampExtendReject, timestampExtendRenew, sender, bpom, cpotbIpfs] = certDetails;
      
      console.log(sender);
      const detailUserFactoryCt = await contracts.roleManager.getUserData(sender[2]);

      if (factoryType === "UMOT") {
        typeFactory = "Usaha Mikro Obat Tradisional (UMOT)"
      } else if (factoryType === "UKOT") {
        typeFactory = "Usaha Kecil Obat Tradisional (UKOT)"
      } else if (factoryType === "IOT") {
        typeFactory = "Industri Obat Tradisional (IOT)"
      }

      let statusCert;
      if (status=== 1n || status=== 6n) {
        if (Math.floor(Date.now() / 1000) > Number(timestampExpired)) {
          statusCert = statusMap[4n];  
          console.log('tes');
        } else {
          statusCert = statusMap[status]; 
        }
      } else if (status=== 5n) {
        statusCert = statusMap[5];
      } else {
        statusCert = statusMap[status];
      }

      console.log(status)
      console.log(statusCert)

      let detailCpotb
      if(docsReSertifikasi[0] !== '') {
        detailCpotb = {
          cpotbId: cpotbId,
          cpotbNumber: cpotbNumber ? cpotbNumber : "-",
          factoryUserName: sender[0],
          factoryAddr: sender[2],
          factoryInstanceName: sender[1],
          jenisSediaan: jenisSediaanMap[jenisSediaan], 
          status: statusCert, 
          timestampRequest: new Date(Number(timestampRequest) * 1000).toLocaleDateString('id-ID', options),
          timestampApprove: Number(timestampApprove) !== 0 ? new Date(Number(timestampApprove) * 1000).toLocaleDateString('id-ID', options): "-",
          timestampRenewRequest: parseInt(timestampRenewRequest) !== 0 ? new Date(Number(timestampRenewRequest) * 1000).toLocaleDateString('id-ID', options): "-",
          timestampRejected: parseInt(timestampRejected) !== 0 ? new Date(Number(timestampRejected) * 1000).toLocaleDateString('id-ID', options): "-",
          timestampExpired: parseInt(timestampExpired) !== 0 ? new Date(Number(timestampExpired) * 1000).toLocaleDateString('id-ID', options): "-",
          timestampExtendRequest: parseInt(timestampExtendRequest) !== 0 ? new Date(Number(timestampExtendRequest) * 1000).toLocaleDateString('id-ID', options): "-",
          timestampExtendReject: parseInt(timestampExtendReject) !== 0 ? new Date(Number(timestampExtendReject) * 1000).toLocaleDateString('id-ID', options): "-",
          timestampExtendRenew: parseInt(timestampExtendRenew) !== 0 ? new Date(Number(timestampExtendRenew) * 1000).toLocaleDateString('id-ID', options): "-",
          timestampExtendApprove: parseInt(timestampExtendApprove) !== 0 ? new Date(Number(timestampExtendApprove) * 1000).toLocaleDateString('id-ID', options): "-",
          bpomName : bpom[0] ? bpom[0] : "-",
          bpomInstance: bpom[1] ? bpom[1] : "-",
          bpomAddr: bpom[2] === "0x0000000000000000000000000000000000000000" ? "-" : bpom[2],
          cpotbIpfs: cpotbIpfs ? cpotbIpfs : "-",
          factoryType: typeFactory,
          factoryNIB: detailUserFactoryCt[6],
          factoryNPWP: detailUserFactoryCt[7],
          dokumenAdministrasi: {
            suratPermohonan: docsReSertifikasi[0],
            buktiPembayaranNegaraBukanPajak: docsReSertifikasi[1],
            suratKomitmen: suratKomitmen
          },
          dokumenTeknis: {
            denahBangunan: docsReSertifikasi[2],
            sistemMutu: docsReSertifikasi[3]
          },
          dokumenReSertifikasi: {
            oldCpotbIpfs: docsReSertifikasi[4],
            dokumenCapa: docsReSertifikasi[5]
          }
        }
      } else {
        detailCpotb = {
          cpotbId: cpotbId,
          cpotbNumber: cpotbNumber ? cpotbNumber : "-",
          factoryUserName: sender[0],
          factoryAddr: sender[2],
          factoryInstanceName: sender[1],
          jenisSediaan: jenisSediaanMap[jenisSediaan], 
          status: statusCert, 
          timestampRequest: new Date(Number(timestampRequest) * 1000).toLocaleDateString('id-ID', options),
          timestampApprove: Number(timestampApprove) !== 0 ? new Date(Number(timestampApprove) * 1000).toLocaleDateString('id-ID', options): "-",
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
          cpotbIpfs: cpotbIpfs ? cpotbIpfs : "-",
          factoryType: typeFactory,
          factoryNIB: detailUserFactoryCt[6],
          factoryNPWP: detailUserFactoryCt[7],
          dokumenAdministrasi: {
            suratPermohonan: suratPermohonan,
            buktiPembayaranNegaraBukanPajak: buktiPembayaranNegaraBukanPajak,
            suratKomitmen: suratKomitmen
          },
          dokumenTeknis: {
            denahBangunan: denahBangunan,
            sistemMutu: sistemMutu,
          }
        }
      }

      console.log(detailCpotb)

      const eligbleFactory = checkEligible(factoryType, parseInt(jenisSediaan));
      console.log(eligbleFactory);

      const rejectMsg = await contracts.certificateManager.getRejectMsgCpotb(id);
      console.log(rejectMsg);

      if(detailCpotb.status === 'Disetujui' || detailCpotb.status === 'Perpanjangan CPOTB' || detailCpotb.status === 'Pengajuan Perpanjangan CPOTB Ditolak'  || detailCpotb.status === 'Sertifikat Kadaluarsa'){
        MySwal.fire({
          title: "Detail Sertifikat CPOTB",
          html: (
            <div className='form-swal detail-modal'>
              <div className="row6">
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
                      <a
                        href={`http://localhost:3000/public/certificate/${detailCpotb.cpotbIpfs}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {detailCpotb.cpotbNumber}
                        <i className="fa-solid fa-arrow-up-right-from-square"></i>
                      </a>
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
                    : null
                  }
                  {rejectMsg[0]? 
                    <ul className='rejectMsg klaim'>
                      <li className="label">
                        <p>Alasan Penolakan</p> 
                      </li>
                      <li className="input">
                        <p>{rejectMsg[0]}</p> 
                      </li>
                    </ul> 
                    : null
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
                    : null
                  }
  
                  <ul>
                    <li className="label">
                      <p>Tanggal Disertifikasi</p> 
                    </li>
                    <li className="input">
                      <p>{detailCpotb.timestampApprove}</p> 
                    </li>
                  </ul>
                  <ul>
                    <li className="label">
                      <p>CPOTB Berlaku Sampai</p> 
                    </li>
                    <li className="input">
                      <p>{Math.floor(Date.now() / 1000) > Number(timestampExpired)
                        ? `${detailCpotb.timestampExpired} (Kadaluarsa)`
                        : detailCpotb.timestampExpired}
                      </p> 
                    </li>
                  </ul>
                  <ul>
                    <li className="label">
                      <p>Tanggal Pengajuan Perpanjangan CPOTB</p> 
                    </li>
                    <li className="input">
                      <p>{detailCpotb.timestampExtendRequest}</p> 
                    </li>
                  </ul>
                  <ul>
                    <li className="label">
                      <p>Tanggal Penyetujuan Perpanjangan CPOTB</p> 
                    </li>
                    <li className="input">
                      <p>{detailCpotb.timestampExtendApprove}</p> 
                    </li>
                  </ul>
                  <ul>
                    <li className="label">
                      <p>Nama Instansi Pabrik</p>
                    </li>
                    <li className="input">
                      <p>{detailCpotb.factoryInstanceName} </p>
                    </li>
                  </ul>

                  <ul className='klaim'>
                    <li className="label">
                      <p>Alamat Akun Pabrik (Pengguna)</p> 
                    </li>
                    <li className="input">
                      <p>{detailCpotb.factoryAddr}</p> 
                    </li>
                  </ul>
  
                  <ul>
                    <li className="label">
                      <p>Nama Instansi BPOM</p> 
                    </li>
                    <li className="input">
                      <p>{detailCpotb.bpomInstance}</p> 
                    </li>
                  </ul>
  
                  <ul className='klaim'>
                    <li className="label">
                      <p>Alamat Akun BPOM (Pengguna)</p> 
                    </li>
                    <li className="input">
                      <p>{detailCpotb.bpomAddr}</p> 
                    </li>
                  </ul>

                </div> 
                  <div className='row4'>
                    <div className='col doku'>
                      <h5>Dokumen Administrasi</h5>
                      <ul>
                        <li className="label">
                          <p>Surat Permohonan CPOTB</p>
                        </li>
                        <li className="input">
                          <a
                            href={`http://localhost:8080/ipfs/${detailCpotb.dokumenAdministrasi.suratPermohonan}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Lihat Surat Permohonan CPOTB
                            <i className="fa-solid fa-arrow-up-right-from-square"></i>
                          </a>
                        </li>
                      </ul>
                      <ul>
                        <li className="label">
                          <p>Bukti Pembayaran Negara Bukan Pajak</p>
                        </li>
                        <li className="input">
                          <a
                            href={`http://localhost:8080/ipfs/${detailCpotb.dokumenAdministrasi.buktiPembayaranNegaraBukanPajak}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Lihat Bukti Pembayaran Negara Bukan Pajak
                            <i className="fa-solid fa-arrow-up-right-from-square"></i>
                          </a>
                        </li>
                      </ul>
                      <ul>
                        <li className="label">
                          <p>Surat Pernyataan Komitmen</p>
                        </li>
                        <li className="input">
                          <a
                            href={`http://localhost:8080/ipfs/${detailCpotb.dokumenAdministrasi.suratKomitmen}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Lihat Surat Pernyataan Komitmen
                            <i className="fa-solid fa-arrow-up-right-from-square"></i>
                          </a>
                        </li>
                      </ul>
                      <h5>Dokumen Teknis</h5>
                      <ul>
                        <li className="label">
                          <p>Denah Bangunan Pabrik</p>
                        </li>
                        <li className="input">
                          <a
                            href={`http://localhost:8080/ipfs/${detailCpotb.dokumenTeknis.denahBangunan}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Lihat Denah Bangunan Pabrik
                            <i className="fa-solid fa-arrow-up-right-from-square"></i>
                          </a>
                        </li>
                      </ul>
                      <ul>
                        <li className="label">
                          <p>Dokumen Sistem Mutu CPOTB</p>
                        </li>
                        <li className="input">
                          <a
                            href={`http://localhost:8080/ipfs/${detailCpotb.dokumenTeknis.sistemMutu}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Lihat Dokumen Sistem Mutu CPOTB
                            <i className="fa-solid fa-arrow-up-right-from-square"></i>
                          </a>
                        </li>
                      </ul>
                    </div>

                    {
                      docsReSertifikasi[0] !== ''? 
                      <div className='col doku'>
                        <h5>Dokumen Re-Sertifikasi CPOTB</h5>
                        <ul>
                          <li className="label">
                            <p>Surat Permohonan CPOTB</p>
                          </li>
                          <li className="input">
                            <a
                              href={`http://localhost:8080/ipfs/${detailCpotb.dokumenAdministrasi.suratPermohonan}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Lihat Surat Permohonan CPOTB
                              <i className="fa-solid fa-arrow-up-right-from-square"></i>
                            </a>
                          </li>
                        </ul>
                        <ul>
                          <li className="label">
                            <p>Bukti Pembayaran Negara Bukan Pajak</p>
                          </li>
                          <li className="input">
                            <a
                              href={`http://localhost:8080/ipfs/${detailCpotb.dokumenAdministrasi.buktiPembayaranNegaraBukanPajak}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Lihat Bukti Pembayaran Negara Bukan Pajak
                              <i className="fa-solid fa-arrow-up-right-from-square"></i>
                            </a>
                          </li>
                        </ul>
                        <ul>
                          <li className="label">
                            <p>Denah Bangunan Pabrik</p>
                          </li>
                          <li className="input">
                            <a
                              href={`http://localhost:8080/ipfs/${detailCpotb.dokumenTeknis.denahBangunan}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Lihat Denah Bangunan Pabrik
                              <i className="fa-solid fa-arrow-up-right-from-square"></i>
                            </a>
                          </li>
                        </ul>
                        <ul>
                          <li className="label">
                            <p>Dokumen Sistem Mutu CPOTB</p>
                          </li>
                          <li className="input">
                            <a
                              href={`http://localhost:8080/ipfs/${detailCpotb.dokumenTeknis.sistemMutu}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Lihat Dokumen Sistem Mutu CPOTB
                              <i className="fa-solid fa-arrow-up-right-from-square"></i>
                            </a>
                          </li>
                        </ul>
                        <ul>
                          <li className="label">
                            <p>CPOTB IPFS Sebelumnya</p>
                          </li>
                          <li className="input">
                            <a
                              href={`http://localhost:3000/public/certificate/${detailCpotb.cpotbIpfs}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Lihat CPOTB Sebelumnya
                              <i className="fa-solid fa-arrow-up-right-from-square"></i>
                            </a>
                          </li>
                        </ul>
                        <ul>
                          <li className="label">
                            <p>Dokumen CAPA (Corrective Action and Preventive Action)</p>
                          </li>
                          <li className="input">
                            <a
                              href={`http://localhost:8080/ipfs/${detailCpotb.dokumenTeknis.sistemMutu}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Lihat Dokumen CAPA
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
      } else if(detailCpotb.status === 'Tidak Disetujui'){
        MySwal.fire({
          title: "Detail Sertifikat CPOTB",
          html: (
            <div className='form-swal detail-modal'>
              <div className="row6">
  
                <div className="col">
                  <ul className='status'>
                    <li className="label">
                      <p>Status Sertifikasi</p>
                    </li>
                    <li className="input">
                      <p className={detailCpotb.status}>{detailCpotb.status}</p>
                    </li>
                  </ul>
  
                  <ul className='rejectMsg klaim'>
                    <li className="label">
                      <p>Alasan Penolakan</p> 
                    </li>
                    <li className="input">
                      <p>{rejectMsg[0]}</p> 
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
                      <p>Tanggal Penolakan</p> 
                    </li>
                    <li className="input">
                      <p>{ new Date(Number(timestampRejected) * 1000).toLocaleDateString('id-ID', options)}</p> 
                    </li>
                  </ul>

                  <ul>
                    <li className="label">
                      <p>Nama Instansi Pabrik</p>
                    </li>
                    <li className="input">
                      <p>{detailCpotb.factoryInstanceName} </p>
                    </li>
                  </ul>

                  <ul className='klaim'>
                    <li className="label">
                      <p>Alamat Akun Pabrik (Pengguna)</p> 
                    </li>
                    <li className="input">
                      <p>{detailCpotb.factoryAddr}</p> 
                    </li>
                  </ul>

                  <ul>
                    <li className="label">
                      <p>Tipe Industri Farmasi</p>
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
                      <p>Nama Instansi BPOM</p> 
                    </li>
                    <li className="input">
                      <p>{detailCpotb.bpomInstance}</p> 
                    </li>
                  </ul>
  
                  <ul className='klaim'>
                    <li className="label">
                      <p>Alamat Akun BPOM (Pengguna)</p> 
                    </li>
                    <li className="input">
                      <p>{detailCpotb.bpomAddr}</p> 
                    </li>
                  </ul>

                </div>

                <div className ="row4">
                  <div className='col doku'>
                    <h5>Dokumen Administrasi</h5>
                    <ul>
                      <li className="label">
                        <p>Surat Permohonan CPOTB</p>
                      </li>
                      <li className="input">
                        <a
                          href={`http://localhost:8080/ipfs/${detailCpotb.dokumenAdministrasi.suratPermohonan}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Lihat Surat Permohonan CPOTB
                          <i className="fa-solid fa-arrow-up-right-from-square"></i>
                        </a>
                      </li>
                    </ul>
                    <ul>
                      <li className="label">
                        <p>Bukti Pembayaran Negara Bukan Pajak</p>
                      </li>
                      <li className="input">
                        <a
                          href={`http://localhost:8080/ipfs/${detailCpotb.dokumenAdministrasi.buktiPembayaranNegaraBukanPajak}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Lihat Bukti Pembayaran Negara Bukan Pajak
                          <i className="fa-solid fa-arrow-up-right-from-square"></i>
                        </a>
                      </li>
                    </ul>
                    <ul>
                      <li className="label">
                        <p>Surat Pernyataan Komitmen</p>
                      </li>
                      <li className="input">
                        <a
                          href={`http://localhost:8080/ipfs/${detailCpotb.dokumenAdministrasi.suratKomitmen}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Lihat Surat Pernyataan Komitmen
                          <i className="fa-solid fa-arrow-up-right-from-square"></i>
                        </a>
                      </li>
                    </ul>
                    <h5>Dokumen Teknis</h5>
                    <ul>
                      <li className="label">
                        <p>Denah Bangunan Pabrik</p>
                      </li>
                      <li className="input">
                        <a
                          href={`http://localhost:8080/ipfs/${detailCpotb.dokumenTeknis.denahBangunan}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Lihat Denah Bangunan Pabrik
                          <i className="fa-solid fa-arrow-up-right-from-square"></i>
                        </a>
                      </li>
                    </ul>
                    <ul>
                      <li className="label">
                        <p>Dokumen Sistem Mutu CPOTB</p>
                      </li>
                      <li className="input">
                        <a
                          href={`http://localhost:8080/ipfs/${detailCpotb.dokumenTeknis.denah_pbf}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Lihat Dokumen Sistem Mutu CPOTB
                          <i className="fa-solid fa-arrow-up-right-from-square"></i>
                        </a>
                      </li>
                    </ul>
                  </div>                  
                </div>

              </div>
            
            </div>
          ),
          width: '1020',
          showCloseButton: true,
          showCancelButton: false,
          showConfirmButton: false,
        })

      } else if(detailCpotb.status === 'Pengajuan Perpanjangan CPOTB' || detailCpotb.status=== 'Pengajuan Perpanjangan Ulang CPOTB'){
        MySwal.fire({
          title: "Detail Pengajuan CPOTB",
          html: (
            <div className='form-swal detail-modal'>
              <div className="row6">
  
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
  
                  <ul>
                    <li className="label">
                      <p>Nomor CPOTB</p>
                    </li>
                    <li className="input">
                      <a
                        href={`http://localhost:3000/public/certificate/${detailCpotb.cpotbIpfs}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {detailCpotb.cpotbNumber}
                        <i className="fa-solid fa-arrow-up-right-from-square"></i>
                      </a>
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
                    : null
                  }
                  {rejectMsg[0]? 
                    <ul className='rejectMsg klaim'>
                      <li className="label">
                        <p>Alasan Penolakan</p> 
                      </li>
                      <li className="input">
                        <p>{rejectMsg[0]}</p> 
                      </li>
                    </ul> 
                    : null
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
                    : null
                  }
                  <ul>
                    <li className="label">
                      <p>Tanggal Disertifikasi</p> 
                    </li>
                    <li className="input">
                      <p>{detailCpotb.timestampApprove}</p> 
                    </li>
                  </ul>
                  <ul>
                    <li className="label">
                      <p>CPOTB Berlaku Sampai</p> 
                    </li>
                    <li className="input">
                      <p>{Math.floor(Date.now() / 1000) > Number(timestampExpired)
                        ? `${detailCpotb.timestampExpired} (Kadaluarsa)`
                        : detailCpotb.timestampExpired}
                      </p> 
                    </li>
                  </ul>
                  <ul>
                    <li className="label">
                      <p>Tanggal Pengajuan Perpanjangan CPOTB</p> 
                    </li>
                    <li className="input">
                      <p>{detailCpotb.timestampExtendRequest}</p> 
                    </li>
                  </ul>
                  {rejectMsg[1]? 
                    <ul>
                      <li className="label">
                        <p>Tanggal Penolakan Pengajuan Perpanjangan CPOTB</p> 
                      </li>
                      <li className="input">
                        <p>{detailCpotb.timestampExtendReject}</p> 
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
                        <p>{detailCpotb.timestampExtendRenew}</p> 
                      </li>
                    </ul>
                    : null
                  }
                  <ul>
                    <li className="label">
                      <p>Tanggal Penyetujuan Perpanjangan CPOTB</p> 
                    </li>
                    <li className="input">
                      <p>{detailCpotb.timestampExtendApprove}</p> 
                    </li>
                  </ul>

                  <ul>
                    <li className="label">
                      <p>Nama Instansi Pabrik</p>
                    </li>
                    <li className="input">
                      <p>{detailCpotb.factoryInstanceName} </p>
                    </li>
                  </ul>

                  <ul className='klaim'>
                    <li className="label">
                      <p>Alamat Akun Pabrik (Pengguna)</p> 
                    </li>
                    <li className="input">
                      <p>{detailCpotb.factoryAddr}</p> 
                    </li>
                  </ul>

                  <ul>
                    <li className="label">
                      <p>Tipe Industri Farmasi</p>
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
                      <p>Nama Instansi BPOM</p> 
                    </li>
                    <li className="input">
                      <p>{detailCpotb.bpomInstance}</p> 
                    </li>
                  </ul>
  
                  <ul className='klaim'>
                    <li className="label">
                      <p>Alamat Akun BPOM (Pengguna)</p> 
                    </li>
                    <li className="input">
                      <p>{detailCpotb.bpomAddr}</p> 
                    </li>
                  </ul>

                </div>

                  <div className='row4'>
                    <div className='col doku'>
                      <h5>Dokumen Administrasi</h5>
                      <ul>
                        <li className="label">
                          <p>Surat Permohonan CPOTB</p>
                        </li>
                        <li className="input">
                          <a
                            href={`http://localhost:8080/ipfs/${detailCpotb.dokumenAdministrasi.suratPermohonan}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Lihat Surat Permohonan CPOTB
                            <i className="fa-solid fa-arrow-up-right-from-square"></i>
                          </a>
                        </li>
                      </ul>
                      <ul>
                        <li className="label">
                          <p>Bukti Pembayaran Negara Bukan Pajak</p>
                        </li>
                        <li className="input">
                          <a
                            href={`http://localhost:8080/ipfs/${detailCpotb.dokumenAdministrasi.buktiPembayaranNegaraBukanPajak}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Lihat Bukti Pembayaran Negara Bukan Pajak
                            <i className="fa-solid fa-arrow-up-right-from-square"></i>
                          </a>
                        </li>
                      </ul>
                      <ul>
                        <li className="label">
                          <p>Surat Pernyataan Komitmen</p>
                        </li>
                        <li className="input">
                          <a
                            href={`http://localhost:8080/ipfs/${detailCpotb.dokumenAdministrasi.suratKomitmen}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Lihat Surat Pernyataan Komitmen
                            <i className="fa-solid fa-arrow-up-right-from-square"></i>
                          </a>
                        </li>
                      </ul>
                      <h5>Dokumen Teknis</h5>
                      <ul>
                        <li className="label">
                          <p>Denah Bangunan Pabrik</p>
                        </li>
                        <li className="input">
                          <a
                            href={`http://localhost:8080/ipfs/${detailCpotb.dokumenTeknis.denahBangunan}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Lihat Denah Bangunan Pabrik
                            <i className="fa-solid fa-arrow-up-right-from-square"></i>
                          </a>
                        </li>
                      </ul>
                      <ul>
                        <li className="label">
                          <p>Dokumen Sistem Mutu CPOTB</p>
                        </li>
                        <li className="input">
                          <a
                            href={`http://localhost:8080/ipfs/${detailCpotb.dokumenTeknis.sistemMutu}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Lihat Dokumen Sistem Mutu CPOTB
                            <i className="fa-solid fa-arrow-up-right-from-square"></i>
                          </a>
                        </li>
                      </ul>
                    </div>
                    <div className='col doku'>
                      <h5>Dokumen Re-Sertifikasi CPOTB</h5>
                      <ul>
                        <li className="label">
                          <p>Surat Permohonan CPOTB</p>
                        </li>
                        <li className="input">
                          <a
                            href={`http://localhost:8080/ipfs/${detailCpotb.dokumenAdministrasi.suratPermohonan}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Lihat Surat Permohonan CPOTB
                            <i className="fa-solid fa-arrow-up-right-from-square"></i>
                          </a>
                        </li>
                      </ul>
                      <ul>
                        <li className="label">
                          <p>Bukti Pembayaran Negara Bukan Pajak</p>
                        </li>
                        <li className="input">
                          <a
                            href={`http://localhost:8080/ipfs/${detailCpotb.dokumenAdministrasi.buktiPembayaranNegaraBukanPajak}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Lihat Bukti Pembayaran Negara Bukan Pajak
                            <i className="fa-solid fa-arrow-up-right-from-square"></i>
                          </a>
                        </li>
                      </ul>
                      <ul>
                        <li className="label">
                          <p>Denah Bangunan Pabrik</p>
                        </li>
                        <li className="input">
                          <a
                            href={`http://localhost:8080/ipfs/${detailCpotb.dokumenTeknis.denahBangunan}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Lihat Denah Bangunan Pabrik
                            <i className="fa-solid fa-arrow-up-right-from-square"></i>
                          </a>
                        </li>
                      </ul>
                      <ul>
                        <li className="label">
                          <p>Dokumen Sistem Mutu CPOTB</p>
                        </li>
                        <li className="input">
                          <a
                            href={`http://localhost:8080/ipfs/${detailCpotb.dokumenTeknis.sistemMutu}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Lihat Dokumen Sistem Mutu CPOTB
                            <i className="fa-solid fa-arrow-up-right-from-square"></i>
                          </a>
                        </li>
                      </ul>
                      <ul>
                        <li className="label">
                          <p>CPOTB IPFS Sebelumnya</p>
                        </li>
                        <li className="input">
                          <a
                            href={`http://localhost:3000/public/certificate/${detailCpotb.cpotbIpfs}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Lihat CPOTB Sebelumnya
                            <i className="fa-solid fa-arrow-up-right-from-square"></i>
                          </a>
                        </li>
                      </ul>
                      <ul>
                        <li className="label">
                          <p>Dokumen CAPA (Corrective Action and Preventive Action)</p>
                        </li>
                        <li className="input">
                          <a
                            href={`http://localhost:8080/ipfs/${detailCpotb.dokumenTeknis.sistemMutu}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Lihat Dokumen CAPA
                            <i className="fa-solid fa-arrow-up-right-from-square"></i>
                          </a>
                        </li>
                      </ul>
                    </div>

                  </div>
              </div>
            
            </div>
          ),
          width: '1020',
          showCloseButton: true,
          showCancelButton: false,
          showDenyButton: true,
          confirmButtonText: 'Setujui Perpanjangan',
          denyButtonText: 'Tolak Perpanjangan',
          customClass: {
            htmlContainer: 'scrollable-modal'
          },
        }).then((result) => {
  
          if(result.isConfirmed){
            MySwal.fire({
              title: 'Konfirmasi Penyetujuan Pengajuan Perpanjangan Sertifikat CPOTB',
              html: (
                <div className="form-swal form">
                  <div className="row5 pengajuan">
                    <div className="col">
                      <ul>
                        <li className="label">
                          <label htmlFor="cpotbNumber">Nomor CPOTB</label>
                        </li>
                        <li className="input">
                          <input
                            type="text"
                            id="cpotbNumber"
                            defaultValue={cpotbNumber}
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
                      <ul>
                        <li className="label">
                          <label htmlFor="factoryInstanceName">Nama Instansi Pabrik</label>
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
              
                      <ul className='klaim'>
                        <li className="label">
                          <label htmlFor="factoryAddr">Alamat Akun Pabrik (Pengguna)</label>
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
                          <label htmlFor="factoryAddr">Jenis Usaha Industri</label>
                        </li>
                        <li className="input">
                          <input
                            type="text"
                            value={detailCpotb.factoryType}
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
                      
                    <div className='col doku'>
                      <h5>Dokumen Re-Sertifikasi CPOTB</h5>
                        <ul>
                          <li className="label">
                            <p>Surat Permohonan CPOTB</p>
                          </li>
                          <li className="input">
                            <a
                              href={`http://localhost:8080/ipfs/${detailCpotb.dokumenAdministrasi.suratPermohonan}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Lihat Surat Permohonan CPOTB
                              <i className="fa-solid fa-arrow-up-right-from-square"></i>
                            </a>
                          </li>
                        </ul>
                        <ul>
                          <li className="label">
                            <p>Bukti Pembayaran Negara Bukan Pajak</p>
                          </li>
                          <li className="input">
                            <a
                              href={`http://localhost:8080/ipfs/${detailCpotb.dokumenAdministrasi.buktiPembayaranNegaraBukanPajak}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Lihat Bukti Pembayaran Negara Bukan Pajak
                              <i className="fa-solid fa-arrow-up-right-from-square"></i>
                            </a>
                          </li>
                        </ul>
                        <ul>
                          <li className="label">
                            <p>Denah Bangunan Pabrik</p>
                          </li>
                          <li className="input">
                            <a
                              href={`http://localhost:8080/ipfs/${detailCpotb.dokumenTeknis.denahBangunan}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Lihat Denah Bangunan Pabrik
                              <i className="fa-solid fa-arrow-up-right-from-square"></i>
                            </a>
                          </li>
                        </ul>
                        <ul>
                          <li className="label">
                            <p>Dokumen Sistem Mutu CPOTB</p>
                          </li>
                          <li className="input">
                            <a
                              href={`http://localhost:8080/ipfs/${detailCpotb.dokumenTeknis.sistemMutu}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Lihat Dokumen Sistem Mutu CPOTB
                              <i className="fa-solid fa-arrow-up-right-from-square"></i>
                            </a>
                          </li>
                        </ul>
                        <ul>
                          <li className="label">
                            <p>CPOTB IPFS Sebelumnya</p>
                          </li>
                          <li className="input">
                            <a
                              href={`http://localhost:3000/public/certificate/${detailCpotb.cpotbIpfs}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Lihat CPOTB Sebelumnya
                              <i className="fa-solid fa-arrow-up-right-from-square"></i>
                            </a>
                          </li>
                        </ul>
                        <ul>
                          <li className="label">
                            <p>Dokumen CAPA (Corrective Action and Preventive Action)</p>
                          </li>
                          <li className="input">
                            <a
                              href={`http://localhost:8080/ipfs/${detailCpotb.dokumenTeknis.sistemMutu}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Lihat Dokumen CAPA
                              <i className="fa-solid fa-arrow-up-right-from-square"></i>
                            </a>
                          </li>
                        </ul>
                    
                    </div>
                  </div>
                </div>
              ),     
              width: '960',       
              icon: 'warning',
              showCancelButton: false,
              confirmButtonText: 'Konfirmasi',
              confirmButtonColor: '#530AF7',
              showDenyButton: true,
              denyButtonColor: ' #A6A6A6',
              denyButtonText: 'Batal',
              allowOutsideClick: false,
              customClass: {
                htmlContainer: 'scrollable-modal-small'
              },
            }).then((result) => {
              if(result.isConfirmed){

                MySwal.fire({
                  title: "Menyimpan sertifikat ke IPFS",
                  text: "Proses transaksi sedang berlangsung, harap tunggu. ⏳",
                  icon: 'info',
                  showCancelButton: false,
                  showConfirmButton: false,
                  allowOutsideClick: false,
                });
                
                generateIpfs(detailCpotb.cpotbNumber, detailCpotb, "Perpanjangan")
              }
            })
          } else if (result.isDenied){

            MySwal.fire({
              title: 'Konfirmasi Penolakan Pengajuan Perpanjangan Sertifikat CPOTB',
              html: (
                <div className="form-swal form">
                  <div className="row5 pengajuan">
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
                      <ul>
                        <li className="label">
                          <label htmlFor="factoryInstanceName">Nama Instansi Pabrik</label>
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
              
                      <ul className='klaim'>
                        <li className="label">
                          <label htmlFor="factoryAddr">Alamat Akun Pabrik (Pengguna)</label>
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

                            <option value="Surat Permohonan CPOTB tidak sesuai">Surat Permohonan CPOTB tidak sesuai</option>
                            <option value="Bukti Pembayaran Negara Bukan Pajak tidak sesuai">Bukti Pembayaran Negara Bukan Pajak tidak sesuai</option>
                            <option value="Denah Bangunan Pabrik tidak sesuai">Denah Bangunan Pabrik tidak sesuai</option>
                            <option value="Dokumen Sistem Mutu CPOTB tidak sesuai">Dokumen Sistem Mutu CPOTB tidak sesuai</option>
                            <option value="Dokumen CAPA tidak sesuai">Dokumen CAPA tidak sesuai</option>
                            <option value="Lainnya">Input Manual</option>
                          </select>
                        </li>
                      </ul>

                      <ul id="customRejectMsgWrapper" style={{ display: 'none' }}>
                        <li className="label">
                          <label htmlFor="customRejectMsg">Alasan Reject Detail</label>
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
                    <div className='col doku'>
                      <h5>Dokumen Re-Sertifikasi CPOTB</h5>
                        <ul>
                          <li className="label">
                            <p>Surat Permohonan CPOTB</p>
                          </li>
                          <li className="input">
                            <a
                              href={`http://localhost:8080/ipfs/${detailCpotb.dokumenAdministrasi.suratPermohonan}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Lihat Surat Permohonan CPOTB
                              <i className="fa-solid fa-arrow-up-right-from-square"></i>
                            </a>
                          </li>
                        </ul>
                        <ul>
                          <li className="label">
                            <p>Bukti Pembayaran Negara Bukan Pajak</p>
                          </li>
                          <li className="input">
                            <a
                              href={`http://localhost:8080/ipfs/${detailCpotb.dokumenAdministrasi.buktiPembayaranNegaraBukanPajak}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Lihat Bukti Pembayaran Negara Bukan Pajak
                              <i className="fa-solid fa-arrow-up-right-from-square"></i>
                            </a>
                          </li>
                        </ul>
                        <ul>
                          <li className="label">
                            <p>Denah Bangunan Pabrik</p>
                          </li>
                          <li className="input">
                            <a
                              href={`http://localhost:8080/ipfs/${detailCpotb.dokumenTeknis.denahBangunan}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Lihat Denah Bangunan Pabrik
                              <i className="fa-solid fa-arrow-up-right-from-square"></i>
                            </a>
                          </li>
                        </ul>
                        <ul>
                          <li className="label">
                            <p>Dokumen Sistem Mutu CPOTB</p>
                          </li>
                          <li className="input">
                            <a
                              href={`http://localhost:8080/ipfs/${detailCpotb.dokumenTeknis.sistemMutu}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Lihat Dokumen Sistem Mutu CPOTB
                              <i className="fa-solid fa-arrow-up-right-from-square"></i>
                            </a>
                          </li>
                        </ul>
                        <ul>
                          <li className="label">
                            <p>CPOTB IPFS Sebelumnya</p>
                          </li>
                          <li className="input">
                            <a
                              href={`http://localhost:3000/public/certificate/${detailCpotb.cpotbIpfs}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Lihat CPOTB Sebelumnya
                              <i className="fa-solid fa-arrow-up-right-from-square"></i>
                            </a>
                          </li>
                        </ul>
                        <ul>
                          <li className="label">
                            <p>Dokumen CAPA (Corrective Action and Preventive Action)</p>
                          </li>
                          <li className="input">
                            <a
                              href={`http://localhost:8080/ipfs/${detailCpotb.dokumenTeknis.sistemMutu}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Lihat Dokumen CAPA
                              <i className="fa-solid fa-arrow-up-right-from-square"></i>
                            </a>
                          </li>
                        </ul>
                    
                    </div>
                  </div>
                </div>
              ),     
              width: '960',       
              icon: 'warning',
              showCancelButton: true,
              showCloseButton: true,
              confirmButtonText: 'Konfirmasi',
              confirmButtonColor: '#E33333',
              cancelButtonColor: '#A6A6A6',
              allowOutsideClick: false,
              cancelButtonText: 'Batal',
              customClass: {
                htmlContainer: 'scrollable-modal-small'
              },
              preConfirm: () => {
                const rejectReason = document.getElementById('rejectReason').value;
                const customRejectMsg = document.getElementById('customRejectMsg').value;

                if (!rejectReason) {
                  Swal.showValidationMessage('Pilih alasan reject!');
                } else if (rejectReason === 'Lainnya' && !customRejectMsg.trim()) {
                  Swal.showValidationMessage('Masukkan alasan manual jika memilih "Lainnya"!');
                }

                return {
                  rejectReason: rejectReason === 'Lainnya' ? customRejectMsg : rejectReason,
                };
              },
            }).then((result) => {
              
              if(result.isConfirmed){

                MySwal.fire({
                  title: "Menunggu koneksi Metamask...",
                  text: "Jika proses ini memakan waktu terlalu lama, coba periksa koneksi Metamask Anda. 🚀",
                  icon: 'info',
                  showCancelButton: false,
                  showConfirmButton: false,
                  allowOutsideClick: false,
                });

                rejectExtendCpotb(id, result.value.rejectReason, jenisSediaan, detailCpotb.factoryInstanceName, detailCpotb.cpotbNumber)
              }
            })

          } 
        })

      } else{
        MySwal.fire({
          title: "Detail Pengajuan CPOTB",
          html: (
            <div className='form-swal detail-modal'>
              <div className="row6">
  
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
                    : null
                  }
                  {rejectMsg[0]? 
                    <ul className='rejectMsg klaim'>
                      <li className="label">
                        <p>Alasan Penolakan</p> 
                      </li>
                      <li className="input">
                        <p>{rejectMsg[0]}</p> 
                      </li>
                    </ul> 
                    : null
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
                    : null
                  }
                  <ul>
                    <li className="label">
                      <p>Tanggal Disertifikasi</p> 
                    </li>
                    <li className="input">
                      <p>{detailCpotb.timestampApprove}</p> 
                    </li>
                  </ul>
                  <ul>
                    <li className="label">
                      <p>Nama Instansi Pabrik</p>
                    </li>
                    <li className="input">
                      <p>{detailCpotb.factoryInstanceName} </p>
                    </li>
                  </ul>

                  <ul className='klaim'>
                    <li className="label">
                      <p>Alamat Akun Pabrik (Pengguna)</p> 
                    </li>
                    <li className="input">
                      <p>{detailCpotb.factoryAddr}</p> 
                    </li>
                  </ul>

                  <ul>
                    <li className="label">
                      <p>Tipe Industri Farmasi</p>
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
                      <p>Nama Instansi BPOM</p> 
                    </li>
                    <li className="input">
                      <p>{detailCpotb.bpomInstance}</p> 
                    </li>
                  </ul>
  
                  <ul className='klaim'>
                    <li className="label">
                      <p>Alamat Akun BPOM (Pengguna)</p> 
                    </li>
                    <li className="input">
                      <p>{detailCpotb.bpomAddr}</p> 
                    </li>
                  </ul>
                </div>

                <div className ="row4">
                  <div className='col doku'>
                    <h5>Dokumen Administrasi</h5>
                    <ul>
                      <li className="label">
                        <p>Surat Permohonan CPOTB</p>
                      </li>
                      <li className="input">
                        <a
                          href={`http://localhost:8080/ipfs/${detailCpotb.dokumenAdministrasi.suratPermohonan}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Lihat Surat Permohonan CPOTB
                          <i className="fa-solid fa-arrow-up-right-from-square"></i>
                        </a>
                      </li>
                    </ul>
                    <ul>
                      <li className="label">
                        <p>Bukti Pembayaran Negara Bukan Pajak</p>
                      </li>
                      <li className="input">
                        <a
                          href={`http://localhost:8080/ipfs/${detailCpotb.dokumenAdministrasi.buktiPembayaranNegaraBukanPajak}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Lihat Bukti Pembayaran Negara Bukan Pajak
                          <i className="fa-solid fa-arrow-up-right-from-square"></i>
                        </a>
                      </li>
                    </ul>
                    <ul>
                      <li className="label">
                        <p>Surat Pernyataan Komitmen</p>
                      </li>
                      <li className="input">
                        <a
                          href={`http://localhost:8080/ipfs/${detailCpotb.dokumenAdministrasi.suratKomitmen}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Lihat Surat Pernyataan Komitmen
                          <i className="fa-solid fa-arrow-up-right-from-square"></i>
                        </a>
                      </li>
                    </ul>
                    <h5>Dokumen Teknis</h5>
                    <ul>
                      <li className="label">
                        <p>Denah Bangunan Pabrik</p>
                      </li>
                      <li className="input">
                        <a
                          href={`http://localhost:8080/ipfs/${detailCpotb.dokumenTeknis.denahBangunan}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Lihat Denah Bangunan Pabrik
                          <i className="fa-solid fa-arrow-up-right-from-square"></i>
                        </a>
                      </li>
                    </ul>
                    <ul>
                      <li className="label">
                        <p>Dokumen Sistem Mutu CPOTB</p>
                      </li>
                      <li className="input">
                        <a
                          href={`http://localhost:8080/ipfs/${detailCpotb.dokumenTeknis.denah_pbf}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Lihat Dokumen Sistem Mutu CPOTB
                          <i className="fa-solid fa-arrow-up-right-from-square"></i>
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            
            </div>
          ),
          width: '1020',
          showCloseButton: true,
          showCancelButton: false,
          showDenyButton: true,
          confirmButtonText: 'Setujui Pengajuan',
          denyButtonText: 'Tolak pengajuan',
          customClass: {
            htmlContainer: 'scrollable-modal'
          },
        }).then((result) => {
  
          if(result.isConfirmed){
            const prefix = "PW-S.01.3.331";
            const day = `${String(new Date().getMonth() + 1).padStart(2, '0')}.${String(new Date().getDate()).padStart(2, '0')}`;
            const randomString = String(Math.floor(1000 + Math.random() * 9000));
            const cpotbNumber = `${prefix}.${day}.${randomString}`
            
            MySwal.fire({
              title: 'Konfirmasi Penyetujuan Pengajuan Sertifikat CPOTB',
              html: (
                <div className="form-swal form">
                  <div className="row5 pengajuan">
                    <div className="col">
                      <ul>
                        <li className="label">
                          <label htmlFor="cpotbNumber">Nomor CPOTB</label>
                        </li>
                        <li className="input">
                          <input
                            type="text"
                            id="cpotbNumber"
                            defaultValue={cpotbNumber}
                            
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
                      <ul>
                        <li className="label">
                          <label htmlFor="factoryInstanceName">Nama Instansi Pabrik</label>
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
              
                      <ul className='klaim'>
                        <li className="label">
                          <label htmlFor="factoryAddr">Alamat Akun Pabrik (Pengguna)</label>
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
                          <label htmlFor="factoryAddr">Jenis Usaha Industri</label>
                        </li>
                        <li className="input">
                          <input
                            type="text"
                            value={detailCpotb.factoryType}
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

                    <div className='col doku'>
                      <h5>Dokumen Administrasi</h5>
                      <ul>
                        <li className="label">
                          <p>Surat Permohonan CPOTB</p>
                        </li>
                        <li className="input">
                          <a
                            href={`http://localhost:8080/ipfs/${detailCpotb.dokumenAdministrasi.suratPermohonan}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Lihat Surat Permohonan CPOTB
                            <i className="fa-solid fa-arrow-up-right-from-square"></i>
                          </a>
                        </li>
                      </ul>
                      <ul>
                        <li className="label">
                          <p>Bukti Pembayaran Negara Bukan Pajak</p>
                        </li>
                        <li className="input">
                          <a
                            href={`http://localhost:8080/ipfs/${detailCpotb.dokumenAdministrasi.buktiPembayaranNegaraBukanPajak}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Lihat Bukti Pembayaran Negara Bukan Pajak
                            <i className="fa-solid fa-arrow-up-right-from-square"></i>
                          </a>
                        </li>
                      </ul>
                      <ul>
                        <li className="label">
                          <p>Surat Pernyataan Komitmen</p>
                        </li>
                        <li className="input">
                          <a
                            href={`http://localhost:8080/ipfs/${detailCpotb.dokumenAdministrasi.suratKomitmen}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Lihat Surat Pernyataan Komitmen
                            <i className="fa-solid fa-arrow-up-right-from-square"></i>
                          </a>
                        </li>
                      </ul>
                      <hr></hr>
                      <h5>Dokumen Teknis</h5>
                      <ul>
                        <li className="label">
                          <p>Denah Bangunan Pabrik</p>
                        </li>
                        <li className="input">
                          <a
                            href={`http://localhost:8080/ipfs/${detailCpotb.dokumenTeknis.denahBangunan}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Lihat Denah Bangunan Pabrik
                            <i className="fa-solid fa-arrow-up-right-from-square"></i>
                          </a>
                        </li>
                      </ul>
                      <ul>
                        <li className="label">
                          <p>Dokumen Sistem Mutu CPOTB</p>
                        </li>
                        <li className="input">
                          <a
                            href={`http://localhost:8080/ipfs/${detailCpotb.dokumenTeknis.denah_pbf}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Lihat Dokumen Sistem Mutu CPOTB
                            <i className="fa-solid fa-arrow-up-right-from-square"></i>
                          </a>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              ),     
              width: '960',       
              icon: 'warning',
              showCancelButton: false,
              confirmButtonText: 'Konfirmasi',
              confirmButtonColor: '#530AF7',
              showDenyButton: true,
              denyButtonColor: ' #A6A6A6',
              denyButtonText: 'Batal',
              allowOutsideClick: false,
              customClass: {
                htmlContainer: 'scrollable-modal-small'
              },
            }).then((result) => {

              let updatedCpotbNumber = document.getElementById('cpotbNumber').value;
              if(result.isConfirmed){

                MySwal.fire({
                  title: "Menyimpan sertifikat ke IPFS",
                  text: "Proses transaksi sedang berlangsung, harap tunggu. ⏳",
                  icon: 'info',
                  showCancelButton: false,
                  showConfirmButton: false,
                  allowOutsideClick: false,
                });
                
                console.log(updatedCpotbNumber);
                generateIpfs(updatedCpotbNumber, detailCpotb, '')
              }
            })
          } else if (result.isDenied){

            MySwal.fire({
              title: 'Konfirmasi Penolakan Pengajuan Sertifikat CPOTB',
              html: (
                <div className="form-swal form row-reject-form">
                  <div className="row5 pengajuan">
                    <div className="col reject">
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
                      <ul>
                        <li className="label">
                          <label htmlFor="factoryInstanceName">Nama Instansi Pabrik</label>
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
              
                      <ul className='klaim'>
                        <li className="label">
                          <label htmlFor="factoryAddr">Alamat Akun Pabrik (Pengguna)</label>
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
                            <option value="Surat Permohonan CPOTB tidak sesuai">Surat Permohonan CPOTB tidak sesuai</option>
                            <option value="Bukti Pembayaran Negara Bukan Pajak tidak sesuai">Bukti Pembayaran Negara Bukan Pajak tidak sesuai</option>
                            <option value="Surat Pernyataan Komitmen tidak sesuai">Surat Pernyataan Komitmen tidak sesuai</option>
                            <option value="Denah Bangunan Pabrik tidak sesuai">Denah Bangunan Pabrik tidak sesuai</option>
                            <option value="Dokumen Sistem Mutu CPOTB tidak sesuai">Dokumen Sistem Mutu CPOTB tidak sesuai</option>
                            <option value="Lainnya">Input Manual</option>
                          </select>
                        </li>
                      </ul>

                      <ul id="customRejectMsgWrapper" style={{ display: 'none' }}>
                        <li className="label">
                          <label htmlFor="customRejectMsg">Alasan Reject Detail</label>
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
                    <div className='col doku'>
                      <h5>Dokumen Administrasi</h5>
                      <ul>
                        <li className="label">
                          <p>Surat Permohonan CPOTB</p>
                        </li>
                        <li className="input">
                          <a
                            href={`http://localhost:8080/ipfs/${detailCpotb.dokumenAdministrasi.suratPermohonan}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Lihat Surat Permohonan CPOTB
                            <i className="fa-solid fa-arrow-up-right-from-square"></i>
                          </a>
                        </li>
                      </ul>
                      <ul>
                        <li className="label">
                          <p>Bukti Pembayaran Negara Bukan Pajak</p>
                        </li>
                        <li className="input">
                          <a
                            href={`http://localhost:8080/ipfs/${detailCpotb.dokumenAdministrasi.buktiPembayaranNegaraBukanPajak}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Lihat Bukti Pembayaran Negara Bukan Pajak
                            <i className="fa-solid fa-arrow-up-right-from-square"></i>
                          </a>
                        </li>
                      </ul>
                      <ul>
                        <li className="label">
                          <p>Surat Pernyataan Komitmen</p>
                        </li>
                        <li className="input">
                          <a
                            href={`http://localhost:8080/ipfs/${detailCpotb.dokumenAdministrasi.suratKomitmen}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Lihat Surat Pernyataan Komitmen
                            <i className="fa-solid fa-arrow-up-right-from-square"></i>
                          </a>
                        </li>
                      </ul>
                      <hr></hr>
                      <h5>Dokumen Teknis</h5>
                      <ul>
                        <li className="label">
                          <p>Denah Bangunan Pabrik</p>
                        </li>
                        <li className="input">
                          <a
                            href={`http://localhost:8080/ipfs/${detailCpotb.dokumenTeknis.denahBangunan}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Lihat Denah Bangunan Pabrik
                            <i className="fa-solid fa-arrow-up-right-from-square"></i>
                          </a>
                        </li>
                      </ul>
                      <ul>
                        <li className="label">
                          <p>Dokumen Sistem Mutu CPOTB</p>
                        </li>
                        <li className="input">
                          <a
                            href={`http://localhost:8080/ipfs/${detailCpotb.dokumenTeknis.denah_pbf}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Lihat Dokumen Sistem Mutu CPOTB
                            <i className="fa-solid fa-arrow-up-right-from-square"></i>
                          </a>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              ),     
              width: '960',       
              icon: 'warning',
              showCancelButton: true,
              showCloseButton: true,
              confirmButtonText: 'Konfirmasi',
              confirmButtonColor: '#E33333',
              cancelButtonColor: '#A6A6A6',
              allowOutsideClick: false,
              customClass: {
                htmlContainer: 'scrollable-modal-small'
              },
              cancelButtonText: 'Batal',
              preConfirm: () => {
                const rejectReason = document.getElementById('rejectReason').value;
                const customRejectMsg = document.getElementById('customRejectMsg').value;

                if (!rejectReason) {
                  Swal.showValidationMessage('Pilih alasan reject!');
                } else if (rejectReason === 'Lainnya' && !customRejectMsg.trim()) {
                  Swal.showValidationMessage('Masukkan alasan manual jika memilih "Lainnya"!');
                }

                return {
                  rejectReason: rejectReason === 'Lainnya' ? customRejectMsg : rejectReason,
                };
              },
            }).then((result) => {
              
              if(result.isConfirmed){

                MySwal.fire({
                  title: "Menunggu koneksi Metamask...",
                  text: "Jika proses ini memakan waktu terlalu lama, coba periksa koneksi Metamask Anda. 🚀",
                  icon: 'info',
                  showCancelButton: false,
                  showConfirmButton: false,
                  allowOutsideClick: false,
                });

                rejectCpotb(id, result.value.rejectReason, jenisSediaan, detailCpotb.factoryInstanceName)
              }
            })
          }
        })

      }
      
    } catch (e) {
      errAlert(e, "Can't retrieve data")
    }
  }

  function checkEligible(factoryType, jenisSediaanId) {
    const jenisSediaanMap = {
      0: "Cairan Obat Dalam",
      1: "Rajangan",
      2: "Serbuk",
      3: "Serbuk Instan",
      4: "Efervesen",
      5: "Pil",
      6: "Kapsul",
      7: "Kapsul Lunak",
      8: "Tablet atau Kaplet",
      9: "Granul",
      10: "Pastiles",
      11: "Dodol atau Jenang",
      12: "Film Strip",
      13: "Cairan Obat Luar",
      14: "Losio",
      15: "Parem",
      16: "Salep",
      17: "Krim",
      18: "Gel",
      19: "Serbuk Obat Luar",
      20: "Tapel",
      21: "Pilis",
      22: "Plaster atau Koyok",
      23: "Supositoria",
      24: "Rajangan Obat Luar",
    };
  
    const usahaSediaanMapping = {
      UMOT: [1, 13, 15, 20, 21],
      UKOT: [
        0, 1, 2, 3, 5, 6, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 24,
      ],
      IOT: [
        0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
        22, 23, 24,
      ],
    };
  
    if (!Object.keys(jenisSediaanMap).includes(String(jenisSediaanId))) {
      return `Jenis sediaan dengan ID ${jenisSediaanId} tidak valid. Mohon periksa kembali.`;
    }
  
    const allowedJenisSediaan = usahaSediaanMapping[factoryType] || [];
  
    if (allowedJenisSediaan.includes(jenisSediaanId)) {
      return true; 
    }
  
    const eligibleFactoryTypes = Object.keys(usahaSediaanMapping).filter((key) =>
      usahaSediaanMapping[key].includes(jenisSediaanId)
    );

    let factoryTypesString = eligibleFactoryTypes.join(', ');

    if (eligibleFactoryTypes.length > 1) {
      const lastCommaIndex = factoryTypesString.lastIndexOf(','); 
      factoryTypesString = `${factoryTypesString.substring(0, lastCommaIndex)} dan ${factoryTypesString.substring(lastCommaIndex + 2)}`;
    }
  
    return `Jenis sediaan ${jenisSediaanMap[jenisSediaanId]} hanya diperuntukkan untuk tipr industri farmasi ${factoryTypesString}`; 
  }
  
  function handleRejectReasonChange(e) {
    const customMsgWrapper = document.getElementById('customRejectMsgWrapper');
    if (e.target.value === 'Lainnya') {
      customMsgWrapper.style.display = 'flex';
    } else {
      customMsgWrapper.style.display = 'none';
    }
  }
  
  const generateIpfs = async (cpotbNumber, detailCpotb, msg) => {

    console.log(detailCpotb);
    console.log(cpotbNumber);

    const date = new Date();
    const formattedDate = new Intl.DateTimeFormat('id-ID', options).format(date);
    const expireDate = new Date(date.getTime() + 2 * 60 * 1000);
    const formattedDateExp = new Intl.DateTimeFormat('id-ID', options).format(expireDate)

    MySwal.update({
      title: "Mengunggah data CPOTB ke IPFS...",
      text: "Jika proses ini memakan waktu terlalu lama, coba periksa koneksi IPFS Anda. 🚀",
    });

    let cpotbData;
    
    try {
      
      const userFactoryCt = await contracts.roleManager.getUserData(detailCpotb.factoryAddr)
      const userBpomCt = await contracts.roleManager.getUserData(userdata.address)

      if(msg === "Perpanjangan"){
        cpotbData = {
          certName: "CPOTB",
          tipePermohonan: detailCpotb.jenisSediaan,
          certNumber: cpotbNumber,
          timestampRequest: detailCpotb.timestampRequest, 
          timestampApprove: detailCpotb.timestampApprove,
          timestampExpired: formattedDateExp,
          timestampExtendRequest: detailCpotb.timestampExtendRequest,
          timestampExtendApprove: formattedDate,
          senderInstance: detailCpotb.factoryInstanceName,
          senderAddress: detailCpotb.factoryAddr,
          factoryType: detailCpotb.factoryType,
          senderNIB: detailCpotb.factoryNIB,
          senderNPWP: detailCpotb.factoryNPWP,
          senderInstanceAddress: userFactoryCt[4],
          bpomInstance: userdata.instanceName,
          bpomAddress: userdata.address,
          bpomInstanceAddress: userBpomCt[4]
        }
      } else {
        cpotbData = {
          certName: "CPOTB",
          tipePermohonan: detailCpotb.jenisSediaan,
          certNumber: cpotbNumber,
          timestampRequest: detailCpotb.timestampRequest, 
          timestampApprove: formattedDate,
          timestampExpired: formattedDateExp,
          timestampExtendRequest: '',
          timestampExtendApprove: '',
          senderInstance: detailCpotb.factoryInstanceName,
          senderAddress: detailCpotb.factoryAddr,
          factoryType: detailCpotb.factoryType,
          senderNIB: detailCpotb.factoryNIB,
          senderNPWP: detailCpotb.factoryNPWP,
          senderInstanceAddress: userFactoryCt[4],
          bpomInstance: userdata.instanceName,
          bpomAddress: userdata.address,
          bpomInstanceAddress: userBpomCt[4]
        }
      }

      console.log(cpotbData);

      const result = await client.add(JSON.stringify(cpotbData), 
        { progress: (bytes) => 
          console.log(`Uploading data CPOTB: ${bytes} bytes uploaded`) }
      );

      if (result.path) {
        MySwal.update({
          title: "Menunggu koneksi Metamask...",
          text: "Jika proses ini memakan waktu terlalu lama, coba periksa koneksi Metamask Anda. 🚀",
        });
        if (msg=== "Perpanjangan") {
          approveExtendCpotb(detailCpotb.factoryInstanceName, cpotbNumber, detailCpotb.jenisSediaan, detailCpotb.cpotbId, result.path)
        } else {
          approveCpotb(cpotbNumber, detailCpotb.cpotbId, detailCpotb.jenisSediaan, result.path, detailCpotb.factoryInstanceName);
        }
      }

    } catch (error) {
      errAlert(error, "Tidak bisa mengunggah data obat ke IPFS."); 
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

    console.log(
      [certNumber, certTd, userdata.name, userdata.instanceName, userdata.address], 
      cpotbIpfs,
      jenisMap[jenisSediaan])

    try {
      
      const approveCt = await contracts.certificateManager.approveCpotb(
        [certNumber, certTd, userdata.name, userdata.instanceName, userdata.address], 
        cpotbIpfs,
        jenisMap[jenisSediaan])
      console.log(approveCt);

      if(approveCt){
        
        MySwal.update({
          title: "Memproses transaksi...",
          text: "Proses transaksi sedang berlangsung, harap tunggu. ⏳"
        });
      }
      contracts.certificateManager.once('CertApproved',  (bpomInstance, bpomAddr, _jenisSediaan, cpotbNumber, _timestampApprove) => {
        updateCpotbFb( factoryInstanceName, jenisSediaan, approveCt.hash, Number(_timestampApprove), cpotbNumber, cpotbIpfs, 'Setujui' );
        recordHashFb(jenisSediaan, approveCt.hash, Number(_timestampApprove), factoryInstanceName, 'Setujui')
        handleEventCpotb("Disetujui", jenisSediaan, cpotbNumber, _timestampApprove, approveCt.hash);
      });
      
    } catch (error) {
      errAlert(error, "Can't Approve CPOTB")
    }
  }

  const rejectExtendCpotb = async(id, rejectMsg, jenisSediaan, factoryInstanceName, certNumber) => {
    console.log(id);

    try {
      
      contracts.certificateManager.once("CertExtendReject", (_instanceAddr, _rejectMsg, _timestampRejected) => {
        handleEventCpotb( "Tolak Perpanjangan", jenisSediaanMap[jenisSediaan], _rejectMsg, _timestampRejected, rejectCt.hash, certNumber);
        recordHashFb(jenisSediaanMap[jenisSediaan], rejectCt.hash, Number(_timestampRejected), factoryInstanceName, 'Tolak Perpanjangan')
        updateCpotbFb( factoryInstanceName, jenisSediaanMap[jenisSediaan], rejectCt.hash, Number(_timestampRejected), "", "", 'Tolak Perpanjangan');
      });

      const rejectCt = await contracts.certificateManager.rejectExtendCpotb( id, rejectMsg);

      if(rejectCt){
        MySwal.update({
          title: "Memproses transaksi...",
          text: "Proses transaksi sedang berlangsung, harap tunggu. ⏳"
        });
      }
    } catch (error) {
      errAlert(error, `Gagal menolak pengajuan CPOTB ${factoryInstanceName} dengan Jenis Sediaan ${jenisSediaanMap[jenisSediaan]}`)
    }
  }

  const rejectCpotb = async(id, rejectMsg, jenisSediaan, factoryInstanceName) => {
    console.log(id);

    try {
      
      contracts.certificateManager.once("CertRejected", (_instanceName, _instanceAddr, _jenisSediaan, _timestampRejected, _rejectMsg) => {
        handleEventCpotb( "Tidak Disetujui", jenisSediaanMap[jenisSediaan], _rejectMsg, _timestampRejected, rejectCt.hash, '');
        recordHashFb(jenisSediaanMap[jenisSediaan], rejectCt.hash, Number(_timestampRejected), factoryInstanceName, 'Tidak Disetujui')
        updateCpotbFb( factoryInstanceName, jenisSediaanMap[jenisSediaan], rejectCt.hash, Number(_timestampRejected), "", "", 'Tidak Disetujui');
      });

      const rejectCt = await contracts.certificateManager.rejectCpotb( id, rejectMsg, userdata.name, userdata.instanceName, jenisSediaan);

      if(rejectCt){
        MySwal.update({
          title: "Memproses transaksi...",
          text: "Proses transaksi sedang berlangsung, harap tunggu. ⏳"
        });
      }
      
    } catch (error) {
      errAlert(error, `Gagal menolak pengajuan CPOTB ${factoryInstanceName} dengan Jenis Sediaan ${jenisSediaan}`)
    }
  }

  const approveExtendCpotb = async(factoryName, cpotbNumber, jenisSediaan, certTd, cpotbIpfs) => {

    console.log(certTd, cpotbIpfs);

    try {

      contracts.certificateManager.once('CertExtend',  (bpomAddr, _timestampApprove) => {
        updateCpotbFb(factoryName, jenisSediaan, approveExtendCt.hash, Number(_timestampApprove), '', cpotbIpfs, 'Perpanjangan');
        recordHashFb(jenisSediaan, approveExtendCt.hash, Number(_timestampApprove), factoryName, 'Perpanjangan')
        handleEventCpotb("Perpanjangan", jenisSediaan, cpotbNumber, _timestampApprove, approveExtendCt.hash);
      });
      
      const approveExtendCt = await contracts.certificateManager.approveExtendCpotb(
        certTd, 
        cpotbIpfs
      )

      console.log(approveExtendCt);

      if(approveExtendCt){

        MySwal.update({
          title: "Memproses transaksi...",
          text: "Proses transaksi sedang berlangsung, harap tunggu. ⏳"
        });
      }
    } catch (error) {
      errAlert(error, `Gagal menyetujui pengajuan CPOTB ${factoryName} dengan Jenis Sediaan ${jenisSediaanMap[jenisSediaan]}`)
    }
  }
 
  const updateCpotbFb = async (factoryName, jenisSediaan, cpotbHash, timestamp, cpotbNumber, cpotbIpfs, msg) => {
    try {
      const docRef = doc(db, 'cpotb_list', factoryName);

      if(msg === 'Setujui'){
        await updateDoc(docRef, {
          [`${jenisSediaan}.approvedHash`]: cpotbHash,
          [`${jenisSediaan}.approvedTimestamp`]: timestamp, 
          [`${jenisSediaan}.cpotbNumber`]: cpotbNumber,
          [`${jenisSediaan}.ipfsCid`]: cpotbIpfs,
          [`${jenisSediaan}.bpomInstance`]: userdata.instanceName, 
          [`${jenisSediaan}.status`]: 1, 
        }); 
      } else if(msg === 'Perpanjangan'){
        await updateDoc(docRef, { 
          [`${jenisSediaan}.extendedApprovedHash`]: cpotbHash,
          [`${jenisSediaan}.extendedApprovedTimestamp`]: timestamp, 
          [`${jenisSediaan}.bpomInstance`]: userdata.instanceName, 
          [`${jenisSediaan}.status`]: 5, 
          [`${jenisSediaan}.ipfsCid`]: cpotbIpfs
        });
      } else if(msg === 'Tolak Perpanjangan'){
        await updateDoc(docRef, { 
          [`${jenisSediaan}.extendedRejectedHash`]: cpotbHash,
          [`${jenisSediaan}.extendedRejectedTimestamp`]: timestamp, 
          [`${jenisSediaan}.bpomInstance`]: userdata.instanceName, 
          [`${jenisSediaan}.status`]: 6
        });
      } 
      else {
        await updateDoc(docRef, {
          [`${jenisSediaan}.rejectedHash`]: cpotbHash,
          [`${jenisSediaan}.rejectedTimestamp`]: timestamp,
          [`${jenisSediaan}.bpomInstance`]: userdata.instanceName, 
          [`${jenisSediaan}.status`]: 2
        });  
        
      }
      
    } catch (err) {
      errAlert(err);
    }
  };

  const recordHashFb = async(jenisSediaan, txHash, timestamp, factoryName, msg) => {
    try {
      const collectionName = `pengajuan_cpotb_${factoryName}`
      const docRef = doc(db, 'transaction_hash', collectionName);
  
      if(msg === 'Setujui'){
        await setDoc(docRef, {
          [`${jenisSediaan}`]: {
            'approve': {
              hash: txHash,
              timestamp: timestamp,
            }
          },
        }, { merge: true }); 
      } else if(msg === 'Perpanjangan'){
          await setDoc(docRef, {
            [`${jenisSediaan}`]: {
              'extend_approve': {
                hash: txHash,
                timestamp: timestamp,
              }
            },
          }, { merge: true }); 
      } else if(msg === 'Tolak Perpanjangan'){
          await setDoc(docRef, {
            [`${jenisSediaan}`]: {
              'extend_reject': {
                hash: txHash,
                timestamp: timestamp,
              }
            },
          }, { merge: true }); 
      }
      else {
        await setDoc(docRef, {
          [`${jenisSediaan}`]: {
            'reject': {
              hash: txHash,
              timestamp: timestamp,
            }
          },
        }, { merge: true }); 
      }
    } catch (err) {
      errAlert(err);
    }
  }

  return (
    <>
      <div id="CpotbPage" className='Layout-Menu layout-page'>
        <div className="title-menu">
          <h1>Data Pengajuan Sertifikat CPOTB</h1>
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
            <div className="fade-container">
              <div className={`fade-layer loader-layer ${fadeOutLoader ? 'fade-out' : 'fade-in'}`}>
                <div className="image">
                  <Loader />

                </div>
              </div>

              <div className={`fade-layer content-layer ${!loading ? 'fade-in' : 'fade-out'}`}>
              {dataCpotb.length > 0 ? (
                  <ul>
                    {dataCpotb.map((item, index) => (
                      <li key={index}>
                        <button className='title' onClick={() => getDetailCpotb(item.cpotbId)}>{item.factoryInstance}: {item.jenisSediaan}</button>
                        <p>
                          { item.cpotbNumber !== null ? `Nomor CPOTB: ${item.cpotbNumber}` : "Nomor CPOTB: Tidak Tersedia"}
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


export default CpotbApprove;