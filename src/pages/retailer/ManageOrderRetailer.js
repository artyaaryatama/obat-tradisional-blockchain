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

  const obatStatusMap = {
    0: "In Local Production",
    1: "Requested NIE",
    2: "Approved NIE"
  };

  const orderStatusMap = {
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

          const listOrderedObatCt = await contracts.orderManagement.getAllOrderFromBuyer(userData.instanceName);

          const tempData = [];

          for (let index = 0; index < listOrderedObatCt.length; index++) {
            const [orderId, obatId, namaProduk, batchName, orderQuantity, buyerUser, sellerUser, statusOrder, prevOrderId] = listOrderedObatCt[index];

            const obj = {
              prevOrderId: prevOrderId,
              orderId: orderId,
              obatId: obatId, 
              namaProduk: namaProduk,
              batchName: batchName, 
              orderQuantity: orderQuantity,
              buyerUser: buyerUser,
              sellerUser: sellerUser, 
              statusOrder: orderStatusMap[statusOrder],
            };

            tempData.push(obj)
            
          }

          setDataObatOrder(tempData)
          console.log(tempData);

        } catch (error) {
          errAlert(error, "Can't access order data.");
        }
      }
    };
  
    loadData();
  }, [contracts, userData.instanceName]);

    useEffect(() => {
      if (contracts) {
  
        contracts.orderManagement.on("evt_orderUpdate", (_batchName, _namaProduk,  _buyerInstance, _sellerInstance, _orderQuantity, _timestampOrder) => {
  
          const timestamp = new Date(Number(_timestampOrder) * 1000).toLocaleDateString('id-ID', options)
      
          MySwal.fire({
            title:  `Order Completed Obat ${_namaProduk}`,
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
                  <p>Batchname</p> 
                </li>
                <li className="input">
                  <p>{_batchName}</p> 
                </li>
              </ul>
                <ul>
                  <li className="label">
                    <p>Total Order</p> 
                  </li>
                  <li className="input">
                    <p>{_orderQuantity.toString()} Obat</p> 
                  </li>
                </ul>
                <ul>
                  <li className="label">
                    <p>Retailer Instance</p> 
                  </li>
                  <li className="input">
                    <p>{_buyerInstance}</p> 
                  </li>
                </ul>
                <ul>
                  <li className="label">
                    <p>PBF Instance</p> 
                  </li>
                  <li className="input">
                    <p>{_sellerInstance}</p> 
                  </li>
                </ul>
                <ul>
                  <li className="label">
                    <p>Timestamp Order Completed</p> 
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
  
    
        return () => {
          contracts.orderManagement.removeAllListeners("evt_orderUpdate");
        };
      }
    }, [contracts]);

  const getDetailObat = async (prevOrderId, id, orderId) => {

    try {
      const detailObatCt = await contracts.obatTradisional.detailObat(id);
      const detailOrderCt = await contracts.orderManagement.detailOrder(orderId);
      const detailOrderPrevCt = await contracts.orderManagement.detailOrder(prevOrderId);
      const orderTimestampCt = await contracts.orderManagement.orderTimestamp(orderId);
      const orderObatIpfs = await contracts.orderManagement.obatIpfs(orderId);

      const [obatDetails, obatNie] = detailObatCt;

      const [merk, namaProduk, klaim, komposisi, kemasan, tipeProduk, factoryInstance, factoryAddr] = obatDetails;

      const [nieNumber, nieStatus, timestampProduction, timestampNieRequest, timestampNieApprove, bpomInstance, bpomAddr] = obatNie;

      const [orderIdProduk, obatIdProduk, namaProdukk, batchName, orderQuantity, buyerUser, sellerUser, statusOrder] = detailOrderCt;

      const [prevBuyerInstance, prevBuyerAddr] = detailOrderPrevCt[5]

      const [timestampOrder, timestampShipped, timestampComplete] = orderTimestampCt;

      const detailObat = {
        obatId: id,
        merk: merk,
        namaProduk: namaProduk,
        klaim: klaim,
        kemasan: kemasan,
        komposisi: komposisi,
        tipeProduk: tipeProdukMap[tipeProduk], 
        nieStatus: obatStatusMap[nieStatus], 
        produtionTimestamp: timestampProduction ? new Date(Number(timestampProduction) * 1000).toLocaleDateString('id-ID', options) : '-', 
        nieRequestDate: timestampNieRequest ? new Date(Number(timestampNieRequest) * 1000).toLocaleDateString('id-ID', options) : '-', 
        nieApprovalDate:  timestampNieApprove ? new Date(Number(timestampNieApprove) * 1000).toLocaleDateString('id-ID', options): "-",
        nieNumber: nieNumber ? nieNumber : "-",
        factoryAddr: factoryAddr,
        factoryInstance: factoryInstance,
        bpomAddr: bpomAddr ,
        bpomInstance:  bpomInstance 
      };

      const timestamps = {
        timestampOrder: timestampOrder ? new Date(Number(timestampOrder) * 1000).toLocaleDateString('id-ID', options) : 0, 
        timestampShipped: timestampShipped ? new Date(Number(timestampShipped) * 1000).toLocaleDateString('id-ID', options) : 0,
        timestampComplete: timestampComplete ?  new Date(Number(timestampComplete) * 1000).toLocaleDateString('id-ID', options) : 0
      }
            
      const detailOrder = {
        orderId: orderId,
        batchName: batchName,
        orderQuantity: parseInt(orderQuantity),
        buyerInstance: buyerUser[0],
        buyerAddress: buyerUser[1],
        sellerInstance: sellerUser[0],
        sellerAddress: prevBuyerAddr,
        statusOrder: orderStatusMap[statusOrder],
        orderObatIpfs: orderObatIpfs
      }

      console.log(detailOrder);

      if(statusOrder === 1n) {
        MySwal.fire({
          title: `Detail Order Obat ${detailObat.namaProduk}`,
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
                            <p>{orderStatusMap[statusOrder]}</p> 
                          </li>
                        </ul>
  
                        <ul>
                          <li className="label">
                            <p>Nama Obat</p>
                          </li>
                          <li className="input">
                            <p>{detailObat.namaProduk}</p> 
                          </li>
                        </ul>
                      
                        <div className="group">
                          <ul>
                            <li className="label">
                              <p>Factory Instance</p>
                            </li>
                            <li className="input">
                              <p>{factoryInstance}</p>
                            </li>
                          </ul>
                        
                          <ul>
                            <li className="label">
                              <p>Factory Address</p>
                            </li>
                            <li className="input">
                              <p>{factoryAddr}</p>
                            </li>
                          </ul>

                        </div>
                      
                        <ul>
                          <li className="label">
                            <p>PBF Instance</p>
                          </li>
                          <li className="input">
                            <p>{prevBuyerInstance}</p>
                          </li>
                        </ul>
                      
                        <ul>
                          <li className="label">
                            <p>PBF Instance</p>
                          </li>
                          <li className="input">
                            <p>{prevBuyerAddr}</p>
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
                  <DataIpfsHash ipfsHashes={orderObatIpfs} />
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
                        <li className="label label1">
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
                        <li className="label label1">
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
            generateIpfs(prevOrderId, detailObat, detailOrder, timestamps, orderId, batchName)
          }
        })

      } else{
        MySwal.fire({
          title: `Detail Order Obat ${detailObat.namaProduk}`,
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
                            <p>{orderStatusMap[statusOrder]}</p> 
                          </li>
                        </ul>
  
                        <ul>
                          <li className="label">
                            <p>Nama Obat</p>
                          </li>
                          <li className="input">
                            <p>{detailObat.namaProduk}</p> 
                          </li>
                        </ul>
                        <ul>
                          <li className="label">
                            <p>Factory Instance</p>
                          </li>
                          <li className="input">
                            <p>{factoryInstance}</p>
                          </li>
                        </ul>
                      
                        <ul>
                          <li className="label">
                            <p>Factory Address</p>
                          </li>
                          <li className="input">
                            <p>{factoryAddr}</p>
                          </li>
                        </ul>
                      
                        <ul>
                          <li className="label">
                            <p>PBF Instance</p>
                          </li>
                          <li className="input">
                            <p>{prevBuyerInstance}</p>
                          </li>
                        </ul>
                      
                        <ul>
                          <li className="label">
                            <p>PBF Instance</p>
                          </li>
                          <li className="input">
                            <p>{prevBuyerAddr}</p>
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
                  <DataIpfsHash ipfsHashes={orderObatIpfs} />
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
                        <li className="label label1">
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
                        <li className="label label1">
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
  
  const generateIpfs = async(prevOrderId, dataObat, dataOrder, timestamps, orderId, batchName) => {
    MySwal.fire({ 
      title:"Processing your request...",
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
    timestamps.timestampComplete = formattedDate;

    console.log(dataOrder);

    try {
      const prevOrderPbfCt = await contracts.orderManagement.detailOrder(prevOrderId)
      const orderTimestampCt = await contracts.orderManagement.orderTimestamp(orderId);

      const pbfTimestampOrder =  new Date(Number(orderTimestampCt[0]) * 1000).toLocaleDateString('id-ID', options)
      const pbfTimestampShipped = orderTimestampCt[1] !== 0n ? new Date(Number(orderTimestampCt[1]) * 1000).toLocaleDateString('id-ID', options) : "-"
      const pbfTimestampCompleted = orderTimestampCt[2] !== 0n ? new Date(Number(orderTimestampCt[2]) * 1000).toLocaleDateString('id-ID', options) : "-"
      
      

      for (let i = 0; i < dataOrder.orderQuantity; i++) {
        const obat = {
          batchName: batchName,
          obatIdPackage: `OT-${i * 23}${randomFourDigit}${randomTwoLetters}`,
          dataObat:  {
            obatIdProduk: dataObat.obatId,
            namaProduk: dataObat.namaProduk,
            merk: dataObat.merk,
            klaim: dataObat.klaim,
            kemasan: dataObat.kemasan,
            komposisi: dataObat.komposisi,
            factoryAddr: dataObat.factoryAddr,
            factoryInstanceName: dataObat.factoryInstance,
            tipeProduk: dataObat.tipeProduk,
            nieNumber: dataObat.nieNumber,
            obatStatus: "NIE Approved",
            nieRequestDate: dataObat.nieRequestDate,
            nieApprovalDate: dataObat.nieApprovalDate,
            bpomAddr: dataObat.bpomAddr,
            bpomInstanceName: dataObat.bpomInstance,
          },
          dataOrderPbf: {
            orderQuantity: parseInt(prevOrderPbfCt[4]),
            senderInstanceName: prevOrderPbfCt[5][0],
            senderAddress: prevOrderPbfCt[5][1],
            statusOrder : "Order Completed",
            targetInstanceName : prevOrderPbfCt[6][0] ,
            targetAddress: prevOrderPbfCt[6][1],
            timestampOrder: pbfTimestampOrder,
            timestampShipped: pbfTimestampShipped,
            timestampComplete: pbfTimestampCompleted
          },
          dataOrderRetailer: {
            orderQuantity: dataOrder.orderQuantity,
            senderInstanceName: dataOrder.buyerInstance,
            senderAddress: dataOrder.buyerAddress,
            statusOrder : "Order Completed",
            targetInstanceName : dataOrder.sellerInstance,
            targetAddress: dataOrder.sellerAddress,
            timestampOrder: timestamps.timestampOrder,
            timestampShipped: timestamps.timestampShipped,
            timestampComplete: timestamps.timestampComplete
          }
        };
        
        console.log(obat);
        const result = await client.add(JSON.stringify(obat), 
          { progress: (bytes) => 
            console.log(`Uploading ${i+1}/${dataOrder.orderQuantity}: ${bytes} bytes uploaded`) }
        );
        
        newIpfsHashes.push(result.path); 
      }

    } catch (error) {
      errAlert(error, "Can't upload data to IPFS.")
    }

    console.log("Generated IPFS Hashes:", newIpfsHashes);

    if(newIpfsHashes.length !== 0){
      MySwal.fire({
        title: `Order Obat ${dataObat.namaProduk}`,
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
                    <p>PBF Instance</p> 
                  </li>
                  <li className="input input-1">
                    <p>{dataOrder.sellerInstance}</p> 
                  </li>
                </ul>
  
                <ul>
                  <li className="label label-1">
                    <p>Retailer Instance</p> 
                  </li>
                  <li className="input input-1">
                    <p>{dataOrder.buyerInstance}</p> 
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
                    <button className='title' onClick={() => getDetailObat(item.prevOrderId, item.obatId, item.orderId)} >{item.namaProduk}</button>
                    <p>Batchname: {item.batchName}</p>
                    <p>
                    Total order: {item.orderQuantity.toString()} Obat
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