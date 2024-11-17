import { useEffect, useState } from 'react';
import { BrowserProvider, Contract } from "ethers";
import contractMainSupplyChain from '../../auto-artifacts/MainSupplyChain.json';
import { useNavigate } from 'react-router-dom';

import imgLoader from '../../assets/images/loader.svg';
import "../../styles/MainLayout.scss";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import './../../styles/SweetAlert.scss';

const MySwal = withReactContent(Swal);

function CpotbReqPage() {
  const [contract, setContract] = useState();
  const navigate = useNavigate();
  const userdata = JSON.parse(sessionStorage.getItem('userdata')) || {};

  const [jenisSediaan, setJenisSediaan] = useState(""); 
  const [loader, setLoader] = useState(false)

  const today = new Date();
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  const formattedDate = today.toLocaleDateString('id-ID', options);

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
            contractMainSupplyChain.address, 
            contractMainSupplyChain.abi, 
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
      console.log("Setting up listener for evt_cpotbRequested on contract", contract);
      
      contract.on("evt_cpotbRequested", (_name, _userAddr, _instanceName, _jenisSediaan, _cpotbId, _timestampRequest) => {

        const timestampDate = new Date(Number(_timestampRequest) * 1000);
        const formattedTimestamp = timestampDate.toLocaleDateString('id-ID', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });

        const js = {
          0n : "Tablet Non Betalaktam",
          1n : "Kapsul Keras Non Betalaktam",
          2n : "Serbuk Oral Non Betalaktam",
          3n : "Cairan Oral Non Betalaktam"
        };
    
        MySwal.fire({
          title: "Pengajuan Sertifikat CPOTB Berhasil",
          html: (
            <div className='form-swal'>
              <ul>
                <li className="label">
                  <p>Diajukan oleh</p> 
                </li>
                <li className="input">
                  <p>{_instanceName}</p> 
                </li>
              </ul>
              <ul>
                <li className="label">
                  <p>Nama Pengirim</p> 
                </li>
                <li className="input">
                  <p>{_name}</p> 
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
              <ul>
                <li className="label">
                  <p>Alamat Instance</p> 
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
        
        console.log("Request CPOTB Event Triggered: ", { _name, _userAddr, _instanceName, jenisSediaan: js[_jenisSediaan], _cpotbId, _timestampRequest });
        
      });
  
      return () => {
        console.log("Removing evt_cpotbRequested listener");
        contract.removeAllListeners("evt_cpotbRequested");
      };
    }
  }, [contract]);

  const requestCpotb = async (e) => {
    e.preventDefault();

    setLoader(true)

    if (!jenisSediaan) {
      errAlert(0, "Please select a valid Jenis Sediaan");
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

    const js = {
      "TabletNonbetalaktam": 0n,
      "KapsulKerasNonbetalaktam": 1n,
      "SerbukOralNonbetalaktam": 2n,
      "CairanOralNonbetalaktam": 3n
    };

    const id = Math.random().toString(36).slice(2, 9);
    console.log('ini req id:', id);
    console.log(userdata);

    console.log(userdata.instanceName, id, userdata.name, js[jenisSediaan]);

    try {
      const tx = await contract.requestCpotb(userdata.instanceName, id, userdata.name, js[jenisSediaan]);
      await tx.wait();
      console.log('Receipt:', tx);

    } catch (err) {
      setLoader(false)
      errAlert(err, "Error making request!");
    }
  };

  const handleOptionJenisSediaan = (e) => {
    setJenisSediaan(e.target.value);
    console.log("Selected value:", e.target.value);
  };

  return (
    <div id="CpotbPage" className='Layout-Menu layout-page'>
      <div className="title-menu">
        <h1>Pengajuan Data Sertifikat CPOTB Baru</h1>
      </div>
      <div className='container-form'>
        <form onSubmit={requestCpotb}>
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
                <option value="TabletNonbetalaktam">Tablet Non Betalaktam</option>
                <option value="KapsulKerasNonbetalaktam">Kapsul Keras Non Betalaktam</option>
                <option value="SerbukOralNonbetalaktam">Serbuk Oral Non Betalaktam</option>
                <option value="CairanOralNonbetalaktam">Cairan Oral Non Betalaktam</option>
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

export default CpotbReqPage;

