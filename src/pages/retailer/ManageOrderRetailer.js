import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserProvider, Contract } from "ethers";
import contractData from '../../auto-artifacts/deployments.json';
import { useNavigate } from 'react-router-dom';
import { create } from 'ipfs-http-client';

import DataIpfsHash from '../../components/TableHash';
import OrderStatusStepper from '../../components/StepperOrder';

import "../../styles/MainLayout.scss"
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import './../../styles/SweetAlert.scss';

const MySwal = withReactContent(Swal);

const client = create({ url: 'http://127.0.0.1:5001/api/v0' });


function ManageOrderRetailer() {
  const [contracts, setContracts] = useState(null);
  const navigate = useNavigate();

  const userData = JSON.parse(sessionStorage.getItem('userdata'));
  const [dataObatOrder, setDataObatOrder] = useState([]);

  const statusOrderMap = {
    0: "Order Placed",
    1: "Order Shipped",
    2: "Order Completed"
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

          const orderManagementContract = new Contract(
            contractData.OrderManagement.address,
            contractData.OrderManagement.abi,
            signer
          );
          const obatTradisionalContract = new Contract(
            contractData.ObatTradisional.address,
            contractData.ObatTradisional.abi,
            signer
          );

          setContracts({
            orderManagement: orderManagementContract,
            obatTradisional: obatTradisionalContract
          });
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
      if (contracts) {
        try {

          const listOrderedObatCt = await contracts.orderManagement.getAllOrderFromBuyerRetailer(userData.instanceName);
  
          const reconstructedDataorder = listOrderedObatCt.map((item) => {

            const [orderId, obatId, namaProduk, batchName, orderQuantity, buyerUser, sellerUser, statusOrder] = item[0]; 
          
            return {
              prevOrderId: item[1], 
              orderId: orderId,
              obatId: obatId, 
              namaObat: namaProduk,
              batchName: batchName, 
              orderQuantity: orderQuantity,
              buyerUser: buyerUser,
              sellerUser: sellerUser, 
              statusOrder: statusOrderMap[statusOrder],
            };
          });

          setDataObatOrder(reconstructedDataorder)

        } catch (error) {
          errAlert(error, "Can't access order data.");
        }
      }
    };
  
    loadData();
  }, [contracts, userData.instanceName]);

  // useEffect(() => {
  //   if (contracts) {

  //     contracts.orderManagement.on("evt_updateOrder", (_namaProduk, _batchName, _targetInstanceName, _senderInstanceName, _orderQuantity, _latestTimestamp) => {

  //       const timestamp = new Date(Number(_latestTimestamp) * 1000).toLocaleDateString('id-ID', options)

  //       MySwal.fire({
  //         title:  `Success Accept Order Delivery Obat ${_namaProduk}`,
  //         html: (
  //           <div className='form-swal'>
  //             <ul>
  //               <li className="label">
  //                 <p>Nama Obat</p> 
  //               </li>
  //               <li className="input">
  //                 <p>{_namaProduk}</p> 
  //               </li>
  //             </ul>
  //             <ul>
  //               <li className="label">
  //                 <p>Batch Name</p> 
  //               </li>
  //               <li className="input">
  //                 <p>{_batchName}</p> 
  //               </li>
  //             </ul>
  //             <ul>
  //               <li className="label">
  //                 <p>Di produksi oleh</p> 
  //               </li>
  //               <li className="input">
  //                 <p>{_targetInstanceName}</p> 
  //               </li>
  //             </ul>
  //             <ul>
  //               <li className="label">
  //                 <p>Di order oleh</p> 
  //               </li>
  //               <li className="input">
  //                 <p>{_senderInstanceName}</p> 
  //               </li>
  //             </ul>
  //             <ul>
  //               <li className="label">
  //                 <p>Total order</p> 
  //               </li>
  //               <li className="input">
  //                 <p>{_orderQuantity.toString()} Obat</p> 
  //               </li>
  //             </ul>
  //             <ul>
  //               <li className="label">
  //                 <p>Tanggal pengiriman</p> 
  //               </li>
  //               <li className="input">
  //                 <p>{timestamp}</p> 
  //               </li>
  //             </ul>
  //           </div>
  //         ),
  //         icon: 'success',
  //         width: '560',
  //         showCancelButton: false,
  //         confirmButtonText: 'Oke',
  //         allowOutsideClick: true,
  //       }).then((result) => {
  //         if (result.isConfirmed) {
  //           window.location.reload()
  //         }
  //       });
  //     })
  
  //     return () => {
  //       contracts.orderManagement.removeAllListeners("evt_updateOrder");
  //     };
  //   }
  // }, [contracts]);
  

  const getDetailObat = async (id, orderId) => {

    try {
      const detailObatCt = await contracts.obatTradisional.detailObat(id);
      const detailOrderCt = await contracts.orderManagement.detailOrderRetailer(orderId)

      const [obatDetails, factoryAddress, factoryInstanceName, factoryUserName, bpomAddress, bpomInstanceName, bpomUserName] = detailObatCt;

      const [dataOrder, timestamp, orderObatIpfsHash] = detailOrderCt;

      const [orderIdProduk, obatIdProduk, namaProduk, batchName, orderQuantity, buyerUser, sellerUser, statusOrder] = dataOrder;
      
      const timestamps = {
        timestampOrder: timestamp[0] ? new Date(Number(timestamp[0]) * 1000).toLocaleDateString('id-ID', options) : 0, 
        timestampShipped: timestamp[1] ? new Date(Number(timestamp[1]) * 1000).toLocaleDateString('id-ID', options) : 0,
        timestampComplete: timestamp[2] ?  new Date(Number(timestamp[2]) * 1000).toLocaleDateString('id-ID', options) : 0
      }

      console.log(timestamps);

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
        obatStatus: statusOrderMap[obatDetails.obatStatus], 
        nieRequestDate: obatDetails.nieRequestDate ? new Date(Number(obatDetails.nieRequestDate) * 1000).toLocaleDateString('id-ID', options) : '-', 
        nieApprovalDate: Number(obatDetails.nieApprovalDate) > 0 ? new Date(Number(obatDetails.nieApprovalDate) * 1000).toLocaleDateString('id-ID', options): "-",
        nieNumber: obatDetails.nieNumber ? obatDetails.nieNumber : "-",
        bpomAddr: bpomAddress === "0x0000000000000000000000000000000000000000" ? "-" : bpomAddress,
        bpomUserName:  bpomUserName ? bpomUserName : "-",
        bpomInstanceNames:  bpomInstanceName ?  bpomInstanceName : "-"
      };

      const detailOrder = {
        orderId: orderIdProduk,
        batchName: batchName,
        orderQuantity: parseInt(orderQuantity),
        senderInstanceName: buyerUser[0],
        senderAdddress: buyerUser[1],
        statusOrder : statusOrderMap[statusOrder],
        targetInstanceName : sellerUser[0],
        targetAddress: sellerUser[1],
        orderObatIpfsHash : orderObatIpfsHash,
        timestampOrder: timestamp[0] ? new Date(Number(timestamp[0]) * 1000).toLocaleDateString('id-ID', options) : 0, 
        timestampShipped: timestamp[1] ? new Date(Number(timestamp[1]) * 1000).toLocaleDateString('id-ID', options) : 0,
        timestampComplete: timestamp[2] ?  new Date(Number(timestamp[2]) * 1000).toLocaleDateString('id-ID', options) : 0
      }

      if(statusOrder === 1n) {
        MySwal.fire({
          title: `Detail Order Obat ${detailObat.namaObat}`,
          html: (
            <div className='form-swal order'>
              <div className="row1">
                <div className="produce-obat">
                  <div className="detailObat">
                    <div className="row row--obat">
                      <div className="col">
                        <ul>
                          <li className="label">
                            <p>ID ORDER</p>
                          </li>
                          <li className="input">
                            <p>{orderId}</p> 
                          </li>
                        </ul>
  
                        <ul>
                          <li className="label">
                            <p>Status Order</p>
                          </li>
                          <li className="input">
                            <p>{statusOrderMap[statusOrder]}</p> 
                          </li>
                        </ul>
  
                        <ul>
                          <li className="label">
                            <p>Nama Obat</p>
                          </li>
                          <li className="input">
                            <p>{detailObat.namaObat}</p> 
                          </li>
                        </ul>
                      
                        <ul>
                          <li className="label">
                            <p>Factory Instance</p>
                          </li>
                          <li className="input">
                            <p>{factoryInstanceName}</p>
                          </li>
                        </ul>
                      
                        <ul>
                          <li className="label">
                            <p>Factory Address</p>
                          </li>
                          <li className="input">
                            <p>{factoryAddress}</p>
                          </li>
                        </ul>
                      
                        <ul>
                          <li className="label">
                            <p>Retailer Instance</p>
                          </li>
                          <li className="input">
                            <p>{buyerUser[0]}</p>
                          </li>
                        </ul>
                      
                        <ul>
                          <li className="label">
                            <p>Retailer Instance</p>
                          </li>
                          <li className="input">
                            <p>{buyerUser[1]}</p>
                          </li>
                        </ul>
  
                        <ul>
                          <li className="label">
                            <p>Total Pemesanan</p>
                          </li>
                          <li className="input">
                            <p> {orderQuantity.toString()} Obat</p>
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
                        <li className="label-sm">
                          <p>Nomor NIE</p>
                        </li>
                        <li className="input">
                          <p>{detailObat.nieNumber}</p> 
                        </li>
                      </ul>
  
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
              <div className="container-stepper">
                <div id="stepperOrder"></div>
              </div>
            </div>
          ),
          width: '1220',
          showCancelButton: true,
          confirmButtonText: 'Complete Order',
          didOpen: () => {
            const stepperOrder = document.getElementById('stepperOrder');
            const root = ReactDOM.createRoot(stepperOrder);
            root.render( 
              <OrderStatusStepper orderStatus={statusOrder} timestamps={timestamps} />
            );
          }
        }).then((result) => {
          if (result.isConfirmed) {
            generateIpfs(detailObat, detailOrder, orderId, batchName)
          }
        })

      } else{
        MySwal.fire({
          title: `Detail Order Obat ${detailObat.namaObat}`,
          html: (
            <div className='form-swal order'>
              <div className="row1">
                <div className="produce-obat">
                  <div className="detailObat">
                    <div className="row row--obat">
                      <div className="col">
                        <ul>
                          <li className="label">
                            <p>ID ORDER</p>
                          </li>
                          <li className="input">
                            <p>{orderId}</p> 
                          </li>
                        </ul>
  
                        <ul>
                          <li className="label">
                            <p>Status Order</p>
                          </li>
                          <li className="input">
                            <p>{statusOrderMap[statusOrder]}</p> 
                          </li>
                        </ul>
  
                        <ul>
                          <li className="label">
                            <p>Nama Obat</p>
                          </li>
                          <li className="input">
                            <p>{detailObat.namaObat}</p> 
                          </li>
                        </ul>
                        <ul>
                          <li className="label">
                            <p>Factory Instance</p>
                          </li>
                          <li className="input">
                            <p>{factoryInstanceName}</p>
                          </li>
                        </ul>
                      
                        <ul>
                          <li className="label">
                            <p>Factory Address</p>
                          </li>
                          <li className="input">
                            <p>{factoryAddress}</p>
                          </li>
                        </ul>
                      
                        <ul>
                          <li className="label">
                            <p>Retailer Instance</p>
                          </li>
                          <li className="input">
                            <p>{buyerUser[0]}</p>
                          </li>
                        </ul>
                      
                        <ul>
                          <li className="label">
                            <p>Retailer Instance</p>
                          </li>
                          <li className="input">
                            <p>{buyerUser[1]}</p>
                          </li>
                        </ul>
  
                        <ul>
                          <li className="label">
                            <p>Total Pemesanan</p>
                          </li>
                          <li className="input">
                            <p> {orderQuantity.toString()} Obat</p>
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
                        <li className="label-sm">
                          <p>Nomor NIE</p>
                        </li>
                        <li className="input">
                          <p>{detailObat.nieNumber}</p> 
                        </li>
                      </ul>
  
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
              <div className="container-stepper">
                <div id="stepperOrder"></div>
              </div>
            </div>
          ),
          width: '1220',
          showCancelButton: false,
          showCloseButton: true,
          showConfirmButton: false,
          didOpen: () => {
            const stepperOrder = document.getElementById('stepperOrder');
            const root = ReactDOM.createRoot(stepperOrder);
            root.render( 
              <OrderStatusStepper orderStatus={statusOrder} timestamps={timestamps} />
            );
          }
        })

      }
      
    } catch (e) {
      errAlert(e, "Can't retrieve data")
    }
  }

  const completeOrder = async (orderId, ipfsHash) => {
    MySwal.fire({
      title:"Processing your request...",
      text:"Your request is on its way. This won't take long. 🚀",
      icon: 'info',
      showCancelButton: false,
      showConfirmButton: false,
      allowOutsideClick: false,
    })

    const completeOrderCt = await contracts.orderManagement.completeOrderRetailer(orderId, ipfsHash)

    console.log(completeOrderCt);
  }
  
  const generateIpfs = async(dataObat, dataOrder, orderId, batchName) => {
    MySwal.fire({
      title:"Preparing your data",
      text:"Your request is on its way. This won't take long. 🚀",
      icon: 'info',
      showCancelButton: false,
      showConfirmButton: false,
      allowOutsideClick: false,
    })
    
    let newIpfsHashes = [];
    const randomFourDigit = Math.floor(1000 + Math.random() * 9000); 
    const randomTwoLetters = String.fromCharCode(
      65 + Math.floor(Math.random() * 26),
      65 + Math.floor(Math.random() * 26)
    );

    const date = new Date();
    const formattedDate = new Intl.DateTimeFormat('id-ID', options).format(date);
    dataOrder.timestampComplete = formattedDate;
    console.log(dataOrder);
    dataOrder.statusOrder = statusOrderMap[dataOrder.statusOrder]

    try {
      const detailOrderPbf = await contracts.orderManagement.getHistoryOrderObatPbf(batchName)

      console.log(detailOrderPbf);
      const [orderQuantity, senderInstanceName, targetInstanceName, senderAddress, targetAdddress, timestampOrder, timestampShipped, timestampComplete] = detailOrderPbf

      const timestampOrderPbf= timestampOrder ? new Date(Number(timestampOrder) * 1000).toLocaleDateString('id-ID', options) : 0;
      const timestampShippedPbf= timestampShipped ? new Date(Number(timestampShipped) * 1000).toLocaleDateString('id-ID', options) : 0;
      const timestampCompletePbf= timestampComplete ?  new Date(Number(timestampComplete) * 1000).toLocaleDateString('id-ID', options) : 0;

      const orderQuantityPbf = parseInt(orderQuantity)

      for (let i = 0; i < dataOrder.orderQuantity; i++) {
        const obat = {
          batchName: batchName,
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
          },
          dataOrderPbf: {
            orderQuantity: orderQuantityPbf,
            senderInstanceName: senderInstanceName,
            senderAddress: senderAddress,
            targetInstanceName : targetInstanceName,
            targetAddress: targetAdddress,
            timestampOrder: timestampOrderPbf,
            timestampShipped: timestampShippedPbf,
            timestampComplete: timestampCompletePbf 
          },
          dataOrderRetailer: {
            orderQuantity: dataOrder.orderQuantity,
            senderInstanceName: dataOrder.senderInstanceName,
            senderAddress : dataOrder.senderAddress,
            targetAddress : dataOrder.targetAddress,
            targetInstanceName : dataOrder.targetInstanceName,
            timestampOrder: dataOrder.timestampOrder,
            timestampShipped: dataOrder.timestampShipped,
            timestampComplete: dataOrder.timestampComplete
          }
        };
        
        try {
          console.log(obat);
          const result = await client.add(JSON.stringify(obat), 
            { progress: (bytes) => 
              console.log(`Uploading ${i+1}/${dataOrder.orderQuantity}: ${bytes} bytes uploaded`) }
          );
  
          newIpfsHashes.push(result.path); 
        } catch (error) {
          errAlert(error, "Can't upload Data Obat to IPFS."); 
          break;
        }
      }
  
      console.log("Generated IPFS Hashes:", newIpfsHashes);
  
      if(newIpfsHashes.length !== 0){
        MySwal.fire({
          title: `Order Obat ${dataObat.namaObat}`,
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
                      <p>Nama PBF</p> 
                    </li>
                    <li className="input input-1">
                      <p>{dataOrder.targetInstanceName}</p> 
                    </li>
                  </ul>
    
                  <ul>
                    <li className="label label-1">
                      <p>Nama Retailer</p> 
                    </li>
                    <li className="input input-1">
                      <p>{dataOrder.senderInstanceName}</p> 
                    </li>
                  </ul>
    
                  <ul>
                    <li className="label label-1">
                      <p>Total Order</p> 
                    </li>
                    <li className="input input-1">
                      <p>{dataOrder.orderQuantity} Obat</p>
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
            completeOrder(orderId, newIpfsHashes)
          }
        })
      }
    } catch (error) {
      errAlert(error, "Can't find data order.")
    }

  }

  return (
    <>
      <div id="ObatProduce" className='Layout-Menu layout-page'>
        <div className="title-menu">
          <h1>List Order Obat Tradisional</h1>
          <p>Oleh {userData.instanceName}</p>
        </div>
        <div className="tab-menu">
          <ul>
            <li><button onClick={() => navigate('/create-retailer-order')}>Pengajuan Order</button></li>
            <li><button className='active' onClick={() => navigate('/retailer-orders')}>Order Obat Tradisional</button></li>
            <li><button onClick={() => navigate('/obat-available-retailer')}>Obat Ready Stock</button></li>
          </ul>
        </div>
        <div className="container-data ">
          <div className="data-list">
            {dataObatOrder.length > 0 ? (
              <ul>
                {dataObatOrder.map((item, index) => (
                  <li key={index}>
                    <button className='title' onClick={() => getDetailObat(item.obatId, item.orderId)} >{item.namaObat}</button>
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

export default ManageOrderRetailer;