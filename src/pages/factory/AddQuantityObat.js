import { useEffect, useState } from 'react';
import { BrowserProvider, Contract } from "ethers";
import contractData from '../../auto-artifacts/deployments.json';
import { useNavigate } from 'react-router-dom';
import { create } from 'ipfs-http-client';

import DataIpfsHash from '../../components/TableHash';

import imgLoader from '../../assets/images/loader.svg';
import "../../styles/MainLayout.scss";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import './../../styles/SweetAlert.scss';

const MySwal = withReactContent(Swal);

const client = create({ url: 'http://127.0.0.1:5001/api/v0' });

function AddQuantityObat() {
  const [contract, setContract] = useState(null);
  const navigate = useNavigate();
  const userdata = JSON.parse(sessionStorage.getItem('userdata')) || {};

  const [loader, setLoader] = useState(false);
  const [dataObatAvail, setDataObatAvail] = useState([])
  const [batchName, setBatchName] = useState("")

  const [namaProduk, setNamaProduk] = useState("");
  const [quantityObat, setQuantityObat] = useState("")

  const tipeProdukMap = {
    0: "Obat Tradisional",
    1: "Suplemen Kesehatan"
  };

  const tipeObatMap = {
    0n: "Obat Lain",
    1n: "Cold Chain Product",
    2n: "Narkotika"
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
          const contr = new Contract(
            contractData.ObatTradisional.address, 
            contractData.ObatTradisional.abi, 
            signer
          );


            
          setContract(contr);
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
      if(contract) {
        try {
          const listObatNameCt = await contract.getAllObatNameApprovedNie(userdata.instanceName);

          console.log(listObatNameCt);

          const reconstructedData = listObatNameCt.map((item) => {
            return {
              obatId: item[0],
              namaProduk: item[1]
            }
          })

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
  }, [contract])


  const handleEventAddBatchProduction = (_batchName, _obatQuantity, _namaProduk, _factoryInstance, txHash) => {
      
    MySwal.fire({
        title: `Success Add Batch Production`,
        html: (
          <div className='form-swal'>
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
                <p>Batch Name</p> 
              </li>
              <li className="input">
                <p>{_batchName}</p> 
              </li>
            </ul>
            <ul>
              <li className="label">
                <p>Obat Quantity</p> 
              </li>
              <li className="input">
                <p>{_obatQuantity.toString()} Obat</p> 
              </li>
            </ul>
            <ul>
              <li className="label">
                <p>Factory Instance</p> 
              </li>
              <li className="input">
                <p>{_factoryInstance}</p> 
              </li>
            </ul>
            <ul className="txHash">
            <li className="label">
              <p>Transaction Hash</p>
            </li>
            <li className="input">
              <a
                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noreferrer"
              >
                View Transaction on Etherscan
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
      }).then((result) => {
        if (result.isConfirmed) {
          navigate('/obat-available-factory')
        }
      });
  }

  const getData = async (e) => {
    e.preventDefault();

    MySwal.fire({
      title:"Processing your request...",
      text:"Your request is on its way. This won't take long. 🚀",
      icon: 'info',
      showCancelButton: false,
      showConfirmButton: false,
      allowOutsideClick: false,
    })

    const selectedObat = dataObatAvail.filter(item => item.namaProduk === namaProduk)

    const id = selectedObat[0].obatId;

    const detailObatCt = await contract.detailObat(id);

    const [obatDetails, obatNie] = detailObatCt;

    const [merk, namaProduct, klaim, komposisi, kemasan, tipeProduk, factoryInstance, factoryAddr, tipeObat, cpotbHash] = obatDetails;

    const [nieNumber, nieStatus, timestampProduction, timestampNieRequest, timestampNieApprove, bpomInstance, bpomAddr] = obatNie;
    console.log(cpotbHash);
    
    const detailObat = {
      obatId: id,
      merk: merk,
      namaProduk: namaProduct,
      klaim: klaim,
      kemasan: kemasan,
      komposisi: komposisi,
      tipeProduk: tipeProdukMap[tipeProduk], 
      produtionTimestamp: timestampProduction ? new Date(Number(timestampProduction) * 1000).toLocaleDateString('id-ID', options) : '-', 
      nieRequestDate: timestampNieRequest ? new Date(Number(timestampNieRequest) * 1000).toLocaleDateString('id-ID', options) : '-', 
      nieApprovalDate:  timestampNieApprove ? new Date(Number(timestampNieApprove) * 1000).toLocaleDateString('id-ID', options): "-",
      nieNumber: nieNumber ? nieNumber : "-",
      factoryAddr: factoryAddr,
      factoryInstanceName: factoryInstance,
      bpomAddr: bpomAddr,
      bpomInstanceName:  bpomInstance,
      tipeObat: tipeObatMap[tipeObat]
    };

    console.log(detailObat);
    generateIpfs(detailObat, parseInt(quantityObat), batchName, cpotbHash)
  };

  const generateIpfs = async(dataObat, quantity, batchNameObat, cpotbHash) => {
    console.log(dataObat, quantity, batchNameObat); 
    let newIpfsHashes = [];

    const timestampYear = new Date().getFullYear().toString().slice(-4);
    const randomFourLetters = Array.from({ length: 4 }, () =>
      String.fromCharCode(65 + Math.floor(Math.random() * 26))
    ).join(''); 

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
          tipeProduk: dataObat.tipeProduk,
          nieNumber: dataObat.nieNumber,
          obatStatus: "NIE Approved",
          nieRequestDate: dataObat.nieRequestDate,
          nieApprovalDate: dataObat.nieApprovalDate,
          bpomAddr: dataObat.bpomAddr,
          bpomInstanceName: dataObat.bpomInstanceName,
        }
      };
      
      try {
        const result = await client.add(JSON.stringify(obat), 
          { progress: (bytes) => 
            console.log(`Uploading ${i+1}/${quantityObat}: ${bytes} bytes uploaded`) }
        );

        newIpfsHashes.push(result.path); 
      } catch (error) {
        errAlert(error, "Can't upload Data Obat to IPFS."); 
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
        confirmButtonText: 'Confirm Obat',
        allowOutsideClick: false,
  
      }).then((result) => {
        if(result.isConfirmed){
          addQuantity(dataObat, batchNameObat, quantityObat, newIpfsHashes)
        }
      })
    }
    
  }
  
  const addQuantity = async (dataObat, batchNameObat, quantityObat, newIpfsHashes) => {

    MySwal.fire({
      title:"Processing your request...",
      text:"Your request is on its way. This won't take long. 🚀",
      icon: 'info',
      showCancelButton: false,
      showConfirmButton: false,
      allowOutsideClick: false,
    })

    
    try {
      const quantity = parseInt(quantityObat)
      
      console.log(dataObat.obatId, dataObat.namaProduk, batchNameObat, quantity, newIpfsHashes,  dataObat.factoryInstanceName);

      const addBatchCt = await contract.addBatchProduction(dataObat.obatId, dataObat.namaProduk, batchNameObat, quantity, newIpfsHashes,  dataObat.factoryInstanceName);

      if(addBatchCt){
        MySwal.update({
          title: "Processing your transaction...",
          text: "This may take a moment. Hang tight! ⏳"
        });
      }

      contract.once('evt_addBatchProduction',  (_batchName, _obatQuantity, _namaProduk, _factoryInstance) => {
        handleEventAddBatchProduction(_batchName, _obatQuantity, _namaProduk, _factoryInstance, addBatchCt.hash)
      });
  
    } catch (err) {
      setLoader(false)
      errAlert(err, "Error add quantity obat!");
    }
  }

  return (
    <div id="CpotbPage" className='Layout-Menu layout-page'>
      <div className="title-menu">
        <h1>Add Quantity Obat Tradisional</h1>
      </div>
      
      <div className='container-form'>
        <form onSubmit={getData}>

          <ul>
            <li className="label">
              <label htmlFor="instanceName">Di produksi oleh</label>
            </li>
            <li className="input">
              <input type="text" name="instanceName" value={userdata.instanceName} readOnly />
            </li>
          </ul>

          <ul>
            <li className="label">
              <label htmlFor="batchName">Batch Name Obat</label>
            </li>
            <li className="input">
              <input type="text" name="batchName" value={batchName} readOnly />
            </li>
          </ul>

          <ul>
            <li className="label">
              <label htmlFor="namaProduk">Nama Produk</label>
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
                  <option value="" disabled>Pilih Nama Obat</option>
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
              <label htmlFor="quantity">Total Quantity</label>
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
                  <option value="" disabled>Pilih Quantity Obat</option>
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
              "Add Quantity Obat"
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
    confirmButtonText: 'Try Again'
  });

  console.error(customMsg)
  console.error(errorObject);
}

export default AddQuantityObat;

