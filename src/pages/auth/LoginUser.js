import { useEffect, useState } from "react";
import { BrowserProvider, Contract } from "ethers";
import { useNavigate } from 'react-router-dom';
import contractMainSupplyChain from '../../auto-artifacts/MainSupplyChain.json';
import imgLogin from '../../assets/images/login.png';
import imgLoader from '../../assets/images/loader.svg';

import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import './../../styles/Auth.scss';
import './../../styles/SweetAlert.scss';

const MySwal = withReactContent(Swal);

function LoginPage() {
  const [name, setName] = useState("");
  const [userAddr, setUserAddr] = useState("");

  const navigate = useNavigate();
  const [contract, setContract] = useState();
  const [loader, setLoader] = useState(false)

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
            console.error("User denied access: ", err);
            errAlert(err)
          }
        } else {
          console.error("MetaMask is not installed");
        }
      }
      connectWallet();
    }, []);

    const loginUser = async (e) => {
      e.preventDefault();
      setLoader(true)

      if(userAddr && name){
        try {
          const nameUpperCase = name.toUpperCase()
          const [address, userName, role] = await contract.getRegisteredUser(userAddr);
          
          if (userAddr === address || nameUpperCase === name) {

            const userdata = {
              address: address,
              name: userName,
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
              showCancelButton: false,
              showConfirmButton: false,
              allowOutsideClick: false,
            })
            .then(() => {
              if (userdata.role === "1") {
                navigate('/cdob');
              } else if (userdata.role  === "0") {
                navigate('/cpotb');
              } else {
                // navigate('/unauthorized');
              }
            });
            
          } else {
            console.error("Wrong input! Username and User Address not match.")
          }
          
    
        } catch (err) {
          errAlert(err, "User not registered!")
        }
      } else {
        console.log("Please filled all input!")
      }
    }; 

    function autoFilled() {
      setUserAddr('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266')
      setName('Asd')
    }

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
                value={userAddr} 
                onChange={(e) => setUserAddr(e.target.value)} 
                required 
              />
              
              <button type="submit" disabled={loader}>
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

  console.error(customMsg);
  console.error(errorObject);
}

export default LoginPage;