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

function ManageCpotb() {
  const [contracts, setContracts] = useState(null);
  const navigate = useNavigate();
  const userdata = JSON.parse(sessionStorage.getItem('userdata')) || {};
  const [dataCpotb, setDataCpotb] = useState([]);
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
    5: "Pengajuan Resertifikasi",
    6: "Resertifikasi"
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
    document.title = "CPOTB List - Pabrik"; 
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
      if (contracts) {
        try {
          console.log(userdata.instanceName);
          const listAllCt = await contracts.certificateManager.getCpotbByInstance(userdata.instanceName);
          console.log(listAllCt);
          const reconstructedData = listAllCt.map((item) => {
            const cpotbId = item[0]; 
            let cpotbNumber = item[1] || 'Belum Tersedia'; 

            console.log(item[4]);
            if (item[4] === 2n) {
              cpotbNumber = null;
            }

            let statusCert;
            if (item[4] === 1n || item[4] === 6n) {
              if (Number(item[6]) !== 0 && Math.floor(Date.now() / 1000) > Number(item[6])) {
                statusCert = statusMap[4];
              } else {
                statusCert = statusMap[item[4]];
              }
            } else if (item[4] === 5n) {
              statusCert = statusMap[item[4]];
            } else if (item[6] !== 0) {
              if (Math.floor(Date.now() / 1000) > Number(item[6])) {
                statusCert = statusMap[4];
              } else {
                statusCert = statusMap[item[4]];
              }
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
          });
          
          setDataCpotb(reconstructedData);
  
        } catch (error) {
          console.error("Error loading data: ", error);
        } finally{
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

  const handleEventCpotb = (factoryAddr, timestamp, txHash) => {

    const formattedTimestamp = new Date(Number(timestamp) * 1000).toLocaleDateString('id-ID', options)

    MySwal.fire({
      title: "Permintaan perpanjangan CPOTB terkirim",
      html: (
        <div className='form-swal event'>
          <ul>
            <li className="label">
              <p>Nama Instansi Pabrik</p> 
            </li>
            <li className="input">
              <p>{userdata.instanceName}</p> 
            </li>
          </ul>
          <ul className='klaim'>
            <li className="label">
              <p>Alamat Akun Pabrik (Pengguna)</p> 
            </li>
            <li className="input">
              <p>{factoryAddr}</p> 
            </li>
          </ul>
          <ul>
            <li className="label">
              <p>Tanggal Dikirim</p> 
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

  const getDetailCpotb = async (id) => {
    
    console.log(id);

    try {
      const detailCpotbCt = await contracts.certificateManager.getCpotbDetails(id);
      const detailUserFactoryCt = await contracts.roleManager.getUserData(userdata.address);
      let typeFactory;
      console.log(detailUserFactoryCt);
 
      const [certDetails, cpotbDetails, docsAdministrasi, docsTeknis] = detailCpotbCt; 
      const [suratPermohonan, buktiPembayaranNegaraBukanPajak, suratKomitmen] = docsAdministrasi;
      const [denahBangunan, sistemMutu] = docsTeknis
      const [cpotbId, cpotbNumber, jenisSediaan, factoryType] = cpotbDetails;
      const [status, timestampRequest, timestampApprove, timestampRejected, timestampRenewRequest, timestampExpired, timestampExtendRequest, factory, bpom, cpotbIpfs] = certDetails;

      const rejectMsg = await contracts.certificateManager.getRejectMsgCpotb(id);
      console.log(timestampRenewRequest);

      let statusCert;
      if (status === 1n || status === 6n) {
        if (Number(timestampExpired) !== 0 && Math.floor(Date.now() / 1000) > Number(timestampExpired)) {
          statusCert = statusMap[4];
        } else {
          statusCert = statusMap[status];
        }
      } else if (status === 5n) {
        statusCert = statusMap[status];
      } else if (timestampExpired !== 0) {
        if (Math.floor(Date.now() / 1000) > Number(timestampExpired)) {
          statusCert = statusMap[4];
        } else {
          statusCert = statusMap[status];
        }
      } else {
        statusCert = statusMap[status];
      }

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
        status: statusCert, 
        timestampRequest: new Date(Number(timestampRequest) * 1000).toLocaleDateString('id-ID', options),
        timestampApprove: Number(timestampApprove) !== 0 ? new Date(Number(timestampApprove) * 1000).toLocaleDateString('id-ID', options): "-",
        timestampRenewRequest: parseInt(timestampRenewRequest) !== 0 ? new Date(Number(timestampRenewRequest) * 1000).toLocaleDateString('id-ID', options): "-",
        timestampRejected: parseInt(timestampRejected) !== 0 ? new Date(Number(timestampRejected) * 1000).toLocaleDateString('id-ID', options): "-",
        timestampExpired: parseInt(timestampExpired) !== 0 ? new Date(Number(timestampExpired) * 1000).toLocaleDateString('id-ID', options): "-",
        timestampExtendRequest: parseInt(timestampExtendRequest) !== 0 ? new Date(Number(timestampExtendRequest) * 1000).toLocaleDateString('id-ID', options): "-",
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
      };

      console.log(detailCpotb.status);

      if(detailCpotb.status === 'Tidak Disetujui'){
        
        MySwal.fire({
          title: "Detail Sertifikat CPOTB",
          html: (
            <div className='form-swal order'>
              <div className="row2">
  
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

                  <ul>
                    <li className="label">
                      <p>Nama Instansi Pabrik</p>
                    </li>
                    <li className="input">
                      <p>{detailCpotb.factoryName} </p>
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
              </div>
            
            </div>
          ),
          width: '1020',
          showCloseButton: true,
          showCancelButton: false,
          confirmButtonText: 'Pengajuan Ulang CPOTB',
        }).then((result) => {
          if (result.isConfirmed) {
            const cpotbData = {
              idCpotb: id,
              jenisSediaan: jenisSediaan.toString()
            }
            sessionStorage.setItem("cpotbData", JSON.stringify(cpotbData))
            navigate('/renew-request-cpotb')
          }
        })
      } else if(Math.floor(Date.now() / 1000) > Number(timestampExpired)) {
        MySwal.fire({
          title: "Detail Sertifikat CPOTB",
          html: (
            <div className='form-swal order'>
              <div className="row2">
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
                      <p>Tanggal Perpanjangan CPOTB</p> 
                    </li>
                    <li className="input">
                      <p>{detailCpotb.timestampExtendRequest}</p> 
                    </li>
                  </ul>
                  <ul>
                    <li className="label">
                      <p>Nama Instansi Pabrik</p>
                    </li>
                    <li className="input">
                      <p>{detailCpotb.factoryName}</p>
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
                            Liat data CPOTB di IPFS
                            <i class="fa-solid fa-arrow-up-right-from-square"></i>
                          </a>
                        </li>
                      </ul>
                  }
                  
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
            MySwal.fire({
              title: 'Konfirmasi Perpanjangan Sertifikat CPOTB',
              html: (
                <div className="form-swal form">
                  <div className="row">
                    <div className="col">
                      <ul>
                        <li className="label">
                          <label htmlFor="factoryInstanceName">Nama Instansi Pabrik</label>
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
                            value={detailCpotb.bpomInstance}
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
                            value={detailCpotb.bpomAddr}
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
                            defaultValue={detailCpotb.cpotbNumber}
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
                  title: "Menunggu koneksi Metamask...",
                  text: "Jika proses ini memakan waktu terlalu lama, coba periksa koneksi Metamask Anda. 🚀",
                  icon: 'info',
                  showCancelButton: false,
                  showConfirmButton: false,
                  allowOutsideClick: false,
                });

                extendCertificate(id, timestampExpired, detailCpotb.jenisSediaan)
                
              }
            })

          }
        })
      } else {
        MySwal.fire({
          title: "Detail Sertifikat CPOTB",
          html: (
            <div className='form-swal order'>
              <div className="row2">
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
                      <p>Tanggal Perpanjangan CPOTB</p> 
                    </li>
                    <li className="input">
                      <p>{detailCpotb.timestampExtendRequest}</p> 
                    </li>
                  </ul>
                  <ul>
                    <li className="label">
                      <p>Nama Instansi Pabrik</p>
                    </li>
                    <li className="input">
                      <p>{detailCpotb.factoryName}</p>
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
                            Liat data CPOTB di IPFS
                            <i class="fa-solid fa-arrow-up-right-from-square"></i>
                          </a>
                        </li>
                      </ul>
                  }
                  
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
              </div>
            
            </div>
          ),
          width: '1020',
          showCloseButton: true,
          showCancelButton: false,
          showConfirmButton: false
        })
      }

    } catch (e) {
      errAlert(e, "Can't retrieve data")
    }
  }
  
  const extendCertificate = async(cpotbId, expTimestamp, jenisSediaan) =>{

    console.log(cpotbId, expTimestamp, jenisSediaan);
    try {
      const extendCertificateCt = await contracts.certificateManager.extendCpotb(cpotbId, expTimestamp)
      console.log(extendCertificateCt);

      if (extendCertificateCt) {
        MySwal.update({
          title: "Memproses transaksi...",
          text: "Proses transaksi sedang berlangsung, harap tunggu. ⏳"
        });
      }

      contracts.certificateManager.on('CertExtendRequest',  (factoryAddr, _timestamp) => {
        updateCpotbFb(extendCertificateCt.hash, Number(_timestamp), jenisSediaan);
        recordHashFb(extendCertificateCt.hash, Number(_timestamp), jenisSediaan)
        handleEventCpotb(factoryAddr, _timestamp, extendCertificateCt.hash)
      });
    } catch (error) {
      errAlert(error)
    }
  }

  const updateCpotbFb = async (cpotbHash, timestamp, jenisSediaan) => {
    try {
      const docRef = doc(db, 'cpotb_list', userdata.instanceName);

      await updateDoc(docRef, {
        [`${jenisSediaan}.extendHash`]: cpotbHash,
        [`${jenisSediaan}.extendTimestamp`]: timestamp, 
        [`${jenisSediaan}.status`]: 2 
      }); 
  
    } catch (err) {
      errAlert(err);
    }
  };

  const recordHashFb = async(txHash, timestamp, jenisSediaan) => {
    try {
      const collectionName = `pengajuan_cpotb_${userdata.instanceName}`
      const docRef = doc(db, 'transaction_hash', collectionName);
  
      await setDoc(docRef, {
        [`${jenisSediaan}`]: {
          'extend_request': {
            hash: txHash,
            timestamp: timestamp,
          }
        },
      }, { merge: true }); 
    } catch (err) {
      errAlert(err);
    }
  }

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
              {dataCpotb.length > 0 ? (
                <ul>
                  {dataCpotb.map((item, index) => (
                  <li key={index}>
                    <button className='title' onClick={() => getDetailCpotb(item.cpotbId)}>{item.jenisSediaan}</button>
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

export default ManageCpotb;