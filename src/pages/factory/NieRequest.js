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
import dummyPdf from '../../assets/dummy.pdf'
import dummyPdf2 from '../../assets/dummy2.pdf'
import dummyPdf3 from '../../assets/dummy3.pdf'

const MySwal = withReactContent(Swal);
const client = create({ url: 'http://127.0.0.1:5001/api/v0' });

function NieRequest() {
  const [contracts, setContracts] = useState({});
  const navigate = useNavigate();
  const userdata = JSON.parse(sessionStorage.getItem('userdata'))
  const obatData = JSON.parse(sessionStorage.getItem('obatData'))

  const [masterFormula, setMasterFormula] = useState(null);
  const [suratKuasa, setSuratKuasa] = useState(null);
  const [suratPernyataan, setSuratPernyataan] = useState(null);
  const [komposisiProduk, setKomposisiProduk] = useState(null);
  const [caraPembuatanProduk, setCaraPembuatanProduk] = useState(null);
  const [sertifikatAnalisaBahanBaku, setSertifikatAnalisaBahanBaku] = useState(null);
  const [sertifikatAnalisaProdukJadi, setSertifikatAnalisaProdukJadi] = useState(null);
  const [spesifikasiProdukJadi, setSpesifikasiProdukJadi] = useState(null);
  const [spesifikasiKemasan, setSpesifikasiKemasan] = useState(null);
  const [sistemPenomoranBets, setSistemPenomoranBets] = useState(null);
  const [hasilUjiStabilitas, setHasilUjiStabilitas] = useState(null);
  const [desainKemasan, setDesainKemasan] = useState(null);
  const [dataPendukungKeamanan, setDataPendukungKeamanan] = useState(null);
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
    document.title = "Pengajuan NIE"; 
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

  const handleEventNieRequsted = (namaProduk, factoryAddr, factoryInstance, timestamp, txHash) =>{

    const formattedTimestamp = new Date(Number(timestamp) * 1000).toLocaleDateString('id-ID', options)
    
    MySwal.fire({
      title: "Sukses mengajukan NIE",
      html: (
        <div className='form-swal event'>
          <ul>
            <li className="label">
              <p>Nama Produk</p> 
            </li>
            <li className="input">
              <p>{namaProduk}</p> 
            </li>
          </ul>
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

  const requestNie = async(hashDocs) => {
    console.log(obatData.obatId,
      [
        hashDocs.dokumen_master_formula,
        hashDocs.surat_kuasa,
        hashDocs.surat_pernyataan,
        hashDocs.dokumen_komposisi_produk,
        hashDocs.dokumen_cara_pembuatan_produk,
        hashDocs.dokumen_spesifikasi_kemasan,
        hashDocs.dokumen_hasil_uji_stabilitas
      ],
      [
        hashDocs.sertifikat_analisa_bahan_baku,
        hashDocs.sertifikat_analisa_produk_jadi,
        hashDocs.dokumen_spesifikasi_produk_jadi,
        hashDocs.dokumen_sistem_penomoran_bets,
        hashDocs.desain_kemasan,
        hashDocs.data_pendukung_keamanan
      ]);
    try {
      const requestNieCt = await contracts.nieManager.requestNie(
        obatData.obatId,
        [
          hashDocs.dokumen_master_formula,
          hashDocs.surat_kuasa,
          hashDocs.surat_pernyataan,
          hashDocs.dokumen_komposisi_produk,
          hashDocs.dokumen_cara_pembuatan_produk,
          hashDocs.dokumen_spesifikasi_kemasan,
          hashDocs.dokumen_hasil_uji_stabilitas
        ],
        [
          hashDocs.sertifikat_analisa_bahan_baku,
          hashDocs.sertifikat_analisa_produk_jadi,
          hashDocs.dokumen_spesifikasi_produk_jadi,
          hashDocs.dokumen_sistem_penomoran_bets,
          hashDocs.desain_kemasan,
          hashDocs.data_pendukung_keamanan
        ]
      );
      
      if(requestNieCt){
        updateObatFb(userdata.instanceName, obatData.namaObat, requestNieCt.hash)
        MySwal.update({
          title: "Memproses transaksi...",
          text: "Proses transaksi sedang berlangsung, harap tunggu. ⏳",
          allowOutsideClick: false
        });
      }

      contracts.nieManager.once("NieRequested", ( _factoryInstance, _factoryAddr, _timestampRequestNie) => {
        handleEventNieRequsted(obatData.namaObat, _factoryAddr, _factoryInstance,_timestampRequestNie, requestNieCt.hash)
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

  const reconstructedHashes = (uploadedHashes) => {
    const hashes = {};

    Object.entries(uploadedHashes).forEach(([key, value]) => {
      const formattedKey = key.toLowerCase().replace(/\s+/g, '_'); 
      hashes[formattedKey] = value;
    });

    return hashes;
  };

  const mountData =(e) => {
    e.preventDefault();

    setLoader(true)
    MySwal.fire({
      title: "Menunggu koneksi Metamask...",
      text: "Jika proses ini memakan waktu terlalu lama, coba periksa koneksi Metamask Anda. 🚀",
      icon: 'info',
      showCancelButton: false,
      showConfirmButton: false,
      allowOutsideClick: false,
    });
    
    uploadDocuIpfs()
  }

  const uploadDocuIpfs = async () => {
    console.log(34);
    let uploadedHashes;

    MySwal.fire({
      title: "Mengunggah semua dokumen ke IPFS...",
      text: "Harap tunggu. Jika proses ini memakan waktu terlalu lama, coba periksa koneksi IPFS. 🚀",
      icon: 'info',
      showCancelButton: false,
      showConfirmButton: false,
      allowOutsideClick: true,
    });
    try {
      
      uploadedHashes = await uploadAllDocuments();
      console.log(uploadedHashes);
      console.log(2);
      
      MySwal.fire({
        title: `Konfirmasi dokumen pengajuan NIE`,
        html: `
            <div class="form-swal">
                <div class="row row--obat table-like">
                    <div class="col">
                    
                    <div class="doku">
                      <ul>
                          <li class="label label1"><p>Nama Pabrik</p></li>
                          <li class="input input-2"><p>${userdata.instanceName}</p></li>
                      </ul>
                      <ul>
                          <li class="label label1"><p>Nama Obat</p></li>
                          <li class="input input-2"><p>${obatData.namaObat}</p></li>
                      </ul>
                            ${Object.entries(uploadedHashes).map(([docName, hash]) => `
                              <ul>
                                <li class="label label1"><p>${docName}</p></li>
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
        width: '900',
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
              title:"Menunggu koneksi Metamask...",
              text:"Jika proses ini memakan waktu terlalu lama, coba periksa koneksi Metamask Anda. 🚀",
              icon: "info",
              showConfirmButton: false,
              allowOutsideClick: false
            });
            const hashDocs = reconstructedHashes(uploadedHashes);
            console.log(hashDocs);
            requestNie(hashDocs)
          }
          else {
            setLoader(false)
          }
      });

    } catch (error) {
      MySwal.fire({
        title: "Gagal mengunggah dokumen pengajuan CPOTB!",
        text: "IPFS mungkin tidak aktif atau terjadi error saat mengunggah dokumen.",
        icon: "error",
        confirmButtonText: "Coba Lagi",
        didOpen: () => {
          const actions = Swal.getActions();
         actions.style.justifyContent = "center";
        }
      });
      
    }


  };  

  const uploadAllDocuments = async () => {
    const files = {
      "Dokumen Master Formula": masterFormula,
      "Surat Kuasa": suratKuasa,
      "Surat Pernyataan": suratPernyataan,
      "Dokumen Komposisi Produk": komposisiProduk,
      "Dokumen Cara Pembuatan Produk": caraPembuatanProduk,
      "Dokumen Spesifikasi Produk Jadi": spesifikasiProdukJadi,
      "Dokumen Sistem Penomoran Bets": sistemPenomoranBets,
      "Sertifikat Analisa Bahan Baku": sertifikatAnalisaBahanBaku,
      "Sertifikat Analisa Produk Jadi": sertifikatAnalisaProdukJadi,
      "Dokumen Hasil Uji Stabilitas": hasilUjiStabilitas,
      "Dokumen Spesifikasi Kemasan": spesifikasiKemasan,
      "Desain Kemasan": desainKemasan,
      "Data Pendukung Keamanan": dataPendukungKeamanan
    };
    
    const uploadedHashes = {};

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
          setLoader(false)
          return uploadedHashes = false;
        }
    });

    await Promise.all(uploadPromises);
    return uploadedHashes;
  };

  const handleAutoUploadClickDummy3 = (setName) => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'application/pdf';
    
    // Mengatur file input untuk secara otomatis mengisi file
    fileInput.files = createFileList([dummyPdf3]);
    
    handleFileChange({ target: { files: fileInput.files } }, setName);
  };

  const handleAutoFill = () => {
    handleAutoUploadClickDummy3(setMasterFormula); // Dokumen Master Formula
    handleAutoUploadClickDummy3(setSuratKuasa); // Surat Kuasa
    handleAutoUploadClickDummy3(setSuratPernyataan); // Surat Pernyataan
    handleAutoUploadClickDummy3(setKomposisiProduk); // Dokumen Komposisi Produk
    handleAutoUploadClickDummy3(setCaraPembuatanProduk); // Dokumen Cara Pembuatan Produk
    handleAutoUploadClickDummy3(setSpesifikasiProdukJadi); // Dokumen Spesifikasi Produk Jadi
    handleAutoUploadClickDummy3(setSistemPenomoranBets); // Dokumen Sistem Penomoran Bets
    handleAutoUploadClickDummy3(setSertifikatAnalisaBahanBaku); // Sertifikat Analisa Bahan Baku
    handleAutoUploadClickDummy3(setSertifikatAnalisaProdukJadi); // Sertifikat Analisa Produk Jadi
    handleAutoUploadClickDummy3(setHasilUjiStabilitas); // Dokumen Hasil Uji Stabilitas
    handleAutoUploadClickDummy3(setSpesifikasiKemasan); // Spesifikasi Kemasan
    handleAutoUploadClickDummy3(setDesainKemasan); // Desain Kemasan
    handleAutoUploadClickDummy3(setDataPendukungKeamanan); // Data Pendukung Keamanan
  };

  const createFileList = (files) => {
    const dataTransfer = new DataTransfer();
    files.forEach((file) => {
      dataTransfer.items.add(file);
    });
    return dataTransfer.files;
  };

  return (
    <div id="CpotbPage" className='Layout-Menu layout-page'>
      <div className="title-menu">
        <h1>Pengajuan NIE Obat Tradisonal</h1>
      </div>
      <div className='container-form'>
        <form onSubmit={mountData}>
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
              <label htmlFor="instanceName">NIB Pabrik</label>
            </li>
            <li className="input">
              <p>{userdata.nib}</p>
            </li>
          </ul>
          <ul>
            <li className="label">
              <label htmlFor="instanceName">NPWP Pabrik</label>
            </li>
            <li className="input">
              <p>{userdata.npwp}</p>
            </li>
          </ul>

          <div className="doku">
            <h5>Dokumen Pengajuan NIE</h5>
            <ul>
              <li className="label">
                <label htmlFor="instanceName">Dokumen Master Formula</label>
              </li>
              <li className="input">
                <input type="file" accept="application/pdf" name="instanceName" onChange={(e) => handleFileChange(e, setMasterFormula)} required/>
              </li>
            </ul>
            <ul>
              <li className="label">
                <label htmlFor="instanceName">Surat Kuasa</label>
              </li>
              <li className="input">
                <input type="file" accept="application/pdf" name="instanceName" onChange={(e) => handleFileChange(e, setSuratKuasa)} required/>
              </li>
            </ul>
            <ul>
              <li className="label">
                <label htmlFor="instanceName">Surat Pernyataan</label>
              </li>
              <li className="input">
                <input type="file" accept="application/pdf" name="instanceName" onChange={(e) => handleFileChange(e, setSuratPernyataan)} required/>
              </li>
            </ul>
            <ul>
              <li className="label">
                <label htmlFor="instanceName">Dokumen Komposisi Produk</label>
              </li>
              <li className="input">
                <input type="file" accept="application/pdf" name="instanceName" onChange={(e) => handleFileChange(e, setKomposisiProduk)} required/>
              </li>
            </ul>
            <ul>
              <li className="label">
                <label htmlFor="instanceName">Dokumen Cara Pembuatan Produk</label>
              </li>
              <li className="input">
                <input type="file" accept="application/pdf" name="instanceName" onChange={(e) => handleFileChange(e, setCaraPembuatanProduk)} required/>
              </li>
            </ul>
            <ul>
              <li className="label">
                <label htmlFor="instanceName">Dokumen Spesifikasi Produk Jadi</label>
              </li>
              <li className="input">
                <input type="file" accept="application/pdf" name="instanceName" onChange={(e) => handleFileChange(e, setSpesifikasiProdukJadi)} required/>
              </li>
            </ul>
            <ul>
              <li className="label">
                <label htmlFor="instanceName">Dokumen Sistem Penomoran Bets</label>
              </li>
              <li className="input">
                <input type="file" accept="application/pdf" name="instanceName" onChange={(e) => handleFileChange(e, setSistemPenomoranBets)} required/>
              </li>
            </ul>
            <ul>
              <li className="label">
                <label htmlFor="instanceName">Sertifikat Analisa Bahan Baku</label>
              </li>
              <li className="input">
                <input type="file" accept="application/pdf" name="instanceName" onChange={(e) => handleFileChange(e, setSertifikatAnalisaBahanBaku)} required/>
              </li>
            </ul>
            <ul>
              <li className="label">
                <label htmlFor="instanceName">Sertifikat Analisa Produk Jadi</label>
              </li>
              <li className="input">
                <input type="file" accept="application/pdf" name="instanceName" onChange={(e) => handleFileChange(e, setSertifikatAnalisaProdukJadi)} required/>
              </li>
            </ul>
            <ul>
              <li className="label">
                <label htmlFor="instanceName">Dokumen Hasil Uji Stabilitas</label>
              </li>
              <li className="input">
                <input type="file" accept="application/pdf" name="instanceName" onChange={(e) => handleFileChange(e, setHasilUjiStabilitas)} required/>
              </li>
            </ul>
            <ul>
              <li className="label">
                <label htmlFor="instanceName">Dokumen Spesifikasi Kemasan</label>
              </li>
              <li className="input">
                <input type="file" accept="application/pdf" name="instanceName" onChange={(e) => handleFileChange(e, setSpesifikasiKemasan)} required/>
              </li>
            </ul>
            <ul>
              <li className="label">
                <label htmlFor="instanceName">Desain Kemasan</label>
              </li>
              <li className="input">
                <input type="file" accept="application/pdf" name="instanceName" onChange={(e) => handleFileChange(e, setDesainKemasan)} required/>
              </li>
            </ul>
            <ul>
              <li className="label">
                <label htmlFor="instanceName">Data Pendukung Keamanan</label>
              </li>
              <li className="input">
                <input type="file" accept="application/pdf" name="instanceName" onChange={(e) => handleFileChange(e, setDataPendukungKeamanan)} required/>
              </li>
            </ul>
          </div>

          <button type='submit'>
          {
            loader? (
              <img src={imgLoader} alt="" />
            ) : (
              "Kirim Pengajuan NIE"
            )
          }
            </button>

            {/* <button type='button' onClick={handleAutoFill}>
              Isi Semua Field dengan Dummy
            </button> */}
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

export default NieRequest;

