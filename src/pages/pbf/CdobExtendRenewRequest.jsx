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

function CdobExtendRenewRequest() {
  const [contracts, setContracts] = useState({});
  const navigate = useNavigate();
  const userdata = JSON.parse(sessionStorage.getItem('userdata'))
  const cdobDataExt = JSON.parse(sessionStorage.getItem('cdobDataExt'));
  const [dokumen, setDokumen] = useState({
    ipfsSuratPernyataanPimpinan: null,
    ipfsDokumenInspeksiDiri: null,
    ipfsDokumenPerbaikan: null,
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

  const formattedDate = today.toLocaleDateString('id-ID', options);
  
  useEffect(() => {
    document.title = "Pengajuan Ulang Perpanjangan CDOB"; 
  }, []);

  useEffect(() => {
    async function connectWallet() {
      if (window.ethereum) {
        try {
          const provider = new BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const contract = new Contract(
            contractData.CertificateManager.address,
            contractData.CertificateManager.abi,
            signer
          );
          setContracts({ certificateManager: contract });
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

      const detailCdobCt = await contracts.certificateManager.getCdobDetails(cdobDataExt.cdobId);
      const [certDetails, cdobDetails, docsAdministrasi, docsTeknis, docsReSertifikasi] = detailCdobCt; 
      
      setDokumen({
        ipfsSuratPernyataanPimpinan: docsReSertifikasi[0],
        ipfsDokumenInspeksiDiri: docsReSertifikasi[1],
        ipfsDokumenPerbaikan: docsReSertifikasi[2],
      });
      
      console.log(docsReSertifikasi);

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
    setDokumen(prev => ({ ...prev, [key]: file }));
    setUpdateFileIpfs(prev => [...new Set([...prev, key])]);

  };

  const uploadToIPFS = async (file) => {
    if (!file) return null;
    try {
      const result = await client.add(file);
      return result.path;
    } catch (error) {
      MySwal.fire({ title: "Gagal mengunggah dokumen!", text: error.message, icon: "error" });
      return null;
    }
  };

  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoader(true);

    const uploaded = {};
    for (const key of updateFileIpfs) {
      const file = dokumen[key];
      const hash = file instanceof File ? await uploadToIPFS(file) : null;
      if (hash) uploaded[key] = hash;
    }

    const finalDocs = { ...dokumen };
    Object.entries(uploaded).forEach(([key, hash]) => finalDocs[key] = hash);

    const htmlList = [
      ['Surat pernyataan bahwa pimpinan puncak dan direksi tidak pernah terlibat tindak pidana di bidang obat', finalDocs.ipfsSuratPernyataanPimpinan],
      [' Dokumen inspeksi diri', finalDocs.ipfsDokumenInspeksiDiri],
      ['Riwayat tindakan perbaikan dan pencegahan berdasarkan hasil pengawasan CDOB dalam 4 (empat) tahun terakhir', finalDocs.ipfsDokumenPerbaikan],
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
      title: 'Konfirmasi Perpanjangan CDOB',
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
    await extendRenewCdob(finalDocs);
    setLoader(false);
  };

  const extendRenewCdob = async(hashDocs) => {
    try {
      console.log(hashDocs);
      const renewExtendCdobCt = await contracts.certificateManager.renewExtendCdob(
        cdobDataExt.cdobId,
        [
          hashDocs.ipfsSuratPernyataanPimpinan,
          hashDocs.ipfsDokumenInspeksiDiri,
          hashDocs.ipfsDokumenPerbaikan
        ],
      );
      
      if(renewExtendCdobCt){
        MySwal.update({
          title: "Memproses transaksi...",
          text: "Proses transaksi sedang berlangsung, harap tunggu. ⏳"
        });
      }
      
      console.log(renewExtendCdobCt);

      // contracts.nieManager.on("CertExtend", ( _factoryInstance, _factoryAddr, _timestampRenewRequestNie) => {
      //   createObatFb(userdata.instanceName, obatData.namaObat, renewRequestNieCt.hash, Number(_timestampRenewRequestNie) )
      //   recordHashFb(obatData.namaObat, renewRequestNieCt.hash, Number(_timestampRenewRequestNie) )
      //   handleEventNieRenewRequest( _factoryInstance, _factoryAddr,_timestampRenewRequestNie, renewRequestNieCt.hash)
      // });
      
    } catch (error) {
      errAlert(error, "Can't Request NIE.")
    }
  }

  const updateCdobFb = async (cdobHash, timestamp, tp) => {

    const tpMap = {
      0n: 'Obat Lain',
      1n: 'Cold Chain Product'
    };

    const tipeP = tpMap[tp]

    try {
      const docRef = doc(db, 'cdob_list', userdata.instanceName);

      await updateDoc(docRef, {
        [`${tipeP}.extendRequestHash`]: cdobHash,
        [`${tipeP}.extendRequestTimestamp`]: timestamp, 
        [`${tipeP}.status`]: 4
      }); 
  
    } catch (err) {
      errAlert(err);
    }
  };

  const recordHashFb = async(txHash, timestamp, tp) => {

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
    <div id="CpotbPage" className='Layout-Menu layout-page'>
      <div className="title-menu">
        <h1>Pengajuan Ulang Perpanjangan Sertifikat CDOB</h1>
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
            <li className="label"><label>Nomor CDOB</label></li>
            <li className="input">
              <a
                href={`http://localhost:3000/public/certificate/${cdobDataExt.cdobIpfs}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {cdobDataExt.cdobNumber}
                <i className="fa-solid fa-arrow-up-right-from-square"></i>
              </a>
            </li>
          </ul> 
          <ul>
            <li className="label"><label>Tipe Permohonan</label></li>
            <li className="input"><p>{cdobDataExt.tipePermohonan}</p></li>
          </ul> 
          <ul>
            <li className="label">
              <label htmlFor="instanceName">Alasan Penolakan</label>
            </li>
            <li className="input">
              <p>{cdobDataExt.rejectExtendMsg}</p>
            </li>
          </ul>

          <div className="doku">
            <h5>Dokumen Perpanjangan CDOB</h5>
            <ul>
              <li className="label">
                <label htmlFor="suratPernyataanTindakPidanaObat">
                  Surat pernyataan bahwa pimpinan puncak dan direksi tidak pernah terlibat tindak pidana di bidang obat.
                </label>
              </li>
              <li className="input">
                <input
                  type="file"
                  accept="application/pdf"
                  name="suratPernyataanTindakPidanaObat"
                  id="suratPernyataanTindakPidanaObat"
                  onChange={e => handleFileChange(e, 'ipfsSuratPernyataanPimpinan')}
                />
                <a href="#" target="_blank" rel="noopener noreferrer">
                  Lihat Surat pernyataan pimpinan 
                  <i className="fa-solid fa-arrow-up-right-from-square"></i>
                </a>
              </li>
            </ul>

            <ul>
              <li className="label">
                <label htmlFor="dokumenInspeksiDiri">
                  Dokumen inspeksi diri
                </label>
              </li>
              <li className="input">
                <input
                  type="file"
                  accept="application/pdf"
                  name="dokumenInspeksiDiri"
                  id="dokumenInspeksiDiri"
                  onChange={e => handleFileChange(e, 'ipfsDokumenInspeksiDiri')}

                />
                <a href="#" target="_blank" rel="noopener noreferrer">
                  Lihat Dokumen inspeksi diri
                  <i className="fa-solid fa-arrow-up-right-from-square"></i>
                </a>
              </li>
            </ul>

            <ul>
              <li className="label">
                <label htmlFor="riwayatPerbaikanCDOB">
                  Riwayat tindakan perbaikan dan pencegahan berdasarkan hasil pengawasan CDOB dalam 4 (empat) tahun terakhir
                </label>
              </li>
              <li className="input">
                <input
                  type="file"
                  accept="application/pdf"
                  name="riwayatPerbaikanCDOB"
                  id="riwayatPerbaikanCDOB"
                  onChange={e => handleFileChange(e, 'ipfsDokumenPerbaikan')}

                />
                <a href="#" target="_blank" rel="noopener noreferrer">
                  Lihat Riwayat tindakan perbaikan 
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
              "Kirim Pengajuan CDOB"
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

export default CdobExtendRenewRequest;

