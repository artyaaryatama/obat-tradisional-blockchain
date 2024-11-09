import { useEffect, useState } from "react";
import { BrowserProvider, Contract } from "ethers";
import contractMainSupplyChain from '../../auto-artifacts/MainSupplyChain.json';
import { useNavigate } from 'react-router-dom';
import imgLogin from '../../assets/images/login.png';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import './../../styles/Auth.scss';
import './../../styles/SweetAlert.scss';

const MySwal = withReactContent(Swal);

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

        // buat convert role dri eventnya
        const roles = {
          0n: "Pabrik",
          1n: "PBF", 
          2n: "BPOM",
          3n: "Retailer"
        }

        setUserDetails({
          address: _userAddr,
          name: _name,
          role: roles[_role]
        });

        // setIsUserRegistered(true);

        MySwal.fire({
          title: <h5>User berhasil terdaftar!</h5>, // Custom title using JSX
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
                placeholder="Masukan nama" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
              />

              <input 
                type="email" 
                placeholder="Masukkan email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
              
              <input 
                type="text" 
                placeholder="Masukkan alamat e-wallet" 
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
              
              <button type="submit">Daftar</button>
            </form>

            <p className="register-footer">
              Sudah punya akun? <a href="/login">Masuk disini</a>
            </p>

              <button className="test" onClick={autoFilled}>Auto Filled</button>
          </div>
        </div>


        {/* <h1>Is connected to MetaMask? {addrAccount}</h1>
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
          <button onClick={autoFilled}>Auto Filled</button>
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
        </div> */}
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
