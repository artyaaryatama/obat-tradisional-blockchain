import { useEffect, useState } from 'react';
import { BrowserProvider, Contract } from "ethers";
import contractObatTradisional from '../../auto-artifacts/ObatTradisional.json';
import { useNavigate } from 'react-router-dom';

import imgLoader from '../../assets/images/loader.svg';
import "../../styles/MainLayout.scss";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import './../../styles/SweetAlert.scss';

const MySwal = withReactContent(Swal);

function ObatReqPage() {
  const [contract, setContract] = useState();
  const navigate = useNavigate();
  const userdata = JSON.parse(sessionStorage.getItem('userdata')) || {};

  const [loader, setLoader] = useState(false)

  const [namaProduk, setNamaProduk] = useState("");
  const [merk, setMerk] = useState("")
  const [klaim, setKlaim] = useState([])
  const [kemasanPrim, setKemasanPrim] = useState("Botol Plastik")
  const [kemasanSeku, setKemasanSeku] = useState("Dus")
  const [ketKemasanPrim, setKetKemasanPrim] = useState("")
  const [satuanKemasanPrim, setSatuanKemasanPrim] = useState("ml")
  const [ketKemasanSeku, setKetKemasanSeku] = useState("")
  const [komposisi, setKomposisi] = useState([""])
  const [tipeProduk, setTipeProduk] = useState("obatTradisonal")

  const klaimValue = klaim.join("\n");

  const today = new Date();
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  const formattedDate = today.toLocaleDateString('id-ID', options);

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
            contractObatTradisional.address, 
            contractObatTradisional.abi, 
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
    if (contract) {
      console.log("Setting up listener for evt_obatCreated on contract", contract);
      
      contract.on("evt_obatCreated", (_namaProduk, _factoryInstanceName, _factoryUserName, _factoryAddr, _kemasan, _tipeProduk) => {

        const tp = {
          0n : "Obat Tradisional",
          1n : "Suplemen Kesehatan"
        };
    
        MySwal.fire({
          title: "Pembuatan Obat Tradisonal",
          html: (
            <div className='form-swal'>
              <ul>
                <li className="label">
                  <p>Diajukan oleh</p> 
                </li>
                <li className="input">
                  <p>{_factoryInstanceName}</p> 
                </li>
              </ul>
              <ul>
                <li className="label">
                  <p>Nama Pengirim</p> 
                </li>
                <li className="input">
                  <p>{_factoryUserName}</p> 
                </li>
              </ul>
              <ul>
                <li className="label">
                  <p>Alamat Instance</p> 
                </li>
                <li className="input">
                  <p>{_factoryAddr}</p> 
                </li>
              </ul>
              <ul>
                <li className="label">
                  <p>Jenis Sediaan</p> 
                </li>
                <li className="input">
                  <p>{tp[_tipeProduk]}</p> 
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
            navigate('/obat');
          }
        });

        setLoader(false)
      });
  
      return () => {
        console.log("Removing evt_obatCreated listener");
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

    const tp = {
      "obatTradisional": 0n,
      "suplemenKesehatan": 1n
    };

    const kemasanSet = `${kemasanSeku}, ${ketKemasanSeku} @ ${kemasanPrim} (${ketKemasanPrim} ${satuanKemasanPrim})`
  
    const randomFourDigit = Math.floor(1000 + Math.random() * 9000); 
    const randomTwoLetters = String.fromCharCode(
      65 + Math.floor(Math.random() * 26),
      65 + Math.floor(Math.random() * 26)
    );
    const id = `ot-${randomFourDigit}${randomTwoLetters}`;
    console.log(userdata);

    console.log({id, namaProduk, tipeProduk, merk, klaim, kemasanSet, komposisi}, tp[tipeProduk], userdata.instanceName, userdata.name, userdata.address);

    // console.log(userdata.instanceName, id, userdata.name, js[jenisSediaan]);

    try {
      const tx = await contract.createObat(
        id, merk, namaProduk, klaim, kemasanSet, komposisi, userdata.address, userdata.instanceName, userdata.name, tp[tipeProduk], 
      );
      await tx.wait();
      console.log('Receipt:', tx);

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

  const handleOptionKemasanPrimer = (e) => {
    setKemasanPrim(e.target.value);
    console.log(e.target.value);
  };

  const handleOptionKemasanSekunder = (e) => {
    setKemasanSeku(e.target.value);
    console.log(e.target.value);
  };
    
  const hancleOptionSatuan = (e) => {
    setSatuanKemasanPrim(e.target.value);
    console.log(e.target.value);
  }

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
          {/* <div className="row">
            <div className="col">
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
                    required
                  />
                </li>
              </ul>

              <ul>
                <li className="label">
                  <label htmlFor="namaProduk">Merk Produk</label>
                </li>
                <li className="input">
                  <input
                    type="text"
                    id="namaProduk"
                    value={merk}
                    onChange={(e) => setMerk(e.target.value)}
                  />
                </li>
              </ul>
              <ul>
                <li className="label">
                  <label htmlFor="klaimObat">Klaim Produk</label>
                </li>
                <li className="input">
                  <textarea 
                  id="klaimObat"
                  rows="4"
                  cols="50"
                  onChange={(e) => setKlaim(e.value)}
                  required
                  >
                  {klaim}
                </textarea>
                </li>
              </ul>

            </div>
            <div className="col">
              <ul>
                <li className="label">
                  <label htmlFor="namaProduk">Kemasan Produk</label>
                </li>
                <li className="input">
                  <textarea 
                  id="klaimObat"
                  rows="4"
                  cols="50"
                  onChange={(e) => setKlaim(e.value)}
                  required
                  >
                  {klaim}
                </textarea>
                </li>
              </ul>

            </div>
          </div> */}
          <ul>
            <li className="label">
              <label htmlFor="formatedDate">Tanggal Pembuatan</label>
            </li>
            <li className="input">
              <input type="text" name="formatedDate" value={formattedDate} readOnly />
            </li>
          </ul>

          <ul>
            <li className="label">
              <label htmlFor="instanceName">Diajukan oleh</label>
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
                  onChange= {(e) => setKemasanPrim(e.target.value)}
                  required
                >
                  <option value="Botol Plastik">Botol Plastik</option>
                  <option value="Botol Kaca">Botol Kaca</option>
                  <option value="Sachet">Sachet</option>
                  <option value="Strip">Strip</option>
                  <option value="Blister Pack">Blister Pack</option>
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

export default ObatReqPage;

