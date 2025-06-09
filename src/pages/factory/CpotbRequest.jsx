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

function CpotbRequest() {
  const [contract, setContract] = useState();
  const navigate = useNavigate();
  const userdata = JSON.parse(sessionStorage.getItem('userdata'))
  const [dataCpotb, setDataCpotb] = useState([]);
  const [jenisSediaan, setJenisSediaan] = useState(""); 
  const [filteredJenisSediaan, setFilteredJenisSediaan] = useState([]);
  const [suratPermohonan, setSuratPermohonan] = useState(null);
  const [buktiPembayaranNegaraBukanPajak, setBuktiPembayaranNegaraBukanPajak] = useState(null);
  const [suratKomitmen, setSuratKomitmen] = useState(null);
  const [denahBangunan, setDenahBangunan] = useState(null);
  const [sistemMutu, setSistemMutu] = useState(null);
  const [loader, setLoader] = useState(false)
  const [factoryType, setFactoryType] = useState("")

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
  
  const usahaSediaanMapping = {
    UMOT: [1n, 13n, 15n, 20n, 21n], 
    UKOT: [0n, 1n, 2n, 3n, 5n, 6n, 9n, 10n, 11n, 12n, 13n, 14n, 15n, 16n, 17n, 18n, 19n, 20n, 21n, 22n, 24n], 
    IOT: [0n, 1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n, 9n, 10n, 11n, 12n, 13n, 14n, 15n, 16n, 17n, 18n, 19n, 20n, 21n, 22n, 23n, 24n] 
  };
  
  useEffect(() => {
    document.title = "Pengajuan CPOTB"; 
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

    if (userdata.factoryType === "UMOT") {
      setFactoryType("Usaha Mikro Obat Tradisional (UMOT)")
    } else if (userdata.factoryType === "UKOT") {
      setFactoryType("Usaha Kecil Obat Tradisional (UKOT)")
    } else if (userdata.factoryType === "IOT") {
      setFactoryType("Industri Obat Tradisional (IOT)")
    }

    if (userdata.factoryType && usahaSediaanMapping[userdata.factoryType]) {
      const filtered = usahaSediaanMapping[userdata.factoryType].map((key) => ({
        key: key.toString(),
        label: jenisSediaanMap[key]
      }));

      console.log('==>',filtered);
      setFilteredJenisSediaan(filtered);
    } else {
      setFilteredJenisSediaan([]);
    }

    const fetchDataCpotb = async () => {
      if(contract) { 
        try {
          console.log(userdata.instanceName);
          const listAllCt = await contract.getCpotbByInstance(userdata.instanceName);
          console.log(listAllCt);
          const reconstructedData = listAllCt.map((item) => {
          
            if(item[3] === 0) {
              
            }
            return { 
              jenisSediaan: item[3].toString(),
            };
          });
  
          setDataCpotb(reconstructedData);
          console.log(reconstructedData);
  
        } catch (error) {
          errAlert(error, "Error loading data.")
        }
      }

    }

    fetchDataCpotb()

  }, [userdata.factoryType, contract]);

  const handleEventCpotbRequested = (_name, _userAddr, _jenisSediaan, _timestampRequest, txHash) => {
    const formattedTimestamp = new Date(Number(_timestampRequest) * 1000).toLocaleDateString('id-ID', options)

    MySwal.fire({
      title: "Sukses Mengajukan CPOTB",
      html: (
        <div className='form-swal event'>
          <ul>
            <li className="label">
              <p>Nama Instansi Pabrik</p>
            </li>
            <li className="input">
              <p>{_name}</p> 
            </li>
          </ul>
          <ul>
            <li className="label">
              <p>Alamat Akun Pengguna</p> 
            </li>
            <li className="input">
              <p>{_userAddr}</p> 
            </li>
          </ul>
          <ul>
            <li className="label">
              <p>Jenis Sediaan</p> 
            </li>
            <li className="input">
              <p>{jenisSediaanMap[_jenisSediaan]}</p> 
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
        navigate('/cpotb');
      }
    });

    setLoader(false)
  }

  const checkExistingCpotb = (jenisSediaan) => {
    if (dataCpotb.length > 0) {
      const found = dataCpotb.some((item) => item.jenisSediaan === jenisSediaan);
      console.log(jenisSediaan);
      console.log(found);

      if (found){
        return false
      } else {
        return true
      }
    } else {
      return true
    }

  }

  const requestCpotb = async (hashDocs) => {
    console.log(4);
    console.log(hashDocs);
  
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0'); 
    const year = today.getFullYear();
    const randomNumber = Math.floor(100000 + Math.random() * 900000); 
    
    const id = `cpotb-${day}${month}${year}-${randomNumber}` 
    console.log(        [id, userdata.name, userdata.instanceName, userdata.address], 
      parseInt(jenisSediaan), 
      userdata.factoryType,
      [hashDocs.surat_permohonan_cpotb, hashDocs.bukti_pembayaran_negara_bukan_pajak, hashDocs.surat_pernyataan_komitmen],
      [hashDocs.denah_bangunan_pabrik, hashDocs.dokumen_sistem_mutu_cpotb]
    );

    try {
      const requestCpotbCt = await contract.requestCpotb(
        [id, userdata.name, userdata.instanceName, userdata.address], 
        parseInt(jenisSediaan), 
        userdata.factoryType,
        [hashDocs.surat_permohonan_cpotb, hashDocs.bukti_pembayaran_negara_bukan_pajak, hashDocs.surat_pernyataan_komitmen],
        [hashDocs.denah_bangunan_pabrik, hashDocs.dokumen_sistem_mutu_cpotb]
      );
      console.log('Receipt:', requestCpotbCt);
  
      if(requestCpotbCt){
        
        MySwal.update({
          title: "Memproses transaksi...",
          text: "Proses transaksi sedang berlangsung, harap tunggu. ⏳",
          allowOutsideClick: false
        });
      }
      
      contract.once("CertRequested", (_name, _userAddr, _jenisSediaan, _timestampRequest) => {
        handleEventCpotbRequested(_name, _userAddr, _jenisSediaan, _timestampRequest, requestCpotbCt.hash);
        writeCpotbFb( userdata.instanceName, jenisSediaanMap[jenisSediaan], requestCpotbCt.hash, Number(_timestampRequest));
        recordHashFb(jenisSediaanMap[jenisSediaan], requestCpotbCt.hash, Number(_timestampRequest))
      });
  
    } catch (err) {
      setLoader(false)
      errAlert(err, "Error making request!");
    }
   
  };

  const checkEligiblePabrik = (jenisSediaan) => {
    console.log(jenisSediaan);
    const isSediaanValid = filteredJenisSediaan.some(item => item.key === jenisSediaan || console.log(item.key));
    console.log(isSediaanValid);
    return isSediaanValid
  }

  const writeCpotbFb = async (instanceName, jenisSediaan, requestCpotbCtHash, timestamp) => {
    try {
      const docRef = doc(db, 'cpotb_list', instanceName);
      const docRefUser = doc(db, 'company_data', instanceName)

      const companyData = await getDoc(docRefUser);

      if (!companyData.exists()) {
        await setDoc(docRefUser, {
          userNib: userdata.nib,
          role: 'Pabrik',
          userLocation: userdata.location,
          userAddr: userdata.address,
          factoryType: userdata.factoryType,
        });
      } else {
        console.log("Data perusahaan telah tersimpan di database.");
      } 
  
      await setDoc(docRef, {
        [`${jenisSediaan}`]: {
          requestHash: requestCpotbCtHash,
          requestTimestamp: timestamp,
          status: 0
        },
      }, { merge: true }); 
    } catch (err) {
      errAlert(err);
    }
  };

  const recordHashFb = async(jenisSediaan, txHash, timestamp) => {
    try {
      const collectionName = `pengajuan_cpotb_${userdata.instanceName}`
      const docRef = doc(db, 'transaction_hash', collectionName);
  
      await setDoc(docRef, {
        [`${jenisSediaan}`]: {
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

  const handleOptionJenisSediaan = (e) => {;
    const selectedValue = e.target.value;
    setJenisSediaan(selectedValue); 
    console.log("Selected Jenis Sediaan (string):", selectedValue);
    console.log("Selected Jenis Sediaan (uint8):", parseInt(selectedValue));
    checkEligiblePabrik(jenisSediaan);

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

    const isEligiblePabrik = checkEligiblePabrik(jenisSediaan);
    const isCpotbNotExist = checkExistingCpotb(jenisSediaan);

    console.log(isEligiblePabrik, isCpotbNotExist);

    if (isEligiblePabrik && isCpotbNotExist) {
      uploadDocuIpfs();
      return; 
    }

    let text = ""; 

    if (!isEligiblePabrik) {
      text = `Maaf, ${userdata.instanceName} tidak dapat mengajukan CPOTB untuk bentuk sediaan ${jenisSediaanMap[jenisSediaan]}. Harap memilih bentuk sediaan yang sesuai dengan jenis Industri Obat Tradisional.`;
    } else if (!isCpotbNotExist) {
      text = `Maaf, ${userdata.instanceName} sudah pernah mengajukan CPOTB untuk bentuk sediaan ${jenisSediaanMap[jenisSediaan]}.`;
    }

    MySwal.fire({
      title: 'Pengajuan CPOTB gagal',
      text: text,
      icon: 'error',
      confirmButtonText: 'Coba Lagi',
      didOpen: () => {
        const actions = Swal.getActions();
        actions.style.justifyContent = "center";
      }
    });

    setLoader(false);

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
      allowOutsideClick: false,
    });
    try {
      
      uploadedHashes = await uploadAllDocuments();
      console.log(uploadedHashes);
      console.log(2);
      
      MySwal.fire({
        title: `Konfirmasi pengajuan CPOTB`,
        html: `
            <div class="form-swal">
                <div class="row row--obat table-like">
                    <div class="col doku">
                        <ul>
                            <li class="label label-2"><p>Nama Pabrik</p></li>
                            <li class="input input-2"><p>${userdata.instanceName}</p></li>
                        </ul>
                        <ul>
                            <li class="label label-2"><p>Jenis Sediaan</p></li>
                            <li class="input input-2"><p>${jenisSediaanMap[jenisSediaan]}</p></li>
                        </ul>
  
                        <div class="doku">
                            ${Object.entries(uploadedHashes).map(([docName, hash]) => `
                              <ul>
                                <li class="label label-2"><p>${docName}</p></li>
                                <li class="input input-2">
                                ${hash !== "Gagal Upload" 
                                  ? 
                                  `<a href="http://localhost:8080/ipfs/${hash}" target="_blank">
                                   ${hash} <i class="fa-solid fa-arrow-up-right-from-square"></i>
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
      }).then((result) => {
          if (result.isConfirmed) {
            MySwal.fire({
              title: "Menunggu koneksi Metamask...",
              text: "Jika proses ini memakan waktu terlalu lama, coba periksa koneksi Metamask Anda. 🚀",
              icon: "info",
              showConfirmButton: false,
              allowOutsideClick: false
            });
            const hashDocs = reconstructedHashes(uploadedHashes);
            console.log(hashDocs);
            requestCpotb(hashDocs);
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
      "Denah Bangunan Pabrik": denahBangunan,
      "Dokumen Sistem Mutu CPOTB": sistemMutu,
      "Surat Permohonan CPOTB": suratPermohonan,
      "Bukti Pembayaran Negara Bukan Pajak": buktiPembayaranNegaraBukanPajak,
      "Surat Pernyataan Komitmen": suratKomitmen,
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
          setLoader(false)
          return uploadedHashes = false;
        }
    });

    await Promise.all(uploadPromises);
    return uploadedHashes;
  };

  const handleAutoFillAndUploadToIPFS = async () => {

    const fetchBlob = async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch file from ${url}`);
      return await res.blob();
    };

    const [blob1, blob2, blob3] = await Promise.all([
      fetchBlob(dummyPdf),
      fetchBlob(dummyPdf2),
      fetchBlob(dummyPdf3),
    ]);

    const filesMap = {
      suratPermohonan: new File([blob1], "surat_permohonan.pdf", { type: "application/pdf" }),
      buktiPembayaranNegaraBukanPajak: new File([blob2], "bukti_pnbp.pdf", { type: "application/pdf" }),
      suratKomitmen: new File([blob1], "surat_komitmen.pdf", { type: "application/pdf" }),
      denahBangunan: new File([blob2], "denah_bangunan.pdf", { type: "application/pdf" }),
      sistemMutu: new File([blob3], "sistem_mutu.pdf", { type: "application/pdf" }),
    };

    setSuratPermohonan(filesMap.suratPermohonan);
    setBuktiPembayaranNegaraBukanPajak(filesMap.buktiPembayaranNegaraBukanPajak);
    setSuratKomitmen(filesMap.suratKomitmen);
    setDenahBangunan(filesMap.denahBangunan);
    setSistemMutu(filesMap.sistemMutu);

    await uploadDocuIpfs();
  };

  return (
    <div id="CpotbPage" className='Layout-Menu layout-page'>
      <div className="title-menu">
        <h1>Pengajuan Data Sertifikat CPOTB Baru</h1>
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
              <label htmlFor="factoryType">Tipe Industri Farmasi</label>
            </li>
            <li className="input">
              <p>{factoryType}</p>
            </li>
          </ul>
          <ul>
            <li className="label">
              <label htmlFor="nib">NIB Pabrik</label>
            </li>
            <li className="input">
              <p>{userdata.nib}</p>
            </li>
          </ul>
          <ul>
            <li className="label">
              <label htmlFor="npwp">NPWP Pabrik</label>
            </li>
            <li className="input">
              <p>{userdata.npwp}</p>
            </li>
          </ul>

          <ul>
            <li className="label">
              <label htmlFor="jenisSediaan">Jenis Sediaan</label>
            </li>
            <li className="input col">
              <select
                name="jenisSediaan"
                value={jenisSediaan}
                onChange={handleOptionJenisSediaan}
                className='jenisSediaan'
                required
              >
                <option value="" disabled>Select Jenis Sediaan</option>
                {/* {filteredJenisSediaan.map(({ key, label }) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))} */}
                {Object.entries(jenisSediaanMap).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
              <JenisSediaanTooltip
                jenisSediaan={jenisSediaanMap[jenisSediaan]}
              />
            </li>
          </ul>
          <div className="doku">
            <h5>Dokumen Teknis</h5>
            <ul>
              <li className="label">
                <label htmlFor="instanceName">Denah Bangunan Pabrik</label>
              </li>
              <li className="input">
                <input type="file" accept="application/pdf" name="instanceName" onChange={(e) => handleFileChange(e, setDenahBangunan)} required/>
              </li>
            </ul>
            <ul>
              <li className="label">
                <label htmlFor="instanceName">Dokumen Sistem Mutu CPOTB</label>
              </li>
              <li className="input">
                <input type="file" accept="application/pdf" name="instanceName" onChange={(e) => handleFileChange(e, setSistemMutu)} required/>
              </li>
            </ul>
          </div>
          <div className="doku">
            <h5>Dokumen Administrasi</h5>
            <ul>
              <li className="label">
                <label htmlFor="instanceName">Surat Permohonan CPOTB </label>
              </li>
              <li className="input">
                <input type="file" accept="application/pdf" name="instanceName" onChange={(e) => handleFileChange(e, setSuratPermohonan)} required/>
              </li>
            </ul>
            <ul>
              <li className="label">
                <label htmlFor="instanceName">Bukti Pembayaran Negara Bukan Pajak</label>
              </li>
              <li className="input">
                <input type="file" accept="application/pdf" name="instanceName" onChange={(e) => handleFileChange(e, setBuktiPembayaranNegaraBukanPajak)} required/>
              </li>
            </ul>
            <ul>
              <li className="label">
                <label htmlFor="instanceName">Surat Pernyataan Komitmen</label>
              </li>
              <li className="input">
                <input type="file" accept="application/pdf" name="instanceName" onChange={(e) => handleFileChange(e, setSuratKomitmen)} required/>
              </li>
            </ul>
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

export default CpotbRequest;

