import { useEffect, useState } from 'react';
import { BrowserProvider, Contract } from "ethers";
import contractData from '../../auto-artifacts/deployments.json';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc, setDoc  } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { create } from 'ipfs-http-client';
import imgLoader from '../../assets/images/loader.svg';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import './../../styles/SweetAlert.scss';
import dummyPdf from '../../assets/dummy.pdf'
import dummyPdf2 from '../../assets/dummy2.pdf'
import dummyPdf3 from '../../assets/dummy3.pdf'

const MySwal = withReactContent(Swal);
const client = create({ url: 'http://127.0.0.1:5001/api/v0' });

function CpotbExtendRequest() {
  const [contracts, setContracts] = useState({});
  const navigate = useNavigate();
  const userdata = JSON.parse(sessionStorage.getItem('userdata'));
  const cpotbDataExt = JSON.parse(sessionStorage.getItem('cpotbDataExt'))
  const [dokumen, setDokumen] = useState({
    ipfsSuratPermohonanCpotb: null,
    ipfsBuktiPembayaranNegaraBukanPajak: null,
    ipfsDenahBangunan: null,
    ipfsSistemMutu: null,
    ipfsCpotb: null,
    ipfsDokumenCapa: null,
  });
  const [updateFileIpfs, setUpdateFileIpfs] = useState([])
  const [loader, setLoader] = useState(false);
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

  const labelMapping = {
    ipfsDenahBangunan: "Denah Bangunan Pabrik",
    ipfsSistemMutu: "Dokumen Sistem Mutu CPOTB",
    ipfsBuktiPembayaranNegaraBukanPajak: 'Bukti Pembayaran Negara Bukan Pajak',
    ipfsDokumenCapa: "Dokumen CAPA (Corrective Action and Preventive Action)",
    ipfsSuratPermohonanCpotb: 'Surat Permohonan CPOTB',
  };

  useEffect(() => {
    document.title = "Pengajuan Perpanjangan CPOTB"; 
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

  const handleEventCpotbExtendRequested = (factoryAddr, timestamp, txHash, certNumber) => {
    const formattedTimestamp = new Date(Number(timestamp) * 1000).toLocaleDateString('id-ID', options)
    MySwal.fire({
      title: "Permintaan perpanjangan CPOTB terkirim",
      html: (
        <div className='form-swal event'>
          <ul className='klaim'>
            <li className="label">
              <p>Nomor CPOTB</p> 
            </li>
            <li className="input">
              <p>{certNumber}</p> 
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
              <p>{factoryAddr}</p> 
            </li>
          </ul>
          <ul>
            <li className="label">
              <p>Tanggal Dikirim Perpanjangan</p> 
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
      return result.path;  
    } catch (error) {
      MySwal.fire({
        title: "Gagal mengunggah dokumen pengajuan ulang CPOTB!",
        text: "IPFS mungkin tidak aktif atau terjadi error saat mengunggah dokumen.",
        icon: "error",
        confirmButtonText: "Coba Lagi"
      });
      return null;
    }
  };
  
  // PATCH: Fungsi mapping sesuai kebutuhan extend/renew
  const reconstructedHashesExtend = (uploaded) => ({
    ipfsSuratPermohonanCpotb:             uploaded["Surat Permohonan CPOTB"],
    ipfsBuktiPembayaranNegaraBukanPajak:  uploaded["Bukti Pembayaran Negara Bukan Pajak"],
    ipfsDenahBangunan:                    uploaded["Denah Bangunan Pabrik"],
    ipfsSistemMutu:                       uploaded["Dokumen Sistem Mutu CPOTB"],
    ipfsDokumenCapa:                       uploaded["Dokumen CAPA"],
    // ipfsDokumenCapa tidak dikirim ke kontrak, bisa ke Firestore jika perlu
  });

  // PATCH: Versi upload khusus untuk dokumen perpanjangan
  const uploadAllDocumentsExtend = async () => {
    const files = {
      "Surat Permohonan CPOTB":             dokumen.ipfsSuratPermohonanCpotb,
      "Bukti Pembayaran Negara Bukan Pajak": dokumen.ipfsBuktiPembayaranNegaraBukanPajak,
      "Denah Bangunan Pabrik":              dokumen.ipfsDenahBangunan,
      "Dokumen Sistem Mutu CPOTB":          dokumen.ipfsSistemMutu,
      "Dokumen CAPA":                       dokumen.ipfsDokumenCapa,
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
    // Set File ke dokumen
    setDokumen({
      ipfsSuratPermohonanCpotb:             new File([b1], "surat_permohonan.pdf", { type: "application/pdf" }),
      ipfsBuktiPembayaranNegaraBukanPajak:  new File([b2], "bukti_pnbp.pdf", { type: "application/pdf" }),
      ipfsDenahBangunan:                    new File([b2], "denah_bangunan.pdf", { type: "application/pdf" }),
      ipfsSistemMutu:                       new File([b3], "sistem_mutu.pdf", { type: "application/pdf" }),
      ipfsCpotb:                            cpotbDataExt.cpotbIpfs,
      ipfsDokumenCapa:                      new File([b3], "dokumen_capa.pdf", { type: "application/pdf" }),
    });

    MySwal.fire({ title: "Mengunggah dokumen ke IPFS…", icon: "info", showConfirmButton: false });
    const uploaded = await uploadAllDocumentsExtend();

    // --- PATCH SWEETALERT STYLE SAMA ---
    const { isConfirmed } = await MySwal.fire({
      title: `Konfirmasi Perpanjangan CPOTB`,
      html: `
          <div class="form-swal">
              <div class="row row--obat table-like">
                  <div class="col doku">
                      <ul>
                          <li class="label label-2"><p>Nama Pabrik</p></li>
                          <li class="input input-2"><p>${userdata.instanceName}</p></li>
                      </ul>
                      <ul>
                          <li class="label label-2"><p>Nomor CPOTB</p></li>
                          <li class="input input-2">
                          <a
                            href={'http://localhost:3000/public/certificate/${cpotbDataExt.cpotbIpfs}'}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            ${cpotbDataExt.cpotbNumber}
                            <i class="fa-solid fa-arrow-up-right-from-square"></i>
                          </a>
                          </li>
                      </ul>
                      <div class="doku">
                          ${Object.entries(uploaded).map(([docName, hash]) => `
                            <ul>
                              <li class="label label-2"><p>${docName}</p></li>
                              <li class="input input-2">
                                <a href="http://localhost:8080/ipfs/${hash}" target="_blank">
                                  Lihat dokumen ↗ (${hash})
                                </a>
                              </li>
                            </ul>
                          `).join("")}
                      </div>
                  </div>
              </div>
          </div>
      `,
      width: '900',
      showCancelButton: true,
      confirmButtonText: 'Konfirmasi',
      cancelButtonText: "Batal",
      allowOutsideClick: false,
    });
    if (!isConfirmed) { setLoader(false); return; }
    MySwal.fire({ title: "Tunggu koneksi Metamask…", icon: "info", showConfirmButton: false });
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
        title: 'Dokumen Pengajuan Ulang CPOTB',
        html: (
          <div className='form-swal'>
            <div className="row row--obat table-like">
              <div className="col">
                <div className="doku">
                  {Object.entries(uploadedHashes).map(([key, hash]) => (
                    <ul key={key}>
                      <li className="label label-2">
                        <p>{key.replace('ipfs', '').replace(/([A-Z])/g, ' $1')}</p>
                      </li>
                      <li className="input input-2">
                      <a
                        href={`http://localhost:8080/ipfs/${hash}`}  
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Lihat dokumen ↗ ({hash})
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
          MySwal.fire({
            title: "Menunggu koneksi Metamask...",
            text: "Jika proses ini memakan waktu terlalu lama, coba periksa koneksi Metamask Anda. 🚀",
            icon: 'info',
            showCancelButton: false,
            showConfirmButton: false,
            allowOutsideClick: false,
          });
          extendCertificate(updatedDokumen)
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

  const extendCertificate = async(hashDocs) =>{
    console.log(
      cpotbDataExt.idCpotb, 
        cpotbDataExt.extTimestamp,
        [hashDocs.ipfsSuratPermohonanCpotb, hashDocs.ipfsBuktiPembayaranNegaraBukanPajak, hashDocs.ipfsDenahBangunan, hashDocs.ipfsSistemMutu, cpotbDataExt.cpotbIpfs, hashDocs.ipfsDokumenCapa]

    );
    try {
      const extendCertificateCt = await contracts.certificateManager.extendCpotb(
        cpotbDataExt.idCpotb, 
        cpotbDataExt.extTimestamp, 
        [hashDocs.ipfsSuratPermohonanCpotb, hashDocs.ipfsBuktiPembayaranNegaraBukanPajak, hashDocs.ipfsDenahBangunan, hashDocs.ipfsSistemMutu, cpotbDataExt.cpotbIpfs, hashDocs.ipfsDokumenCapa]
      )
      console.log(extendCertificateCt);

      if (extendCertificateCt) {
        MySwal.update({
          title: "Memproses transaksi...",
          text: "Proses transaksi sedang berlangsung, harap tunggu. ⏳"
        });
      }

      contracts.certificateManager.on('CertExtendRequest',  (factoryAddr,  _timestamp) => {
        updateCpotbFb(extendCertificateCt.hash, Number(_timestamp), jenisSediaanMap[cpotbDataExt.jenisSediaan]);
        recordHashFb(extendCertificateCt.hash, Number(_timestamp), jenisSediaanMap[cpotbDataExt.jenisSediaan])
        handleEventCpotbExtendRequested(factoryAddr, _timestamp, extendCertificateCt.hash, cpotbDataExt.cpotbNumber)
      });
    } catch (error) {
      errAlert(error)
    }
  }

  const updateCpotbFb = async (cpotbHash, timestamp, jenisSediaan) => {
    try {
      const docRef = doc(db, 'cpotb_list', userdata.instanceName);

      await updateDoc(docRef, {
        [`${jenisSediaan}.extendRequestHash`]: cpotbHash,
        [`${jenisSediaan}.extendRequestTimestamp`]: timestamp, 
        [`${jenisSediaan}.status`]: 4
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

  // Tombol Auto Dummy + IPFS + Renew (patch, ini yang dipakai di tombol bawah)
  // handleAutoFillAndRenew

  return (
    <div id="CpotbPage" className='Layout-Menu layout-page'>
      <div className="title-menu">
        <h1>Pengajuan Perpanjangan Sertifikat CPOTB</h1>
      </div>
      <div className='container-form pengajuan-ulang'>
        <form onSubmit={handleSubmit}>
          <ul>
            <li className="label"><label>Nomor CPOTB</label></li>
            <li className="input">
              <a
                href={`http://localhost:3000/public/certificate/${cpotbDataExt.cpotbIpfs}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {cpotbDataExt.cpotbNumber}
                <i className="fa-solid fa-arrow-up-right-from-square"></i>
              </a>
            </li>
          </ul> 
          <ul>
            <li className="label"><label>Jenis Sediaan</label></li>
            <li className="input"><p>{jenisSediaanMap[cpotbDataExt.jenisSediaan]}</p></li>
          </ul> 
          <div className="doku">
            <h5>Dokumen Perpanjangan</h5>
            {['ipfsDenahBangunan', 'ipfsSistemMutu', 'ipfsBuktiPembayaranNegaraBukanPajak','ipfsDokumenCapa', 'ipfsSuratPermohonanCpotb'].map((key) => (
              <ul key={key}>
                <li className="label">
                  <label>{labelMapping[key]}</label>
                </li>
                <li className="input">
                  <input type="file" accept="application/pdf" onChange={(e) => handleFileChange(e, key)} />
                  {dokumen[key] && typeof dokumen[key] === "string" && (
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
            {loader ? <img src={imgLoader} alt="loading..." /> : "Kirim Pengajuan Ulang CPOTB"}
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

export default CpotbExtendRequest;
  