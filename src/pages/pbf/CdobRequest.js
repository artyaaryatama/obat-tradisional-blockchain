import { useEffect, useState } from 'react';
import { BrowserProvider, Contract } from "ethers";
import contractData from '../../auto-artifacts/deployments.json';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc  } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import imgLoader from '../../assets/images/loader.svg';
import "../../styles/MainLayout.scss";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import './../../styles/SweetAlert.scss';
import JenisSediaanTooltip from '../../components/TooltipJenisSediaan';

const MySwal = withReactContent(Swal);

function CdobRequest() {
  const [contract, setContract] = useState();
  const navigate = useNavigate();
  const userdata = JSON.parse(sessionStorage.getItem('userdata')) || {};

  const [tipePermohonan, setTipePermohonan] = useState(""); 
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

  useEffect(() => {
    document.title = "Add New CDOB Request"; 
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
  
  const handleEventCdobRequested =  (_instanceName, _userAddr, _tipePermohonan, _timestampRequest, txHash) => {
    
    const formattedTimestamp = new Date(Number(_timestampRequest) * 1000).toLocaleDateString('id-ID', options)
  
    const tp = {
      0n: "Obat Lain",
      1n: "Cold Chain Product (CCP)"
    };

    MySwal.fire({
      title: "Pengajuan Sertifikat CDOB Berhasil",
      html: (
        <div className='form-swal'>
          <ul>
            <li className="label">
              <p>PBF Instance</p> 
            </li>
            <li className="input">
              <p>{_instanceName}</p> 
            </li>
          </ul>
          <ul>
            <li className="label">
              <p>PBF Address</p> 
            </li>
            <li className="input">
              <p>{_userAddr}</p> 
            </li>
          </ul>
          <ul>
            <li className="label">
              <p>Tipe Permohonan</p> 
            </li>
            <li className="input">
              <p>{tp[_tipePermohonan]}</p> 
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
        navigate('/cdob');
      }
    });
  
    setLoader(false)
  }

  const requestCdob = async (e) => {
    e.preventDefault();

    setLoader(true)
    console.log(userdata.address);

    if (!tipePermohonan) {
      errAlert(0, "Please select a valid Tipe Permohonan")
      setLoader(false)
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

    const tp = {
      "ObatLain": 0n,
      "CCP": 1n
    };

    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0'); 
    const year = today.getFullYear();
    const randomNumber = Math.floor(100000 + Math.random() * 900000); 

    const id = `cdob-${day}${month}${year}-${randomNumber}` 

    console.log(userdata.instanceName, id, userdata.name, tp[tipePermohonan]);

    try {
      const tipePermohonanInt = tp[tipePermohonan]
      const requestCdobCt = await contract.requestCdob([id, userdata.name, userdata.instanceName, userdata.address], tipePermohonanInt);
      console.log('Receipt:', requestCdobCt);

      if(requestCdobCt){
        writeCpotbFb(userdata.instanceName, tipePermohonan, requestCdobCt.hash)

        MySwal.update({
          title: "Processing your transaction...",
          text: "This may take a moment. Hang tight! ⏳"
        });
      }

      contract.once("evt_certRequested", (_instanceName, _userAddr, _tipePermohonan, _timestampRequest) => {
        handleEventCdobRequested(_instanceName, _userAddr, _tipePermohonan, _timestampRequest, requestCdobCt.hash);
      });

    } catch (err) {
      setLoader(false)
      errAlert(err, "Error making request!");
    }
  };

  const handleOptionTipePermohonan = (e) => {
    setTipePermohonan(e.target.value);
    console.log("Selected value:", e.target.value);
  };

  const writeCpotbFb = async (instanceName, tipePermohonan, requestCdobCtHash) => {
    try {
      const documentId = `cdob-lists`; 
      const pbfDocRef = doc(db, instanceName, documentId);
  
      await setDoc(pbfDocRef, {
        [`${tipePermohonan}`]: {
          requestCdob: requestCdobCtHash,
          requestTimestamp: Date.now(),
        },
      }, { merge: true }); 
    } catch (err) {
      errAlert(err);
    }
  };
  

  return (
    <div id="CpotbPage" className='Layout-Menu layout-page'>
      <div className="title-menu">
        <h1>Pengajuan Data Sertifikat CDOB Baru</h1>
      </div>
      <div className='container-form'>
        <form onSubmit={requestCdob}>
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
              <label htmlFor="instanceName">NIB PBF</label>
            </li>
            <li className="input">
              <input type="text" name="instanceName" value={userdata.nib} disabled />
            </li>
          </ul>
          <ul>
            <li className="label">
              <label htmlFor="instanceName">NPWP PBF</label>
            </li>
            <li className="input">
              <input type="text" name="instanceName" value={userdata.npwp} disabled />
            </li>
          </ul>
          <ul>
            <li className="label">
              <label htmlFor="tipePermohonan">Jenis Sediaan</label>
            </li>
            <li className="input col">
              <select
                name="tipePermohonan"
                id="tipePermohonan"
                value={tipePermohonan}
                onChange={handleOptionTipePermohonan}
              >
                <option value="" disabled>Select Jenis Sediaan</option>
                <option value="CCP">Cold Chain Product (CCP)</option>
                <option value="ObatLain">Obat Lain</option>
              </select>
              <JenisSediaanTooltip
                jenisSediaan={tipePermohonan}
              />
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

export default CdobRequest;

