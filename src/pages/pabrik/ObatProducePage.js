import { useEffect, useState } from 'react';
import { BrowserProvider, Contract } from "ethers";
import contractData from '../../auto-artifacts/deployments.json';
import { useNavigate } from 'react-router-dom';
import { create } from 'ipfs-http-client';

import DataTable from '../../components/TableData';

import "../../styles/MainLayout.scss"
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import './../../styles/SweetAlert.scss';

const MySwal = withReactContent(Swal);

const client = create({ url: 'http://127.0.0.1:5001/api/v0' });


function ObatProduce() {
  const [contract, setContract] = useState();
  const navigate = useNavigate();

  const userData = JSON.parse(sessionStorage.getItem('userdata'));
  const [dataObat, setDataObat] = useState([]);
  const [ipfsHashes, setIpfsHashes] = useState([])
  

  const obatStatusMap = {
    0: "In Local Production",
    1: "Requested NIE",
    2: "Approved NIE"
  };

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
    second: '2-digit',
  }

  useEffect(() => {
    document.title = "Produksi Obat Tradisional"; 
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
          console.error("User access denied!")
          errAlert(err, "User access denied!")
        }
      } else {
        console.error("MetaMask is not installed");
      }
    }
    connectWallet();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      if (contract && userData.instanceName) {
        try {

          const tx = await contract.getListAllProducedObatByFactory(userData.instanceName);
          const [obatIdArray, namaProdukArray, obatQuantityArray] = tx;

          // You then use map on obatIdArray, which iterates through each obatId
          const reconstructedData = obatIdArray.map((obatId, index) => ({
            namaObat: namaProdukArray[index],
            idObat: obatIdArray[index],
            obatQuantity: obatQuantityArray[index].toString(),
          }));

          setDataObat(reconstructedData)
          console.log(reconstructedData);

        } catch (error) {
          console.error("Error loading data: ", error);
        }
      }
    };
  
    loadData();
  }, [contract, userData.instanceName]);

  useEffect(() => {
    if (contract) {
      
      contract.on("evt_nieRequested", ( _obatId, _timestampRequestNie,_namaProduk) => {

        const timestamp = new Date(Number(_timestampRequestNie) * 1000).toLocaleDateString('id-ID', options)
    
        MySwal.fire({
          title: "Success Add New Stock",
          html: (
            <div className='form-swal'>
              <ul>
                <li className="label">
                  <p>Nama Obat</p> 
                </li>
                <li className="input">
                  <p>{_namaProduk}</p> 
                </li>
              </ul>
              <ul>
                <li className="label">
                  <p>Timestamp Request</p> 
                </li>
                <li className="input">
                  <p>{timestamp}</p> 
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
            window.location.reload()
          }
        });

      });

      contract.on("evt_obatProduced", (_namaProduk, _obatQuantity, _obatId) => {
        const quantity = _obatQuantity.toString()
        MySwal.fire({
          title: "Success Add New Stock",
          html: (
            <div className='form-swal'>
              <ul>
                <li className="label">
                  <p>Nama Obat</p> 
                </li>
                <li className="input">
                  <p>{_namaProduk}</p> 
                </li>
              </ul>
              <ul>
                <li className="label">
                  <p>Total Stok Baru</p> 
                </li>
                <li className="input">
                  <p>{quantity} Obat</p> 
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
            window.location.reload()
          }
        });
      })
  
      return () => {
        contract.removeAllListeners("evt_nieRequested");
        contract.removeAllListeners("evt_obatProduced");
      };
    }
  }, [contract]);
  

  const getDetailObat = async (id) => {

    try {
      const tx = await contract.getListObatById(id);
      const tx1 = await contract.getDetailProducedObatById(id)

      const [obatDetails, factoryAddress, factoryInstanceName, factoryUserName, bpomAddress, bpomInstanceName, bpomUserName] = tx;

      const [obatQuantity, obatIpfsHash] = tx1;

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
        obatStatus: obatStatusMap[obatDetails.obatStatus], 
        nieRequestDate: obatDetails.nieRequestDate ? new Date(Number(obatDetails.nieRequestDate) * 1000).toLocaleDateString('id-ID', options) : '-', 
        nieApprovalDate: Number(obatDetails.nieApprovalDate) > 0 ? new Date(Number(obatDetails.nieApprovalDate) * 1000).toLocaleDateString('id-ID', options): "-",
        nieNumber: obatDetails.nieNumber ? obatDetails.nieNumber : "-",
        bpomAddr: bpomAddress === "0x0000000000000000000000000000000000000000" ? "-" : bpomAddress,
        bpomUserName:  bpomUserName ? bpomUserName : "-",
        bpomInstanceNames:  bpomInstanceName ?  bpomInstanceName : "-"
      };

      MySwal.fire({
        title: `Produksi Obat ${detailObat.namaObat}`,
        html: (
          <div className='form-swal'>
            <div className="row1">
              <div className="produce-obat">
                <div className="detailObat">
                  <div className="row row--obat">
                    <div className="col">
                      <ul>
                        <li className="label-sm">
                          <p>Nama Obat</p>
                        </li>
                        <li className="input">
                          <p>{detailObat.namaObat}</p> 
                        </li>
                      </ul>

                      <ul>
                        <li className="label-sm">
                          <p>Nomor NIE</p>
                        </li>
                        <li className="input">
                          <p>{detailObat.nieNumber}</p> 
                        </li>
                      </ul>
                    
                      <ul>
                        <li className="label-sm">
                          <p>Di Produksi oleh</p>
                        </li>
                        <li className="input">
                          <p>{detailObat.factoryInstanceName}</p>
                        </li>
                      </ul>

                      <ul>
                        <li className="label-sm">
                          <p>Stok Tersedia</p>
                        </li>
                        <li className="input">
                          <p>{obatQuantity} Obat</p>
                        
                        </li>
                      </ul>
                      
                    </div>
                  </div>

                </div>
                <DataTable ipfsHashes={obatIpfsHash} />
              </div>
              <div className="row row--obat">
                <div className="col column">

                    <ul>
                      <li className="label">
                        <p>Tipe Produk</p>
                      </li>
                      <li className="input">
                        <p>{detailObat.tipeProduk}</p> 
                      </li>
                    </ul>

                    <ul>
                      <li className="label">
                        <p>Kemasan Obat</p>
                      </li>
                      <li className="input">
                        <p>{detailObat.kemasan}</p> 
                      </li>
                    </ul>

                    <ul>
                      <li className="label">
                        <p>Klaim Obat</p>
                      </li>
                      <li className="input">
                        <ul className='numbered'>
                          {detailObat.klaim.map((item, index) => (
                            <li key={index}><p>{item}</p></li>
                          ))}
                        </ul>
                      </li>
                    </ul>

                    <ul>
                      <li className="label">
                        <p>Komposisi Obat</p>
                      </li>
                      <li className="input">
                        <ul className='numbered'>
                          {detailObat.komposisi.map((item, index) => (
                            <li key={index}><p>{item}</p></li>
                          ))}
                        </ul>
                      </li>
                    </ul>

                </div>
              </div>

            </div>
          
          </div>
        ),
        width: '1220',
        showCancelButton: true,
        confirmButtonText: 'Tambah Stok Obat',
      }).then((result) => {

        if(result.isConfirmed){
         
          MySwal.fire({
            title: "Tambah Stok Obat",
            html: (
              <div className='form-swal'>
                <div className="row row--obat">
                  <div className="col">
      
                    <ul>
                      <li className="label">
                        <p>Nama Produk</p>
                      </li>
                      <li className="input">
                        <p>{detailObat.namaObat}</p> 
                      </li>
                    </ul>
      
                    <ul>
                      <li className="label">
                        <p>Nama Pabrik</p> 
                      </li>
                      <li className="input">
                        <p>{detailObat.factoryInstanceName}</p> 
                      </li>
                    </ul>
      
                    <ul>
                      <li className="label">
                        <p>Jumlah Stok</p> 
                      </li>
                      <li className="input">
                        <input type="number" name="stok" id="stok" />
                      </li>
                    </ul>
      
                    <ul>
                      <li className="label">
                        <button id='addQuantity'  className='addQuantity' >
                          <i className="fa-solid fa-arrows-rotate"></i>
                          Generate Data Obat
                          </button>
                      </li>
                      <li className="input">
                        <DataTable ipfsHashes={[]} />
                      </li>
                    </ul>
                  </div>
                </div>
              
              </div>
            ),
            width: '820',
            showCancelButton: true,
            confirmButtonText: 'Request',
            allowOutsideClick: false,
            didOpen: () => {
              const generateIpfsHash = document.getElementById('addQuantity')
              const stokInput = document.getElementById('stok');
              
              const handleGenerate = async () => {
                const quantity = parseInt(stokInput.value, 10);
                if (quantity <= 0) {
                  MySwal.showValidationMessage('Jumlah stok harus lebih dari 0');
                  return;
                }
                addStok(quantity, detailObat);
              };
            
              generateIpfsHash.addEventListener('click', handleGenerate);
            
              return () => {
                generateIpfsHash.removeEventListener('click', handleGenerate);
              };
            }
          })
        }
      })
      
    } catch (e) {
      errAlert(e, "Can't retrieve data")
    }
  }

  const getNodeInfo = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5001/api/v0/id', {
        method: 'POST', // Use POST as required by IPFS API
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const nodeInfo = await response.json();
      console.log(nodeInfo);
    } catch (error) {
      console.error('Error fetching node info:', error);
    }
  };
  
  // getNodeInfo();
  const addStok = async(quantity, data) => {
    const ipfsHashes = [];
    for (let i = 0; i < quantity; i++) {
      const randomFourDigit = Math.floor(1000 + Math.random() * 9000); 
      const randomTwoLetters = String.fromCharCode(
        65 + Math.floor(Math.random() * 26),
        65 + Math.floor(Math.random() * 26)
      );
      const obat = {
        obatIdProduk: data.obatId,
        obatIdPackage: `ot-${i * 23}${randomFourDigit}${randomTwoLetters}`,
        namaProduk: data.namaObat,
        obatQuantity: quantity,
        merk: data.merk,
        klaim: data.klaim,
        kemasan: data.kemasan,
        komposisi: data.komposisi,
        factoryAddr: data.factoryAddr,
        factoryInstanceName: data.factoryInstanceName,
        tipeProduk: data.tipeProduk,
        nieNumber: data.nieNumber,
        pbfAddr:"",
        pbfInstanceName: "",
        retailerAddr: "",
        retailerInstanceName: "",
        timestampOrderPbf: "",
        timestampCompletePbf: "",
        timestampOrderRetailer: "",
        timestampCompleteRetailer: ""
      };

      try {
        const result = await client.add(JSON.stringify(obat)); // Upload to IPFS
        ipfsHashes.push(result.path); // Add IPFS hash to the array
      } catch (error) {
        console.error(error); // Log errors for debugging
      }
    }
    console.log("Generated IPFS Hashes:", ipfsHashes);
    
    MySwal.fire({
      title: "Tambah Stok Obat",
      html: (
        <div className='form-swal'>
          <div className="row row--obat">
            <div className="col">

              <ul>
                <li className="label">
                  <p>Nama Produk</p>
                </li>
                <li className="input">
                  <p>{data.namaObat}</p> 
                </li>
              </ul>

              <ul>
                <li className="label">
                  <p>Nama Pabrik</p> 
                </li>
                <li className="input">
                  <p>{data.factoryInstanceName}</p> 
                </li>
              </ul>

              <ul>
                <li className="label">
                  <p>Jumlah Stok</p> 
                </li>
                <li className="input">
                  <p>{quantity} Obat</p>
                </li>
              </ul>

              <ul>
                <li className="label">
                  <button id='addQuantity'  className='addQuantity' >
                    <i className="fa-solid fa-arrows-rotate"></i>
                    Generate Data Obat
                    </button>
                </li>
                <li className="input">
                  <DataTable ipfsHashes={ipfsHashes} />
                </li>
              </ul>
            </div>
          </div>
        
        </div>
      ),
      width: '820',
      showCancelButton: true,
      confirmButtonText: 'Request',
      allowOutsideClick: false
    }).then((result) => {
      if(result.isConfirmed){
        produceObat(data.namaObat, data.obatId, quantity, data.factoryInstanceName, ipfsHashes)
      }
    })

    return ipfsHashes;

  }

  const produceObat = async(namaObat, obatId, quantity, factoryInstanceName, ipfsHash) => {

    MySwal.fire({
      title:"Processing your request...",
      text:"Your request is on its way. This won't take long. 🚀",
      icon: 'info',
      showCancelButton: false,
      showConfirmButton: false,
      allowOutsideClick: false,
    })

    try {
      console.log(namaObat, obatId, quantity, factoryInstanceName, ipfsHash);
      const tx = await contract.produceObat(namaObat, obatId, quantity, factoryInstanceName, ipfsHash);
      tx.wait()
      
    } catch (error) {
      errAlert(error, "Can't upload data.")
    }
  }

  return (
    <>
      <div id="ObatProduce" className='Layout-Menu layout-page'>
        <div className="title-menu">
          <h1>Data Produksi Obat Tradisional</h1>
          <p>Di produksi oleh {userData.instanceName}</p>
        </div>
        <div className="tab-menu">
          <ul>
            <li><button className='active' onClick={() => navigate('/obat-produce')}>Produksi Obat</button></li>
            <li><button onClick={() => navigate('/obat')}>Pengajuan NIE</button></li>
          </ul>
        </div>
        <div className="container-data ">
          <div className="data-list">
            {dataObat.length > 0 ? (
              <ul>
                {dataObat.map((item, index) => (
                  <li key={index}>
                    <button className='title' onClick={() => getDetailObat(item.idObat)} >{item.namaObat}</button>
                    <p>Stok tersedia: {item.obatQuantity} Obat</p>
                  </li>
                ))}
              </ul>
            ) : (
              <h2 className='small'>No Records Found</h2>
            )}
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
    confirmButtonText: 'Try Again'
  });

  console.error(customMsg)
  console.error(errorObject);
}

export default ObatProduce;