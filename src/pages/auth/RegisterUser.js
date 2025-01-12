import { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { BrowserProvider, Contract } from "ethers";
import contractData from '../../auto-artifacts/deployments.json';
import imgLoader from '../../assets/images/loader.svg';

import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import './../../styles/Auth.scss';
import './../../styles/SweetAlert.scss';

const MySwal = withReactContent(Swal);

function RegisterPage() {
  const navigate = useNavigate(); 
  const [contract, setContract] = useState("");
  const [loader, setLoader] = useState(false)

  const [name, setName] = useState("");
  const [instanceName, setInstanceName] = useState("");
  // const [userAddr, setUserAddr] = useState("");
  const [role, setRole] = useState("");
  const [locationInstance, setLocationInstance] = useState("");
  const [factoryType, setFactoryType] = useState("")

  useEffect(() => {
    document.title = "Sign Up"; 
  }, []);

  // connect wallet
  useEffect(() => {
    async function connectWallet() {
      if (window.ethereum) {
        try {
          const provider = new BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const contr = new Contract(
            contractData.RoleManager.address, 
            contractData.RoleManager.abi, 
            signer
          );

          setContract(contr)
          console.log(signer);

        } catch (err) {
          console.error("User access denied!");
          errAlert(err, "User access denied!")
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

  const handleEventUserRegister = (_userAddr,_name, _instanceName, _role, _locationInstance, txHash) => {
    const roles = {
      0n: "Factory",
      1n: "PBF",
      2n: "BPOM",
      3n: "Retailer",
    };
  
    MySwal.fire({
      title: "Sign Up Success",
      html: (
        <div className='form-swal regist'>
          <ul>
            <li className="label">
              <p>User Name</p> 
            </li>
            <li className="input">
              <p>{_name}</p> 
            </li>
          </ul>
          <ul>
            <li className="label">
              <p>User Address</p> 
            </li>
            <li className="input">
              <p>{_userAddr}</p> 
            </li>
          </ul>
          <ul>
            <li className="label">
              <p>User Instance</p> 
            </li>
            <li className="input">
              <p>{_instanceName}</p> 
            </li>
          </ul>
          <ul>
            <li className="label">
              <p>User Role</p> 
            </li>
            <li className="input">
              <p>{roles[_role]}</p> 
            </li>
          </ul>
          <ul>
            <li className="label">
              <p>Location</p> 
            </li>
            <li className="input">
              <p>{_locationInstance}</p> 
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
        navigate('/login');
      }
    });
  };
  
  const registerUser = async (e) => {

    e.preventDefault();
    setLoader(true)
    
    MySwal.fire({
      title:"Please wait",
      text: "Your registration is in progress. This will only take a moment! 🧙‍♂️🧙‍♀️",
      icon: 'info',
      showCancelButton: false,
      showConfirmButton: false,
      allowOutsideClick: false,
    })

    try {
      const nameUpperCase = name.toUpperCase()
      let registCt;
      if(factoryType){
        registCt = await contract.registerUser(nameUpperCase, instanceName, role, locationInstance, factoryType);
      } else {
        registCt = await contract.registerUser(nameUpperCase, instanceName, role, locationInstance, "");
      }
      console.log("Transaction receipt:", registCt);
      console.log("Transaction hash:", registCt.hash);

      if(registCt){
        MySwal.update({
          title: "Processing your transaction...",
          text: "This may take a moment. Hang tight! ⏳"
        });
      }

      contract.once("evt_UserRegistered", (_userAddr, _name, _instanceName, _role, _locationInstance) => {
        handleEventUserRegister(_userAddr, _name, _instanceName, _role, _locationInstance, registCt.hash);
      });
      
    } catch (err) {
      setLoader(false)
      errAlert(err, "Registration failed")
    }
  };

  function autoFilled(event, role) {
    event.preventDefault();
    console.log(role);
    if(role===0){
      setInstanceName('PT. Budi Pekerti')
      setRole(parseInt(0))
      setName('Factory ABC')
      // setUserAddr("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266")
      setLocationInstance("Jl. Ini Alamat Factory PT. Budi Pekerti, Jakarta Selatan")
      // setUserAddr("0x6142E74121ADE0de3BEC1641e0318dBcCFcDe06A")
      
    } else if(role===1){
      setInstanceName('PT. Mangga Arum')
      setRole(parseInt(1))
      setName('PBF DEF') 
      // setUserAddr("0x90F79bf6EB2c4f870365E785982E1f101E93b906")
      setLocationInstance("Jl. Ini Alamat PBF PT. Mangga Arum, Jakarta Selatan")
      // setUserAddr("0x97CB6400E271e65150B2330ad27f213a4C9c31af")
      
    } else if(role===2){
      setInstanceName('BPOM Makassar')
      setRole(parseInt(2))
      setName('BPOM GHI') 
      // setUserAddr('0x70997970C51812dc3A010C7d01b50e0d17dc79C8')
      setLocationInstance("Jl. Ini Alamat BPOM Makassar, Makassar")
      // setUserAddr('0xcbcD762c3C27212937314C1D46072a214346F2F3')
      
    }  else if(role===3){
      setInstanceName('Apotek Sejahtera')
      setRole(parseInt(3))
      setName('Retailer JKL') 
      // setUserAddr('0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65')
      setLocationInstance("Jl. Ini Alamat Apotek Sejahtera, Jakarta Selatan")
      // setUserAddr('0xA3cE1983150Fade27518DF467a99a74FB4082dDa')
    }
  }
  
  function parseIntSelect(opt){
    const a = parseInt(opt);
    setRole(a);
  }

  const formattedAddress = (addr) => {
    if (!addr) return "";
    return `${addr.slice(0, 16)}...${addr.slice(-14)}`;
  };

  return (
    <>
      <div id="RegisterPage" className="App">
        <div className="container">
          <div className="form-container">
            <h1>ot-blockchain.</h1>

            <form className="register-form" onSubmit={registerUser}>
              <input 
                type="text" 
                placeholder="Name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
              />

              <input 
                type="text" 
                placeholder="Instance Name" 
                value={instanceName} 
                onChange={(e) => setInstanceName(e.target.value)} 
                required 
              />
              
              {/* <input 
                type="text" 
                placeholder="Account E-Wallet Address" 
                value={userAddr} 
                onChange={(e) => setUserAddr(e.target.value)} 
                required
              /> */}

              <textarea 
                type="text" 
                placeholder="Address Instance" 
                value={locationInstance} 
                onChange={(e) => setLocationInstance(e.target.value)} 
                rows="3"
                required
              />
              
              <select 
                value={role} 
                onChange={(e) => parseIntSelect(e.target.value)} 
                required >
                <option value="" disabled>Pilih role user</option>
                <option value="0">Factory</option>
                <option value="1">PBF</option>
                <option value="2">BPOM</option>
                <option value="3">Retailer</option>
              </select>

              {role === 0 ? 
                <select 
                value={factoryType} 
                onChange={(e) => setFactoryType(e.target.value)} 
                className="usaha"
                required >
                  <option value="" disabled>Pilih Jenis Usaha</option>
                  <option value="UMOT">Usaha Mikro Obat Tradisional (UMOT) </option>
                  <option value="UKOT">Usaha Kecil Obat Tradisional (UKOT) </option>
                  <option value="IOT">Industri Obat Tradisional (IOT)</option>
                </select> 
              : <div className="empty"></div>
            }
              
              <button type="submit">
              {
                  loader? (
                    <img src={imgLoader} alt="" />
                  ) : (
                    "Sign Up"
                  )
                }
              </button>
            </form>

            <p className="register-footer">
              ALready have an account? <a href="/login">login here</a>
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
                  <button className="test" onClick={(event) => autoFilled(event, 3)}>Auto Filled Retailer</button>
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

export default RegisterPage;
