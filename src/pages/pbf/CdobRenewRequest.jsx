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

function CdobRenewRequest() {
  const [contracts, setContracts] = useState({});
  const navigate = useNavigate();
  const userdata = JSON.parse(sessionStorage.getItem('userdata'));
  const idCdob = JSON.parse(sessionStorage.getItem('idCdob'))
  const [tipePermohonan, setTipePermohonan] = useState('')
  const [dokumen, setDokumen] = useState({
    ipfsSuratPermohonanCdob: null,
    ipfsBuktiPembayaran: null,
    ipfsSuratIzinCdob: null,
    ipfsDenahBangunanPbf: null,
    ipfsStrukturOrganisasi: null,
    ipfsDaftarPeralatan: null,
    ipfsDaftarPersonalia: null,
    ipfsEksekutifQualityManagement: null,
    ipfsSuratIzinApoteker: null,
    ipfsDokumenSelfAssesment: null
  });
  // buat tampung ipfs baru
  const [updateFileIpfs, setUpdateFileIpfs] = useState([])
  const [loader, setLoader] = useState(false);
  const [rejectMsg, setRejectMsg] = useState("");
  const tipePermohonanMap = {
    0: "ObatLain",
    1: "CCP"
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
    ipfsSuratPermohonanCdob: "Surat Permohonan CDOB",
    ipfsBuktiPembayaran: "Bukti Pembayaran Pajak",
    ipfsSuratIzinCdob: "Surat Izin CDOB",
    ipfsDenahBangunanPbf: "Denah Bangunan PBF",
    ipfsStrukturOrganisasi: "Struktur Organisasi",
    ipfsDaftarPeralatan: "Daftar Peralatan",
    ipfsDaftarPersonalia: "Daftar Personalia",
    ipfsEksekutifQualityManagement: "Ringkasan Eksekutif Quality Management System",
    ipfsSuratIzinApoteker: "Surat Izin Apoteker",
    ipfsDokumenSelfAssesment: "Dokumen Self Assesment"
  };
  
  useEffect(() => {
    document.title = "Pengajuan Ulang CDOB"; 
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
  }, []);

  useEffect(() => {
    const loadData = async () => {
      if (!contracts.certificateManager) return;
      
      const idCdob = JSON.parse(sessionStorage.getItem('idCdob'));
      if (!idCdob) return;

      const detailCdobCt = await contracts.certificateManager.getCdobDetails(idCdob);
      const rejectMsgCt = await contracts.certificateManager.getRejectMsgCdob(idCdob);

      const [cdobId, cdobNumber, tipePermohonan] = detailCdobCt[1]
      const [suratPermohonan, buktiPembayaran] = detailCdobCt[2];
      const [suratIzinCdob, denah, strukturOrganisasi, daftarPersonalia, daftarPeralatan, eksekutifQualityManagement, suratIzinApoteker, dokumenSelfAsses] = detailCdobCt[3];


      setTipePermohonan(tipePermohonan)
      setRejectMsg(rejectMsgCt);
      setDokumen({
        ipfsSuratPermohonanCdob: suratPermohonan,
        ipfsBuktiPembayaran: buktiPembayaran,
        ipfsSuratIzinCdob: suratIzinCdob,
        ipfsDenahBangunanPbf: denah,
        ipfsStrukturOrganisasi: strukturOrganisasi,
        ipfsDaftarPeralatan: daftarPeralatan,
        ipfsDaftarPersonalia: daftarPersonalia,
        ipfsEksekutifQualityManagement: eksekutifQualityManagement,
        ipfsSuratIzinApoteker: suratIzinApoteker,
        ipfsDokumenSelfAssesment: dokumenSelfAsses
      });

    };
    loadData();
  }, [contracts]);

  const handleEventCdobRenewRequested = (pabrikInstance, pabrikAddr, timestamp, txHash) => {

    const formattedTimestamp = new Date(Number(timestamp) * 1000).toLocaleDateString('id-ID', options)
  
    MySwal.fire({
      title: "Sukses mengajukan ulang CDOB",
      html: (
        <div className='form-swal event'>
          <ul>
            <li className="label">
              <p>Nama Instansi PBF</p> 
            </li>
            <li className="input">
              <p>{pabrikInstance}</p> 
            </li>
          </ul>
          <ul className='klaim'>
            <li className="label">
              <p>Alamat Akun PBF (Pengguna)</p> 
            </li>
            <li className="input">
              <p>{pabrikAddr}</p> 
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
        navigate('/cdob')
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
        title: "Gagal mengunggah dokumen pengajuan ulang CDOB!",
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
            title: "Gagal mengunggah dokumen pengajuan ulang CDOB!",
            text: "IPFS mungkin tidak aktif atau terjadi error saat mengunggah dokumen.",
            icon: "error",
            confirmButtonText: "Coba Lagi",
            didOpen: () => {
              const actions = Swal.getActions();
              actions.style.justifyContent = "center";
            }
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
        title: 'Dokumen Pengajuan Ulang CDOB',
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
        width: '960',
        showCancelButton: true,
        confirmButtonText: 'Konfirmasi Pengajuan',
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
          renewRequestCdob(updatedDokumen)
        }
      });
      setLoader(false);
    } else {
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

  const renewRequestCdob = async (hashDocs) => {
    try {
      const renewRequestCdobCt = await contracts.certificateManager.renewCdob(
        [idCdob, userdata.name, userdata.instanceName, userdata.address], 
        [hashDocs.ipfsSuratPermohonanCdob, hashDocs.ipfsBuktiPembayaran],
        [hashDocs.ipfsSuratIzinCdob, hashDocs.ipfsDenahBangunanPbf, hashDocs.ipfsStrukturOrganisasi, hashDocs.ipfsDaftarPersonalia, hashDocs.ipfsDaftarPeralatan, hashDocs.ipfsEksekutifQualityManagement, hashDocs.ipfsSuratIzinApoteker, hashDocs.ipfsDokumenSelfAssesment]
      );

      console.log('Receipt:', renewRequestCdobCt);
  
      if(renewRequestCdobCt){
        
        MySwal.update({
          title: "Memproses transaksi...",
          text: "Proses transaksi sedang berlangsung, harap tunggu. ⏳"
        });
      }
      
      contracts.certificateManager.on("CertRenewRequest", (_instance, _userAddr, _timestampRenew) => {
        writeCdobFb( userdata.instanceName, tipePermohonan, renewRequestCdobCt.hash, Number(_timestampRenew) );
        recordHashFb(tipePermohonan, renewRequestCdobCt.hash, Number(_timestampRenew) );
        handleEventCdobRenewRequested(_instance, _userAddr, _timestampRenew, renewRequestCdobCt.hash);
      });
  
    } catch (err) {
      errAlert(err, "Error making request!");
    }
  }

  const writeCdobFb = async (instanceName, tipePermohonan, requestCdobCtHash, timestamp) => {

    const tp = {
      0n: 'Obat Lain',
      1n: 'Cold Chain Product'
    };

    const tipeP = tp[tipePermohonan]

    try {
      const docRef = doc(db, 'cdob_list', instanceName);

      await setDoc(docRef, {
        [`${tipeP}`]: {
          renewRequestHash: requestCdobCtHash,
          renewRequestTimestamp: timestamp,
          status: 0
        },
      }, { merge: true }); 
    } catch (err) {
      errAlert(err);
    }
  };

  const recordHashFb = async(tp, txHash, timestamp) => {

    const tpMap = {
      0n: 'Obat Lain',
      1n: 'Cold Chain Product'
    };

    const tipeP = tpMap[tp]

    try {
      const collectionName = `pengajuan_cdob_${userdata.instanceName}`
      const docRef = doc(db, 'transaction_hash', collectionName);
  
      await setDoc(docRef, {
        [`${tipeP}`]: {
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
        <h1>Pengajuan Ulang Sertifikat CDOB</h1>
      </div>
      <div className='container-form pengajuan-ulang'>
        <form onSubmit={handleSubmit}>
          <ul>
            <li className="label"><label>Tanggal Pengajuan Ulang</label></li>
            <li className="input"><p>{formattedDate}</p></li>
          </ul>
          <ul>
            <li className="label"><label>Alasan Penolakan CDOB</label></li>
            <li className="input reject"><p>{rejectMsg}</p></li>
          </ul>

          <div className="doku">
            <h5>Dokumen Administrasi</h5>
            {['ipfsSuratPermohonanCdob', 'ipfsBuktiPembayaran'].map((key) => (
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
            <h5>Dokumen Teknis</h5>
            {['ipfsSuratIzinCdob', 'ipfsDenahBangunanPbf', 'ipfsEksekutifQualityManagement', 'ipfsStrukturOrganisasi', 'ipfsDaftarPersonalia', 'ipfsDaftarPeralatan', 'ipfsSuratIzinApoteker', 'ipfsDokumenSelfAssesment'].map((key) => (
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

          <button type="submit" disabled={loader}>
            {loader ? <img src={imgLoader} alt="loading..." /> : "Kirim Pengajuan Ulang CDOB"}
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

export default CdobRenewRequest;
