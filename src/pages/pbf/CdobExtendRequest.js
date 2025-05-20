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
  const cdobDataExt = JSON.parse(sessionStorage.getItem('cdobDataExt'));
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

  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  };

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

  const handleEventCdob = (pbfAddr, timestamp, txHash, certNumber) => {
    const formattedTimestamp = new Date(Number(timestamp) * 1000).toLocaleDateString('id-ID', options);
    MySwal.fire({
      title: "Permintaan perpanjangan CDOB terkirim",
      html: (
        `<div class='form-swal event'>
          <ul class='klaim'>
            <li class="label"><p>Nomor CDOB</p></li>
            <li class="input"><p>${certNumber}</p></li>
          </ul>
          <ul>
            <li class="label"><p>Nama Instansi PBF</p></li>
            <li class="input"><p>${userdata.instanceName}</p></li>
          </ul>
          <ul class='klaim'>
            <li class="label"><p>Alamat Akun PBF (Pengguna)</p></li>
            <li class="input"><p>${pbfAddr}</p></li>
          </ul>
          <ul>
            <li class="label"><p>Tanggal Dikirim Perpanjangan</p></li>
            <li class="input"><p>${formattedTimestamp}</p></li>
          </ul>
          <ul class="txHash">
            <li class="label"><p>Hash Transaksi</p></li>
            <li class="input">
              <a
                href="https://sepolia.etherscan.io/tx/${txHash}"
                target="_blank"
                rel="noreferrer"
              >
                Lihat transaksi di Etherscan
              </a>
            </li>
          </ul>
        </div>`
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
        title: "Gagal mengunggah dokumen pengajuan ulang CDOB!",
        text: "IPFS mungkin tidak aktif atau terjadi error saat mengunggah dokumen.",
        icon: "error",
        confirmButtonText: "Coba Lagi"
      });
      return null;
    }
  };

  // Fungsi mapping khusus CDOB
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
      html: `
        <div class="form-swal">
          <div class="row row--obat table-like">
            <div class="col doku">
              <ul>
                <li class="label label-2"><p>Nama PBF</p></li>
                <li class="input input-2"><p>${userdata.instanceName}</p></li>
              </ul>
              <ul>
                <li class="label label-2"><p>Nomor CDOB</p></li>
                <li class="input input-2">
                  <a
                    href="http://localhost:3000/public/certificate/${cdobDataExt.cdobIpfs}"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    ${cdobDataExt.cdobNumber}
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
        html: `
          <div class="form-swal">
            <div class="row row--obat table-like">
              <div class="col">
                <div class="doku">
                  ${Object.entries(uploadedHashes).map(([key, hash]) => `
                    <ul>
                      <li class="label label-2">
                        <p>${labelMapping[key]}</p>
                      </li>
                      <li class="input input-2">
                        <a
                          href="http://localhost:8080/ipfs/${hash}"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
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

  // Fungsi extend ke kontrak (dan Firebase)
  const extendCertificate = async (hashDocs) => {
    const { idCdob, extTimestamp, tipePermohonan, cdobNumber } = cdobDataExt;
    try {
      const extendCertificateCt = await contracts.certificateManager.extendCdob(
        idCdob,
        extTimestamp,
        [hashDocs.suratPernyataanPimpinan, hashDocs.dokumenInspeksiDiri, hashDocs.dokumenPerbaikan]
      );
      if (extendCertificateCt) {
        MySwal.update({
          title: "Memproses transaksi...",
          text: "Proses transaksi sedang berlangsung, harap tunggu. ⏳"
        });
      }
      contracts.certificateManager.on('CertExtendRequest', (_pbfAddr, _timestamp) => {
        updateCdobFb(extendCertificateCt.hash, Number(_timestamp), tipePermohonan);
        recordHashFb(extendCertificateCt.hash, Number(_timestamp), tipePermohonan);
        handleEventCdob(_pbfAddr, _timestamp, extendCertificateCt.hash, cdobNumber);
      });
    } catch (error) {
      errAlert(error);
    }
  };

  // Update Firestore untuk CDOB
  const updateCdobFb = async (cdobHash, timestamp, tp) => {
    const tpMap = {
      0n: 'Obat Lain',
      1n: 'Cold Chain Product'
    };
    const tipeP = tpMap[tp] || tp;
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

  const recordHashFb = async (txHash, timestamp, tp) => {
    const tpMap = {
      0n: 'Obat Lain',
      1n: 'Cold Chain Product'
    };
    const tipeP = tpMap[tp] || tp;
    try {
      const collectionName = `pengajuan_cdob_${userdata.instanceName}`;
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
  };

  return (
    <div id="CdobPage" className='Layout-Menu layout-page'>
      <div className="title-menu">
        <h1>Pengajuan Perpanjangan Sertifikat CDOB</h1>
      </div>
      <div className='container-form pengajuan-ulang'>
        <form onSubmit={handleSubmit}>
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
            <h5>Dokumen Perpanjangan</h5>
            {Object.keys(labelMapping).map((key) => (
              <ul key={key}>
                <li className="label">
                  <label>{labelMapping[key]}</label>
                </li>
                <li className="input">
                  <input type="file" accept="application/pdf" onChange={(e) => handleFileChange(e, key)} />
                  {dokumen[key] && typeof dokumen[key] === "string" && (
                    <a href={`http://localhost:8080/ipfs/${dokumen[key]}`} target="_blank" rel="noopener noreferrer">
                      Lihat {labelMapping[key]}
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
