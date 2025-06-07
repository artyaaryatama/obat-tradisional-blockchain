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
import JenisSediaanTooltip from '../../components/TooltipJenisSediaan';

const MySwal = withReactContent(Swal);
const client = create({ url: 'http://127.0.0.1:5001/api/v0' });

function NieExtendRenewRequest() {
  const [contracts, setContracts] = useState({});
  const navigate = useNavigate();
  const userdata = JSON.parse(sessionStorage.getItem('userdata'))
  const obatData = JSON.parse(sessionStorage.getItem('obatData'))
  const [dokumenNie, setDokumenNie] = useState({
    ipfsFormulaProdukMetrik: null,
    ipfsSkPersetujuanVariasi: null,
    ipfsDesainKemasanTerakhir: null,
    ipfsSuratPernyataanPeredaran: null,
    ipfsDesainKemasanBerwarna: null
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

  const formattedDate = today.toLocaleDateString('id-ID', options);
  
  useEffect(() => {
    document.title = "Pengajuan Ulang Registrasi Ulang NIE"; 
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
        ipfsFormulaProdukMetrik: DokumenRegisUlang[0],
        ipfsSkPersetujuanVariasi: DokumenRegisUlang[1],
        ipfsDesainKemasanTerakhir: DokumenRegisUlang[2],
        ipfsSuratPernyataanPeredaran: DokumenRegisUlang[3],
        ipfsDesainKemasanBerwarna: DokumenRegisUlang[4],
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

  const extendRenewRequestNie = async(hashDocs) => {

    try {
      console.log(hashDocs);
      const extendRenewRequestNieCt = await contracts.nieManager.extendRenewRequestNie(
        obatData.obatId,
        [
          hashDocs.ipfsFormulaProdukMetrik,
          hashDocs.ipfsSkPersetujuanVariasi,
          hashDocs.ipfsDesainKemasanTerakhir,
          hashDocs.ipfsSuratPernyataanPeredaran,
          hashDocs.ipfsDesainKemasanBerwarna,
        ]
      );
      
      if(extendRenewRequestNieCt){
        MySwal.update({
          title: "Memproses transaksi...",
          text: "Proses transaksi sedang berlangsung, harap tunggu. ⏳"
        });
      }
      
      contracts.nieManager.once("NieRenewRequest", ( _factoryInstance, _factoryAddr, _timestampRenewRequestNie) => {
        createObatFb(userdata.instanceName, obatData.namaObat, extendRenewRequestNieCt.hash, Number(_timestampRenewRequestNie) )
        recordHashFb(obatData.namaObat, extendRenewRequestNieCt.hash, Number(_timestampRenewRequestNie) )
        handleEventNieRenewRequest( _factoryInstance, _factoryAddr,_timestampRenewRequestNie, extendRenewRequestNieCt.hash)
      });
      
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoader(true);

    const uploaded = {};
    for (const key of updateFileIpfs) {
      const file = dokumenNie[key];
      const hash = file instanceof File ? await uploadToIPFS(file) : null;
      if (hash) uploaded[key] = hash;
    }

    const finalDocs = { ...dokumenNie };
    Object.entries(uploaded).forEach(([key, hash]) => finalDocs[key] = hash);

    const htmlList = [
      ['Formula produk Metrik', finalDocs.ipfsFormulaProdukMetrik],
      ['SK Persetujuan', finalDocs.ipfsSkPersetujuanVariasi],
      ['Desain Kemasan Terakhir', finalDocs.ipfsDesainKemasanTerakhir],
      ['Surat Pernyataan Peredaran', finalDocs.ipfsSuratPernyataanPeredaran],
      ['Desain Kemasan Berwarna', finalDocs.ipfsDesainKemasanBerwarna],
    ].map(([label, hash]) => `
      <ul>
        <li class="label label-2"><p>${label}</p></li>
        <li class="input input-2">
          <a href="http://localhost:8080/ipfs/${hash}" target="_blank" rel="noopener noreferrer">
            Lihat ${label} <i class="fa-solid fa-arrow-up-right-from-square"></i></a>
        </li>
      </ul>
    `).join('');

    const { isConfirmed } = await MySwal.fire({
      title: 'Konfirmasi Perpanjangan CPOTB',
      html: `<div class="form-swal"><div class="row row--obat table-like"><div class="col doku">${htmlList}</div></div></div>`,
      width: '900', showCancelButton: true, confirmButtonText: 'Konfirmasi', cancelButtonText: 'Batal', allowOutsideClick: false
    });

    if (!isConfirmed) { setLoader(false); return; }
    MySwal.fire({
      title: "Menunggu koneksi Metamask...",
      text: "Jika proses ini memakan waktu terlalu lama, coba periksa koneksi Metamask Anda. 🚀",
      icon: 'info',
      showCancelButton: false,
      showConfirmButton: false,
      allowOutsideClick: false,
    });
    await extendRenewRequestNie(finalDocs);
    setLoader(false);
  };

  return (
    <div id="CpotbPage" className='Layout-Menu layout-page'>
      <div className="title-menu">
        <h1>Pengajuan Ulang Registrasi Ulang NIE</h1>
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
              <p>{obatData.rejectMsg}</p>
            </li>
          </ul>

          <div className="doku">
            <h5>Dokumen Registrasi Ulang NIE</h5>
            <ul>
              <li className="label">
                <label htmlFor="formulaProdukMetrik">Formula produk dalam satuan metrik</label>
              </li>
              <li className="input">
                <input
                  type="file"
                  accept="application/pdf"
                  name="formulaProdukMetrik"
                  id="formulaProdukMetrik"
                  
                />
                <a href="#" target="_blank" rel="noopener noreferrer">
                  Lihat Formula produk dalam satuan metrik
                  <i className="fa-solid fa-arrow-up-right-from-square"></i>
                </a>
              </li>
            </ul>

            <ul>
              <li className="label">
                <label htmlFor="skPersetujuanVariasi">
                  SK persetujuan serta semua jenis variasi yang pernah disetujui
                </label>
              </li>
              <li className="input">
                <input
                  type="file"
                  accept="application/pdf"
                  name="skPersetujuanVariasi"
                  id="skPersetujuanVariasi"
                  
                />
                <a href="#" target="_blank" rel="noopener noreferrer">
                  Lihat SK persetujuan serta semua jenis variasi yang pernah disetujui
                  <i className="fa-solid fa-arrow-up-right-from-square"></i>
                </a>
              </li>
            </ul>

            <ul>
              <li className="label">
                <label htmlFor="desainKemasanTerakhirDisetujui">
                  Desain kemasan terakhir yang disetujui
                </label>
              </li>
              <li className="input">
                <input
                  type="file"
                  accept="application/pdf"
                  name="desainKemasanTerakhirDisetujui"
                  id="desainKemasanTerakhirDisetujui"
                  
                />
                <a href="#" target="_blank" rel="noopener noreferrer">
                  Lihat Desain kemasan terakhir yang disetujui
                  <i className="fa-solid fa-arrow-up-right-from-square"></i>
                </a>
              </li>
            </ul>

            <ul>
              <li className="label">
                <label htmlFor="suratPernyataanPeredaranNoBets">
                  Surat pernyataan bahwa produk masih diedarkan
                </label>
              </li>
              <li className="input">
                <input
                  type="file"
                  accept="application/pdf"
                  name="suratPernyataanPeredaranNoBets"
                  id="suratPernyataanPeredaranNoBets"
                  
                />
                <a href="#" target="_blank" rel="noopener noreferrer">
                  Lihat Surat pernyataan bahwa produk masih diedarkan
                  <i className="fa-solid fa-arrow-up-right-from-square"></i>
                </a>
              </li>
            </ul>

            <ul>
              <li className="label">
                <label htmlFor="desainKemasanBerwarnaTerbaru">
                  Desain kemasan berwarna yang terbaru
                </label>
              </li>
              <li className="input">
                <input
                  type="file"
                  accept="application/pdf"
                  name="desainKemasanBerwarnaTerbaru"
                  id="desainKemasanBerwarnaTerbaru"
                  
                />
                <a href="#" target="_blank" rel="noopener noreferrer">
                  Lihat Desain kemasan berwarna yang terbaru
                  <i className="fa-solid fa-arrow-up-right-from-square"></i>
                </a>
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

export default NieExtendRenewRequest;

