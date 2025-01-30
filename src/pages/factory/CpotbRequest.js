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

const MySwal = withReactContent(Swal);

function CpotbRequest() {
  const [contract, setContract] = useState();
  const navigate = useNavigate();
  const userdata = JSON.parse(sessionStorage.getItem('userdata'))
  const [dataCpotb, setDataCpotb] = useState([]);
  const [jenisSediaan, setJenisSediaan] = useState(""); 
  const [filteredJenisSediaan, setFilteredJenisSediaan] = useState([]);
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
    document.title = "Add New Obat Request"; 
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

      console.log(filtered);
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
        <div className='form-swal'>
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
    const found = dataCpotb.find((item) => item.jenisSediaan === jenisSediaanMap[jenisSediaan]);

    console.log(jenisSediaan);
    console.log(found);
  }

  const mountData = async (e) => {
    e.preventDefault();

    setLoader(true)
    const jenisSediaanInt = parseInt(jenisSediaan)

    if (jenisSediaanInt === "" || isNaN(jenisSediaanInt)) {
      errAlert(0, "Harap memilih Jenis Sediaan yang sesuai dengan Usaha Industri Farmasi");
      setLoader(false);
      return;
    }

    MySwal.fire({
      title: "Memproses Permintaan...",
      text: "Permintaan Anda sedang diproses. Ini tidak akan memakan waktu lama. 🚀",
      icon: 'info',
      showCancelButton: false,
      showConfirmButton: false,
      allowOutsideClick: false,
    });

    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0'); 
    const year = today.getFullYear();
    const randomNumber = Math.floor(100000 + Math.random() * 900000); 

    const id = `cpotb-${day}${month}${year}-${randomNumber}` 
    checkExistingCpotb(jenisSediaan)
    try {
      const requestCpotbCt = await contract.requestCpotb([id, userdata.name, userdata.instanceName, userdata.address], parseInt(jenisSediaan), userdata.factoryType);
      console.log('Receipt:', requestCpotbCt);
  
      if(requestCpotbCt){
        writeCpotbFb( userdata.instanceName, jenisSediaanMap[jenisSediaan], requestCpotbCt.hash );

        MySwal.update({
          title: "Memproses transaksi...",
          text: "Proses ini mungkin memerlukan sedikit waktu. Harap tunggu. ⏳"
        });
      }
  
      contract.once("evt_certRequested", (_name, _userAddr, _jenisSediaan, _timestampRequest) => {
        handleEventCpotbRequested(_name, _userAddr, _jenisSediaan, _timestampRequest, requestCpotbCt.hash);
      });
  
    } catch (err) {
      setLoader(false)
      errAlert(err, "Error making request!");
    }

  };

  const writeCpotbFb = async (instanceName, jenisSediaan, requestCpotbCtHash) => {
    try {
      const documentId = `cpotb-lists`; 
      const factoryDocRef = doc(db, instanceName, documentId);
  
      await setDoc(factoryDocRef, {
        [`${jenisSediaan}`]: {
          requestCpotb: requestCpotbCtHash,
          requestTimestamp: Date.now(),
        },
      }, { merge: true }); 
    } catch (err) {
      errAlert(err);
    }
  };

  const handleOptionJenisSediaan = (e) => {;
    const selectedValue = e.target.value;
    setJenisSediaan(selectedValue); 
    console.log("Selected Jenis Sediaan (string):", selectedValue);
    console.log("Selected Jenis Sediaan (uint8):", parseInt(selectedValue));
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
              <input type="text" name="formatedDate" value={formattedDate} disabled />
            </li>
          </ul>
          <ul>
            <li className="label">
              <label htmlFor="instanceName">Diajukan oleh</label>
            </li>
            <li className="input">
              <input type="text" name="instanceName" value={userdata.instanceName} disabled />
            </li>
          </ul>
          <ul>
            <li className="label">
              <label htmlFor="instanceName">Jenis Industri Farmasi</label>
            </li>
            <li className="input">
              <input type="text" name="instanceName" value={factoryType} disabled />
            </li>
          </ul>
          <ul>
            <li className="label">
              <label htmlFor="instanceName">NIB Pabrik</label>
            </li>
            <li className="input">
              <input type="text" name="instanceName" value={userdata.nib} disabled />
            </li>
          </ul>
          <ul>
            <li className="label">
              <label htmlFor="instanceName">NPWP Pabrik</label>
            </li>
            <li className="input">
              <input type="text" name="instanceName" value={userdata.npwp} disabled />
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
          <button type='submit'>
          {
            loader? (
              <img src={imgLoader} alt="" />
            ) : (
              "Kirim Pengajuan CPOTB"
            )
          }
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
    confirmButtonText: 'Try Again',
    didOpen: () => {
      const actions = Swal.getActions();
      actions.style.justifyContent = "center";
    }
  });

  console.error(customMsg)
  console.error(errorObject);
}

export default CpotbRequest;

