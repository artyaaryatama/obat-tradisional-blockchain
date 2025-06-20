import { useEffect, useState } from 'react';
import { BrowserProvider, Contract } from "ethers";
import contractData from '../../auto-artifacts/deployments.json';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { create } from 'ipfs-http-client';
import imgLoader from '../../assets/images/loader.svg';
import "../../styles/MainLayout.scss";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import './../../styles/SweetAlert.scss';
import JenisSediaanTooltip from '../../components/TooltipJenisSediaan';
import dummyPdf from '../../assets/dummy.pdf'
import dummyPdf2 from '../../assets/dummy2.pdf'
import dummyPdf3 from '../../assets/dummy3.pdf'

const MySwal = withReactContent(Swal);
const client = create({ url: 'http://127.0.0.1:5001/api/v0' });

function CdobRequest() {
  const [contract, setContract] = useState();
  const navigate = useNavigate();
  const userdata = JSON.parse(sessionStorage.getItem('userdata')) || {};
  const [cdobData, setCdobData] = useState([]);
  const [suratIzin, setSuratIzin] = useState(null);
  const [denah, setDenah] = useState(null);
  const [strukturOrganisasi, setStrukturOrganisasi] = useState(null);
  const [daftarPeralatan, setDaftarPeraltan] = useState(null);
  const [daftarPersonalia, setDaftarPersonalia] = useState(null);
  const [eksekutifQualityManagement, setEksekutifQualityManagement] = useState(null);
  const [suratIzinApoteker, setSuratIzinApoteker] = useState(null);
  const [dokSelfAsses, setDokSelfAsses] = useState(null);
  const [suratPermohonan, setSuratPermohonan] = useState(null);
  const [buktiPembayaran, setBuktiPembayaran] = useState(null);
  const [tipePermohonan, setTipePermohonan] = useState('CCP'); 
  const [loader, setLoader] = useState(false)

  const today = new Date();
  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  }
  const formattedDate = today.toLocaleDateString('id-ID', options);

  const tp = {
    0n: "Obat Lain",
    1n: "Cold Chain Product (CCP)"
  };

  const tipePermohonanMap = {
    'ObatLain': 'Obat Lain',
    'CCP' : "Cold Chain Product (CCP)"
  }

  useEffect(() => {
    document.title = "Pengajuan CDOB"; 
  }, []);

  useEffect(() => {
    async function connectWallet() {
      if (window.ethereum) {
        try {
          const provider = new BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const contr = new Contract(
            contractData.CertificateManager.address, 
            contractData.CertificateManager.abi, 
            signer
          );
            
          setContract(contr);
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
    const fetchDataCpotb = async () => {
      if(contract) { 
        try {
          console.log(userdata.instanceName);
          const listAllCt = await contract.getCdobByInstance(userdata.instanceName);
          console.log(listAllCt);
          
          const tp2 = {
            0n: "ObatLain",
            1n: "CCP"
          };

          const reconstructedData = listAllCt.map((item) => {

            return { 
              tipePermohonan: tp2[item[3]],
            };
          });
  
          setCdobData(reconstructedData);
  
        } catch (error) {
          errAlert(error, "Error loading data.")
        }
      }

    }

    fetchDataCpotb()
  }, [])

  const checkExistingCdob = () => {
    if (cdobData.length > 0) {
      const found = cdobData.some((item) => item.tipePermohonan === tipePermohonan);

      if (found){
        return false
      } else {
        return true
      }
    } else {
      return true
    }

  }

  const handleEventCdobRequested =  (_instanceName, _userAddr, _tipePermohonan, _timestampRequest, txHash) => {
    
    const formattedTimestamp = new Date(Number(_timestampRequest) * 1000).toLocaleDateString('id-ID', options)
  

    MySwal.fire({
      title: "Pengajuan Sertifikat CDOB Berhasil",
      html: (
        <div className='form-swal event'>
          <ul>
            <li className="label">
              <p>Nama Instansi PBF</p> 
            </li>
            <li className="input">
              <p>{_instanceName}</p> 
            </li>
          </ul>
          <ul className='klaim'>
            <li className="label">
              <p>Alamat Akun PBF (Pengguna)</p> 
            </li>
            <li className="input">
              <p>{_userAddr}</p> 
            </li>
          </ul>
          <ul>
            <li className="label">
              <p>Tipe Permohonan</p> 
            </li>
            <li className="input">
              <p>{tp[_tipePermohonan]}</p> 
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
        navigate('/cdob');
      }
    });
  
    setLoader(false)
  }

  const reconstructedHashes = (uploadedHashes) => {
    const hashes = {};

    Object.entries(uploadedHashes).forEach(([key, value]) => {
      const formattedKey = key.toLowerCase().replace(/\s+/g, '_'); 
      hashes[formattedKey] = value;
    });

    return hashes;
  };

  const uploadDocuIpfs = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    let uploadedHashes;    

    MySwal.fire({
      title: "Mengunggah semua dokumen ke IPFS...",
      text: "Harap tunggu. Jika proses ini memakan waktu terlalu lama, coba periksa koneksi IPFS. 🚀",
      icon: 'info',
      showCancelButton: false,
      showConfirmButton: false,
      allowOutsideClick: true,
    });
    
    const isCdobExist = checkExistingCdob();
    console.log(isCdobExist);
    console.log(tipePermohonan);
    console.log(tipePermohonanMap[tipePermohonan]);

    if (isCdobExist) {
      try {
        
        uploadedHashes = await uploadAllDocuments();
        console.log(uploadedHashes);
        console.log(2);
        
        MySwal.fire({
          title: `Konfirmasi pengajuan CDOB`,
          html: `
              <div class="form-swal">
                  <div class="row row--obat table-like">
                      <div class="col doku">
                          <ul>
                              <li class="label label-2"><p>Nama PBF</p></li>
                              <li class="input input-2"><p>${userdata.instanceName}</p></li>
                          </ul>
                          <ul>
                              <li class="label label-2"><p>Tipe Permohonan</p></li>
                              <li class="input input-2"><p>${tipePermohonanMap[tipePermohonan]}</p></li>
                          </ul>
    
                          <div class="doku">
                              ${Object.entries(uploadedHashes).map(([docName, hash]) => `
                                <ul>
                                  <li class="label label-2"><p>${docName}</p></li>
                                  <li class="input input-2">
                                  ${hash !== "Gagal Upload" 
                                    ? `<a href="http://localhost:8080/ipfs/${hash}" target="_blank">
                                     Lihat dokumen ↗ (${hash})
                                    </a>` 
  
  
                                    : `<span style="color: red;">${hash}</span>`}
                                   
                                  </li>
                                </ul>
                                  `)
                                  .join("")}
                          </div>
                      </div>
                  </div>
              </div>
          `,
          width: '960',
          showCancelButton: true,
          confirmButtonText: 'Konfirmasi',
          cancelButtonText: "Batal",
          allowOutsideClick: false,
          customClass: {
            htmlContainer: 'scrollable-modal'
          },
        }).then((result) => {
            if (result.isConfirmed) {
              MySwal.fire({
                title: "Mempersiapkan transaksi...",
                text: "Proses transaksi sedang berlangsung, harap tunggu. ⏳",
                icon: "info",
                showConfirmButton: false,
              });
              const hashDocs = reconstructedHashes(uploadedHashes);
              console.log(hashDocs);
              requestCdob(hashDocs);
            }
        });
  
      } catch (error) {
        MySwal.fire({
          title: "Gagal mengunggah dokumen pengajuan CDOB!",
          text: "IPFS mungkin tidak aktif atau terjadi error saat mengunggah dokumen.",
          icon: "error",
          confirmButtonText: "Coba Lagi",
          didOpen: () => {
            const actions = Swal.getActions();
           actions.style.justifyContent = "center";
          }
        });
        
      }
    } else {
      
      MySwal.fire({
        title: 'Pengajuan CDOB gagal',
        text: `Maaf, ${userdata.instanceName} sudah pernah mengajukan CDOB untuk tipe permohonan ${tipePermohonanMap[tipePermohonan]}.`,
        icon: 'error',
        confirmButtonText: 'Coba Lagi',
        didOpen: () => {
          const actions = Swal.getActions();
          actions.style.justifyContent = "center";
        }
      });
  
      setLoader(false);
    }



  };  

  const uploadAllDocuments = async () => {
    const files = {
      "Surat Permohonan CDOB": suratPermohonan,
      "Bukti Pembayaran Pajak": buktiPembayaran,
      "Surat Izin": suratIzin,
      "Denah PBF": denah,
      "Struktur Organisasi": strukturOrganisasi,
      "Daftar Personalia": daftarPersonalia,
      "Daftar Peralatan": daftarPeralatan,
      "Ringkasan Eksekutif Quality Management System": eksekutifQualityManagement,
      "Surat Izin Apoteker": suratIzinApoteker,
      "Dokumen Self Assessment": dokSelfAsses, 
    };

    let uploadedHashes = {};

    const fileEntries = Object.entries(files).filter(([_, file]) => file);

    const uploadPromises = fileEntries.map(async ([docName, file], index) => {
        try {
          const result = await client.add(file, {
            progress: (bytes) => {
              console.log(`📤 ${docName}: ${bytes} bytes uploaded`);
            }
          });
          
          uploadedHashes[docName] = result.path;
        } catch (error) {
          return uploadedHashes = false;
        }
    });

    await Promise.all(uploadPromises);
    return uploadedHashes;
  };

  const requestCdob = async (hashDocs) => {

    setLoader(true)
    console.log(userdata.address);

    MySwal.fire({
      title: "Menunggu koneksi Metamask...",
      text: "Jika proses ini memakan waktu terlalu lama, coba periksa koneksi Metamask Anda. 🚀",
      icon: "info",
      showConfirmButton: false
    });

    const tp = {
      "ObatLain": 0n,
      "CCP": 1n
    };

    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0'); 
    const year = today.getFullYear();
    const randomNumber = Math.floor(100000 + Math.random() * 900000); 

    const id = `cdob-${day}${month}${year}-${randomNumber}` 

    console.log(userdata.instanceName, id, userdata.name, tp[tipePermohonan]);

    try {
      const tipePermohonanInt = tp[tipePermohonan]
      console.log(
        [id, userdata.name, userdata.instanceName, userdata.address], tipePermohonanInt,
        [hashDocs.surat_permohonan_cdob, hashDocs.bukti_pembayaran_pajak],

      );
      const requestCdobCt = await contract.requestCdob(
        [id, userdata.name, userdata.instanceName, userdata.address], tipePermohonanInt,
        [hashDocs.surat_permohonan_cdob, hashDocs.bukti_pembayaran_pajak],
        [hashDocs.surat_izin, hashDocs.denah_pbf, hashDocs.struktur_organisasi, hashDocs.daftar_personalia, hashDocs.daftar_peralatan, hashDocs.ringkasan_eksekutif_quality_management_system, hashDocs.surat_izin_apoteker, hashDocs.dokumen_self_assessment]
      );
      console.log('Receipt:', requestCdobCt);

      if(requestCdobCt){
        
        MySwal.update({
          title: "Memproses transaksi...",
          text: "Proses transaksi sedang berlangsung, harap tunggu. ⏳"
        });
      }
      
      contract.on("CertRequested", (_instanceName, _userAddr, _tipePermohonan, _timestampRequest) => {
        writeCdobFb(userdata.instanceName, tipePermohonan, requestCdobCt.hash, Number(_timestampRequest))
        recordHashFb(tipePermohonan, requestCdobCt.hash, Number(_timestampRequest))
        handleEventCdobRequested(_instanceName, _userAddr, _tipePermohonan, _timestampRequest, requestCdobCt.hash);
      });

    } catch (err) {
      setLoader(false)
      errAlert(err, "Gagal mengirim transaksi pengajuan CDOB.");
    }
  };

  const handleOptionTipePermohonan = (e) => {
    setTipePermohonan(e.target.value);
    console.log("Selected value:", e.target.value);
  };

  const writeCdobFb = async (instanceName, tipePermohonan, requestCdobCtHash, timestamp) => {

    const tp = {
      "ObatLain": "Obat Lain",
      "CCP": "Cold Chain Product"
    };

    const tipeP = tp[tipePermohonan]

    try {
      const docRef = doc(db, 'cdob_list', instanceName);
      const docRefUser = doc(db, 'company_data', instanceName)

      const companyData = await getDoc(docRefUser);

      if (!companyData.exists()) {
        await setDoc(docRefUser, {
          userNib: userdata.nib,
          userLocation: userdata.location,
          userAddr: userdata.address
        });
      } else {
        console.log("Data perusahaan telah tersimpan di database.");
      } 

      await setDoc(docRef, {
        [`${tipeP}`]: {
          requestHash: requestCdobCtHash,
          requestTimestamp: timestamp,
          status: 0
        },
      }, { merge: true }); 
    } catch (err) {
      errAlert(err);
    }
  };

  const recordHashFb = async(tp, txHash, timestamp) => {

    const tpMap = {
      "ObatLain": "Obat Lain",
      "CCP": "Cold Chain Product"
    };

    const tipeP = tpMap[tipePermohonan]

    try {
      const collectionName = `pengajuan_cdob_${userdata.instanceName}`
      const docRef = doc(db, 'transaction_hash', collectionName);
  
      await setDoc(docRef, {
        [`${tipeP}`]: {
          'request': {
            hash: txHash,
            timestamp: timestamp,
          }
        },
      }, { merge: true }); 
    } catch (err) {
      errAlert(err);
    }
  }

  const handleFileChange = (e, setFile) => {
    const file = e.target.files[0];

    if (!file) return;
  
    if (file.type !== "application/pdf") {
      MySwal.fire({
        title: 'Maaf, harap upload ulang file dengan format PDF',
        icon: 'error',
        confirmButtonText: 'Coba Lagi',
        didOpen: () => {
          const actions = Swal.getActions();
          actions.style.justifyContent = "center";
        }
      });
    }

  
    setFile(file);
  };

  const handleAutoFillAndUploadToIPFS = async () => {
  const fetchBlob = async (url) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch dummy file from ${url}`);
    return await res.blob();
  };
  const [blob1, blob2, blob3] = await Promise.all([
    fetchBlob(dummyPdf),
    fetchBlob(dummyPdf2),
    fetchBlob(dummyPdf3),
  ]);
  const filesMap = {
    suratPermohonan: new File([blob1], "permohonan_cdob.pdf", { type: "application/pdf" }),
    buktiPembayaran: new File([blob2], "bukti_pajak_cdob.pdf", { type: "application/pdf" }),
    suratIzin: new File([blob1], "surat_izin_cdob.pdf", { type: "application/pdf" }),
    denah: new File([blob2], "denah_pbf_cdob.pdf", { type: "application/pdf" }),
    strukturOrganisasi: new File([blob3], "struktur_organisasi_cdob.pdf", { type: "application/pdf" }),
    daftarPersonalia: new File([blob1], "daftar_personalia_cdob.pdf", { type: "application/pdf" }),
    daftarPeralatan: new File([blob2], "daftar_peralatan_cdob.pdf", { type: "application/pdf" }),
    eksekutifQualityManagement: new File([blob3], "ringkasan_qms_cdob.pdf", { type: "application/pdf" }),
    suratIzinApoteker: new File([blob1], "izin_apoteker_cdob.pdf", { type: "application/pdf" }),
    dokSelfAsses: new File([blob2], "self_assessment_cdob.pdf", { type: "application/pdf" }),
  };
  setSuratPermohonan(filesMap.suratPermohonan);
  setBuktiPembayaran(filesMap.buktiPembayaran);
  setSuratIzin(filesMap.suratIzin);
  setDenah(filesMap.denah);
  setStrukturOrganisasi(filesMap.strukturOrganisasi);
  setDaftarPersonalia(filesMap.daftarPersonalia);
  setDaftarPeraltan(filesMap.daftarPeralatan);
  setEksekutifQualityManagement(filesMap.eksekutifQualityManagement);
  setSuratIzinApoteker(filesMap.suratIzinApoteker);
  setDokSelfAsses(filesMap.dokSelfAsses);
  await uploadDocuIpfs();
  };

  return (
    <div id="CpotbPage" className='Layout-Menu layout-page'>
      <div className="title-menu">
        <h1>Pengajuan Data Sertifikat CDOB Baru</h1>
      </div>
      <div className='container-form'>
        <form onSubmit={uploadDocuIpfs}>
          <ul>
            <li className="label">
              <label htmlFor="formatedDate">Tanggal Pengajuan</label>
            </li>
            <li className="input">
              <p>{formattedDate}</p>
            </li>
          </ul>
          <ul>
            <li className="label">
              <label htmlFor="instanceName">Diajukan oleh</label>
            </li>
            <li className="input">
              <p>{userdata.instanceName}</p>
            </li>
          </ul>
          <ul>
            <li className="label">
              <label htmlFor="instanceName">NIB PBF</label>
            </li>
            <li className="input">
              <p>{userdata.nib}</p>
            </li>
          </ul>
          <ul>
            <li className="label">
              <label htmlFor="instanceName">NPWP PBF</label>
            </li>
            <li className="input">
              <p>{userdata.npwp}</p>
            </li>
          </ul>

          <ul>
            <li className="label">
              <label htmlFor="tipePermohonan">Tipe Permohonan</label>
            </li>
            <li className="input col">
              <select
                name="tipePermohonan"
                id="tipePermohonan"
                value={tipePermohonan}
                onChange={handleOptionTipePermohonan}
              >
                <option value="" disabled>Pilih tipePermohonan</option>
                <option value="CCP">Cold Chain Product (CCP)</option>
                <option value="ObatLain">Obat Lain</option>
              </select>
              <JenisSediaanTooltip
                jenisSediaan={tipePermohonan}
              />
            </li>
          </ul>
          <div className="doku">
            <h5>Dokumen Teknis</h5>
            <ul>
              <li className="label">
                <label htmlFor="instanceName">Surat Permohonan CDOB</label>
              </li>
              <li className="input">
                <input type="file" accept="application/pdf" name="instanceName" onChange={(e) => handleFileChange(e, setSuratPermohonan)} required/>
              </li>
            </ul>
            <ul>
              <li className="label">
                <label htmlFor="instanceName">Bukti Pembayaran Pajak</label>
              </li>
              <li className="input">
                <input type="file" accept="application/pdf" name="instanceName" onChange={(e) => handleFileChange(e, setBuktiPembayaran)} required/>
              </li>
            </ul>
          </div>
          <div className="doku">
            <h5>Dokumen Administrasi</h5>
            <ul>
              <li className="label">
                <label htmlFor="instanceName">Surat Izin</label>
              </li>
              <li className="input">
                <input type="file" accept="application/pdf" name="instanceName" onChange={(e) => handleFileChange(e, setSuratIzin)} required/>
              </li>
            </ul>
            <ul>
              <li className="label">
                <label htmlFor="instanceName">Denah Bangunan PBF</label>
              </li>
              <li className="input">
                <input type="file" accept="application/pdf" name="instanceName" onChange={(e) => handleFileChange(e, setDenah)} required/>
              </li>
            </ul>
            <ul>
              <li className="label">
                <label htmlFor="instanceName">Ringkasan Eksekutif Quality Management System</label>
              </li>
              <li className="input">
                <input type="file" accept="application/pdf" name="instanceName" onChange={(e) => handleFileChange(e, setEksekutifQualityManagement)} required/>
              </li>
            </ul>
            <ul>
              <li className="label">
                <label htmlFor="instanceName">Struktur Organisasi</label>
              </li>
              <li className="input">
                <input type="file" accept="application/pdf" name="instanceName" onChange={(e) => handleFileChange(e, setStrukturOrganisasi)} required/>
              </li>
            </ul>
            <ul>
              <li className="label">
                <label htmlFor="instanceName">Daftar Personalia</label>
              </li>
              <li className="input">
                <input type="file" accept="application/pdf" name="instanceName" onChange={(e) => handleFileChange(e, setDaftarPersonalia)} required/>
              </li>
            </ul>
            <ul>
              <li className="label">
                <label htmlFor="instanceName">Daftar Peralatan</label>
              </li>
              <li className="input">
                <input type="file" accept="application/pdf" name="instanceName" onChange={(e) => handleFileChange(e, setDaftarPeraltan)} required/>
              </li>
            </ul>
            <ul>
              <li className="label">
                <label htmlFor="instanceName">Surat Izin Apoteker</label>
              </li>
              <li className="input">
                <input type="file" accept="application/pdf" name="instanceName" onChange={(e) => handleFileChange(e, setSuratIzinApoteker)} required/>
              </li>
            </ul>
            <ul>
              <li className="label">
                <label htmlFor="instanceName">Dokumen Self Assesment</label>
              </li>
              <li className="input">
                <input type="file" accept="application/pdf" name="instanceName"onChange={(e) => handleFileChange(e, setDokSelfAsses)} required/>
              </li>
            </ul>
          </div>
          <button type='submit'>
          {
            loader? (
              <img src={imgLoader} alt="" />
            ) : (
              "Kirim Pengajuan CDOB"
            )
          }
            </button>

            <button type='button' onClick={handleAutoFillAndUploadToIPFS} className='auto-filled'>
              Isi Semua Field dengan Dummy File
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

export default CdobRequest;

