import { useEffect, useState } from "react";
import { BrowserProvider, Contract } from "ethers";
import { useNavigate } from 'react-router-dom';
import contractMainSupplyChain from './../auto-artifacts/MainSupplyChain.json';
import { useUser } from "../UserContext";


function LoginPage() {
  const [userName, setUserName] = useState("");
  const [userAddr, setUserAddr] = useState("");
  const {userDetails, setUserDetails} = useUser();
  const navigate = useNavigate(); 
  
  const [contract, setContract] = useState();

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

    const loginFetch = async () => {

      if(userAddr && userName){
        try {
          const userNameUpperCase = userName.toUpperCase()
          const [address, name, role] = await contract.getRegisteredUser(userAddr);
          
          if (userAddr === address || userNameUpperCase === name) {
            // address: address
            // address act as userDetails: dan address satunya yg merupakan response dri contract itu act as setuserdetails
            setUserDetails({
              address: address,
              name: name,
              role: role.toString()
            });

            console.log(userDetails);
            
            if (userDetails.role === "1") {
              navigate('/cdob');
            } else if (userDetails.role  === "0") {
              console.log(3);
              navigate('/cpotb');
            } else {
              // navigate('/unauthorized');
            }
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

    function registerDirect() {
      navigate("/register")
    }

    return (
      <div>
        <h2>Login</h2>
        <input
          type="text"
          placeholder="Enter Ethereum Address"
          value={userAddr}
          onChange={(e) => setUserAddr(e.target.value)}
        />
        <input
          type="text"
          placeholder="Enter Username"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
        />
        <button onClick={loginFetch}>Login</button>
        <button onClick={registerDirect}>Register</button>
      </div>
    );
}

function errAlert(err, customMsg){

  const errorObject = {
    message: err.reason || err.message || "Unknown error",
    data: err.data || {},
    transactionHash: err.transactionHash || null
  };

  console.error(customMsg);
  console.error(errorObject);
}

export default LoginPage;