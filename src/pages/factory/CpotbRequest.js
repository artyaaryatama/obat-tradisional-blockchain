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

function CpotbRequest() {
  const [contract, setContract] = useState();
  const navigate = useNavigate();
  const userdata = JSON.parse(sessionStorage.getItem('userdata'))

  const [jenisSediaan, setJenisSediaan] = useState(""); 
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

  const formattedDate = today.toLocaleDateString('id-ID', options);

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
    document.title = "Add New Obat Request"; 
  }, []);

  useEffect(() => {
    async function connectWallet() {
      if (window.ethereum) {
        try {
          const provider = new BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const contr = new Contract(
            contractData.MainSupplyChain.address, 
            contractData.MainSupplyChain.abi, 
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

  const handleEventCpotbRequested = (_name, _userAddr, _jenisSediaan, _timestampRequest, txHash) => {
    const formattedTimestamp = new Date(Number(_timestampRequest) * 1000).toLocaleDateString('id-ID', options)

    MySwal.fire({
      title: "Success Request CPOTB",
      html: (
        <div className='form-swal'>
          <ul>
            <li className="label">
              <p>Factory Instance</p> 
            </li>
            <li className="input">
              <p>{_name}</p> 
            </li>
          </ul>
          <ul>
            <li className="label">
              <p>Factory Address</p> 
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
              <p>{js[_jenisSediaan]}</p> 
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
        navigate('/cpotb');
      }
    });

    setLoader(false)
  }

  const mountData = async (e) => {
    e.preventDefault();

    setLoader(true)
    const jenisSediaanInt = parseInt(jenisSediaan)

    if (jenisSediaanInt === "" || isNaN(jenisSediaanInt)) {
      errAlert(0, "Please select a valid Jenis Sediaan");
      setLoader(false);
      return;
    }

    MySwal.fire({
      title:"Processing your request...",
      text:"Your request is on its way. This won't take long. 🚀",
      icon: 'info',
      showCancelButton: false,
      showConfirmButton: false,
      allowOutsideClick: false,
    })

    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0'); 
    const year = today.getFullYear();
    const randomNumber = Math.floor(100000 + Math.random() * 900000); 

    const id = `CPOTB-${day}${month}${year}-${randomNumber}` 

    try {
      const requestCpotbCt = await contract.requestCpotb([id, userdata.name, userdata.instanceName], jenisSediaanInt);
      console.log('Receipt:', requestCpotbCt);
  
      if(requestCpotbCt){
        MySwal.update({
          title: "Processing your transaction...",
          text: "This may take a moment. Hang tight! ⏳"
        });
      }
  
      contract.once("evt_cpotbRequested", (_name, _userAddr, _jenisSediaan, _timestampRequest) => {
        handleEventCpotbRequested(_name, _userAddr, _jenisSediaan, _timestampRequest, requestCpotbCt.hash);
      });
  
    } catch (err) {
      setLoader(false)
      errAlert(err, "Error making request!");
    }

  };

  const handleOptionJenisSediaan = (e) => {
    setJenisSediaan((e.target.value)); 
    console.log("Selected Jenis Sediaan (uint8):", parseInt(e.target.value));
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
              <label htmlFor="jenisSediaan">Jenis Sediaan</label>
            </li>
            <li className="input">
              <select
                name="jenisSediaan"
                id="jenisSediaan"
                value={jenisSediaan}
                onChange={handleOptionJenisSediaan}
              >
                <option value="" disabled>Select Jenis Sediaan</option>
                <option value="0n">Tablet</option>
                <option value="8n">Pil</option>
                <option value="1n">Kapsul</option>
                <option value="2n">Kapsul Lunak</option>
                <option value="3n">Serbuk Oral</option>
                <option value="4n">Cairan Oral</option>
                <option value="5n">Cairan Obat Dalam</option>
                <option value="6n">Cairan Obat Luar</option>
                <option value="7n">Film Strip / Edible Film</option>
              </select>
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

export default CpotbRequest;

