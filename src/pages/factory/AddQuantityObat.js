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
  const [contract, setContract] = useState();
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
  }, []);

  useEffect(() => {

    const loadObatDataAvailable = async () => {
      if(contract) {
        try {
          console.log(userdata);
          const listObat = await contract.getListAllApprovedObatNie(userdata.instanceName);
          console.log(listObat);

          const formattedOutput = listObat[0].map((idobat, index) => ({
            idobat: idobat,  
            namaProduk: listObat[1][index]  
          }));

          setDataObatAvail(formattedOutput)
          console.log(formattedOutput);

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

  useEffect(() => {
    if (contract) {
      
      contract.on("evt_addObatQuantity", (_namaProduk, _quantity, _batchName) => {

        MySwal.fire({
          title: "Success Add Quantity",
          html: (
            <div className='form-swal'>
              <ul>
                <li className="label">
                  <p>Nama Produk Obat</p> 
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
                  <p>Total Quantity</p> 
                </li>
                <li className="input">
                  <p>{_quantity.toString()} Obat</p> 
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
            navigate('/obat-available-factory');
          }
        });

        setLoader(false)
      });
  
      return () => {;
        contract.removeAllListeners("evt_addObatQuantity");
      };
    }
  }, [contract]);

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

    const listObatCt = await contract.getListObatById(selectedObat[0].idobat);

    const [obatDetails, factoryAddress, factoryInstanceName, factoryUserName, bpomAddress, bpomInstanceName, bpomUserName] = listObatCt;

    const detailObat = {
      obatId: obatDetails.obatId,
      merk: obatDetails.merk,
      namaObat: obatDetails.namaProduk,
      klaim: obatDetails.klaim,
      kemasan: obatDetails.kemasan,
      komposisi: obatDetails.komposisi,
      factoryAddr: factoryAddress,
      factoryInstanceName: factoryInstanceName,
      factoryUserName: factoryUserName,
      tipeProduk: tipeProdukMap[obatDetails.tipeProduk], 
      nieRequestDate: obatDetails.nieRequestDate ? new Date(Number(obatDetails.nieRequestDate) * 1000).toLocaleDateString('id-ID', options) : '-', 
      nieApprovalDate: Number(obatDetails.nieApprovalDate) > 0 ? new Date(Number(obatDetails.nieApprovalDate) * 1000).toLocaleDateString('id-ID', options): "-",
      nieNumber: obatDetails.nieNumber ? obatDetails.nieNumber : "-",
      bpomAddr: bpomAddress === "0x0000000000000000000000000000000000000000" ? "-" : bpomAddress,
      bpomUserName:  bpomUserName ? bpomUserName : "-",
      bpomInstanceName:  bpomInstanceName ?  bpomInstanceName : "-"
    };

    generateIpfsHash(detailObat, parseInt(quantityObat), batchName)
  };

  const generateIpfsHash = async(dataObat, quantityObat, batchNameObat) => {
    let newIpfsHashes = [];
    const randomFourDigit = Math.floor(1000 + Math.random() * 9000); 
    const randomTwoLetters = String.fromCharCode(
      65 + Math.floor(Math.random() * 26),
      65 + Math.floor(Math.random() * 26)
    );

    for (let i = 0; i < quantityObat; i++) {
      const obat = {
        batchName: batchNameObat,
        obatIdPackage: `OT-${i * 23}${randomFourDigit}${randomTwoLetters}`,
        dataObat:  {
          obatIdProduk: dataObat.obatId,
          namaProduk: dataObat.namaObat,
          merk: dataObat.merk,
          klaim: dataObat.klaim,
          kemasan: dataObat.kemasan,
          komposisi: dataObat.komposisi,
          factoryAddr: dataObat.factoryAddr,
          factoryInstanceName: dataObat.factoryInstanceName,
          factoryUserName: dataObat.factoryUserName,
          tipeProduk: dataObat.tipeProduk,
          nieNumber: dataObat.nieNumber,
          nieRequestDate: dataObat.nieRequestDate,
          nieApprovalDate: dataObat.nieApprovalDate,
          bpomAddr: dataObat.bpomAddr,
          bpomInstanceName: dataObat.bpomInstanceName,
          bpomUserName: dataObat.bpomUserName
        }
      };
      
      try {
        console.log(obat);
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
        title: `Data Obat ${dataObat.namaObat}`,
        html: (
          <div className='form-swal'>
            <div className="row row--obat">
              <div className="col">
  
                <ul>
                  <li className="label label-1">
                    <p>Nama Produk</p>
                  </li>
                  <li className="input input-1">
                    <p>{dataObat.namaObat}</p> 
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
        confirmButtonText: 'Send Obat',
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

    console.log(dataObat, batchNameObat, quantityObat, newIpfsHashes);
    
    try {
      const addObatQuantityCt = await contract.addObatQuantity(dataObat.obatId, batchNameObat, dataObat.factoryInstanceName, quantityObat, newIpfsHashes);
      console.log('Receipt:', addObatQuantityCt);
  
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
                  <option value="5">5 Obat</option>
                  <option value="50">50 Obat</option>
                  <option value="100">100 Obat</option>
                  <option value="150">150 Obat</option>
                  <option value="200">200 Obat</option>
                  <option value="1000">1000 Obat</option>
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

