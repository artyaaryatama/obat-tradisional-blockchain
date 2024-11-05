import { useEffect, useState } from "react";
import { BrowserProvider, Contract } from "ethers";
import contractABI from "../artifacts/contracts/MainSupplyChain.sol/MainSupplyChain.json";


function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [userAddr, setUserAddr] = useState("");
  const [role, setRole] = useState("");
  const [contract, setContract] = useState("");
  const [userDetails, setUserDetails] = useState({});
  const [isUserRegistered, setIsUserRegistered] = useState("");

  // Testing address current MetaMask
  const [addrAccount, setAddrAccount] = useState("");

  // connect wallet
  useEffect(() => {
    async function connectWallet() {
      if (window.ethereum) {
        try {
          const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
          const provider = new BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const contr = new Contract(contractAddress, contractABI.abi, signer);

          setAddrAccount(await signer.getAddress());
          setContract(contr);
        } catch (err) {
          console.error("User denied addrAccount access: ", err);
          errAlert(err)
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
      contract.on("evt_UserRegistered", (_userAddr, _name) => {
        console.log("User Registered Event: ", { _userAddr, _name});

        setUserDetails({
          address: _userAddr,
          name: _name
        });

        setIsUserRegistered(true);
      });

      return () => {
        contract.removeAllListeners("evt_UserRegistered");
      };
    }
  }, [contract]);

  const registerUser = async () => {
    if (!name || !email || !role === undefined || !userAddr) {
      alert("All fields are required");
      console.log(email, role, name, userAddr);
      return
    }
    
    try {
      const tx = await contract.registerUser(name, email, userAddr, role);
      await tx.wait();
      console.log("Transaction receipt:", tx);
      console.log("User Registered Successfully!");
      
    } catch (err) {
      console.log("Registration failed:", err);
      errAlert(err)
    }
  };

  const getRegisterUser = async () => {
    try {
      const [address, name] = await contract.getRegisteredUser(userAddr);
      setUserDetails({ address, name });
      setIsUserRegistered(true);

    } catch (err) {
      console.error("Failed to fetch user registration:", err);
      errAlert(err)
      setIsUserRegistered(false);
    }
  };

  const handleOptionRole = (e) => {
    setRole(parseInt(e.target.value));
  };

  return (
    <>
      <div id="RegisterPage" className="App">
        <h1>Is connected to MetaMask? {addrAccount}</h1>
        <h1>Sign Up User</h1>
        <div>
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="text"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <textarea
            type="text"
            placeholder="Account Address"
            value={userAddr}
            onChange={(e) => setUserAddr(e.target.value)}
          />
          <label htmlFor="role">User Role</label>
          <select id="role" name="role" value={role} onChange={handleOptionRole}>
            <option value="" disabled>Select your role</option>
              <option value="0">Factory</option>
              <option value="1">PBF</option>
              <option value="2">BPOM</option>
              <option value="3">Retailer</option>
              <option value="4">Guest</option>
            
          </select>
          <button onClick={registerUser}>Sign Up</button>
        </div>

        <div>
          <button onClick={getRegisterUser}>Check Registration</button>
          {isUserRegistered ? (
            <div>
              <h2>User Details</h2>
              <p>Name: {userDetails?.name}</p>
              <p>Address: {userDetails?.address}</p>
            </div>
          ) : (
            <p></p>
          )}
        </div>
      </div>
    </>
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

export default RegisterPage;
