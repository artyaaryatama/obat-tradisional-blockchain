import { useEffect, useState } from 'react';
import { BrowserProvider, Contract } from "ethers";
import contractData from '../../auto-artifacts/deployments.json';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig"; 
import { create } from 'ipfs-http-client';
import imgLoader from '../../assets/images/loader.svg';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import './../../styles/SweetAlert.scss';

const MySwal = withReactContent(Swal);
const client = create({ url: 'http://127.0.0.1:5001/api/v0' });

function CpotbRenewRequest() {
  const [contracts, setContracts] = useState({});
  const navigate = useNavigate();
  const userdata = JSON.parse(sessionStorage.getItem('userdata'));
  const cpotbData = JSON.parse(sessionStorage.getItem('cpotbData'))
  const [dokumen, setDokumen] = useState({
    ipfsSuratPermohonanCpotb: null,
    ipfsBuktiPembayaranNegaraBukanPajak: null,
    ipfsSuratKomitmen: null,
    ipfsDenahBangunan: null,
    ipfsSistemMutu: null
  });
  // buat tampung ipfs baru
  const [updateFileIpfs, setUpdateFileIpfs] = useState([])
  const [loader, setLoader] = useState(false);
  const [rejectMsg, setRejectMsg] = useState("");
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
  
  const today = new Date();
  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  };
  const formattedDate = today.toLocaleDateString('id-ID', options);

  const labelMapping = {
    ipfsDenahBangunan: "Denah Bangunan Pabrik",
    ipfsSistemMutu: "Dokumen Sistem Mutu CPOTB",
    ipfsSuratPermohonanCpotb: "Surat Permohonan CPOTB",
    ipfsSuratKomitmen: 'Surat Pernyataan Komitmen',
    ipfsBuktiPembayaranNegaraBukanPajak: 'Bukti Pembayaran Negara Bukan Pajak'
  };

  useEffect(() => {
    document.title = "Pengajuan Ulang CPOTB"; 
  }, []);

  useEffect(() => {
    async function connectWallet() {
      if (window.ethereum) {
        const provider = new BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new Contract(
          contractData.CertificateManager.address, 
          contractData.CertificateManager.abi, 
          signer
        );
        setContracts({ certificateManager: contract });
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
      if (!contracts.certificateManager) return;
      const detailCpotbCt = await contracts.certificateManager.getCpotbDetails(cpotbData.idCpotb);
      const rejectMsgCt = await contracts.certificateManager.getRejectMsgCpotb(cpotbData.idCpotb);
      const [suratPermohonan, buktiPembayaranNegaraBukanPajak, suratKomitmen] = detailCpotbCt[2];
      const [denahBangunan, sistemMutu] = detailCpotbCt[3];

      setRejectMsg(rejectMsgCt);
      setDokumen({
        ipfsSuratPermohonanCpotb: suratPermohonan,
        ipfsBuktiPembayaranNegaraBukanPajak: buktiPembayaranNegaraBukanPajak,
        ipfsSuratKomitmen: suratKomitmen,
        ipfsDenahBangunan: denahBangunan,
        ipfsSistemMutu: sistemMutu
      });

    };
    loadData();
  }, [contracts]);

  const handleEventCpotbRenewRequested = (timestamp, txHash) => {

    const formattedTimestamp = new Date(Number(timestamp) * 1000).toLocaleDateString('id-ID', options)
  
    MySwal.fire({
      title: "Sukses mengajukan ulang CPOTB",
      html: (
        <div className='form-swal event'>
          <ul>
            <li className="label">
              <p>Nomor CPOTB</p> 
            </li>
            <li className="input">
              <p>{cpotbData.cpotbNumber}</p> 
            </li>
          </ul>
          <ul>
            <li className="label">
              <p>Jenis Sediaan</p> 
            </li>
            <li className="input">
              <p>{cpotbData.jenisSediaan}</p> 
            </li>
          </ul>
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
              <p>{userdata.address}</p> 
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
        navigate('/cpotb')
      }
    });
  }

  const handleFileChange = (e, key) => {
    const file = e.target.files[0];
    if (!file || file.type !== "application/pdf") {
      MySwal.fire({
        title: 'Harap upload file PDF',
        icon: 'error',
        confirmButtonText: 'Coba Lagi'
      });
      return;
    }

    console.log(key);

    setDokumen(prev => ({
      ...prev,
      [key]: file
    }));

    setUpdateFileIpfs(prev => [...prev, key]);

  };

  const uploadToIPFS = async (file) => {
    if (!file) return null;
    try {
      const result = await client.add(file);
      console.log(result);
      return result.path;  
    } catch (error) {
      console.error("Upload failed:", error);
      MySwal.fire({
        title: "Gagal mengunggah dokumen pengajuan ulang CPOTB!",
        text: "IPFS mungkin tidak aktif atau terjadi error saat mengunggah dokumen.",
        icon: "error",
        confirmButtonText: "Coba Lagi"
      });
      return null;
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoader(true);
    console.log(dokumen);
    const uploadedHashes = {};
    
    for (const key of updateFileIpfs) {  
      const file = dokumen[key];
      if (file instanceof File) {

        try {
          const hash = await uploadToIPFS(file);
          if (hash) {
            uploadedHashes[key] = hash;
          }
          
        } catch (error) {
          MySwal.fire({
            title: "Gagal mengunggah dokumen pengajuan ulang CPOTB!",
            text: "IPFS mungkin tidak aktif atau terjadi error saat mengunggah dokumen.",
            icon: "error",
            confirmButtonText: "Coba Lagi"
          });
        }
      }
    }
    
    console.log(uploadedHashes);
    let updatedDokumen;
    if (Object.keys(uploadedHashes).length > 0) {
      setDokumen(prev => {
        updatedDokumen = { ...prev };
        updateFileIpfs.forEach(item => {
          if (uploadedHashes[item]) {
            updatedDokumen[item] = uploadedHashes[item]; 
          }
        });
  
        return updatedDokumen;
      });
    }

    if (uploadedHashes.length !== 0) {
      MySwal.fire({
        title: 'Dokumen Pengajuan Ulang CPOTB',
        html: (
          <div className='form-swal'>
            <div className="row row--obat table-like">
              <div class="col">
                <div class="doku">
                  {Object.entries(uploadedHashes).map(([key, hash]) => (
                    <ul key={key}>
                      <li class="label label-2">
                        <p>{key.replace('ipfs', '').replace(/([A-Z])/g, ' $1')}</p>
                      </li>
                      <li class="input input-2">
                      <a
                        href={`http://localhost:8080/ipfs/${hash}`}  
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Lihat dokumen ↗ (${hash})
                      </a>
                      </li>
                    </ul>
                  ))}
  
                </div>
              </div>
            </div>
          </div>
        ),
        width: '900',
        showCancelButton: true,
        confirmButtonText: 'Konfirmasi Pengajuan CPOTB',
        cancelButtonText: 'Batal',
        allowOutsideClick: false
      }).then(result => {
        if (result.isConfirmed) {
          console.log(updatedDokumen);
          MySwal.fire({
            title: "Menunggu koneksi Metamask...",
            text: "Jika proses ini memakan waktu terlalu lama, coba periksa koneksi Metamask Anda. 🚀",
            icon: 'info',
            showCancelButton: false,
            showConfirmButton: false,
            allowOutsideClick: false,
          });
          renewRequestCpotb(updatedDokumen)
        }
      });
      setLoader(false);
      
    } else{
      MySwal.fire({
        title: "Gagal mengunggah dokumen ke IPFS!",
        text: "Harap masukkan ulang semua dokumen yang ingin diubah.",
        icon: "error",
        confirmButtonText: "Coba Lagi",
        didOpen: () => {
          const actions = Swal.getActions();
          actions.style.justifyContent = "center";
        }
      });
      setLoader(false);
    }
    
  };

  const renewRequestCpotb = async (hashDocs) => {
    try {
      console.log(        
        [cpotbData.idCpotb, userdata.name, userdata.instanceName, userdata.address],
        [hashDocs.ipfsSuratPermohonanCpotb, hashDocs.ipfsBuktiPembayaranNegaraBukanPajak, hashDocs.ipfsSuratKomitmen],
        [hashDocs.ipfsDenahBangunan, hashDocs.ipfsSistemMutu]);
      const renewRequestCpotbCt = await contracts.certificateManager.renewCpotb(
        [cpotbData.idCpotb, userdata.name, userdata.instanceName, userdata.address],
        [hashDocs.ipfsSuratPermohonanCpotb, hashDocs.ipfsBuktiPembayaranNegaraBukanPajak, hashDocs.ipfsSuratKomitmen],
        [hashDocs.ipfsDenahBangunan, hashDocs.ipfsSistemMutu]
      );

      console.log('Receipt:', renewRequestCpotbCt);
  
      if(renewRequestCpotbCt){
        
        MySwal.update({
          title: "Memproses transaksi...",
          text: "Proses transaksi sedang berlangsung, harap tunggu. ⏳"
        });
      }
      
      contracts.certificateManager.on("CertRenewRequest", (_isntanceName, _instanceAddr, _timestampRenew) => {
        writeCpotbFb( userdata.instanceName, jenisSediaanMap[parseInt(cpotbData.jenisSediaan)], renewRequestCpotbCt.hash, Number(_timestampRenew) );
        recordHashFb(jenisSediaanMap[parseInt(cpotbData.jenisSediaan)], renewRequestCpotbCt.hash, Number(_timestampRenew) );
        handleEventCpotbRenewRequested(_isntanceName, _instanceAddr, _timestampRenew, renewRequestCpotbCt.hash);
      });
  
    } catch (err) {
      errAlert(err, "Error making request!");
    }
  }

  const writeCpotbFb = async (instanceName, jenisSediaan, requestCpotbCtHash, timestamp) => {
    try {
      const docRef = doc(db, 'cpotb_list', instanceName);

      console.log(jenisSediaan);
  
      await setDoc(docRef, {
        [`${jenisSediaan}`]: {
          renewRequestHash: requestCpotbCtHash,
          renewRequestTimestamp: timestamp,
          status: 3
        },
      }, { merge: true }); 
    } catch (err) {
      errAlert(err);
    }
  };

  const recordHashFb = async(jenisSediaan, txHash, timestamp) => {
    try {
      const collectionName = `pengajuan_cpotb_${userdata.instanceName}`
      const docRef = doc(db, 'transaction_hash', collectionName);
  
      await setDoc(docRef, {
        [`${jenisSediaan}`]: {
          'renew_request': {
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
    <div id="CpotbPage" className='Layout-Menu layout-page'>
      <div className="title-menu">
        <h1>Pengajuan Ulang Sertifikat CPOTB</h1>
      </div>
      <div className='container-form pengajuan-ulang'>
        <form onSubmit={handleSubmit}>
          <ul>
            <li className="label"><label>Tanggal Pengajuan Ulang</label></li>
            <li className="input"><p>{formattedDate}</p></li>
          </ul>
          <ul>
            <li className="label"><label>Alasan Penolakan CPOTB</label></li>
            <li className="input reject cpotb"><p>{rejectMsg}</p></li>
          </ul> 
          <div className="doku">
            <h5>Dokumen Teknis</h5>
            {['ipfsDenahBangunan', 'ipfsSistemMutu'].map((key) => (
              <ul key={key}>
                <li className="label">
                  <label>{labelMapping[key]}</label>
                </li>
                <li className="input">
                  <input type="file" accept="application/pdf" onChange={(e) => handleFileChange(e, key)} />
                  {dokumen[key] && (
                    <a href={`http://localhost:8080/ipfs/${dokumen[key]}`} target="_blank" rel="noopener noreferrer">
                      Lihat {key.replace('ipfs', '').replace(/([A-Z])/g, ' $1')}
                      <i className="fa-solid fa-arrow-up-right-from-square"></i>
                    </a>
                  )}
                </li>
              </ul>
            ))}
          </div>
          <div className="doku">
            <h5>Dokumen Administrasi</h5>
            {['ipfsSuratPermohonanCpotb', 'ipfsBuktiPembayaranNegaraBukanPajak', 'ipfsSuratKomitmen'].map((key) => (
              <ul key={key}>
                <li className="label">
                  <label>{labelMapping[key]}</label>
                </li>
                <li className="input">
                  <input type="file" accept="application/pdf" onChange={(e) => handleFileChange(e, key)} />
                  {dokumen[key] && (
                    <a href={`http://localhost:8080/ipfs/${dokumen[key]}`} target="_blank" rel="noopener noreferrer">
                      Lihat  {key.replace('ipfs', '').replace(/([A-Z])/g, ' $1')}
                      <i className="fa-solid fa-arrow-up-right-from-square"></i>
                    </a>
                  )}
                </li>
              </ul>
            ))}
          </div>

          <button type="submit" disabled={loader}>
            {loader ? <img src={imgLoader} alt="loading..." /> : "Kirim Pengajuan Ulang CPOTB"}
          </button>
        </form>
      </div>
    </div>
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

export default CpotbRenewRequest;
