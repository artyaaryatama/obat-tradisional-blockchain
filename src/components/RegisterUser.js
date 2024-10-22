import { useEffect, useState } from "react";
import { BrowserProvider, Contract } from "ethers";
import contractABI from "../artifacts/contracts/MainSupplyChain.sol/MainSupplyChain.json"

function RegisterPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [userAddr, setUserAddr] = useState("")
  const [role, setRole] = useState("")
  const [contract, setContract] = useState("")
  const [addrAccount, setAddrAccount] = useState("")

  let userName, userAddress

  useEffect(() => {
    async function connect_wallet() {
      if(window.ethereum) {
        try {
          const provider = new BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
          const contr = new Contract(
            contractAddress,
            contractABI.abi,
            signer
          ) 
          setAddrAccount(contr.target);
    
          setContract(contr)
        } catch (err) {
          console.error("User denied addrAccount access: ", err)
        }
      } else {
        console.error("MetaMask is not installed")
      }
    }
    connect_wallet()
  }, [])

  const register_user = async () => {
    try {
      console.log({name, email, userAddr, role })
      const tx = await contract.registerUser(
        name, email, userAddr, role 
      )
      await tx.wait();
      console.log("receipt contract:", tx)

    } catch (err) {
      console.error(err)
    }
  }
  
  const get_register_user = async () => {
    try {
      const tx = await contract.getRegisteredUser(userAddr)
      console.log("receipt contract:", tx)
      showRegisteredUser(tx[0], tx[1])
  
    } catch (err) {
      console.error(err)
    }
  }

  const handleOptionRole = (e) => {
    setRole(parseInt(e.target.value))
  }

  function showRegisteredUser(address, name) {
    const container = document.getElementById('ShowRegisteredUser')
    container.innerHTML = `
      <h1>User Registered Successfully</h1>
      <p><strong>Request ID:</strong> ${name}</p>
      <p><strong>Nomor CPOTB:</strong> ${address}</p>
    `
  }

  return (
    <>
      <div id="RegisterPage" className="App">
        <h1>is connect to meta? {addrAccount}</h1>
        <h1>Sign Up User</h1>
        <div>
          <input
            type="text"
            placeholder="Nama"
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
            placeholder="addrAccount Address"
            value={userAddr}
            onChange={(e) => setUserAddr(e.target.value)}
          />
          <label htmlFor="role">User Role</label>
          <select id="role" name="role" value={role} onChange={handleOptionRole}>
            <option value="" disabled>Select your role</option>
              <option value="0">Guest</option>
              <option value="1">Factory</option>
              <option value="2">PBF</option>
              <option value="3">BPOM</option>
              <option value="4">Retailer</option>
          </select>
          <button onClick={register_user}>Sign Up</button>
        </div>

        <div>
          <h2>Check Registered User</h2>
          <textarea
            type="text"
            placeholder="addrAccount Address"
            value={userAddr}
            onChange={(e) => setUserAddr(e.target.value)}
          />

          <button onClick={get_register_user}>Check User</button>

          <div id="ShowRegisteredUser"></div>
        </div>
      </div>
    </>
  );
}

export default RegisterPage;