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
import { Result } from 'ethers';

const MySwal = withReactContent(Swal);

const client = create({ url: 'http://127.0.0.1:5001/api/v0' });


function ObatOrderPagePabrik() {
  const [contract, setContract] = useState();
  const navigate = useNavigate();

  const userData = JSON.parse(sessionStorage.getItem('userdata'));
  const [dataOrder, setDataOrder] = useState([]);
  const [dataObat, setDataObat] = useState([]);
  const [ipfsHashes, setIpfsHashes] = useState([])

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
    document.title = "Order Obat Tradisional"; 
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

        const statusOrderMap = {
          0: "Order Placed",
          1: "Order Shipped",
          2: "Order Delivered"
        };

        try {

          const listOrderedObatCt = await contract.getListAllOrderedObatFromTarget(userData.instanceName);
          const listProducedObatCt = await contract.getListAllProducedObatByFactory(userData.instanceName);
          
          const [orderIdArray, namaProdukArray, statusOrderArray, orderQuantityArray, obatIdProdukArray, batchNameArr] = listOrderedObatCt;
          const [obatIdArray, namaProdukArr, obatQuantityArray, batchNameArray] = listProducedObatCt;

          // use map on obatIdArray, which iterates through each obatId
          const reconstructedDataorder = orderIdArray.map((orderId, index) => ({
            namaObat: namaProdukArray[index],
            orderId: orderIdArray[index],
            statusOrder: statusOrderMap[statusOrderArray[index]],
            obatQuantity: orderQuantityArray[index].toString(),
            obatId: obatIdProdukArray[index],
            batchName: batchNameArr[index]
          }));

          const reconstructedDataObat = obatIdArray.map((obatId, index) => ({
            obatId: obatIdArray[index],
            namaProduk: namaProdukArr[index],
            obatQuantity: obatQuantityArray[index],
            batchName: batchNameArray[index]
          }))

          setDataOrder(reconstructedDataorder)
          setDataObat(reconstructedDataObat)
          console.log(reconstructedDataorder);
          console.log(reconstructedDataObat);

        } catch (error) {
          console.error("Error loading data: ", error);
        }
      }
    };
  
    loadData();
  }, [contract, userData.instanceName]);

  useEffect(() => {
    if (contract) {

      contract.on("evt_updateOrder", (_namaProduk, _batchName, _targetInstanceName, _senderInstanceName, _orderQuantity, _latestTimestamp) => {

        const timestamp = new Date(Number(_latestTimestamp) * 1000).toLocaleDateString('id-ID', options)

        MySwal.fire({
          title:  `Success Accept Order Obat ${_namaProduk}`,
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
                  <p>Di produksi oleh</p> 
                </li>
                <li className="input">
                  <p>{_targetInstanceName}</p> 
                </li>
              </ul>
              <ul>
                <li className="label">
                  <p>Di order oleh</p> 
                </li>
                <li className="input">
                  <p>{_senderInstanceName}</p> 
                </li>
              </ul>
              <ul>
                <li className="label">
                  <p>Total order</p> 
                </li>
                <li className="input">
                  <p>{_orderQuantity.toString()} Obat</p> 
                </li>
              </ul>
              <ul>
                <li className="label">
                  <p>Tanggal pengiriman</p> 
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
      })
  
      return () => {
        contract.removeAllListeners("evt_updateOrder");
      };
    }
  }, [contract]);
  

  const getDetailObat = async (id, orderId) => {
    console.log(id, orderId);

    try {
      let ObatQuantityReady, obatIpfsHashReady, selectedBatchName;
      const listObatCt = await contract.getListObatById(id);
      const detailObatCt = await contract.getDetailOrderedObat(orderId)

      const [obatDetails, factoryAddress, factoryInstanceName, factoryUserName, bpomAddress, bpomInstanceName, bpomUserName] = listObatCt;

      const [orderQuantity, senderInstanceName, statusOrder, targetInstanceName, orderObatIpfsHash] = detailObatCt;

      console.log(statusOrder);

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
        bpomInstanceNames:  bpomInstanceName ?  bpomInstanceName : "-"
      };

      if(statusOrder === 0n){
        MySwal.fire({
          title: `Detail Order Obat ${detailObat.namaObat}`,
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
                            <p>Di Order oleh</p>
                          </li>
                          <li className="input">
                            <p>{senderInstanceName}</p>
                          </li>
                        </ul>
  
                        <ul>
                          <li className="label-sm">
                            <p>Total Order</p>
                          </li>
                          <li className="input">
                            <p>{orderQuantity.toString()} Obat</p>
                          
                          </li>
                        </ul>
                        
                      </div>
                    </div>
  
                  </div>
                  <DataIpfsHash ipfsHashes={orderObatIpfsHash} />
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
          confirmButtonText: 'Accept Order',
          didOpen: async () => {
            const dataObatSelected = dataObat.filter(item => item.namaProduk === detailObat.namaObat)
  
            if (dataObatSelected.length > 0) {
              selectedBatchName = dataObatSelected[0].batchName;
              const detailProducedObat = await contract.getDetailProducedObat(selectedBatchName)
    
              console.log(detailProducedObat);
    
              ObatQuantityReady = detailProducedObat[0];
              obatIpfsHashReady = detailProducedObat[1];
               
              console.log(obatIpfsHashReady, ObatQuantityReady);
              console.log(selectedBatchName);
            }
  
  
          }
        }).then((result) => {
  
          if(result.isConfirmed){
           
            MySwal.fire({
              title: `Order Obat ${detailObat.namaObat}`,
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
                          <p>{targetInstanceName}</p> 
                        </li>
                      </ul>
        
                      <ul>
                        <li className="label">
                          <p>Nama PBF</p> 
                        </li>
                        <li className="input">
                          <p>{senderInstanceName}</p> 
                        </li>
                      </ul>
        
                      <ul>
                        <li className="label">
                          <p>Total Stok Order</p> 
                        </li>
                        <li className="input">
                          <p>{ObatQuantityReady.toString()} Obat</p>
                        </li>
                      </ul>
        
                      <ul>
                        {/* <li className="label">
                          <button id='addQuantity'  className='addQuantity' >
                            <i className="fa-solid fa-arrows-rotate"></i>
                            Generate Data Obat
                            </button>
                        </li> */}
                        <li className="input full-width-table">
                          <DataIpfsHash ipfsHashes={obatIpfsHashReady} />
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
                  acceptOrder(selectedBatchName, orderId)
                }
            })
          }
        })
      } else {
        MySwal.fire({
          title: `Detail Order Obat ${detailObat.namaObat}`,
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
                            <p>Di Order oleh</p>
                          </li>
                          <li className="input">
                            <p>{senderInstanceName}</p>
                          </li>
                        </ul>
  
                        <ul>
                          <li className="label-sm">
                            <p>Total Order</p>
                          </li>
                          <li className="input">
                            <p>{orderQuantity.toString()} Obat</p>
                          
                          </li>
                        </ul>
                        
                      </div>
                    </div>
  
                  </div>
                  <DataIpfsHash ipfsHashes={orderObatIpfsHash} />
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
          showCancelButton: false,
          showCloseButton: true,
          showConfirmButton: false
        })

      }
      
    } catch (e) {
      errAlert(e, "Can't retrieve data")
    }
  }

  const acceptOrder = async (batchName, orderId) => {

    MySwal.fire({
      title:"Processing your request...",
      text:"Your request is on its way. This won't take long. 🚀",
      icon: 'info',
      showCancelButton: false,
      showConfirmButton: false,
      allowOutsideClick: false,
    })

    const acceptOrderCt = await contract.acceptOrder(batchName, orderId)

    console.log(acceptOrderCt);
  }

  // const addStok = async(quantity, data) => {

  //   MySwal.fire({
  //     title:"Processing your request...",
  //     text:"Your request is on its way. This won't take long. 🚀",
  //     icon: 'info',
  //     showCancelButton: false,
  //     showConfirmButton: false,
  //     allowOutsideClick: false,
  //   })

  //   const ipfsHashes = [];
  //   const randomFourDigit = Math.floor(1000 + Math.random() * 9000); 
  //   const randomTwoLetters = String.fromCharCode(
  //     65 + Math.floor(Math.random() * 26),
  //     65 + Math.floor(Math.random() * 26)
  //   );
  //   const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  //   const randomCode = Math.random().toString(36).substring(2, 6).toUpperCase()

  //   for (let i = 0; i < quantity; i++) {
  //     const obat = {
  //       batchName: `BN-${date}-${randomCode}-${quantity}`,
  //       obatIdProduk: data.obatId,
  //       obatIdPackage: `OT-${i * 23}${randomFourDigit}${randomTwoLetters}`,
  //       namaProduk: data.namaObat,
  //       obatQuantity: quantity,
  //       merk: data.merk,
  //       klaim: data.klaim,
  //       kemasan: data.kemasan,
  //       komposisi: data.komposisi,
  //       factoryAddr: data.factoryAddr,
  //       factoryInstanceName: data.factoryInstanceName,
  //       tipeProduk: data.tipeProduk,
  //       nieNumber: data.nieNumber,
  //       pbfAddr:"",
  //       pbfInstanceName: "",
  //       retailerAddr: "",
  //       retailerInstanceName: "",
  //       timestampOrderPbf: "",
  //       timestampCompletePbf: "",
  //       timestampOrderRetailer: "",
  //       timestampCompleteRetailer: ""
  //     };
      
  //     try {
  //       const result = await client.add(JSON.stringify(obat)); 
  //       ipfsHashes.push(result.path); 
  //     } catch (error) {
  //       errAlert(error, "Can't upload Data Obat to IPFS."); 
  //       break;
  //     }
  //   }

  //   console.log("Generated IPFS Hashes:", ipfsHashes);
    
  //   MySwal.fire({
  //     title: "Tambah Stok Obat",
  //     html: (
  //       <div className='form-swal'>
  //         <div className="row row--obat">
  //           <div className="col">

  //             <ul>
  //               <li className="label">
  //                 <p>Nama Produk</p>
  //               </li>
  //               <li className="input">
  //                 <p>{data.namaObat}</p> 
  //               </li>
  //             </ul>

  //             <ul>
  //               <li className="label">
  //                 <p>Nama Pabrik</p> 
  //               </li>
  //               <li className="input">
  //                 <p>{data.factoryInstanceName}</p> 
  //               </li>
  //             </ul>

  //             <ul>
  //               <li className="label">
  //                 <p>Batch Number</p> 
  //               </li>
  //               <li className="input">
  //                 <p>BN-${date}-${randomCode}</p> 
  //               </li>
  //             </ul>

  //             <ul>
  //               <li className="label">
  //                 <p>Jumlah Stok</p> 
  //               </li>
  //               <li className="input">
  //                 <p>{quantity} Obat</p>
  //               </li>
  //             </ul>

  //             <ul>
  //               <li className="input" style={{ width: '100%' }}>
  //                 <DataIpfsHash ipfsHashes={ipfsHashes} />
  //               </li>
  //             </ul>
  //           </div>
  //         </div>
        
  //       </div>
  //     ),
  //     width: '820',
  //     showCancelButton: true,
  //     confirmButtonText: 'Request',
  //     allowOutsideClick: false
  //   }).then((result) => {
  //     if(result.isConfirmed){
  //       addQuantityObat(data.namaObat,`BN-${date}-${randomCode}-${quantity}`, data.obatId, quantity, data.factoryInstanceName, ipfsHashes)
  //     }
  //   })

  //   return ipfsHashes;

  // }

  // const addQuantityObat = async(namaObat, batchName, obatId, quantity, factoryInstanceName, ipfsHash) => {

    // MySwal.fire({
      // title:"Processing your request...",
    //   text:"Your request is on its way. This won't take long. 🚀",
    //   icon: 'info',
    //   showCancelButton: false,
    //   showConfirmButton: false,
    //   allowOutsideClick: false,
    // })

    // try {
    //   console.log(namaObat, obatId, quantity, factoryInstanceName, ipfsHash);
    //   const tx = await contract.addQuantityObat(namaObat, batchName, obatId, quantity, factoryInstanceName, ipfsHash);
    //   tx.wait()
      
    // } catch (error) {
    //   errAlert(error, "Can't upload data.")
    // }
  // }

  return (
    <>
      <div id="ObatProduce" className='Layout-Menu layout-page'>
        <div className="title-menu">
          <h1>Data Order Obat Tradisional</h1>
          <p>Di kelola oleh {userData.instanceName}</p>
        </div>
        <div className="tab-menu">
          <ul>
            <li><button onClick={() => navigate('/obat')}>Pengajuan NIE</button></li>
            <li><button onClick={() => navigate('/obat-produce')}>Produksi Obat</button></li>
            <li><button className='active' onClick={() => navigate('/order-obat-pabrik')}>Order Obat</button></li>
          </ul>
        </div>
        <div className="container-data ">
          <div className="data-list">
            {dataOrder.length > 0 ? (
              <ul>
                {dataOrder.map((item, index) => (
                  <li key={index}>
                    <button className='title' onClick={() => getDetailObat(item.obatId, item.orderId)} >{item.namaObat}</button>
                    <p></p>
                    <p>
                      {item.statusOrder !== 'Order Placed' ? `Total order: ${item.obatQuantity} Obat [${item.batchName}]` : `Total order: ${item.obatQuantity} Obat`}
                    </p>
                    <button className={`statusOrder ${item.statusOrder}`}>
                      {item.statusOrder}
                    </button>
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

export default ObatOrderPagePabrik;