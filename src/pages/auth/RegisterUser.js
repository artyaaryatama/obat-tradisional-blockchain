import { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { BrowserProvider, Contract } from "ethers";
import contractMainSupplyChain from '../../auto-artifacts/MainSupplyChain.json';
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
  const [email, setEmail] = useState("");
  const [userAddr, setUserAddr] = useState("");
  const [role, setRole] = useState("");

  // connect wallet
  useEffect(() => {
    async function connectWallet() {
      if (window.ethereum) {
        try {
          const provider = new BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const contr = new Contract(
            contractMainSupplyChain.address, 
            contractMainSupplyChain.abi, 
            signer);

          setContract(contr);
        } catch (err) {
          console.error("User access denied!");
          errAlert(err, "User access denied!")
        }
      } else {
        console.error("MetaMask is not installed");
      }
    }
    connectWallet();
  }, []);

  // event user registration
  useEffect(() => {
    if (contract) {
      contract.on("evt_UserRegistered", (_userAddr, _name, _role) => {
        console.log("User Registered Event: ", { _userAddr, _name, _role});

        const roles = {
          0n: "Pabrik",
          1n: "PBF", 
          2n: "BPOM",
          3n: "Retailer"
        }

        MySwal.fire({
          title:"Sign Up Success",
          html: (
            <div>
                <ul className="noList">
                  <li>{_name}</li>
                  <li>{roles[_role]}</li>
                </ul>
            </div>
          ),
          icon: 'success',
          showCancelButton: false,
          confirmButtonText: 'Oke',
          allowOutsideClick: false,
        }).then((result) => {
          if (result.isConfirmed) {
            navigate('/login');
          }
        });
      });

      return () => {
        contract.removeAllListeners("evt_UserRegistered");
      };
    }
  }, [contract]);

  const registerUser = async (e) => {

    e.preventDefault();
    setLoader(true)

    try {
      const nameUpperCase = name.toUpperCase()
      const tx = await contract.registerUser(nameUpperCase, email, userAddr, role);
      await tx.wait();
      console.log("Transaction receipt:", tx);
      console.log("User Registered Successfully!");
      
    } catch (err) {
      errAlert(err, "Registration failed")
    }
  };

  function autoFilled() {
    setUserAddr('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266')
    setEmail('sad@mail')
    setName('Asd')
    setRole(parseInt(0))
  }

  function parseIntSelect(opt){
    const a = parseInt(opt);
    setRole(a);
  }

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
                type="email" 
                placeholder="Email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
              
              <input 
                type="text" 
                placeholder="Account E-Wallet Address" 
                value={userAddr} 
                onChange={(e) => setUserAddr(e.target.value)} 
                required 
              />
              
              <select 
                value={role} 
                onChange={(e) => parseIntSelect(e.target.value)} 
                required >
                <option value="" disabled>Pilih role user</option>
                <option value="0">Pabrik</option>
                <option value="1">PBF</option>
                <option value="2">BPOM</option>
                <option value="3">Retailer</option>
              </select>
              
              <button type="submit" disabled={loader}>
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

              <button className="test" onClick={autoFilled}>Auto Filled</button>
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
      confirmButtonText: 'Try Again'
    });

  console.error(customMsg)
  console.error(errorObject);
}

export default RegisterPage;
