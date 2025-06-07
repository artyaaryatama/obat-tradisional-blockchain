import { useEffect, useState } from 'react';
import { BrowserProvider, Contract } from "ethers";
import contractData from '../../auto-artifacts/deployments.json';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { create } from 'ipfs-http-client';
import imgLoader from '../../assets/images/loader.svg';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import './../../styles/SweetAlert.scss';
import dummyPdf from '../../assets/dummy.pdf';
import dummyPdf2 from '../../assets/dummy2.pdf';
import dummyPdf3 from '../../assets/dummy3.pdf';

const MySwal = withReactContent(Swal);
const client = create({ url: 'http://127.0.0.1:5001/api/v0' });

function CdobExtendRequest() {
  const [contracts, setContracts] = useState({});
  const navigate = useNavigate();
  const userdata = JSON.parse(sessionStorage.getItem('userdata'));
  const cdobDataExt = JSON.parse(sessionStorage.getItem('cdobData'));
  const [dokumen, setDokumen] = useState({
    ipfsSuratPernyataanPimpinan: null,
    ipfsDokumenInspeksiDiri: null,
    ipfsDokumenPerbaikan: null,
  });
  const [updateFileIpfs, setUpdateFileIpfs] = useState([]);
  const [loader, setLoader] = useState(false);

  const labelMapping = {
    ipfsSuratPernyataanPimpinan: "Surat Pernyataan Pimpinan",
    ipfsDokumenInspeksiDiri: "Dokumen Inspeksi Diri",
    ipfsDokumenPerbaikan: "Dokumen Perbaikan",
  };

  const tpMap = {
    0: "Obat Lain",
    1: "Cold Chain Product"
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

  useEffect(() => {
    document.title = "Pengajuan Perpanjangan CDOB"; 
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

  const handleEventCdobExtendRequest = ( timestamp, txHash) =>{

  const formattedTimestamp = new Date(Number(timestamp) * 1000).toLocaleDateString('id-ID', options)
    
    MySwal.fire({
      title: "Sukses Mengajukan Perpanjangan CDOB",
      html: (
        <div className='form-swal event'>
          <ul>
            <li className="label">
              <p>Nomor CDOB</p> 
            </li>
            <li className="input">
            <p>{cdobDataExt.cdobNumber}</p> 
            </li>
          </ul>
          <ul>
            <li className="label">
              <p>Tipe Permohonan</p> 
            </li>
            <li className="input">
            <p>tpMap[cdobDataExt.tipePermohonan]</p> 
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
        sessionStorage.removeItem('cdobData')
        navigate('/cdob')
      }
    });
  }

  const uploadToIPFS = async (file) => {
    if (!file) return null;
    try {
      const result = await client.add(file);
      return result.path;
    } catch (error) {
      MySwal.fire({
        title: "Gagal mengunggah dokumen pengajuan ulang CDOB!",
        text: "IPFS mungkin tidak aktif atau terjadi error saat mengunggah dokumen.",
        icon: "error",
        confirmButtonText: "Coba Lagi"
      });
      return null;
    }
  };

  const reconstructedHashesExtend = (uploaded) => ({
    suratPernyataanPimpinan: uploaded["Surat Pernyataan Pimpinan"],
    dokumenInspeksiDiri: uploaded["Dokumen Inspeksi Diri"],
    dokumenPerbaikan: uploaded["Dokumen Perbaikan"],
  });

  const uploadAllDocumentsExtend = async () => {
    const files = {
      "Surat Pernyataan Pimpinan": dokumen.ipfsSuratPernyataanPimpinan,
      "Dokumen Inspeksi Diri": dokumen.ipfsDokumenInspeksiDiri,
      "Dokumen Perbaikan": dokumen.ipfsDokumenPerbaikan,
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
    setDokumen({
      ipfsSuratPernyataanPimpinan: new File([b1], "surat_pernyataan_pimpinan.pdf", { type: "application/pdf" }),
      ipfsDokumenInspeksiDiri: new File([b2], "dokumen_inspeksi_diri.pdf", { type: "application/pdf" }),
      ipfsDokumenPerbaikan: new File([b3], "dokumen_perbaikan.pdf", { type: "application/pdf" }),
    });

    MySwal.fire({ title: "Mengunggah dokumen ke IPFS…", icon: "info", showConfirmButton: false });
    const uploaded = await uploadAllDocumentsExtend();

    const { isConfirmed } = await MySwal.fire({
      title: `Konfirmasi Perpanjangan CDOB`,
      html: (
          <div className='form-swal'>
            <div className="row row--obat table-like">
              <div class="col doku">
                
                <ul>
                  <li className="label label-2"><p>Nama PBF</p></li>
                  <li className="input input-2"><p>{userdata.instanceName}</p></li>
                </ul>
                <ul>
                  <li className="label label-2"><p>Nomor CDOB</p></li>
                  <li className="input input-2">
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
                  {Object.entries(uploaded).map(([docName, hash]) => (
                    <ul key={docName}>
                      <li class="label label-2">
                        <p>{docName.replace('ipfs', '').replace(/([A-Z])/g, ' $1')}</p>
                      </li>
                      <li class="input input-2">
                      <a
                        href={`http://localhost:8080/ipfs/${hash}`}  
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Lihat dokumen ↗ ({docName})
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
    await extendCertificate(hashes);
    setLoader(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoader(true);
    const uploadedHashes = {};
    for (const key of updateFileIpfs) {
      const file = dokumen[key];
      if (file instanceof File) {
        try {
          const hash = await uploadToIPFS(file);
          if (hash) {
            uploadedHashes[key] = hash;
          }
          console.log(hash);
        } catch (error) {
          MySwal.fire({
            title: "Gagal mengunggah dokumen pengajuan ulang CDOB!",
            text: "IPFS mungkin tidak aktif atau terjadi error saat mengunggah dokumen.",
            icon: "error",
            confirmButtonText: "Coba Lagi"
          });
        }
      }
    }
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

    if (Object.keys(uploadedHashes).length !== 0) {
      MySwal.fire({
        title: 'Dokumen Pengajuan Ulang CDOB',
        html:(
          <div className="form-swal">
            <div className="row row--obat table-like">
              <div className="col">
                <div className="doku">
                  ${Object.entries(uploadedHashes).map(([key, hash]) => 
                    <ul>
                      <li className="label label-2">
                        <p>${labelMapping[key]}</p>
                      </li>
                      <li className="input input-2">
                        <a
                          href="http://localhost:8080/ipfs/${hash}"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Lihat dokumen ↗ (${hash})
                        </a>
                      </li>
                    </ul>
                  ).join("")}
                </div>
              </div>
            </div>
          </div>
        ),
        width: '900',
        showCancelButton: true,
        confirmButtonText: 'Konfirmasi Pengajuan CDOB',
        cancelButtonText: 'Batal',
        allowOutsideClick: false
      }).then(result => {
        if (result.isConfirmed) {
          MySwal.fire({
            title: "Menunggu koneksi Metamask...",
            text: "Jika proses ini memakan waktu terlalu lama, coba periksa koneksi Metamask Anda. 🚀",
            icon: 'info',
            showCancelButton: false,
            showConfirmButton: false,
            allowOutsideClick: false,
          });
          extendCertificate(updatedDokumen);
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

  const extendCertificate = async (hashDocs) => {
    try {
      const extendCertificateCt = await contracts.certificateManager.extendCdob(
        cdobDataExt.cdobId,
        cdobDataExt.extTimestamp,
        [hashDocs.suratPernyataanPimpinan, hashDocs.dokumenInspeksiDiri, hashDocs.dokumenPerbaikan]
      );
      if (extendCertificateCt) {
        MySwal.update({
          title: "Memproses transaksi...",
          text: "Proses transaksi sedang berlangsung, harap tunggu. ⏳"
        });
      }
      console.log(extendCertificateCt);
      contracts.certificateManager.on("CertExtend", ( _pbfAddr, _timestampExtendRenew) => {
        console.log(0)
        updateCdobFb(renewRequestNieCt.hash, Number(_timestampExtendRenew) )
        recordHashFb(renewRequestNieCt.hash, Number(_timestampExtendRenew) )
        handleEventCdobExtendRequest(_timestampExtendRenew, renewRequestNieCt.hash)
      });
    } catch (error) {
      errAlert(error);
    }
  };

  const updateCdobFb = async (cdobHash, timestamp) => {

    const tipeP = tpMap[cdobDataExt.tipePermohonan]

    try {
      const docRef = doc(db, 'cdob_list', userdata.instanceName);

      await updateDoc(docRef, {
        [`${tipeP}.extendedRequestHash`]: cdobHash,
        [`${tipeP}.extendedRequestTimestamp`]: timestamp, 
        [`${tipeP}.status`]: 4
      }); 
  
    } catch (err) {
      errAlert(err);
    }
  };

  const recordHashFb = async(txHash, timestamp) => {

    const tipeP = tpMap[cdobDataExt.tipePermohonan]

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
    <div id="CdobPage" className='Layout-Menu layout-page'>
      <div className="title-menu">
        <h1>Pengajuan Perpanjangan Sertifikat CDOB</h1>
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

          <div className="doku">
            <h5>Dokumen Perpanjangan CDOB</h5>
            <ul>
              <li className="label">
                <label htmlFor="suratPernyataanTindakPidanaObat">
                  Surat pernyataan bahwa pimpinan puncak dan direksi tidak pernah terlibat tindak pidana di bidang obat
                </label>
              </li>
              <li className="input">
                <input
                  type="file"
                  accept="application/pdf"
                  name="suratPernyataanTindakPidanaObat"
                  id="suratPernyataanTindakPidanaObat"
                  required
                />
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
                  required
                />
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
                  required
                />
              </li>
            </ul>
          </div>

          <button type='submit'>
            Kirim Pengajuan Perpanjangan CDOB
          </button>

          <button type='button' onClick={handleAutoFillAndRenew} className='auto-filled' disabled={loader}>
            Isi Semua Field dengan Dummy File
          </button>
        </form>
      </div>
    </div>
  );
  
}

function errAlert(err, customMsg) {
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

export default CdobExtendRequest;
