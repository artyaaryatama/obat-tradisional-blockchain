import { useEffect, useState } from 'react';
import { BrowserProvider, Contract } from "ethers";
import contractData from '../../auto-artifacts/deployments.json';
import { useNavigate } from 'react-router-dom';

import imgLoader from '../../assets/images/loader.svg';
import "../../styles/MainLayout.scss";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import './../../styles/SweetAlert.scss';

const MySwal = withReactContent(Swal);

function CreateObat() {
  const [contract, setContract] = useState();
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
  const [tipeProduk, setTipeProduk] = useState("obatTradisonal")
  const [options, setOptions] = useState([]);

  const klaimValue = klaim.join("\n");

  const js = {
    0n: "Tablet",
    1n: "Kapsul",
    2n: "Kapsul Lunak",
    3n: "Serbuk Oral",
    4n: "Cairan Oral",
    5n: "Cairan Obat Dalam",
    6n: "Cairan Obat Luar",
    7n: "Film Strip / Edible Film",
    8n: "Pil"
  };

  useEffect(() => {
    document.title = "Create Obat Tradisional"; 
  }, []);

  useEffect(() => {
    async function connectWallet() {
      if (window.ethereum) {
        try {
          const provider = new BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const contr = new Contract(
            contractData.ObatTradisional.address, 
            contractData.ObatTradisional.abi, 
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
  }, []);

  useEffect(() => {

    const loadJenisSediaan = async () => {
      if(contract) {
        try {
          const ListJenisSediaanCt = await contract.getJenisSediaanAvail(userdata.instanceName);
          console.log("ini jenis sediaan yg ada", ListJenisSediaanCt);
  
          if (ListJenisSediaanCt.length > 0) {
            const dynamicOptions = Object.entries(ListJenisSediaanCt).reduce((acc, [key, value]) => {
              acc[value] = js[value]; 
              return acc;
            }, {});
            
            setOptions(dynamicOptions)
          } else {
            errAlert(0, "No approved CPOTB records available.");
          }

        } catch (error) {
          errAlert(error, "Can't access CPOTB data.")
        }
      }

    }

    loadJenisSediaan()
  }, [contract])

  useEffect(() => {
    if (contract) {
      
      contract.on("evt_obatCreated", (_namaProduk, _factoryInstanceName, _factoryAddr) => {

        MySwal.fire({
          title: "Success Create Obat Tradisonal",
          html: (
            <div className='form-swal'>
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
                  <p>Factory Instance</p> 
                </li>
                <li className="input">
                  <p>{_factoryInstanceName}</p> 
                </li>
              </ul>
              <ul>
                <li className="label">
                  <p>Factoty Address</p> 
                </li>
                <li className="input">
                  <p>{_factoryAddr}</p> 
                </li>
              </ul>
            </div>
          ),
          icon: 'success',
          width: '560',
          showCancelButton: false,
          confirmButtonText: 'Oke',
          allowOutsideClick: true,
        }).then((result) => {
          if (result.isConfirmed) {
            navigate('/obat-available-factory');
          }
        });

        setLoader(false)
      });
  
      return () => {
        contract.removeAllListeners("evt_obatCreated");
      };
    }
  }, [contract]);

  const createObat = async (e) => {
    e.preventDefault();

    MySwal.fire({
      title:"Processing your request...",
      text:"Your request is on its way. This won't take long. 🚀",
      icon: 'info',
      showCancelButton: false,
      showConfirmButton: false,
      allowOutsideClick: false,
    })

    const tipeProdukMap = {
      "obatTradisional": 0n,
      "suplemenKesehatan": 1n
    };

    const kemasanSet = `${kemasanSeku}, ${ketKemasanSeku} @${kemasanPrim} (${ketKemasanPrim} ${satuanKemasanPrim})`
    console.log(kemasanSet);
    
    const randomFourDigit = Math.floor(1000 + Math.random() * 9000); 
    const randomTwoLetters = String.fromCharCode(
      65 + Math.floor(Math.random() * 26),
      65 + Math.floor(Math.random() * 26)
    );
    const id = `ot-${randomFourDigit}${randomTwoLetters}`;

    try {
      const createObatCt = await contract.createObat(
      id, merk, namaProduk, klaim, kemasanSet, komposisi, userdata.instanceName, tipeProdukMap[tipeProduk]);
      
      console.log('Receipt:', createObatCt);
        
      if(createObatCt){
        MySwal.update({
          title: "Processing your transaction...",
          text: "This may take a moment. Hang tight! ⏳"
        });
      }

    } catch (err) {
      setLoader(false)
      errAlert(err, "Error making request!");
    }
  };

  const handleKlaimChange = (e) => {
    const lines = e.target.value.split("\n"); 
    setKlaim(lines);
  };

  const handleAutoFill = () => {
    const autoFillValues = {
      namaProduk: "[TEST] BUYUNG UPIK INSTANT RASA COKLAT",
      merk: "Buyung Upik Instan Rasa Coklat",
      tipeProduk: "obatTradisional",
      klaim: [
        "Memelihara kesehatan",
        "Membantu memperbaiki nafsu makan",
        "Secara tradisional digunakan pada penderita kecacingan"
      ],
      kemasanPrim: "Blister Pack",
      ketKemasanPrim: "5",
      satuanKemasanPrim: "gram",
      kemasanSeku: "Dus",
      ketKemasanSeku: "11",
      komposisi: [
        "Cinnamomum Burmanii Cortex",
        "Curcuma Aeruginosa Rhizoma",
        "Curcuma Domestica Rhizoma",
        "Curcuma Xanthorrhiza Rhizoma"
      ]
    };

    setNamaProduk(autoFillValues.namaProduk);
    setMerk(autoFillValues.merk);
    setKlaim(autoFillValues.klaim);
    setTipeProduk(autoFillValues.tipeProduk);
    setKemasanPrim(autoFillValues.kemasanPrim);
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
              <input type="text" name="instanceName" value={userdata.instanceName} readOnly />
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
              <label htmlFor="tipeObat">Tipe Produk</label>
            </li>
            <li className="input">
              <div className="input-group">
                <select
                  name="tipeObat"
                  id="tipeObat"
                  value={tipeProduk}
                  onChange= {(e) => setTipeProduk(e.target.value)}
                  required
                >
                  <option value="obatTradisional">Obat Tradisional</option>
                  <option value="suplemenKesehatan">Suplemen Kesehatan</option>
                </select>
              </div>
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
                <option value="">Select an option</option>
                {Object.entries(options).map(([key, value]) => (
                  <option key={key} value={value}>
                    {value}
                  </option>
                ))}
              </select>
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
              "Add new request"
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
    confirmButtonText: 'Try Again'
  });

  console.error(customMsg)
  console.error(errorObject);
}

export default CreateObat;

