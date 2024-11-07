import { useEffect, useState } from "react";
import { BrowserProvider, Contract } from "ethers";
import { useNavigate } from 'react-router-dom';
import contractMainSupplyChain from './../auto-artifacts/MainSupplyChain.json';
import { useUser } from "../UserContext";


function LoginPage() {
  const [userName, setUserName] = useState("");
  const [userAddr, setUserAddr] = useState("");
  const {setUserDetails} = useUser();
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
        try {;
          const [address, name, role] = await contract.getRegisteredUser(userAddr);
          if (userAddr === address || userName === name) {
            // address: address
            // address act as userDetails: dan address satunya yg merupakan response dri contract itu act as setuserdetails
            setUserDetails({
              address: address,
              name: name,
              role: role
            });
            
            navigate("/cdob");
          } else {
            console.error("Wrong input! Username and User Address not match.")
          }
    
        } catch (err) {
          console.error("User not registered! ", err);
          errAlert(err)
        }
      } else {
        console.log("Please filled all input!")
      }
    }; 

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
      </div>
    );
}

function errAlert(err){

  const errorObject = {
    message: err.reason || err.message || "Unknown error",
    data: err.data || {},
    transactionHash: err.transactionHash || null
  };

  console.error(errorObject);
}

export default LoginPage;