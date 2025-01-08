import { useEffect, useState } from 'react';
import { BrowserProvider, Contract } from "ethers";
import contractData from '../../auto-artifacts/deployments.json';
import { data, useNavigate } from 'react-router-dom';

import imgLoader from '../../assets/images/loader.svg';
import "../../styles/MainLayout.scss";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import './../../styles/SweetAlert.scss';

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
  const [options, setOptions] = useState([]);
  const [tipeObat, setTipeObat] = useState("CCP");
  const [allJenisSediaan, setAllJenisSediaan] = useState([]); 
  const [dataCpotb, setDataCpotb] = useState([])

  const klaimValue = klaim.join("\n");

  const jenisSediaanMap = {
    0n: "Tablet",
    1n: "Kapsul",
    2n: "Kapsul Lunak",
    3n: "Serbuk Oral",
    4n: "Cairan Oral",
    5n: "Cairan Obat Dalam",
    6n: "Cairan Obat Luar",
    7n: "Film Strip",
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
;
          const MainSupplyChain = new Contract(
            contractData.MainSupplyChain.address,
            contractData.MainSupplyChain.abi,
            signer
          );

          const ObatTradisional = new Contract(
            contractData.ObatTradisional.address,
            contractData.ObatTradisional.abi,
            signer
          );
            
        setContracts({
          mainSupplyChain: MainSupplyChain,
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
          const listAllCt = await contracts.mainSupplyChain.getListAllCertificateByInstance(userdata.instanceName);
          console.log(listAllCt);
          const reconstructedData = listAllCt.map((item, index) => {
            return {
              cpotbHash: item[6],
              jenisSediaan: jenisSediaanMap[item[4]]
            };
          })

          setDataCpotb(reconstructedData);
          console.log(reconstructedData);
          // const ListJenisSediaanCt = await contract.getJenisSediaanAvail(userdata.instanceName);
          // console.log("ini jenis sediaan yg ada", ListJenisSediaanCt);
  
          // if (ListJenisSediaanCt.length > 0) {
          //   const listJenisSediaan = ListJenisSediaanCt.map((item) => ({
          //     cpotbHash: item[0], 
          //     jenisSediaan: kemasanMap[item[1]] 
          //   }));

          //   const jenisSediaan = ListJenisSediaanCt.map((item) => kemasanMap[item[1]]);
            
          //   console.log(listJenisSediaan)
          //   console.log(jenisSediaan)
          //   setOptions(jenisSediaan)
          //   setAllJenisSediaan(listJenisSediaan)
          // } else {
          //   errAlert(0, "No approved CPOTB records available.");
          // }

        } catch (error) {
          errAlert(error, "Can't access CPOTB data.")
        }
      }

    }

    loadJenisSediaan()
  }, [contracts])

  const handleEventObatCreated = (_namaProduk, _tipeObat, _factoryInstanceName, _factoryAddr, txHash) =>{
    console.log(_namaProduk, _tipeObat, _factoryInstanceName, _factoryAddr, txHash)

    const tipeObatMap = {
      0n :"Obat Lain",
      1n :"Cold Chain Product",
      2n :"Narkotika"
    };

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
              <p>Tipe Obat</p> 
            </li>
            <li className="input">
              <p>{tipeObatMap[_tipeObat]}</p> 
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
              <p>Factory Address</p> 
            </li>
            <li className="input">
              <p>{_factoryAddr}</p> 
            </li>
          </ul>
          <ul className="txHash">
            <li className="label">
              <p>Transaction Hash</p>
            </li>
            <li className="input">
              <a
                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noreferrer"
              >
                View Transaction on Etherscan
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
    }).then((result) => {
      if (result.isConfirmed) {
        navigate('/obat');
      }
    });
  
    setLoader(false)
  }

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

    const tipeObatMap = {
      "ObatLain" : 0n,
      "CCP" : 1n,
      "Narkotika" : 2n
    };

    const selectedKemasanPrim = dataCpotb.find((item) => item.jenisSediaan === kemasanPrim)|| false;

    if (selectedKemasanPrim) {
      const kemasanSet = `${kemasanSeku}, ${ketKemasanSeku} @${kemasanPrim} (${ketKemasanPrim} ${satuanKemasanPrim})`
      console.log(kemasanSet);
      
      const randomFourDigit = Math.floor(1000 + Math.random() * 9000); 
      const randomTwoLetters = String.fromCharCode(
        65 + Math.floor(Math.random() * 26),
        65 + Math.floor(Math.random() * 26)
      );
      const id = `ot-${randomFourDigit}${randomTwoLetters}`;
      console.log( id, merk, namaProduk, klaim, kemasanSet, komposisi, userdata.instanceName, tipeObatMap[tipeObat], selectedKemasanPrim.cpotbHash);
  
      try {
        
        const createObatCt = await contracts.obatTradisional.createObat(
        id, merk, namaProduk, klaim, kemasanSet, komposisi, userdata.instanceName, tipeObatMap[tipeObat], selectedKemasanPrim.cpotbHash);
        
        console.log('Receipt:', createObatCt);
          
        if(createObatCt){
          MySwal.update({
            title: "Processing your transaction...",
            text: "This may take a moment. Hang tight! ⏳"
          });
        }
  
        contracts.obatTradisional.once("evt_obatCreated", (_namaProduk, _tipeObat, _factoryInstanceName, _factoryAddr) => {
          handleEventObatCreated(_namaProduk, _tipeObat, _factoryInstanceName, _factoryAddr, createObatCt.hash);
        });
  
      } catch (err) {
        setLoader(false)
        errAlert(err, "Error making request!");
      }
    } else{
      errAlert({reason: "CPOTB Certification Not Found"}, `${userdata.instanceName} does not have a CPOTB certification for the "${kemasanPrim}" primary packaging`);
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
      kemasanPrim: "Pil",
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
                  <option value="CCP">Cold Chain Product</option>
                  <option value="Narkotika">Narkotika</option>
                  <option value="ObatLain">Obat Lain</option>
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
                <option value="" disabled>Select Kemasan Obat Primer</option>
                <option value="Tablet">Tablet</option>
                <option value="Pil">Pil</option>
                <option value="Kapsul">Kapsul</option>
                <option value="Kapsul Lunak">Kapsul Lunak</option>
                <option value="Serbuk Oral">Serbuk Oral</option>
                <option value="Cairan Oral">Cairan Oral</option>
                <option value="Cairan Obat Dalam">Cairan Obat Dalam</option>
                <option value="Cairan Obat Luar">Cairan Obat Luar</option>
                <option value="Film Strip">Film Strip / Edible Film</option>
                {/* <option value="">Select an option</option>
                {Object.entries(options).map(([key, value]) => (
                  <option key={key} value={value}>
                    {value}
                  </option>
                ))} */}
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

