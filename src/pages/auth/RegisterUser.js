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
  const [userAddr, setUserAddr] = useState("");
  const [role, setRole] = useState("");

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
            contractData.MainSupplyChain.address, 
            contractData.MainSupplyChain.abi, 
            signer
          );

          setContract(contr)

        } catch (err) {
          console.error("User access denied!");
          errAlert(err, "User access denied!")
        }
      } else {
        console.error("MetaMask is not installed");
      }
    }
    connectWallet();

    // listener to change the user address automatically if the metamask active account change
    // if (window.ethereum) {
    //   window.ethereum.on("accountsChanged", () => {
    //     connectWallet();
    //     window.location.reload(); 
    //   });
    // }
  
    // return () => {
    //   if (window.ethereum) {
    //     window.ethereum.removeListener("accountsChanged", connectWallet);
    //   }
    // };
  }, []);

  // event user registration
  useEffect(() => {
    if (contract) {
      contract.on("evt_UserRegistered", (_userAddr, _name, _instanceName, _role) => {
        console.log("User Registered Event: ", { _userAddr, _name, _instanceName, _role});

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
                  <li>{_instanceName}</li>
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
      const tx = await contract.registerUser(nameUpperCase, instanceName, userAddr, role);
      await tx.wait();
      console.log("Transaction receipt:", tx);
      console.log("User Registered Successfully!");

      
    } catch (err) {
      setLoader(false)
      errAlert(err, "Registration failed")
    }
  };

  function autoFilled(event, role) {
    event.preventDefault();
    console.log(role);
    if(role===1){
      setInstanceName('PT. Budi Pekerti')
      setName('Takaki Yuya')
      setRole(parseInt(0))
      setUserAddr("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266")
    } else if(role===2){
      setInstanceName('BPOM Makassar')
      setName('NILOJURI')
      setRole(parseInt(2))
      setUserAddr("0x70997970C51812dc3A010C7d01b50e0d17dc79C8")
    } else if(role===3){
      setInstanceName('PT. Mangga Arum')
      setName('STIPEN JENSEN')
      setRole(parseInt(1))
      setUserAddr("0x90F79bf6EB2c4f870365E785982E1f101E93b906")
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
              
              <input 
                type="text" 
                placeholder="Account E-Wallet Address" 
                value={formattedAddress(userAddr)} 
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

              <button className="test" onClick={(event) => autoFilled(event, 1)}>Auto Filled Pabrik</button>
              <button className="test" onClick={(event) => autoFilled(event, 2)}>Auto Filled BPOM</button>
              <button className="test" onClick={(event) => autoFilled(event, 3)}>Auto Filled PBF</button>
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
