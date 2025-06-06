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
  const [isBpom, setIsBpom] = useState(true)

  const [name, setName] = useState("");
  const [instanceName, setInstanceName] = useState("");
  // const [userAddr, setUserAddr] = useState("");
  const [nib, setNib] = useState("");
  const [npwp, setNpwp] = useState("");
  const [role, setRole] = useState("");
  const [locationInstance, setLocationInstance] = useState("");
  const [factoryType, setFactoryType] = useState("")

  useEffect(() => {
    document.title = "Sign Up"; 
  }, []);

  useEffect(() => {
    async function connectWallet() {
      if (window.ethereum) {
        try {
          const provider = new BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const contr = new Contract(
            contractData.RoleManager.address, 
            contractData.RoleManager.abi, 
            signer
          );

          setContract(contr)
          console.log(signer);

        } catch (err) {
          console.error("User access denied!");
          errAlert(err, "User access denied!")
        }
      } else {
        console.error("MetaMask is not installed");
      }
    }
    connectWallet();

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", () => {
        connectWallet();
        window.location.reload(); 
      });
    }
  
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("accountsChanged", connectWallet);
      }
    };
  }, []);

  const handleEventUserRegister = (_userAddr,_name, _instanceName, _role, _locationInstance, _nib, _npwp, txHash) => {
    const roles = {
      0n: "Factory",
      1n: "PBF",
      2n: "BPOM",
      3n: "Retailer",
    };
  
    MySwal.fire({
      title: "User Sukses Terdaftar",
      html: (
        <div className='form-swal regist event'>
          <ul>
            <li className="label">
              <p>Nama Pengguna</p> 
            </li>
            <li className="input">
              <p>{_name}</p> 
            </li>
          </ul>
          <ul>
            <li className="label">
              <p>Alamat Akun Pengguna</p> 
            </li>
            <li className="input">
              <p>{_userAddr}</p> 
            </li>
          </ul>
          <ul>
            <li className="label">
              <p>Asal Instansi</p> 
            </li>
            <li className="input">
              <p>{_instanceName}</p> 
            </li>
          </ul>
          <ul>
            <li className="label">
              <p>Role Pengguna</p> 
            </li>
            <li className="input">
              <p>{roles[_role]}</p> 
            </li>
          </ul>

          {!isBpom ? 
            <ul>
              <li className="label">
                <p>NPWP</p> 
              </li>
              <li className="input">
                <p>{_npwp}</p> 
              </li>
            </ul> : 
            <div className=""></div>
          }
          {!isBpom ? 
            <ul>
              <li className="label">
                <p>NIB</p> 
              </li>
              <li className="input">
                <p>{_nib}</p> 
              </li>
            </ul> : 
            <div className=""></div>
          }
          <ul>
            <li className="label">
              <p>Lokasi Instansi</p> 
            </li>
            <li className="input">
              <p>{_locationInstance}</p> 
            </li>
          </ul>
          <ul className="txHash">
            <li className="label">
              <p>Hash Transaksi</p>
            </li>
            <li className="input">
              <a
                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noreferrer"
              >
                Lihat transaksi di Etherscan
              </a>
            </li>
          </ul>
        </div>
      ),
      icon: 'success',
      width: '560',
      showCancelButton: false,
      confirmButtonText: 'Oke',
      allowOutsideClick: true,
      didOpen: () => {
        const actions = Swal.getActions();
       actions.style.justifyContent = "center";
      }
    }).then((result) => {
      if (result.isConfirmed) {
        navigate('/login');
      }
    });
  };

  const confirmData = async(e) => {
    e.preventDefault();
    let r, typeFactory;
    if(role===2){
      setNib('0')
      setNpwp('0')
      r = 'BPOM'
    } else if(role ===0){
      r= "Pabrik"
    } else if (role===1){
      r= "PBF"
    } else if (role===3){
      r= "Pengecer"
    }

    if (factoryType === "UMOT") {
      typeFactory = "Usaha Mikro Obat Tradisional (UMOT)"
    } else if (factoryType === "UKOT") {
      typeFactory = "Usaha Kecil Obat Tradisional (UKOT)"
    } else if (factoryType === "IOT") {
      typeFactory = "Industri Obat Tradisional (IOT)"
    }

    MySwal.fire({
      title: `Konfirmasi Pendaftaran Pengguna`,
      html: (
        <div className='form-swal'>
          <div className="row row--obat">
            <div className="col">

              <ul>
                <li className="label label-1">
                  <p>Role Pengguna</p>
                </li>
                <li className="input input-1">
                  <p>{r}</p> 
                </li>
              </ul>

              <ul>
                <li className="label label-1">
                  <p>Nama Pengguna</p>
                </li>
                <li className="input input-1">
                  <p>{name}</p> 
                </li>
              </ul>

              <ul>
                <li className="label label-1">
                  <p>Nama Instansi</p>
                </li>
                <li className="input input-1">
                  <p>{instanceName}</p> 
                </li>
              </ul>

              {factoryType? 
              <ul>
                <li className="label label-1">
                  <p>Tipe Pabrik</p>
                </li>
                <li className="input input-1">
                  <p>{typeFactory}</p> 
                </li>
              </ul>
              
              : <div></div>
              }

              <ul>
                <li className="label label-1">
                  <p>Lokasi Instansi</p> 
                </li>
                <li className="input input-1">
                  <p>{locationInstance}</p> 
                </li>
              </ul>
              {
                !isBpom ? 
                <div className="">
                  <ul>
                    <li className="label label-1">
                      <p>Nomor NIB</p>
                    </li>
                    <li className="input input-1">
                      <p>{nib}</p> 
                    </li>
                  </ul>
                  <ul>
                    <li className="label label-1">
                      <p>Nomor NPWP</p>
                    </li>
                    <li className="input input-1">
                      <p>{npwp}</p> 
                    </li>
                  </ul>

                </div>
              : <div className=""></div>
              }

            </div>
          </div>
        </div>
      ),
      width: '620',
      showCancelButton: true,
      confirmButtonText: 'Konfirmasi',
      cancelButtonText: "Batal",
      allowOutsideClick: false
    }).then((result) => {
      if(result.isConfirmed){
        MySwal.fire({
          title: "Menunggu koneksi Metamask...",
          text: "Jika proses ini memakan waktu terlalu lama, coba periksa koneksi Metamask Anda. 🚀",
          icon: 'info',
          showCancelButton: false,
          showConfirmButton: false,
          allowOutsideClick: false,
        });
        registerUser()
      }
    })


  } 
  
  const registerUser = async (e) => {

    setLoader(true)
    
    MySwal.fire({
      title:"Menunggu koneksi Metamask...",
      text:"Jika proses ini memakan waktu terlalu lama, coba periksa koneksi Metamask Anda. 🚀",
      icon: 'info',
      showCancelButton: false,
      showConfirmButton: false,
      allowOutsideClick: false,
    })

    try {
      const nameUpperCase = name.toUpperCase()
      let registCt;
      if(factoryType){
        registCt = await contract.registerUser(nameUpperCase, instanceName, role, locationInstance, factoryType, nib, npwp);
      } else {
        registCt = await contract.registerUser(nameUpperCase, instanceName, role, locationInstance, "", nib, npwp);
      }
      console.log("Transaction receipt:", registCt);
      console.log("Hash Transaksi:", registCt.hash);

      if(registCt){
        MySwal.update({
          title: "Memproses transaksi...",
          text: "Proses transaksi sedang berlangsung, harap tunggu. ⏳"
        });
        
      }

      contract.on("UserRegistered", (_userAddr, _name, _instanceName, _role, _locationInstance, _nib, _npwp) => {
        handleEventUserRegister(_userAddr, _name, _instanceName, _role, _locationInstance, _nib, _npwp, registCt.hash);
      });
      
    } catch (err) {
      setLoader(false)
      errAlert(err, "Pendaftaran gagal")
    }
  };

  // function autoFilled(event, role) {
  //   event.preventDefault();
  //   console.log(role);
  //   if(role===0){
  //     setInstanceName('PT. Lorem ')
  //     setRole(parseInt(0))
  //     setName('Ja Doe')
  //     // setUserAddr("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266")
  //     setNib('1111111111')
  //     setNpwp('11.111.111.1-111.111')
  //     setLocationInstance("Jl. Ini Alamat Factory PT. Lorem , Jakarta Selatan")
  //     setIsBpom(false)
  //     // setUserAddr("0x6142E74121ADE0de3BEC1641e0318dBcCFcDe06A")
      
  //   } else if(role===1){
  //     setInstanceName('PT. Ipsum Arum')
  //     setRole(parseInt(1))
  //     setName('Cha Doe') 
  //     setNib('2222222222')
  //     setNpwp('22.222.222.2-222.222')
  //     // setUserAddr("0x90F79bf6EB2c4f870365E785982E1f101E93b906")
  //     setLocationInstance("Jl. Ini Alamat PBF PT. Ipsum Arum, Jakarta Selatan")
  //     setIsBpom(false)
  //     // setUserAddr("0x97CB6400E271e65150B2330ad27f213a4C9c31af")
      
  //   } else if(role===2){
  //     setInstanceName('BPOM Gowa')
  //     setRole(parseInt(2))
  //     setName('So Doe') 
  //     // setUserAddr('0x70997970C51812dc3A010C7d01b50e0d17dc79C8')
  //     setLocationInstance("Jl. Ini Alamat BPOM Gowa, Makassar")
  //     setIsBpom(true)
  //     // setUserAddr('0xcbcD762c3C27212937314C1D46072a214346F2F3')
      
  //   }  else if(role===3){
  //     setInstanceName('Apotek Amet')
  //     setRole(parseInt(3))
  //     setName('Mar Doe') 
  //     setNib('4444444444')
  //     setNpwp('44.444.444.4-444.444')
  //     // setUserAddr('0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65')
  //     setLocationInstance("Jl. Ini Alamat Apotek Amet, Jakarta Selatan")
  //     setIsBpom(false)
  //     // setUserAddr('0xA3cE1983150Fade27518DF467a99a74FB4082dDa')
  //   }
  // }

  function autoFilled(event, role) {
    event.preventDefault();
    console.log(role);

    if (role === 0) {
      setInstanceName('[TEST] PT. Alam Hijau Farma');
      setRole(0);
      setName('Nadia Zahra');
      setNib('1414141414');
      setNpwp('14.141.414.1-414.141');
      setLocationInstance('Jl. Merdeka No.11, Bogor');
      setIsBpom(false);
    } else if (role === 1) {
      setInstanceName('[TEST] PT. Natural Farma Sejahtera');
      setRole(1); 
      setName('Andi Wicaksono');
      setNib('1313131313');
      setNpwp('13.131.313.1-313.131');
      setLocationInstance('Jl. Sukamulya No.15, Surabaya');
      setIsBpom(false);
    } else if (role === 2) {
      setInstanceName('[TEST] BPOM Singaraja');
      setRole(2);
      setName('Ratna Dewi');
      setLocationInstance('Jl. Pengawasan BPOM, Singaraja, Bali');
      setIsBpom(true);
    } else if (role === 3) {
      setInstanceName('[TEST] Apotek Sehat Utama');
      setRole(3);
      setName('Gilang Saputra');
      setNib('1919191919');
      setNpwp('19.191.919.1-919.191');
      setLocationInstance('Jl. Kartini No.9, Medan');
      setIsBpom(false);
    }

    // the user info for master branch 
    // if (role === 0) {
    //   setInstanceName('PT. Sehat Sentosa');
    //   setRole(0);
    //   setName('Rina Sari');
    //   setNib('6666666666');
    //   setNpwp('66.666.666.6-666.666');
    //   setLocationInstance('Jl. Sehat No.10, Jakarta Selatan');
    //   setIsBpom(false);
    // } else if (role === 1) {
    //   setInstanceName('PT. Cahaya Farma Raya');
    //   setRole(1); 
    //   setName('Fajar Nugroho');
    //   setNib('1212121212');
    //   setNpwp('12.121.212.1-212.121');
    //   setLocationInstance('Jl. Areum-areum No.20, Jakarta Barat');
    //   setIsBpom(false);
    // } else if (role === 2) {
    //   setInstanceName('BPOM Malino');
    //   setRole(2);
    //   setName('Sri Lestari');
    //   setLocationInstance('Jl. Pengawasan BPOM, Malino, Sulawesi Selatan');
    //   setIsBpom(true);
    // } else if (role === 3) {
    //   setInstanceName('Apotek Nusantara');
    //   setRole(3);
    //   setName('Budi Hartono');
    //   setNib('8888888888');
    //   setNpwp('88.888.888.8-888.888');
    //   setLocationInstance('Jl. Apotek Sejahtera No.5, Jakarta Timur');
    //   setIsBpom(false);
    // }
  }
  
  
  function parseIntSelect(opt){
    const a = parseInt(opt);
    setRole(a);

    if(a === 2) {
      setIsBpom(true)
    } else {
      setIsBpom(false)
    }
  }

  return (
    <>
      <div id="RegisterPage" className="App">
        <div className="container">
          <div className="form-container">
            <h1>ot-blockchain.</h1>

            <form className="register-form" onSubmit={confirmData}>
              <input 
                type="text" 
                placeholder="Nama Pengguna" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
              />

              <input 
                type="text" 
                placeholder="Nama Instansi" 
                value={instanceName} 
                onChange={(e) => setInstanceName(e.target.value)} 
                required 
              />
              
              {/* <input 
                type="text" 
                placeholder="Account E-Wallet Address" 
                value={userAddr} 
                onChange={(e) => setUserAddr(e.target.value)} 
                required
              /> */}

              <textarea 
                type="text" 
                placeholder="Lokasi Instansi" 
                value={locationInstance} 
                onChange={(e) => setLocationInstance(e.target.value)} 
                rows="3"
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
                <option value="3">Pengecer</option>
              </select>

              {!isBpom ? 
                <div className="nibNpwp">
                  <input 
                    type="text" 
                    placeholder="Nomor NIB" 
                    value={nib} 
                    className="nib"
                    onChange={(e) => setNib(e.target.value)} 
                    required 
                  />
      
                  <input 
                    type="text" 
                    placeholder="Nomor NPWP " 
                    value={npwp} 
                    onChange={(e) => setNpwp(e.target.value)} 
                    required 
                  />

                </div> : 
                <div className=""></div>
            }


              {role === 0 ? 
                <select 
                value={factoryType} 
                onChange={(e) => setFactoryType(e.target.value)} 
                className="usaha"
                required >
                  <option value="" disabled>Pilih Jenis Usaha</option>
                  <option value="UMOT">Usaha Mikro Obat Tradisional (UMOT) </option>
                  <option value="UKOT">Usaha Kecil Obat Tradisional (UKOT) </option>
                  <option value="IOT">Industri Obat Tradisional (IOT)</option>
                </select> 
              : <div className="empty"></div>
            }
              
              <button type="submit">
              {
                  loader? (
                    <img src={imgLoader} alt="" />
                  ) : (
                    "Daftar"
                  )
                }
              </button>
            </form>

            <p className="register-footer">
              Sudah memiliki akun? <a href="/login">silahkan masuk disini.</a>
            </p>

            <div className="btn-group">
              <ul>
                <li>
                  <button className="test" onClick={(event) => autoFilled(event, 0)}>Auto Filled Factory</button>
                </li>
                <li>
                  <button className="test" onClick={(event) => autoFilled(event, 1)}>Auto Filled PBF</button>
                </li>
              </ul>
              <ul>
                <li>
                  <button className="test" onClick={(event) => autoFilled(event, 2)}>Auto Filled BPOM</button>
                </li>

                <li>
                  <button className="test" onClick={(event) => autoFilled(event, 3)}>Auto Filled Retailer</button>
                </li>
              </ul>
            </div>

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
    confirmButtonText: 'Coba Lagi',
    didOpen: () => {
      const actions = Swal.getActions();
      actions.style.justifyContent = "center";
    }
  });

  console.error(customMsg)
  console.error(errorObject);
}

export default RegisterPage;
