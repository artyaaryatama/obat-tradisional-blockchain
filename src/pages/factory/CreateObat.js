import { useEffect, useState } from 'react';
import { BrowserProvider, Contract } from "ethers";
import contractData from '../../auto-artifacts/deployments.json';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig"; 
import imgLoader from '../../assets/images/loader.svg';
import "../../styles/MainLayout.scss";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import './../../styles/SweetAlert.scss';
import JenisSediaanTooltip from '../../components/TooltipJenisSediaan';
import { validateObat } from '../public/ValidateObat';

const MySwal = withReactContent(Swal);

function CreateObat() {
  const [contracts, setContracts] = useState(null);
  const navigate = useNavigate();
  const userdata = JSON.parse(sessionStorage.getItem('userdata')) || {};

  const [loader, setLoader] = useState(false)

  const [namaProduk, setNamaProduk] = useState("");
  const [merk, setMerk] = useState("")
  const [klaim, setKlaim] = useState([])
  const [kemasanPrim, setKemasanPrim] = useState("")
  const [kemasanSeku, setKemasanSeku] = useState("Dus")
  const [ketKemasanPrim, setKetKemasanPrim] = useState("")
  const [satuanKemasanPrim, setSatuanKemasanPrim] = useState("ml")
  const [ketKemasanSeku, setKetKemasanSeku] = useState("")
  const [komposisi, setKomposisi] = useState([""])
  const [tipeObat, setTipeObat] = useState("");
  const [dataCpotb, setDataCpotb] = useState([])
  const [namaObatExisted, setNamaObatExisted] = useState([])
  const [jenisObat, setJenisObat] = useState("")
  const [filteredJenisSediaan, setFilteredJenisSediaan] = useState([]);

  const klaimValue = klaim.join("\n");

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
    document.title = "Produksi Obat Tradisional"; 
  }, []);

  useEffect(() => {
    async function connectWallet() {
      if (window.ethereum) {
        try {
          const provider = new BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();

          const CertificateManager = new Contract(
            contractData.CertificateManager.address,
            contractData.CertificateManager.abi,
            signer
          );

          const ObatTradisional = new Contract(
            contractData.ObatTradisional.address,
            contractData.ObatTradisional.abi,
            signer
          );
            
        setContracts({
          certificateManager: CertificateManager,
          obatTradisional: ObatTradisional
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

    const loadJenisSediaan = async () => {
      if(contracts) {
        try {
          console.log(userdata.instanceName);
          const listAllCt = await contracts.certificateManager.getCpotbByInstance(userdata.instanceName);
          const reconstructedData = listAllCt.map((item) => {
          
            return {
              cpotbId: item[0],
              cpotbHash: item[5],
              jenisSediaan: jenisSediaanMap[item[3]]
            };
          });

          const listAllObatCt = await contracts.obatTradisional.getAllObatByInstance(userdata.instanceName);
          const reconstructedDataNama = listAllObatCt.map((item, index) => {
            return {
              namaProduk: item[1]
            }
          })
          
          if (userdata.factoryType && usahaSediaanMapping[userdata.factoryType]) {
            const filtered = usahaSediaanMapping[userdata.factoryType].map((key) => ({
              key: key.toString(),
              label: jenisSediaanMap[key]
            }));
            setFilteredJenisSediaan(filtered);
          } else {
            setFilteredJenisSediaan([]);
          }

          setNamaObatExisted(reconstructedDataNama);

          setDataCpotb(reconstructedData);
          console.log(listAllCt);

        } catch (error) {
          errAlert(error, "Error loading data.")
        }
      }

    }
    
    loadJenisSediaan()
  }, [contracts])

  const handleEventObatCreated = (_namaProduk, _tipeObat, _factoryInstanceName, _factoryAddr, txHash) =>{
    console.log(_namaProduk, _tipeObat, _factoryInstanceName, _factoryAddr, txHash)

    const tipeObatMap = {
      0n :"Obat Lain",
      1n :"Cold Chain Product"
    };

    MySwal.fire({
      title: "Sukses membuat data obat tradisonal",
      html: (
        <div className='form-swal event'>
          <ul>
            <li className="label">
              <p>Nama Produk</p> 
            </li>
            <li className="input">
              <p>{_namaProduk}</p> 
            </li>
          </ul>
          <ul>
            <li className="label">
              <p>Tipe Obat</p> 
            </li>
            <li className="input">
              <p>{tipeObatMap[_tipeObat]}</p> 
            </li>
          </ul>
          <ul>
            <li className="label">
              <p>Nama Instansi Pabrik</p> 
            </li>
            <li className="input">
              <p>{_factoryInstanceName}</p> 
            </li>
          </ul>
          <ul className='klaim'>
            <li className="label">
              <p>Alamat Akun Pabrik (Pengguna)</p> 
            </li>
            <li className="input">
              <p>{_factoryAddr}</p> 
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
        navigate('/obat');
      }
    });
  
    setLoader(false)
  }

  const validateForm = () => {
    const obatData = {
      namaProduk,
      komposisi
    };
    const result = validateObat(obatData);

    if (result.message === "Validation Failed") {
      MySwal.fire({
        title: result.title,
        text: result.reason,
        icon: "error",
        confirmButtonText: "Ok"
      });
      return false;
    }
    return true;
  };

  const createObat = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    MySwal.fire({
      title: "Menunggu koneksi Metamask...",
      text: "Jika proses ini memakan waktu terlalu lama, coba periksa koneksi Metamask Anda. 🚀",
      icon: 'info',
      showCancelButton: false,
      showConfirmButton: false,
      allowOutsideClick: false,
    });

    const tipeObatMap = {
      "ObatLain" : 0n,
      "CCP" : 1n
    };

    // const jenisSediaanMapReverse = {
    //   "Cairan Obat Dalam": 0n,
    //   "Rajangan": 1n,
    //   "Serbuk": 2n,
    //   "Serbuk Instan": 3n,
    //   "Efervesen": 4n,
    //   "Pil": 5n,
    //   "Kapsul": 6n,
    //   "Kapsul Lunak": 7n,
    //   "Tablet atau Kaplet": 8n,
    //   "Granul": 9n,
    //   "Pastiles": 10n,
    //   "Dodol atau Jenang": 11n,
    //   "Film Strip": 12n,
    //   "Cairan Obat Luar": 13n,
    //   "Losio": 14n,
    //   "Parem": 15n,
    //   "Salep": 16n,
    //   "Krim": 17n,
    //   "Gel": 18n,
    //   "Serbuk Obat Luar": 19n,
    //   "Tapel": 20n,
    //   "Pilis": 21n,
    //   "Plaster atau Koyok": 22n,
    //   "Supositoria": 23n,
    //   "Rajangan Obat Luar": 24n
    // };
    
    // const kemasanPrimSelected = jenisSediaanMapReverse[kemasanPrim]

    const kemasanPrimData = dataCpotb.find((item) => item.jenisSediaan === kemasanPrim) || false;
    const newObatName = namaObatExisted.find((item) => item.namaProduk === namaProduk) || false;

    console.log(kemasanPrimData);

    if (newObatName) {
      errAlert({reason: "Tidak dapat memproduksi obat tradisional"}, `Obat Tradisonal dengan "${namaProduk}" sudah diproduksi. Harap input nama obat tradisonal lain.`);
      
    } else if (!kemasanPrimData || !kemasanPrimData.cpotbHash) {
      errAlert({reason: "Tidak dapat memproduksi obat tradisional"}, `${userdata.instanceName} tidak memiliki sertifikasi CPOTB "${kemasanPrim}"`);

    } else {
      const kemasanSet = `${kemasanSeku}, ${ketKemasanSeku} @${kemasanPrim} (${ketKemasanPrim} ${satuanKemasanPrim})`
      
      const randomFourDigit = Math.floor(1000 + Math.random() * 9000); 
      const randomTwoLetters = String.fromCharCode(
        65 + Math.floor(Math.random() * 26),
        65 + Math.floor(Math.random() * 26)
      );

      const id = `ot-${randomFourDigit}${randomTwoLetters}`;
      console.log(  id, merk, namaProduk, klaim, kemasanSet, komposisi, userdata.instanceName, tipeObatMap[tipeObat], kemasanPrimData.cpotbHash, jenisObat);
      console.log(kemasanPrim);
      try {
        
        const createObatCt = await contracts.obatTradisional.createObat(
        id, merk, namaProduk, klaim, kemasanSet, komposisi, userdata.instanceName, tipeObatMap[tipeObat], kemasanPrimData.cpotbHash, jenisObat);
        
        console.log('Receipt:', createObatCt);
          
        if(createObatCt){

          createObatFb(userdata.instanceName, namaProduk, createObatCt.hash, kemasanPrim, tipeObat)

          MySwal.update({
            title: "Memproses transaksi...",
            text: "Proses transaksi sedang berlangsung, harap tunggu. ⏳"
          });
        }
  
        contracts.obatTradisional.once("ObatCreated", (_namaProduk, _tipeObat, _factoryInstanceName, _factoryAddr) => {
          handleEventObatCreated(_namaProduk, _tipeObat, _factoryInstanceName, _factoryAddr, createObatCt.hash);
        });
  
      } catch (err) {
        setLoader(false)
        errAlert(err, "Error making request!");
      }
    }
  };

  const createObatFb = async (instanceName, namaProduk, obatHash, kemasanPrim, tipeObat) => {
    try {
      const documentId = `[OT] ${namaProduk}`;
      const factoryDocRef = doc(db, instanceName, documentId); 

      await setDoc(factoryDocRef, {
        jenisSediaan: `${kemasanPrim}`,
        tipeObat: `${tipeObat}`,
        historyNie: {
          createObat: obatHash,
          createObatTimestamp: Date.now(),
        },
      }, { merge: true }); 
  
    } catch (err) {
      errAlert(err);
    }
  };

  const handleKlaimChange = (e) => {
    const lines = e.target.value.split("\n"); 
    setKlaim(lines);
  };

  const handleAutoFill = () => {
    const autoFillValues = {
      namaProduk: "[TEST] UPIK INSTANT RASA COKLAT",
      merk: " Upik Instan Rasa Coklat",
      klaim: [
        "Memelihara kesehatan",
        "Membantu memperbaiki nafsu makan",
        "Secara tradisional digunakan pada penderita kecacingan"
      ],
      // kemasanPrim: "Pil",
      ketKemasanPrim: "5",
      satuanKemasanPrim: "gram",
      kemasanSeku: "Dus",
      ketKemasanSeku: "11",
      komposisi: [
        "Cinnamomum Burmanii Cortex",
        "Curcuma Aeruginosa Rhizoma",
      ]
    };

    setNamaProduk(autoFillValues.namaProduk);
    setMerk(autoFillValues.merk);
    setKlaim(autoFillValues.klaim);
    // setKemasanPrim(autoFillValues.kemasanPrim);
    setKetKemasanPrim(autoFillValues.ketKemasanPrim);
    setSatuanKemasanPrim(autoFillValues.satuanKemasanPrim);
    setKemasanSeku(autoFillValues.kemasanSeku);
    setKetKemasanSeku(autoFillValues.ketKemasanSeku);
    setKomposisi(autoFillValues.komposisi);
  };

  const handleKomposisiChange = (index, e) => {
    const newKomposisi = [...komposisi];
    newKomposisi[index] = e.target.value;
    setKomposisi(newKomposisi);

    console.log(`Changing index ${index} to value: ${e.target.value}`);
    console.log("Updated Array:", newKomposisi);

  };

  const addField = () => {
    setKomposisi([...komposisi, ""]);
    console.log("Adding new field. Current state:", komposisi);
  };

  const removeField = (index) => {
    if (index === 0) {
      alert("Field pertama tidak dapat dihapus!");
      return;
    }
    const newKomposisi = komposisi.filter((_, i) => i !== index);
    setKomposisi(newKomposisi);

    console.log(`Removing index ${index}. Current state:`, komposisi);

  };

  const handleAddProhibitedIngredient = () => {
    setKomposisi([...komposisi, "Abri Precatorii Semen"]);
  };

  return (
    <div id="CpotbPage" className='Layout-Menu layout-page'>
      <div className="title-menu">
        <h1>Pembuatan Obat Tradisional Baru</h1>
      </div>
      
      <div className='container-form'>
        <form onSubmit={createObat}>

          <ul>
            <li className="label">
              <label htmlFor="instanceName">Di produksi oleh</label>
            </li>
            <li className="input">
              <p>{userdata.instanceName}</p>
            </li>
          </ul>

          <ul>
            <li className="label">
              <label htmlFor="namaProduk">Nama Produk</label>
            </li>
            <li className="input">
              <input
                type="text"
                id="namaProduk"
                value={namaProduk}
                onChange={(e) => setNamaProduk(e.target.value)}
              />
            </li>
          </ul>

          <ul>
            <li className="label">
              <label htmlFor="merk">Merk Obat</label>
            </li>
            <li className="input">
              <input
                type="text"
                id="merk"
                value={merk}
                onChange={(e) => setMerk(e.target.value)}
              />
            </li>
          </ul>

          <ul>
            <li className="label">
              <label htmlFor="jenisObat">Jenis Obat</label>
            </li>
            <li className="input">
              <div className="input-group">
                <select
                  name="jenisObat"
                  id="jenisObat"
                  value={jenisObat}
                  onChange= {(e) => setJenisObat(e.target.value)}
                  required
                >
                  <option value="" disabled>Pilih Jenis Obat</option>
                  <option value="Jamu">Jamu</option>
                  <option value="OHT">Obat Herbal Terstandar (OHT)</option>
                  <option value="Fitofarmaka">Fitofarmaka</option>
                </select>
                <JenisSediaanTooltip
                  jenisSediaan={jenisObat}
                />
              </div>
            </li>
          </ul>

          <ul>
            <li className="label">
              <label htmlFor="tipeObat">Tipe Obat</label>
            </li>
            <li className="input">
              <div className="input-group">
                <select
                  name="tipeObat"
                  id="tipeObat"
                  value={tipeObat}
                  onChange= {(e) => setTipeObat(e.target.value)}
                  required
                > 
                  <option value="" disabled>Pilih Tipe Obat</option>
                  <option value="CCP">Cold Chain Product</option>
                  <option value="ObatLain">Obat Lain</option>
                </select>
                <JenisSediaanTooltip
                  jenisSediaan={tipeObat}
                />
              </div>
            </li>
          </ul>
  
          <ul>
            <li className="label">
              <label htmlFor="klaimObat">Klaim Obat</label>
            </li>
            <li className="input">
              <textarea 
                id="klaimObat"
                rows="4"
                cols="50"
                onChange={handleKlaimChange}
                value={klaimValue}
                >
              </textarea>
            </li>
          </ul>
    
          <ul>
            <li className="label">
              <label htmlFor="kemasanObat">Kemasan Obat Primer</label>
            </li>
            <li className="input">

              <div className="input-group">
              <select
                name="kemasanObat"
                id="kemasanObat"
                value={kemasanPrim}
                onChange={(e) => setKemasanPrim(e.target.value)}
                required
              >
                <option value="" disabled>Pilih Kemasan Obat Primer</option>
                {filteredJenisSediaan.map(({ key, label }) => (
                  <option key={key} value={label}>
                    {label}
                  </option>
                ))}
              </select>
                <JenisSediaanTooltip
                  jenisSediaan={kemasanPrim}
                />
                <input 
                  type="number" 
                  value= {ketKemasanPrim}
                  placeholder='Isi'
                  onChange={(e) => setKetKemasanPrim(e.target.value)}
                />
                <select
                  name="kemasan"
                  id="kemasanObat"
                  value={satuanKemasanPrim}
                  onChange={(e) => setSatuanKemasanPrim(e.target.value)}
                  required
                >
                  <option value="ml">ml</option>
                  <option value="mg">mg</option>
                  <option value="gram">gram</option>
                  <option value="sachet">Kapsul</option>
                </select>

              </div>
            </li>
          </ul>

          <ul>
            <li className="label">
              <label htmlFor="kemasanObat">Kemasan Obat Sekunder</label>
            </li>
            <li className="input">
              <div className="input-group">
                <select
                  name="kemasanObat"
                  id="kemasanObat"
                  value={kemasanSeku}
                  onChange= {(e) => setKemasanSeku(e.target.value)}
                  required
                >
                  <option value="Dus">Dus</option>
                  <option value="Sachet">Sachet</option>
                </select>

                <input 
                  type="number" 
                  value= {ketKemasanSeku}
                  placeholder='Isi'
                  onChange={(e) => setKetKemasanSeku(e.target.value)}
                />

              </div>
            </li>
          </ul>
    
          <ul>
            <li className="label">
            <label htmlFor='komposisi'>Komposisi</label>

            </li>
            <li className="input">
              <div className="input-multiple">
                { komposisi.map((comp, index) => (
                  <div key={index} className="input-child">
                    <small>{index+1}. </small>
                    <input
                        type="text"
                        name='komposisi'
                        value={comp}
                        onChange={(e) => handleKomposisiChange(index, e)}
                    />
                    <div className="btn">
                      {index !== 0 && (
                        <button type="button" onClick={() => removeField(index)}><i className="fa-solid fa-trash"></i></button>
                      )}
                      <button type="button" onClick={addField}><i className="fa-solid fa-plus"></i></button>
                      <button type="button" className="add-prohibited" onClick={handleAddProhibitedIngredient}>
                        Add Prohibited Ingredient
                      </button>
                    </div>
                    
                  </div>

                ))

                }
                
              </div>

                {/* {komposisi.map((comp, index) => (
                    <div key={index}>
                    </div>
                ))} */}
            </li>
          </ul>

          <button type='submit'>
          {
            loader? (
              <img src={imgLoader} alt="" />
            ) : (
              "Buat Obat"
            )
          }
            </button>
          <button className='auto-filled' type='button' onClick={handleAutoFill}>Auto Fill Form</button>
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

export default CreateObat;

