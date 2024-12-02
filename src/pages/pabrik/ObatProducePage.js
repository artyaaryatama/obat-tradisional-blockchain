import { useEffect, useState } from 'react';
import { BrowserProvider, Contract } from "ethers";
import contractData from '../../auto-artifacts/deployments.json';
import { useNavigate } from 'react-router-dom';
import { create } from 'ipfs-http-client';

import DataIpfsHash from '../../components/TableHash';

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
  const [namaObatArray, setNamaObatArray] = useState([""])
  const [namaObatSelected, setNamaObatSelected] = useState("");
  const [newStok, setNewStok] = useState(null)
  

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

          const listProducedObatCt = await contract.getListAllProducedObatByFactory(userData.instanceName);
          const [obatIdArray, namaProdukArray, obatQuantityArray, batchNameArray] = listProducedObatCt;

          console.log(listProducedObatCt);

          // use map on obatIdArray, which iterates through each obatId
          const reconstructedData = obatIdArray.map((obatId, index) => ({
            namaObat: namaProdukArray[index],
            idObat: obatIdArray[index],
            obatQuantity: obatQuantityArray[index].toString(),
            batchName: batchNameArray[index]
          }));

          
          setNamaObatArray(namaProdukArray)
          setDataObat(reconstructedData)

        } catch (error) {
          console.error("Error loading data: ", error);
        }
      }
    };
  
    loadData();
  }, [contract, userData.instanceName]);

  useEffect(() => {
    if (contract) {

      contract.on("evt_obatProduced", (_namaProduk, _obatQuantity, _batchName) => {
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
                  <p>Batch Name</p> 
                </li>
                <li className="input">
                  <p>{_batchName}</p> 
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
        contract.removeAllListeners("evt_obatProduced");
      };
    }
  }, [contract]);

  const getDetailObat = async (id, batchName) => {

    try {
      const tx = await contract.getListObatById(id);
      const tx1 = await contract.getDetailProducedObat(batchName)

      const [obatDetails, factoryAddress, factoryInstanceName, factoryUserName, bpomAddress, bpomInstanceName, bpomUserName] = tx;

      const [obatQuantity, obatIpfsHash] = tx1;
      console.log(tx1);

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
                          <p>Batch</p>
                        </li>
                        <li className="input">
                          <p>{batchName}</p>
                        </li>
                      </ul>
                      

                      <ul>
                        <li className="label-sm">
                          <p>Stok Tersedia</p>
                        </li>
                        <li className="input">
                          <p>{obatQuantity.toString()} Obat</p>
                        </li>
                      </ul>
                    </div>
                      
                  </div>

                </div>
                <DataIpfsHash ipfsHashes={obatIpfsHash} />
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
                        <DataIpfsHash ipfsHashes={[]} />
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

  const addStok = async(quantity, data) => {

    MySwal.fire({
      title:"Processing your request...",
      text:"Your request is on its way. This won't take long. 🚀",
      icon: 'info',
      showCancelButton: false,
      showConfirmButton: false,
      allowOutsideClick: false,
    })

    let ipfsHashes = [];
    const randomFourDigit = Math.floor(1000 + Math.random() * 9000); 
    const randomTwoLetters = String.fromCharCode(
      65 + Math.floor(Math.random() * 26),
      65 + Math.floor(Math.random() * 26)
    );
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const randomCode = Math.random().toString(36).substring(2, 6).toUpperCase()

    const batchNameGenerated = 'BN-' + date + '-' + randomCode;

    for (let i = 0; i < quantity; i++) {
      const obat = {
        batchName: batchNameGenerated,
        obatIdProduk: data.obatId,
        obatIdPackage: `OT-${i * 23}${randomFourDigit}${randomTwoLetters}`,
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
        console.log(`Uploading batch ${i + 1} of ${quantity}`);

        const result = await client.add(JSON.stringify(obat), {
          progress: (prog) => 
            console.log(`Uploading... ${prog} bytes uploaded`),
        });

        ipfsHashes.push(result.path); 
      } catch (error) {
        errAlert(error, "Can't upload Data Obat to IPFS."); 
        break;
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
                  <p>Batch Number</p> 
                </li>
                <li className="input">
                  <p>{batchNameGenerated}</p> 
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
                <li className="input" style={{ width: '100%' }}>
                  <DataIpfsHash ipfsHashes={ipfsHashes} />
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
        addQuantityObat(data.namaObat, batchNameGenerated, data.obatId, quantity, data.factoryInstanceName, ipfsHashes)
      }
    })

    return ipfsHashes;

  }

  const addQuantityObat = async(namaObat, batchName, obatId, quantity, factoryInstanceName, ipfsHash) => {

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
      const tx = await contract.addQuantityObat(namaObat, batchName, obatId, quantity, factoryInstanceName, ipfsHash);
      tx.wait()
      
    } catch (error) {
      errAlert(error, "Can't upload data.")
    }
  }

  // const produceObat = async() => {

  //   console.log(dataObat);

  //   MySwal.fire({
  //     title: "Tambah Stok Obat",
  //     html: (
  //       <div className='form-swal'>
  //         <div className="row row--obat">
  //           <div className="col">

  //             <ul>
  //               <li className="label">
  //                 <p>Nama Obat</p>
  //               </li>

  //               <li className="input select">
  //                 <select
  //                   name="namaObat"
  //                   id="namaObat"
  //                   value={namaObatSelected}
  //                   onChange={(e) => setNamaObatSelected(e.target.value)}
  //                   required
  //                 >
  //                   <option value="" disabled>Pilih Nama Obat</option>
  //                   {dataObat.map((obat) => (
  //                     <option key={obat.idObat} value={obat.idObat}>
  //                       {obat.namaObat}
  //                     </option>
  //                   ))}
  //                 </select>
  //               </li>
  //             </ul>

  //             <ul>
  //               <li className="label">
  //                 <p>Jumlah Stok</p> 
  //               </li>
  //               <li className="input select">
  //               <select
  //                   name="stokObat"
  //                   id="stokObat"
  //                   value={newStok}
  //                   onChange={(e) => setNewStok(parseInt(e.target.value))}
  //                   required
  //                 >
  //                 <option value="50">50 Obat</option>
  //                 <option value="100">100 Obat</option>
  //                 <option value="200">200 Obat</option>
  //                 <option value="500">500 Obat</option>
  //                 <option value="1000">1000 Obat</option>
  //               </select>
  //               </li>
  //             </ul>

  //             <ul>
  //               <li className="label">
  //                 <button id='addQuantity'  className='addQuantity' >
  //                   <i className="fa-solid fa-arrows-rotate"></i>
  //                   Generate Data Obat
  //                   </button>
  //               </li>
  //               <li className="input">
  //                 <DataIpfsHash ipfsHashes={[]} />
  //               </li>
  //             </ul>
  //           </div>
  //         </div>
        
  //       </div>
  //     ),
  //     width: '820',
  //     showCancelButton: true,
  //     confirmButtonText: 'Request',
  //     allowOutsideClick: true, 
  //     didOpen: async () => {
  //       const generateIpfsHash = document.getElementById('addQuantity');

  //       const handleGenerate = async () => {
  //         const quantity = parseInt(newStok, 10);
  //         if (quantity <= 0) {
  //           MySwal.showValidationMessage('Jumlah stok harus lebih dari 0');
  //           return;
  //         }

  //         console.log(namaObatSelected); // Check the selected value
  //         try {
  //           // const tx = await contract.getListObatByNameProduct(namaObatSelected);

  //           // const [obatDetails] = tx;

  //           // const detailObat = {
  //           //   obatId: obatDetails.obatId,
  //           //   merk: obatDetails.merk,
  //           //   namaObat: obatDetails.namaProduk,
  //           //   // Add more details as needed
  //           // };

  //           // addStok(quantity, detailObat);
  //         } catch (error) {
  //           errAlert(error, `No data found for ${namaObatSelected}.`);
  //         }
  //       };

  //       // generateIpfsHash.addEventListener('click', handleGenerate);

  //       // return () => {
  //       //   generateIpfsHash.removeEventListener('click', handleGenerate);
  //       // };
  //     },
  //   })

  // }

  return (
    <>
      <div id="ObatProduce" className='Layout-Menu layout-page'>
        <div className="title-menu">
          <h1>Data Produksi Obat Tradisional</h1>
          <p>Di produksi oleh {userData.instanceName}</p>
        </div>
        <div className="tab-menu">
          <ul>
            <li><button onClick={() => navigate('/obat')}>Pengajuan NIE</button></li>
            <li><button className='active' onClick={() => navigate('/obat-produce')}>Produksi Obat</button></li>
            <li><button onClick={() => navigate('/order-obat-pabrik')}>Order Obat</button></li>
          </ul>
        </div>
        <div className="container-data ">
          {/* <div className="menu-data">
            <div className="btn">
              <button className='btn-menu' onClick={produceObat}>
                <i className="fa-solid fa-plus"></i>
                Add new data
              </button>
            </div>
          </div> */}
          <div className="data-list">
            {dataObat.length > 0 ? (
              <ul>
                {dataObat.map((item, index) => (
                  <li key={index}>
                    <button className='title' onClick={() => getDetailObat(item.idObat, item.batchName)} > [{item.batchName}] {item.namaObat}</button>
                    <p>Batch: {item.batchName}</p>
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