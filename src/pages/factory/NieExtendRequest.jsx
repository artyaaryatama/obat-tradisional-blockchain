import { useEffect, useState } from 'react';
import { BrowserProvider, Contract } from "ethers";
import contractData from '../../auto-artifacts/deployments.json';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { create } from 'ipfs-http-client';
import imgLoader from '../../assets/images/loader.svg';
import "../../styles/MainLayout.scss";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import './../../styles/SweetAlert.scss';
import dummyPdf from '../../assets/dummy.pdf'
import dummyPdf2 from '../../assets/dummy2.pdf'
import dummyPdf3 from '../../assets/dummy3.pdf'
import JenisSediaanTooltip from '../../components/TooltipJenisSediaan';

const MySwal = withReactContent(Swal);
const client = create({ url: 'http://127.0.0.1:5001/api/v0' });

function NieExtendRequest() {
  const [contracts, setContracts] = useState({});
  const navigate = useNavigate();
  const userdata = JSON.parse(sessionStorage.getItem('userdata'))
  const obatData = JSON.parse(sessionStorage.getItem('obatData'))
  const [dokumenNie, setDokumenNie] = useState({
    ipfsFormulaProdukMetrik: null,
    ipfsSkPersetujuanVariasi: null,
    ipfsDesainKemasanTerakhir: null,
    ipfsSuratPernyataanPeredaran: null,
    ipfsDesainKemasanBerwarna: null,
  })
  const [updateFileIpfs, setUpdateFileIpfs] = useState([])

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


  const labelMapping = {
    MasterFormula: "Dokumen Master Formula",
    SuratKuasa: "Surat Kuasa",
    SuratPernyataan: "Surat Pernyataan",
    KomposisiProduk: "Dokumen Komposisi Produk",
    CaraPembuatanProduk: "Dokumen Cara Pembuatan Produk",
    SpesifikasiProdukJadi: "Dokumen Spesifikasi Produk Jadi",
    SistemPenomoranBets: "Dokumen Sistem Penomoran Bets",
    SertifikatAnalisaBahanBaku: "Sertifikat Analisa Bahan Baku",
    SertifikatAnalisaProdukJadi: "Sertifikat Analisa Produk Jadi",
    HasilUjiStabilitas: "Dokumen Hasil Uji Stabilitas",
    SpesifikasiKemasan: "Dokumen Spesifikasi Kemasan",
    DesainKemasan: "Desain Kemasan",
    DataPendukungKeamanan: "Data Pendukung Keamanan"
  };
  

  const formattedDate = today.toLocaleDateString('id-ID', options);
  
  useEffect(() => {
    document.title = "Pengajuan Registrasi Ulang NIE";  
  }, []);

  useEffect(() => {
    async function connectWallet() {
      if (window.ethereum) {
        try {
          const provider = new BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const ObatTradisional = new Contract(
            contractData.ObatTradisional.address, 
            contractData.ObatTradisional.abi, 
            signer
          );

          const NieManager = new Contract(
            contractData.NieManager.address, 
            contractData.NieManager.abi, 
            signer
          );

          setContracts({
            obatTradisional: ObatTradisional,
            nieManager: NieManager
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

    const loadData = async() => {
      if (!contracts.nieManager) return;
      const detailNieCt = await contracts.nieManager.getNieDetail(obatData.obatId)
      const [nieDetails, dokumenObat, dokumenSpesifikasi, DokumenRegisUlang] = detailNieCt;

      setDokumenNie({
        ipfsFormulaProdukMetrik : DokumenRegisUlang[0],
        ipfsSkPersetujuanVariasi : DokumenRegisUlang[1],
        ipfsDesainKemasanTerakhir : DokumenRegisUlang[2],
        ipfsSuratPernyataanPeredaran : DokumenRegisUlang[3],
        ipfsDesainKemasanBerwarna : DokumenRegisUlang[4]
      });

    }

    loadData()

  }, [contracts]);

  const handleEventNieRenewRequest = (factoryInstance, factoryAddr, timestamp, txHash) =>{

    const formattedTimestamp = new Date(Number(timestamp) * 1000).toLocaleDateString('id-ID', options)
    
    MySwal.fire({
      title: "Sukses mengajukan ulang NIE",
      html: (
        <div className='form-swal event'>
          <ul>
            <li className="label">
              <p>Nama Instansi Pabrik</p> 
            </li>
            <li className="input">
              <p>{factoryInstance}</p> 
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
        navigate('/obat')
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

    setDokumenNie(prev => ({
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
        title: "Gagal mengunggah dokumen pengajuan ulang NIE!",
        text: "IPFS mungkin tidak aktif atau terjadi error saat mengunggah dokumen.",
        icon: "error",
        confirmButtonText: "Coba Lagi"
      });
      return null;
    }
  };

  const reconstructedHashesExtend = (uploaded) => ({
    ipfsFormulaProdukMetrik: uploaded["Formula produk Metrik"],
    ipfsSkPersetujuanVariasi: uploaded["SK Persetujuan"],
    ipfsDesainKemasanTerakhir: uploaded["Desain Kemasan Terakhir"],
    ipfsSuratPernyataanPeredaran: uploaded["Surat Pernyataan Peredaran"],
    ipfsDesainKemasanBerwarna: uploaded["Desain Kemasan Berwarna"],

  });

  const renewRequestNie = async(hashDocs) => {
    console.log(hashDocs)

    try {
      console.log(obatData.obatId,
        obatData.expTimestamp,
        [
          hashDocs.ipfsFormulaProdukMetrik,
          hashDocs.ipfsSkPersetujuanVariasi,
          hashDocs.ipfsDesainKemasanTerakhir,
          hashDocs.ipfsSuratPernyataanPeredaran,
          hashDocs.ipfsDesainKemasanBerwarna
        ]);
      const renewRequestNieCt = await contracts.nieManager.extendRequestNie(
        obatData.obatId,
        obatData.expTimestamp,
        [
          hashDocs.ipfsFormulaProdukMetrik,
          hashDocs.ipfsSkPersetujuanVariasi,
          hashDocs.ipfsDesainKemasanTerakhir,
          hashDocs.ipfsSuratPernyataanPeredaran,
          hashDocs.ipfsDesainKemasanBerwarna
        ],
      );
      
      if(renewRequestNieCt){
        MySwal.update({
          title: "Memproses transaksi...",
          text: "Proses transaksi sedang berlangsung, harap tunggu. ⏳"
        });
      }
      
      console.log(renewRequestNieCt);

      // contracts.nieManager.once("NieRenewRequest", ( _factoryInstance, _factoryAddr, _timestampRenewRequestNie) => {
      //   createObatFb(userdata.instanceName, obatData.namaObat, renewRequestNieCt.hash, Number(_timestampRenewRequestNie) )
      //   recordHashFb(obatData.namaObat, renewRequestNieCt.hash, Number(_timestampRenewRequestNie) )
      //   handleEventNieRenewRequest( _factoryInstance, _factoryAddr,_timestampRenewRequestNie, renewRequestNieCt.hash)
      // });
      
    } catch (error) {
      errAlert(error, "Can't Request NIE.")
    }
  }

  const createObatFb = async (instanceName, namaProduk, obatHash, timestamp) => {
    try {
      const docRef = doc(db, 'obat_data', instanceName)

      await setDoc(docRef, {
        [`${namaProduk}`]: {
          historyNie: {
            renewRequestHash: obatHash,
            renewRequestTimestamp: timestamp,
          },
          status: 3
        }
      }, { merge: true }); 
    } catch (err) {
      errAlert(err);
    }
  };

  const recordHashFb = async(namaProduk, txHash, timestamp) => {
    try {
      const collectionName = `obat_${namaProduk}_${userdata.instanceName}`
      const docRef = doc(db, 'transaction_hash', collectionName);
  
      await setDoc(docRef, {
        [`produksi`]: {
          'renew_request_nie': {
            hash: txHash,
            timestamp: timestamp,
          }
        },
      }, { merge: true }); 
    } catch (err) {
      errAlert(err);
    }
  }


  const uploadAllDocumentsExtend = async () => {
    const files = {
      "Formula produk Metrik":dokumenNie.ipfsFormulaProdukMetrik,
      "SK Persetujuan":dokumenNie.ipfsSkPersetujuanVariasi,
      "Desain Kemasan Terakhir":dokumenNie.ipfsDesainKemasanTerakhir,
      "Surat Pernyataan Peredaran":dokumenNie.ipfsSuratPernyataanPeredaran,
      "Desain Kemasan Berwarna":  dokumenNie.ipfsDesainKemasanBerwarna,
    };

    let uploaded = {};
    const entries = Object.entries(files).filter(([_, f]) => f instanceof File);
    await Promise.all(entries.map(async ([label, file]) => {
      const res = await client.add(file, { 
        progress: bytes => console.log(`📤 ${label}: ${bytes} bytes`)
      });
      uploaded[label] = res.path;
    }));
    return uploaded;
  };

  const handleAutoFillAndRenew = async () => {
    setLoader(true);
    const fetchBlob = async url => {
      const r = await fetch(url);
      if (!r.ok) throw new Error(`Fetch gagal: ${url}`);
      return r.blob();
    };
    const [b1, b2, b3] = await Promise.all([
      fetchBlob(dummyPdf),
      fetchBlob(dummyPdf2),
      fetchBlob(dummyPdf3),
    ]);
    setDokumenNie({
      ipfsFormulaProdukMetrik: new File([b1], "formulaProdukMetrik.pdf", { type: "application/pdf" }),
      ipfsSkPersetujuanVariasi: new File([b2], "skPersetujuanVariasi.pdf", { type: "application/pdf" }),
      ipfsDesainKemasanTerakhir: new File([b2], "desainKemasanTerakhir.pdf", { type: "application/pdf" }),
      ipfsSuratPernyataanPeredaran: new File([b3], "suratPernyataanPeredaran.pdf", { type: "application/pdf" }),
      ipfsDesainKemasanBerwarna: new File([b3], "desainKemasanBerwarna.pdf", { type: "application/pdf" })
    });

    MySwal.fire({
      title: "Mengunggah semua dokumen ke IPFS...",
      text: "Harap tunggu. Jika proses ini memakan waktu terlalu lama, coba periksa koneksi IPFS. 🚀",
      icon: 'info',
      showCancelButton: false,
      showConfirmButton: false,
      allowOutsideClick: false,
    });
    const uploaded = await uploadAllDocumentsExtend();
    console.log(uploaded);

    const { isConfirmed } = await MySwal.fire({
      title: `Konfirmasi Perpanjangan CPOTB`,
      html: (
          <div className='form-swal'>
            <div className="row row--obat table-like">
              <div className="col doku">
                
                <ul>
                  <li className="label label-2"><p>Nama PBF</p></li>
                  <li className="input input-2"><p>{userdata.instanceName}</p></li>
                </ul>
                <ul>
                  <li className="label label-2"><p>Nomor NIE</p></li>
                  <li className="input input-2">
                    <a
                      href={`http://localhost:3000/public/certificate/${obatData.nieIpfs}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {obatData.nieNumber}
                      <i className="fa-solid fa-arrow-up-right-from-square"></i>
                    </a>
                  </li>
                </ul>
                  {Object.entries(uploaded).map(([docName, hash]) => (
                    <ul key={docName}>
                      <li className="label label-2">
                        <p>{docName.replace('ipfs', '').replace(/([A-Z])/g, ' $1')}</p>
                      </li>
                      <li className="input input-2">
                      <a
                        href={`http://localhost:8080/ipfs/${hash}`}  
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {hash} <i className="fa-solid fa-arrow-up-right-from-square"></i>
                      </a>
                      </li>
                    </ul>
                  ))}
              </div>
            </div>
          </div>
        ),
      width: '900',
      showCancelButton: true,
      confirmButtonText: 'Konfirmasi',
      cancelButtonText: "Batal",
      allowOutsideClick: false,
    });
    if (!isConfirmed) { setLoader(false); return; }
    MySwal.fire({
      title: "Menunggu koneksi Metamask...",
      text: "Jika proses ini memakan waktu terlalu lama, coba periksa koneksi Metamask Anda. 🚀",
      icon: "info",
      showConfirmButton: false,
      allowOutsideClick: false
    });
    const hashes = reconstructedHashesExtend(uploaded);
    console.log()
    await renewRequestNie(hashes);
    setLoader(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoader(true);
    console.log(dokumenNie);
    const uploadedHashes = {};
    
    for (const key of updateFileIpfs) {  
      const file = dokumenNie[key];
      if (file instanceof File) {

        try {
          const hash = await uploadToIPFS(file);
          if (hash) {
            uploadedHashes[key] = hash;
          }
          
        } catch (error) {
          MySwal.fire({
            title: "Gagal mengunggah dokumen pengajuan ulang NIE!",
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
      setDokumenNie(prev => {
        updatedDokumen = { ...prev };
        updateFileIpfs.forEach(item => {
          if (uploadedHashes[item]) {
            updatedDokumen[item] = uploadedHashes[item]; 
          }
        });
  
        return updatedDokumen;
      });
    }
    
    if (Object.keys(uploadedHashes).length !== 0) {
      MySwal.fire({
        title: 'Dokumen Pengajuan Ulang NIE',
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
                        {hash} <i class="fa-solid fa-arrow-up-right-from-square"></i>
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
          renewRequestNie(updatedDokumen)
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

  return (
    <div id="CpotbPage" className='Layout-Menu layout-page'>
      <div className="title-menu">
        <h1>Pengajuan Registrasi Ulang NIE</h1>
      </div>
      <div className='container-form pengajuan-ulang'>
        <form onSubmit={handleSubmit}>
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
              <label htmlFor="instanceName">Nama Obat</label>
            </li>
            <li className="input">
              <p>{obatData.namaObat}</p>
            </li>
          </ul>

          <div className="doku">
            <h5>Dokumen Registrasi Ulang NIE</h5>
            <ul>
              <li class="label">
                <label htmlFor="formulaProdukMetrik">Formula produk dalam satuan metrik</label>
              </li>
              <li class="input">
                <input
                  type="file"
                  accept="application/pdf"
                  name="formulaProdukMetrik"
                  id="formulaProdukMetrik"
                  required
                />
              </li>
            </ul>

            <ul>
              <li class="label">
                <label htmlFor="skPersetujuanVariasi">SK persetujuan serta semua jenis variasi yang pernah disetujui</label>
              </li>
              <li class="input">
                <input
                  type="file"
                  accept="application/pdf"
                  name="skPersetujuanVariasi"
                  id="skPersetujuanVariasi"
                  required
                />
              </li>
            </ul>

            <ul>
              <li class="label">
                <label htmlFor="desainKemasanTerakhirDisetujui">Desain kemasan terakhir yang disetujui</label>
              </li>
              <li class="input">
                <input
                  type="file"
                  accept="application/pdf"
                  name="desainKemasanTerakhirDisetujui"
                  id="desainKemasanTerakhirDisetujui"
                  required
                />
              </li>
            </ul>

            <ul>
              <li class="label">
                <label htmlFor="suratPernyataanPeredaranNoBets">Surat pernyataan bahwa produk masih diedarkan dengan disertai no bets terakhir</label>
              </li>
              <li class="input">
                <input
                  type="file"
                  accept="application/pdf"
                  name="suratPernyataanPeredaranNoBets"
                  id="suratPernyataanPeredaranNoBets"
                  required
                />
              </li>
            </ul>

            <ul>
              <li class="label">
                <label htmlFor="desainKemasanBerwarnaTerbaru">Desain kemasan berwarna yang terbaru</label>
              </li>
              <li class="input">
                <input
                  type="file"
                  accept="application/pdf"
                  name="desainKemasanBerwarnaTerbaru"
                  id="desainKemasanBerwarnaTerbaru"
                  required
                />
              </li>
            </ul>
          </div>

          <button type='submit'>
            {
              loader? (
                <img src={imgLoader} alt="" />
              ) : (
                "Kirim Pengajuan Registrasi Ulang NIE"
              )
            }
          </button>

          <button type='button' onClick={handleAutoFillAndRenew} className='auto-filled' disabled={loader}>
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

export default NieExtendRequest;

