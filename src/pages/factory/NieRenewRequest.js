import { useEffect, useState } from 'react';
import { BrowserProvider, Contract } from "ethers";
import contractData from '../../auto-artifacts/deployments.json';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { create } from 'ipfs-http-client';
import imgLoader from '../../assets/images/loader.svg';
import "../../styles/MainLayout.scss";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import './../../styles/SweetAlert.scss';
import JenisSediaanTooltip from '../../components/TooltipJenisSediaan';

const MySwal = withReactContent(Swal);
const client = create({ url: 'http://127.0.0.1:5001/api/v0' });

function NieRenewRequest() {
  const [contracts, setContracts] = useState({});
  const navigate = useNavigate();
  const userdata = JSON.parse(sessionStorage.getItem('userdata'))
  const obatData = JSON.parse(sessionStorage.getItem('obatData'))
  const [dokumenNie, setDokumenNie] = useState({
    MasterFormula: null,
    SuratKuasa: null,
    SuratPernyataan: null,
    KomposisiProduk: null,
    CaraPembuatanProduk: null,
    SertifikatAnalisaBahanBaku: null,
    SertifikatAnalisaProdukJadi: null,
    SpesifikasiProdukJadi: null,
    SpesifikasiKemasan: null,
    SistemPenomoranBets: null,
    HasilUjiStabilitas: null,
    DesainKemasan: null,
    DataPendukungKeamanan: null
  })
  const [rejectMsg, setRejectMsg] = useState('')
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

  const tipeObatMap = {
    0n: "Obat Lain",
    1n: "Cold Chain Product"
  };

  const formattedDate = today.toLocaleDateString('id-ID', options);
  
  useEffect(() => {
    document.title = "Pengajuan Ulang NIE"; 
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

    const loadData = async() => {
      if (!contracts.nieManager) return;
      const detailNieCt = await contracts.nieManager.getNieDetail(obatData.obatId)
      const rejectMsgCt = await contracts.nieManager.getRejectMsgNie(obatData.obatId);
      const [masterFormula, suratKuasa, suratPernyataan, komposisiProduk, caraPembuatanProduk, sertifikatAnalisaBahanBaku, sertifikatAnalisaProdukJadi, spesifikasiProdukJadi, spesifikasiKemasan, sistemPenomoranBets, hasilUjiStabilitas, desainKemasan, dataPendukungKeamanan] = detailNieCt[1]
      setDokumenNie({
        MasterFormula: masterFormula,
        SuratKuasa: suratKuasa,
        SuratPernyataan: suratPernyataan,
        KomposisiProduk: komposisiProduk,
        CaraPembuatanProduk: caraPembuatanProduk,
        SertifikatAnalisaBahanBaku: sertifikatAnalisaBahanBaku,
        SertifikatAnalisaProdukJadi: sertifikatAnalisaProdukJadi,
        SpesifikasiProdukJadi: spesifikasiProdukJadi,
        SpesifikasiKemasan: spesifikasiKemasan,
        SistemPenomoranBets: sistemPenomoranBets,
        HasilUjiStabilitas: hasilUjiStabilitas,
        DesainKemasan: desainKemasan,
        DataPendukungKeamanan: dataPendukungKeamanan
      });


      setRejectMsg(rejectMsgCt)
    }

    loadData()

  }, [contracts]);

  const handleEventNieRenewRequest = (factoryInstance, factoryAddr, timestamp, txHash) =>{

    const formattedTimestamp = new Date(Number(timestamp) * 1000).toLocaleDateString('id-ID', options)
    
    MySwal.fire({
      title: "Sukses Mengajukan Ulang NIE",
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
          <ul>
            <li className="label">
              <p>Alamat Akun Pabrik (Pengguna)</p> 
            </li>
            <li className="input">
              <p>{factoryAddr}</p> 
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

  const renewRequestNie = async(hashDocs) => {

    try {
      console.log(hashDocs);
      const renewRequestNieCt = await contracts.nieManager.renewRequestNie(
        obatData.obatId,
        [hashDocs.MasterFormula,
          hashDocs.SuratKuasa,
          hashDocs.SuratPernyataan,
          hashDocs.KomposisiProduk,
          hashDocs.CaraPembuatanProduk,
          hashDocs.SertifikatAnalisaBahanBaku,
          hashDocs.SertifikatAnalisaProdukJadi,
          hashDocs.SpesifikasiProdukJadi,
          hashDocs.SpesifikasiKemasan,
          hashDocs.SistemPenomoranBets,
          hashDocs.HasilUjiStabilitas,
          hashDocs.DesainKemasan,
          hashDocs.DataPendukungKeamanan]
      );
      
      if(renewRequestNieCt){
        updateObatFb(userdata.instanceName, obatData.namaObat, renewRequestNieCt.hash)
        MySwal.update({
          title: "Memproses transaksi...",
          text: "Proses transaksi sedang berlangsung, harap tunggu. ⏳"
        });
      }

      contracts.nieManager.once("evt_nieRenewRequest", ( _factoryInstance, _factoryAddr, _timestampRenewRequestNie) => {
        handleEventNieRenewRequest( _factoryInstance, _factoryAddr,_timestampRenewRequestNie, renewRequestNieCt.hash)
      });
      
    } catch (error) {
      errAlert(error, "Can't Request NIE.")
    }
  }

  const updateObatFb = async (instanceName, namaProduk, obatHash ) => {
    try {
      const documentId = `[OT] ${namaProduk}`;
      const factoryDocRef = doc(db, instanceName, documentId); 

      await updateDoc(factoryDocRef, {
        "historyNie.requestNie": obatHash, 
        "historyNie.requestNieTimestamp": Date.now(), 
      }); 
  
    } catch (err) {
      console.error("Error writing cpotb data:", err);
    }
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
  };

  return (
    <div id="CpotbPage" className='Layout-Menu layout-page'>
      <div className="title-menu">
        <h1>Pengajuan Ulang NIE Obat Tradisonal</h1>
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
          <ul>
            <li className="label">
              <label htmlFor="instanceName">Alasan Penolakan</label>
            </li>
            <li className="input">
              <p>{rejectMsg}</p>
            </li>
          </ul>

          <div className="doku">
            <h5>Dokumen Pengajuan NIE</h5>
            {[
              'MasterFormula',
              'SuratKuasa',
              'SuratPernyataan',
              'KomposisiProduk',
              'CaraPembuatanProduk',
              'SertifikatAnalisaBahanBaku',
              'SertifikatAnalisaProdukJadi',
              'SpesifikasiProdukJadi',
              'SpesifikasiKemasan',
              'SistemPenomoranBets',
              'HasilUjiStabilitas',
              'DesainKemasan',
              'DataPendukungKeamanan'
            ]
            .map((key) => (
              <ul key={key}>
                <li className="label">
                  <label>{key.replace('ipfs', '').replace(/([A-Z])/g, ' $1')}</label>
                </li>
                <li className="input">
                  <input type="file" accept="application/pdf" onChange={(e) => handleFileChange(e, key)} />
                  {dokumenNie[key] && (
                    <a href={`http://localhost:8080/ipfs/${dokumenNie[key]}`} target="_blank" rel="noopener noreferrer">
                      Lihat {key.replace('ipfs', '').replace(/([A-Z])/g, ' $1')}
                      <i className="fa-solid fa-arrow-up-right-from-square"></i>
                    </a>
                  )}
                </li>
              </ul>
            ))}
          </div>

          <button type='submit'>
          {
            loader? (
              <img src={imgLoader} alt="" />
            ) : (
              "Kirim Pengajuan CPOTB"
            )
          }
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

export default NieRenewRequest;

