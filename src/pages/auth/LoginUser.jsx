import { useEffect, useState } from "react";
import { BrowserProvider, Contract } from "ethers";
import { useNavigate } from 'react-router-dom';
import contractData from '../../auto-artifacts/deployments.json';
import imgLogin from '../../assets/images/login.png';
import imgLoader from '../../assets/images/loader.svg';

import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import './../../styles/Auth.scss';
import "./../../styles/SweetAlert.scss";

const MySwal = withReactContent(Swal);

function LoginPage() {
  const [name, setName] = useState("");
  const [signer, setSigner] = useState("");

  const navigate = useNavigate();
  const [contract, setContract] = useState();
  const [loader, setLoader] = useState(false)

  useEffect(() => {
    document.title = "Welcome!"; 
  }, []);

  useEffect(() => {
    async function connectWallet() {
      if (window.ethereum) {
        try {
          const provider = new BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();

          console.log(signer)
          const contr = new Contract(
            contractData.RoleManager.address, 
            contractData.RoleManager.abi, 
            signer);

          setContract(contr);
          setSigner(signer)
          console.log(contr);
        } catch (err) {
          console.error("User denied access: ", err);
          errAlert(err)
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

  const loginUser = async (e) => {
    e.preventDefault();
    setLoader(true)

    try {
      const nameUpperCase = name.toUpperCase()
      const loginCt = await contract.loginUser();
      console.log('loginCt', loginCt);
      
      const [userName, instanceName, userAddr, role, location, factoryType, nib, npwp] = loginCt;
      
      if (nameUpperCase === userName && signer.address === userAddr) {
        console.log('role pas login',{role, userAddr});

        let userdata;

        if (role === 0n) {
          userdata = {
            address: userAddr,
            name: userName,
            instanceName: instanceName,
            role: role.toString(),
            location: location,
            factoryType: factoryType,
            nib: nib,
            npwp: npwp
          }

        } else {
          userdata = {
            address: userAddr,
            name: userName,
            instanceName: instanceName,
            role: role.toString(),
            location: location,
            nib: nib,
            npwp: npwp
          }
  
        }
        sessionStorage.setItem("userdata", JSON.stringify(userdata))
        console.log(userdata);

        MySwal.fire({
          title: "Login  Berhasil",
          html: `<div>
                  <p>Harap tunggu sebentar, Anda sedang dialihkan ke halaman yang dituju <span>&#127939;</span></p>
                </div>`,
          timer: 2000,
          icon: 'success',
          timerProgressBar: true,
          showCancelButton: false,
          showConfirmButton: false,
          allowOutsideClick: false,
          customClass: {
            popup: 'my-swal-popup'
          }
        })
        .then(() => {
          if (userdata.role === "1") {
            navigate('/cdob');
          } else if (userdata.role  === "0") {
            navigate('/cpotb');
          } else if (userdata.role === '2') {
            navigate('/cpotb-approval')
          } else if (userdata.role === '3') {
            navigate('/create-retailer-order')
          } else{
            navigate('/unauthorized');
          }
        });
        
      } else {
        errAlert({reason: "Nama Pengguna tidak ditemukan"}, "Harap masukan nama pengguna yang sesuai")
        setLoader(false);
      }
      
    } catch (err) {
      setLoader(false);
      errAlert(err, "Failed to login!");
    }
  }; 
  
  const autoFilled = async(event, role) => {
    event.preventDefault();
    if(role===0){
      setName('Nadia Zahra');
      // setName('James Doe')
      // setName('Rina Sari');

    } else if(role===1){ 
      setName('Andi Wicaksono');
      // setName('Charles Doe') 
      // setName('Fajar Nugroho');

    } else if(role===2){ 
      setName('Ratna Dewi');
      // setName('Sophie Doe') 
      // setName('Sri Lestari');

    } else if(role===3){
      setName('Gilang Saputra');
      // setName('Marlene Doe') 
      // setName('Budi Hartono');
      
    }
    
  }
  
  function goToPage(page){
    if(page === 'obat'){
      navigate('/cek-obat');
    } else if (page === 'sertifikat'){
      navigate('/cek-sertifikat')
    } else {
      navigate('/riwayat-transaksi')
    }
  }

  return (
    <>
    <div id="LoginPage" className="App">

      <div className="container">
        <div className="img-container">
          <img src={imgLogin} alt="Img Login" />

          <div className="attribute">
            <span>
              All Illustration(s) from <a href="https://absurd.design/">absurd.design</a>
            </span>
          </div>

          <div className="nav-group">
          <ul>
            <li>
              <button 
                onClick={(e) => { 
                  e.preventDefault(); 
                  goToPage('obat')}}
              >
              <i className="fa-solid fa-magnifying-glass"></i>
                Cek Obat
              </button>
            </li>
            <li>
              <button 
                onClick={(e) => { 
                  e.preventDefault(); 
                  goToPage('sertifikat')}}
              >
              <i className="fa-solid fa-magnifying-glass"></i>
                Cek Sertifikasi
              </button>
            </li>
            <li>
              <button 
                onClick={(e) => { 
                  e.preventDefault(); 
                  goToPage('transaksi')}}
              >
              <i className="fa-solid fa-magnifying-glass"></i>
                Riwayat Transaksi
              </button>
            </li>
          </ul>
        </div>
        </div>
        <div className="form-container">
          <h1>ot-blockchain.</h1>

          <form className="register-form" onSubmit={loginUser}>
            <input 
              type="text" 
              placeholder="Nama Pengguna" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
            />
            
            <button type="submit">
              {
                loader? (
                  <img src={imgLoader} alt="" />
                ) : (
                  "Login"
                )
              }

            </button>
          </form>

          <p className="register-footer">
            Belum punya akun? <a href="/register">Silahkan daftar disini.</a>
          </p>

          <div className="btn-group">
            <ul>
              <li>
                <button className="test" onClick={(event) => autoFilled(event, 0)}>Auto Filled Factory</button>
              </li>
              <li>
                <button className="test" onClick={(event) => autoFilled(event, 1)}>Auto Filled PBF</button>
              </li>
            </ul>
            <ul>
              <li>
                <button className="test" onClick={(event) => autoFilled(event, 2)}>Auto Filled BPOM</button>
              </li>

              <li>
                <button className="test" onClick={(event) => autoFilled(event, 3)}>Auto Filled Apotek</button>
              </li>
            </ul>
          </div>
        </div>
      </div>

    </div>
  </>
  );
}

function errAlert(err, customMsg){
  
  const errorObject = {
    message: err.reason || err.message || "Unknown error",
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

  console.error(customMsg);
  console.error(errorObject);
}

export default LoginPage;