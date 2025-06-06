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

const MySwal = withReactContent(Swal);
const client = create({ url: 'http://127.0.0.1:5001/api/v0' });

function CpotbExtendRenewRequest() {
  const [contracts, setContracts] = useState({});
  const navigate = useNavigate();
  const userdata = JSON.parse(sessionStorage.getItem('userdata'));
  const cpotbDataExt = JSON.parse(sessionStorage.getItem('cpotbDataExt'));

  const [dokumen, setDokumen] = useState({
    ipfsSuratPermohonanCpotb: null,
    ipfsBuktiPembayaranNegaraBukanPajak: null,
    ipfsDenahBangunan: null,
    ipfsSistemMutu: null,
    ipfsCpotb: null,          
    ipfsDokumenCapa: null,
  });
  const [updateFileIpfs, setUpdateFileIpfs] = useState([]);
  const [loader, setLoader] = useState(false);

  const today = new Date();
  const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' };
  const formattedDate = today.toLocaleDateString('id-ID', options);

  useEffect(() => {
    document.title = "Pengajuan Ulang Perpanjangan CPOTB";

    (async () => {
      if (!window.ethereum) return console.error("MetaMask is not installed");
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(
        contractData.CertificateManager.address,
        contractData.CertificateManager.abi,
        signer
      );
      setContracts({ certificateManager: contract });
    })();

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", () => {
        window.location.reload();
      });
    }
  }, []);

  useEffect(() => {
    const loadDetails = async () => {
      if (!contracts.certificateManager) return;
      const detail = await contracts.certificateManager.getCpotbDetails(cpotbDataExt.idCpotb);
      const docsResertifikasi = detail[4]; 
      const [suratCid, bayarCid, denahCid, mutuCid, oldCid, capaCid] = docsResertifikasi;
      setDokumen({
        ipfsSuratPermohonanCpotb: suratCid,
        ipfsBuktiPembayaranNegaraBukanPajak: bayarCid,
        ipfsDenahBangunan: denahCid,
        ipfsSistemMutu: mutuCid,
        ipfsCpotb: oldCid,
        ipfsDokumenCapa: capaCid,
      });
    };
    loadDetails();
  }, [contracts]);

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
      ['Surat Permohonan CPOTB', finalDocs.ipfsSuratPermohonanCpotb],
      ['Bukti Pembayaran PNBP', finalDocs.ipfsBuktiPembayaranNegaraBukanPajak],
      ['Denah Bangunan', finalDocs.ipfsDenahBangunan],
      ['Dokumen Sistem Mutu CPOTB', finalDocs.ipfsSistemMutu],
      ['Sertifikat Lama', finalDocs.ipfsCpotb],
      ['Dokumen CAPA', finalDocs.ipfsDokumenCapa],
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
    await extendCertificate(finalDocs);
    setLoader(false);
  };

  const extendCertificate = async (hashDocs) => {
    const {
      ipfsSuratPermohonanCpotb,
      ipfsBuktiPembayaranNegaraBukanPajak,
      ipfsDenahBangunan,
      ipfsSistemMutu,
      ipfsCpotb,
      ipfsDokumenCapa
    } = hashDocs;
    try {
      const tx = await contracts.certificateManager.renewExtendCpotb(
        cpotbDataExt.idCpotb,
        [
          ipfsSuratPermohonanCpotb,
          ipfsBuktiPembayaranNegaraBukanPajak,
          ipfsDenahBangunan,
          ipfsSistemMutu,
          ipfsCpotb,
          ipfsDokumenCapa
        ]
      );
      console.log(tx)
      MySwal.update({ title: "Memproses transaksi…", text: "Harap tunggu…" });
      contracts.certificateManager.on('CertExtendRequest', (factoryAddr, ts) => {
        const timestamp = Number(ts);
        // updateCpotbFb(tx.hash, timestamp);
        // recordHashFb(tx.hash, timestamp);
        // handleEventCpotbExtendRequested(factoryAddr, ts, tx.hash);
      });
    } catch (err) {
      MySwal.fire({ title: err.message || 'Error', icon: 'error' });
    }
  };


  return (
    <div id="CpotbPage" className='Layout-Menu layout-page'>
      <div className="title-menu"><h1>Pengajuan Ulang Perpanjangan Sertifikat CPOTB</h1></div>
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
            <li className="input"><p>{cpotbDataExt.jenisSediaan}</p></li>
          </ul> 
          <ul>
            <li className="label"><label>Alasan Penolakan Pengajuan</label></li>
            <li className="input"><p>{cpotbDataExt.rejectMsgExt}</p></li>
          </ul> 

          <div className="doku">
            <h5>Dokumen Administratif</h5>
            <ul><li className="label"><label>Surat permohonan</label></li>
              <li className="input">
                <input type="file" accept="application/pdf" 
                onChange={e => handleFileChange(e, 'ipfsSuratPermohonanCpotb')} />
                {dokumen.ipfsSuratPermohonanCpotb && <a href={`http://localhost:8080/ipfs/${dokumen.ipfsSuratPermohonanCpotoh}`} target="_blank" rel="noopener noreferrer">Lihat Surat permohonan <i class="fa-solid fa-arrow-up-right-from-square"></i></a>}
              </li></ul>
            <ul><li className="label"><label>Bukti pembayaran penerimaan negara bukan pajak</label></li>
              <li className="input">
                <input type="file" accept="application/pdf" onChange={e => handleFileChange(e, 'ipfsBuktiPembayaranNegaraBukanPajak')} />
                {dokumen.ipfsBuktiPembayaranNegaraBukanPajak && <a href={`http://localhost:8080/ipfs/${dokumen.ipfsBuktiPembayaranNegaraBukanPajak}`} target="_blank" rel="noopener noreferrer">Lihat Bukti pembayaran PNBP <i class="fa-solid fa-arrow-up-right-from-square"></i></a>}
              </li></ul>
          </div>

          <div className="doku">
            <h5>Dokumen Teknis</h5>
            <ul><li className="label"><label>Dokumen denah tata ruang bangunan sesuai dengan persyaratan CPOTB</label></li>
              <li className="input">
                <input type="file" accept="application/pdf" onChange={e => handleFileChange(e, 'ipfsDenahBangunan')} />
                {dokumen.ipfsDenahBangunan && <a href={`http://localhost:8080/ipfs/${dokumen.ipfsDenahBangunan}`} target="_blank" rel="noopener noreferrer">Lihat Denah tata ruang bangunan <i class="fa-solid fa-arrow-up-right-from-square"></i></a>}
              </li></ul>
            <ul><li className="label"><label>Dokumen sistem mutu sesuai dengan persyaratan CPOTB</label></li>
              <li className="input">
                <input type="file" accept="application/pdf" onChange={e => handleFileChange(e, 'ipfsSistemMutu')} />
                {dokumen.ipfsSistemMutu && <a href={`http://localhost:8080/ipfs/${dokumen.ipfsSistemMutu}`} target="_blank" rel="noopener noreferrer">Lihat Dokumen sistem mutu <i class="fa-solid fa-arrow-up-right-from-square"></i></a>}
              </li></ul>
            <ul><li className="label"><label>Dokumen Corrective Action and Preventive Action (CAPA)</label></li>
              <li className="input">
                <input type="file" accept="application/pdf" onChange={e => handleFileChange(e, 'ipfsDokumenCapa')} />
                {dokumen.ipfsDokumenCapa && <a href={`http://localhost:8080/ipfs/${dokumen.ipfsDokumenCapa}`} target="_blank" rel="noopener noreferrer">Lihat Dokumen CAPA <i class="fa-solid fa-arrow-up-right-from-square"></i></a>}
              </li></ul>
          </div>

          <button type="submit" disabled={loader}>
            {loader ? <img src={imgLoader} alt="loading..." /> : "Kirim Pengajuan Ulang CPOTB"}
          </button>
        </form>

      </div>
    </div>
  );
}

export default CpotbExtendRenewRequest;
