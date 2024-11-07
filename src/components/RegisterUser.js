import { useEffect, useState } from "react";
import { BrowserProvider, Contract } from "ethers";
import { useNavigate } from 'react-router-dom';
import contractMainSupplyChain from './../auto-artifacts/MainSupplyChain.json';

function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [userAddr, setUserAddr] = useState("");
  const [role, setRole] = useState("");
  const [userDetails, setUserDetails] = useState({});
  const [isUserRegistered, setIsUserRegistered] = useState("");
  const navigate = useNavigate(); 

  const [contract, setContract] = useState("");

  // Testing address current MetaMask
  const [addrAccount, setAddrAccount] = useState("");

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

          setAddrAccount(await signer.getAddress());
          setContract(contr);
        } catch (err) {
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
          0n: "Factory",
          1n: "PBF", 
          2n: "BPOM",
          3n: "Retailer",
          4n: "Guest"
        }

        setUserDetails({
          address: _userAddr,
          name: _name,
          role: roles[_role]
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
      const nameUpperCase = name.toUpperCase()
      const tx = await contract.registerUser(nameUpperCase, email, userAddr, role);
      await tx.wait();
      console.log("Transaction receipt:", tx);
      console.log("User Registered Successfully!");
      
    } catch (err) {
      errAlert(err, "Registration failed")
    }
  };

  const getRegisterUser = async () => {
    try {
      const t = await contract.getRegisteredUser(userAddr)
      console.log(t);
      const [address, name, role] = await contract.getRegisteredUser(userAddr);
      setUserDetails({ address, name, role });
      setIsUserRegistered(true);

    } catch (err) {
      errAlert(err, "Failed to fetch user registration")
      setIsUserRegistered(false);
    }
  };

  const handleOptionRole = (e) => {
    setRole(parseInt(e.target.value));
  };

  function loginRedirect() {
    navigate("/login")
  }

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
          <button onClick={loginRedirect}>Login</button>
          {isUserRegistered ? (
            <div>
              <h2>User Details</h2>
              <p>Name: {userDetails?.name}</p>
              <p>Address: {userDetails?.address}</p>
              <p>Role: {userDetails?.role}</p>
            </div>
          ) : (
            <p></p>
          )}
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

  console.error(customMsg)
  console.error(errorObject);
}

export default RegisterPage;
