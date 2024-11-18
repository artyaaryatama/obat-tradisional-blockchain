import { useEffect, useState } from "react";
import { BrowserProvider, Contract } from "ethers";
import { useNavigate } from 'react-router-dom';
import contractData from '../../auto-artifacts/deployments.json';
import imgLogin from '../../assets/images/login.png';
import imgLoader from '../../assets/images/loader.svg';

import './../../styles/Auth.scss';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import './../../styles/SweetAlert.scss';

const MySwal = withReactContent(Swal);

function LoginPage() {
  const [name, setName] = useState("");
  const [userAddr, setUserAddr] = useState("");

  const navigate = useNavigate();
  const [contract, setContract] = useState();
  const [loader, setLoader] = useState(false)

  useEffect(() => {
    document.title = "Welcome!"; 
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
            signer);

          setContract(contr);
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

  const loginUser = async (e) => {
    e.preventDefault();
    setLoader(true)

    if(userAddr && name){
      try {
        const nameUpperCase = name.toUpperCase()
        console.log(nameUpperCase, userAddr);
        const [address, userName, instanceName, role] = await contract.getRegisteredUser(userAddr);
        
        if (userAddr === address || nameUpperCase === name) {
          console.log('role pas login',{role, address});

          const userdata = {
            address: address,
            name: userName,
            instanceName: instanceName,
            role: role.toString()
          }
          
          sessionStorage.setItem("userdata", JSON.stringify(userdata))
          console.log(userdata);

          MySwal.fire({
            title: "Login Success",
            html: (
              <div>
                  <p>Please wait a moment, we are redirecting you to the page <span>&#127939;</span></p>
              </div>
            ),
            timer: 2000,
            icon: 'success',
            timerProgressBar: true,
            showCancelButton: false,
            showConfirmButton: false,
            allowOutsideClick: false,
          })
          .then(() => {
            if (userdata.role === "1") {
              navigate('/cdob');
            } else if (userdata.role  === "0") {
              navigate('/cpotb');
            } else if (userdata.role === '2') {
              navigate('/cpotb-bpom')
            } else{
              navigate('/unauthorized');
            }
          });
          
        } else {
          console.error("Wrong input! Username and User Address not match.")
        }
        
      } catch (err) {
        setLoader(false)
        errAlert(err, "User not registered!")
      }
    } else {
      console.log("Please filled all input!")
    }
  }; 

  function autoFilled(event, role) {
    event.preventDefault();
    console.log(role);
    if(role===0){
      setName('Takaki Yuya')
      setUserAddr("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266")
    } else if(role===2){ 
      setName('NILOJURI') 
      setUserAddr('0x70997970C51812dc3A010C7d01b50e0d17dc79C8')
    } else if(role===1){ 
      setName('STIPEN JENSEN') 
      setUserAddr("0x90F79bf6EB2c4f870365E785982E1f101E93b906")
    }
  }

  const formattedAddress = (addr) => {
    if (!addr) return "";
    return `${addr.slice(0, 16)}...${addr.slice(-14)}`;
  };

  return (
    <>
    <div id="LoginPage" className="App">
      <div className="container">
        <div className="img-container">
          <img src={imgLogin} alt="Img Login" />
        </div>
        <div className="form-container">
          <h1>ot-blockchain.</h1>

          <form className="register-form" onSubmit={loginUser}>
            <input 
              type="text" 
              placeholder="Name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
            />
            
            <input 
              type="text" 
              placeholder="Account E-Wallet Address" 
              value={formattedAddress(userAddr)} 
              onChange={(e) => setUserAddr(e.target.value)} 
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
            Don't have an account? <a href="/register">Sign Up here</a>
          </p>

          <button className="test" onClick={(event) => autoFilled(event, 0)}>Auto Filled Pabrik</button>
              <button className="test" onClick={(event) => autoFilled(event, 2)}>Auto Filled BPOM</button>
              <button className="test" onClick={(event) => autoFilled(event, 1)}>Auto Filled PBF</button>
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

  console.error(customMsg);
  console.error(errorObject);
}

export default LoginPage;