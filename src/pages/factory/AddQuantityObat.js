import { useEffect, useState } from 'react';
import { BrowserProvider, Contract } from "ethers";
import contractData from '../../auto-artifacts/deployments.json';
import { useNavigate } from 'react-router-dom';
import { create } from 'ipfs-http-client';
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import DataIpfsHash from '../../components/TableHash';
import imgLoader from '../../assets/images/loader.svg';
import "../../styles/MainLayout.scss";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import './../../styles/SweetAlert.scss';

const MySwal = withReactContent(Swal);

const client = create({ url: 'http://127.0.0.1:5001/api/v0' });

function AddQuantityObat() {
  const [contracts, setContracts] = useState(null);
  const navigate = useNavigate();
  const userdata = JSON.parse(sessionStorage.getItem('userdata')) || {};
  const [loader, setLoader] = useState(false);
  const [dataObatAvail, setDataObatAvail] = useState([])
  const [batchName, setBatchName] = useState("")

  const [namaProduk, setNamaProduk] = useState("");
  const [quantityObat, setQuantityObat] = useState("")

  const tipeObatMap = {
    0n: "Obat Lain",
    1n: "Cold Chain Product"
  };

  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  }

  useEffect(() => {
    document.title = "Create Obat Tradisional"; 
  }, []);

  useEffect(() => {
    async function connectWallet() {
      if (window.ethereum) {
        try {
          const provider = new BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const RoleManager = new Contract(
            contractData.RoleManager.address,
            contractData.RoleManager.abi,
            signer
          );
          const obatTradisionalContract = new Contract(
            contractData.ObatTradisional.address,
            contractData.ObatTradisional.abi,
            signer
          );

          const NieManager = new Contract(
            contractData.NieManager.address, 
            contractData.NieManager.abi, 
            signer
          );

          setContracts({
            roleManager: RoleManager,
            nieManager: NieManager,
            obatTradisional: obatTradisionalContract
          });
        } catch (err) {
          console.error("User access denied!");
          errAlert(err, "User access denied!");
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

  useEffect(() => {

    const loadObatDataAvailable = async () => {
      if(contracts) {
        try {
          const listObatNameCt = await contracts.obatTradisional.getAllObatByInstance(userdata.instanceName);

          console.log(listObatNameCt);
          const filteredData = listObatNameCt.filter((item) => item[2] !== '');

          const reconstructedData = filteredData.map((item) => {
            console.log(item);
            return {
              obatId: item[0],
              namaProduk: item[1]
            }
          })

          // const reconstructedData = listObatNameCt.map((item) => {
          //   console.log(item);

          //   if (item[2] !== '') {
          //     console.log(item[1]);
          //     return {
          //       obatId: item[0],
          //       namaProduk: item[1]
          //     }
          //   } else {
          //     return false
          //   }
          // })

          // if(!reconstructedData){
          //   errAlert({reason: `Pabrik ${userdata.instanceName} tidak memiliki obat dengan NIE yang terdaftar.`})
          // }

          setDataObatAvail(reconstructedData)

          const timestamp = Date.now(); 
          const digits = String(timestamp).slice(-4);
          const letters = Array.from({ length: 4 }, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('');

          const generateBatchName = `BN-${digits}-${letters}`;

          setBatchName(generateBatchName)
      

        } catch (error) {
          errAlert(error, "Can't access obat data.")
        }
      }

    }

    loadObatDataAvailable()
  }, [contracts])

  const handleEventAddBatchProduction = (_batchName, _obatQuantity, _namaProduk, _factoryInstance, txHash) => {
      
    MySwal.fire({
        title: `Sukses menambahkan stok obat`,
        html: (
          <div className='form-swal event'>
            <ul>
              <li className="label">
                <p>Nama Produk</p> 
              </li>
              <li className="input">
                <p>{_namaProduk}</p> 
              </li>
            </ul>
            <ul>
              <li className="label">
                <p>Nama Batch</p> 
              </li>
              <li className="input">
                <p>{_batchName}</p> 
              </li>
            </ul>
            <ul>
              <li className="label">
                <p>Total Stok Obat</p> 
              </li>
              <li className="input">
                <p>{_obatQuantity.toString()} Obat</p> 
              </li>
            </ul>
            <ul>
              <li className="label">
                <p>Nama Instansi Pabrik</p> 
              </li>
              <li className="input">
                <p>{_factoryInstance}</p> 
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
          navigate('/obat-available-factory')
        }
      });
  }

  const getData = async (e) => {
    e.preventDefault();

    MySwal.fire({
      title: "Mengunggah Data Obat ke IPFS...",
      text: "Jika proses ini memakan waktu terlalu lama, coba periksa koneksi IPFS Anda. 🚀",
      icon: 'info',
      showCancelButton: false,
      showConfirmButton: false,
      allowOutsideClick: false,
    });

    const selectedObat = dataObatAvail.filter(item => item.namaProduk === namaProduk)
    const id = selectedObat[0].obatId;
    console.log(id);

    const detailObatCt = await contracts.obatTradisional.detailObat(id);
    const detailNieCt = await contracts.nieManager.getNieDetail(id)
    // const rejectMsg = await contracts.NieManager.getRejectMsgNie(id);

    const [merk, namaObat, klaim, komposisi, kemasan, factoryInstance, factoryAddr, tipeObat, cpotbHash, cdobHash, jenisObat] = detailObatCt;

    const [nieNumber, nieStatus, timestampProduction, timestampNieRequest, timestampNieApprove, timestampNieRejected, timestampNieRenewRequest, factoryInstancee, bpomInstance, bpomAddr] = detailNieCt[0];
    console.log(cpotbHash);
    
    const detailObat = {
      obatId: id,
      merk: merk,
      namaProduk: namaObat,
      klaim: klaim,
      kemasan: kemasan,
      komposisi: komposisi,
      produtionTimestamp: timestampProduction ? new Date(Number(timestampProduction) * 1000).toLocaleDateString('id-ID', options) : '-', 
      nieRequestDate: timestampNieRequest ? new Date(Number(timestampNieRequest) * 1000).toLocaleDateString('id-ID', options) : '-', 
      nieApprovalDate:  timestampNieApprove ? new Date(Number(timestampNieApprove) * 1000).toLocaleDateString('id-ID', options): "-",
      nieRejectDate:  timestampNieRejected ? new Date(Number(timestampNieRejected) * 1000).toLocaleDateString('id-ID', options): "-",
      nieRenewRequestDate:  timestampNieRenewRequest ? new Date(Number(timestampNieRenewRequest) * 1000).toLocaleDateString('id-ID', options): "-",
      nieNumber: nieNumber ? nieNumber : "-",
      factoryAddr: factoryAddr,
      factoryInstanceName: factoryInstance,
      bpomAddr: bpomAddr,
      bpomInstanceName:  bpomInstance,
      tipeObat: tipeObatMap[tipeObat],
      jenisObat: jenisObat
    };

    generateIpfs(detailObat, parseInt(quantityObat), batchName, cpotbHash)
  };

  const generateIpfs = async(dataObat, quantity, batchNameObat, cpotbHash) => {
    console.log(dataObat, quantity, batchNameObat); 
    let newIpfsHashes = [];

    const timestampYear = new Date().getFullYear().toString().slice(-4);
    const randomFourLetters = Array.from({ length: 4 }, () =>
      String.fromCharCode(65 + Math.floor(Math.random() * 26))
    ).join(''); 

    const userFactoryCt = await contracts.roleManager.getUserData(dataObat.factoryAddr);
    const userBpomCt = await contracts.roleManager.getUserData(dataObat.bpomAddr);

    console.log(userFactoryCt);

    for (let i = 0; i < quantity; i++) {
      const obat = {
        batchName: batchNameObat,
        obatIdPackage: `OT-${i}${timestampYear}-${randomFourLetters}`,
        cpotbHash: cpotbHash,
        dataObat:  {
          namaProduk: dataObat.namaProduk,
          merk: dataObat.merk,
          klaim: dataObat.klaim,
          kemasan: dataObat.kemasan,
          komposisi: dataObat.komposisi,
          factoryAddr: dataObat.factoryAddr,
          factoryInstanceName: dataObat.factoryInstanceName,
          factoryAddressInstance: userFactoryCt[4], 
          factoryType:  userFactoryCt[5],
          tipeObat: dataObat.tipeObat,
          nieNumber: dataObat.nieNumber,
          obatStatus: "NIE Approved",
          nieRequestDate: dataObat.nieRequestDate,
          nieApprovalDate: dataObat.nieApprovalDate,
          bpomAddr: dataObat.bpomAddr,
          bpomInstanceName: dataObat.bpomInstanceName,
          nibFactory: userFactoryCt[6],
          npwpFactory: userFactoryCt[7],
          nibBpom: userBpomCt[6],
          npwpBpom: userBpomCt[7],
          bpomAddressInstance: userBpomCt[4],
          jenisObat: dataObat.jenisObat
        }
      };
      
      try {
        const result = await client.add(JSON.stringify(obat), 
          { progress: (bytes) => 
            console.log(`Uploading ${i+1}/${quantityObat}: ${bytes} bytes uploaded`) }
        );

        newIpfsHashes.push(result.path); 
      } catch (error) {
        errAlert(error, "Tidak bisa mengunggah data obat ke IPFS."); 
        break;
      }
    }

    if(newIpfsHashes.length !== 0){
      MySwal.fire({
        title: `Data Obat ${dataObat.namaProduk}`,
        html: (
          <div className='form-swal'>
            <div className="row row--obat">
              <div className="col">
  
                <ul>
                  <li className="label label-1">
                    <p>Nama Produk</p>
                  </li>
                  <li className="input input-1">
                    <p>{dataObat.namaProduk}</p> 
                  </li>
                </ul>

                <ul>
                  <li className="label label-1">
                    <p>Batch Name</p>
                  </li>
                  <li className="input input-1">
                    <p>{batchNameObat}</p> 
                  </li>
                </ul>
  
                <ul>
                  <li className="label label-1">
                    <p>Nama Factory</p> 
                  </li>
                  <li className="input input-1">
                    <p>{dataObat.factoryInstanceName}</p> 
                  </li>
                </ul>
  
                <ul>
                  <li className="label label-1">
                    <p>Total Quantity</p> 
                  </li>
                  <li className="input input-1">
                    <p>{quantityObat} Obat</p>
                  </li>
                </ul>
  
                <ul>
                  <li className="input full-width-table">
                    <DataIpfsHash ipfsHashes={newIpfsHashes} />
                  </li>
                </ul>
              </div>
            </div>
          
          </div>
        ),
        width: '820',
        showCancelButton: true,
        confirmButtonText: 'Konfirmasi Kuantitas Obat',
        cancelButtonText: "Batal",
        allowOutsideClick: false
      }).then((result) => {
        if(result.isConfirmed){
          MySwal.update({
            title: "Mempersiapkan transaksi...",
            text: "Proses transaksi sedang berlangsung, harap tunggu. ⏳"
          });
          addQuantity(dataObat, batchNameObat, quantityObat, newIpfsHashes)
        }
      })
    }
    
  }
  
  const addQuantity = async (dataObat, batchNameObat, quantityObat, newIpfsHashes) => {

    MySwal.fire({
      title: "Menunggu koneksi Metamask...",
      text: "Jika proses ini memakan waktu terlalu lama, coba periksa koneksi Metamask Anda. 🚀",
      icon: 'info',
      showCancelButton: false,
      showConfirmButton: false,
      allowOutsideClick: false,
    });

    
    try {
      const quantity = parseInt(quantityObat)
      
      console.log(dataObat.obatId, dataObat.namaProduk, batchNameObat, quantity, newIpfsHashes,  dataObat.factoryInstanceName);

      const addBatchCt = await contracts.obatTradisional.addBatchProduction(dataObat.obatId, dataObat.namaProduk, batchNameObat, quantity, newIpfsHashes,  dataObat.factoryInstanceName);

      if(addBatchCt){
        addBatchObatFb(userdata.instanceName, dataObat.namaProduk, addBatchCt.hash, batchNameObat, quantity)

        MySwal.update({
          title: "Memproses transaksi...",
          text: "Proses transaksi sedang berlangsung, harap tunggu. ⏳"
        });
      }

      contracts.obatTradisional.once('evt_addBatchProduction',  (_batchName, _obatQuantity, _namaProduk, _factoryInstance) => {
        handleEventAddBatchProduction(_batchName, _obatQuantity, _namaProduk, _factoryInstance, addBatchCt.hash)
      });
  
    } catch (err) {
      setLoader(false)
      errAlert(err, "Error add quantity obat!");
    }
  }

  const addBatchObatFb = async (instanceName, namaProduk, hash, batchName, quantity) => {
    try {
      const documentId = `[OT] ${namaProduk}`;
      const factoryDocRef = doc(db, instanceName, documentId);
      
      await updateDoc(factoryDocRef, {
        [`batchData.${batchName}`]: {
          quantity: quantity,
          historyHash: {
            batchCreated: hash,
            batchCreatedTimestamp: Date.now()
          },
        }
      });
  
    } catch (err) {
      errAlert(err);
    }
  };

  return (
    <div id="CpotbPage" className='Layout-Menu layout-page'>
      <div className="title-menu">
        <h1>Penambahan Stok Obat Tradisional</h1>
      </div>
      
      <div className='container-form'>
        <form onSubmit={getData}>

          <ul>
            <li className="label">
              <label htmlFor="instanceName">Di produksi oleh</label>
            </li>
            <li className="input">
              <p>{userdata.instanceName} </p>
            </li>
          </ul>

          <ul>
            <li className="label">
              <label htmlFor="batchName">Nama Batch Obat</label>
            </li>
            <li className="input">
              <input type="text" name="batchName" value={batchName} readOnly />
            </li>
          </ul>

          <ul>
            <li className="label">
              <label htmlFor="namaProduk">Nama Obat</label>
            </li>
            <li className="input">
              <div className="input-group">
                <select
                  name="namaProduk"
                  id="namaProduk"
                  value={namaProduk}
                  onChange= {(e) => setNamaProduk(e.target.value)}
                  required
                >
                  <option value="" disabled>Pilih Obat</option>
                  {dataObatAvail.map((item) => (
                    <option key={item.namaProduk} value={item.namaProduk}>
                      {item.namaProduk}
                    </option>
                  ))}
                </select>
              </div>
            </li>
          </ul>

          <ul>
            <li className="label">
              <label htmlFor="quantity">Total Stok</label>
            </li>
            <li className="input">
              <div className="input-group">
                <select
                  name="quantity"
                  id="quantity"
                  value={quantityObat}
                  onChange= {(e) => setQuantityObat(e.target.value)}
                  required
                >
                  <option value="" disabled>Pilih Jumlah Stok Obat</option>
                  <option value="1">1 Obat</option>
                  <option value="5">5 Obat</option>
                  <option value="50">50 Obat</option>
                  <option value="100">100 Obat</option>
                  <option value="200">200 Obat</option>
                </select>
              </div>
            </li>
          </ul>

          <button type='submit'>
          {
            loader? (
              <img src={imgLoader} alt="" />
            ) : (
              "Tambah Stok Obat"
            )
          }
          </button>
        </form>

      </div>
    </div>
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

export default AddQuantityObat;

