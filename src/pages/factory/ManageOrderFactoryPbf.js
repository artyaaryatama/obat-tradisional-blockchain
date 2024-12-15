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


function ManageOrderFactoryPbf() {
  const [contracts, setContracts] = useState(null);
  const navigate = useNavigate();

  const userData = JSON.parse(sessionStorage.getItem('userdata'));
  const [dataOrder, setDataOrder] = useState([]);
  const [dataObat, setDataObat] = useState([]);
  const [ipfsHashes, setIpfsHashes] = useState([])

  const obatStatusMap = {
    0: "In Local Production",
    1: "Requested NIE",
    2: "Approved NIE"
  };

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

          // Update state with both contracts
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
      if (contracts && userData.instanceName) {

        try {

          const listOrderedObatCt = await contracts.orderManagement.getAllOrderFromSeller(userData.instanceName);
          console.log(listOrderedObatCt);

          const reconstructedDataorder = listOrderedObatCt.map((item, index) => ({
            orderId: item[0],
            obatId: item[1],
            namaObat: item[2],
            batchName: item[3],
            obatQuantity: item[4],
            buyerUser: item[5],
            sellerUser: item[6],
            statusOrder: statusOrderMap[item[7]],
          }));

          setDataOrder(reconstructedDataorder)
          console.log(reconstructedDataorder);

        } catch (error) {
          console.error("Error loading data: ", error);
        }
      }
    };
  
    loadData();
  }, [contracts]);

  useEffect(() => {
    if (contracts) {

      contracts.orderManagement.on("evt_updateOrder", (_namaProduk, _batchName, _targetInstanceName, _senderInstanceName, _orderQuantity, _latestTimestamp) => {

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
        contracts.orderManagement.removeAllListeners("evt_updateOrder");
      };
    }
  }, [contracts]);
  

  const getDetailObat = async (id, orderId) => {
    console.log(id, orderId);

    try {
      const detailObatCt = await contracts.obatTradisional.detailObat(id);
      const detailOrderCt = await contracts.orderManagement.detailOrder(orderId);

      console.log(detailOrderCt);

      const [obatDetails, obatNie] = detailObatCt;

      const [orderData, timestampData, orderObatIpfs] = detailOrderCt

      const [merk, namaProduk, klaim, komposisi, kemasan, tipeProduk, factoryInstance, factoryAddr] = obatDetails;

      const [nieNumber, nieStatus, timestampProduction, timestampNieRequest, timestampNieApprove, bpomInstance, bpomAddr] = obatNie;

      const [orderIdd, obatId, namaProdukk, batchName, orderQuantity, buyerUser, sellerUser, statusOrder] = orderData

      const [timestampOrder, timestampShipped, timestampComplete] = timestampData

      const detailObat = {
        obatId: id,
        merk: merk,
        namaObat: namaProduk,
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

      const detailOrder = {
        orderId: orderId,
        batchName: batchName,
        orderQuantity: parseInt(orderQuantity),
        buyerInstance: buyerUser[0],
        buyerAddress: buyerUser[1],
        sellerInstance: sellerUser[0],
        sellerAddress: sellerUser[1],
        statusOrder: statusOrderMap[statusOrder],
        orderObatIpfs: orderObatIpfs
      }

      console.log(detailOrder);
      
      const timestamps = {
        timestampOrder: timestampOrder ? new Date(Number(timestampOrder) * 1000).toLocaleDateString('id-ID', options) : 0, 
        timestampShipped: timestampShipped ? new Date(Number(timestampShipped) * 1000).toLocaleDateString('id-ID', options) : 0,
        timestampComplete: timestampComplete ?  new Date(Number(timestampComplete) * 1000).toLocaleDateString('id-ID', options) : 0
      }

      if(statusOrder === 0n){
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
                            <p>Nama Obat</p>
                          </li>
                          <li className="input">
                            <p>{detailObat.namaObat}</p> 
                          </li>
                        </ul>
  
                        <ul>
                          <li className="label">
                            <p>Nomor NIE</p>
                          </li>
                          <li className="input">
                            <p>{detailObat.nieNumber}</p> 
                          </li>
                        </ul>
                      
                        <ul>
                          <li className="label">
                            <p>Di Order oleh</p>
                          </li>
                          <li className="input">
                            <p>{factoryInstance}</p>
                          </li>
                        </ul>
  
                        <ul>
                          <li className="label">
                            <p>Total Order</p>
                          </li>
                          <li className="input">
                            <p>{orderQuantity.toString()} Obat</p>
                          
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
          confirmButtonText: 'Accept Order',
          didOpen: async () => {

            const stepperOrder = document.getElementById('stepperOrder');
            const root = ReactDOM.createRoot(stepperOrder);
            root.render( 
              <OrderStatusStepper orderStatus={statusOrder} timestamps={timestamps} />
            );
  
          }
        }).then((result) => {
          if (result.isConfirmed) {
            generateIpfs(detailObat, detailOrder, timestamps, orderId, batchName)
          }
        })
      } else {
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
                            <p>Nama Obat</p>
                          </li>
                          <li className="input">
                            <p>{detailObat.namaObat}</p> 
                          </li>
                        </ul>
  
                        <ul>
                          <li className="label">
                            <p>Nomor NIE</p>
                          </li>
                          <li className="input">
                            <p>{detailObat.nieNumber}</p> 
                          </li>
                        </ul>
                      
                        <ul>
                          <li className="label">
                            <p>Di Order oleh</p>
                          </li>
                          <li className="input">
                            <p>{factoryInstance}</p>
                          </li>
                        </ul>
  
                        <ul>
                          <li className="label">
                            <p>Total Order</p>
                          </li>
                          <li className="input">
                            <p>{orderQuantity.toString()} Obat</p>
                          
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

  const acceptOrder = async (orderId, batchName, ipfsHashes) => {
    
    MySwal.fire({
      title:"Processing your request...",
      text:"Your request is on its way. This won't take long. 🚀",
      icon: 'info',
      showCancelButton: false,
      showConfirmButton: false,
      allowOutsideClick: false,
    })

    try {
      const acceptOrderCt = await contracts.orderManagement.acceptOrder(orderId, batchName, ipfsHashes)
      console.log(acceptOrderCt);

      if(acceptOrderCt){
        MySwal.update({
          title: "Processing your transaction...",
          text: "This may take a moment. Hang tight! ⏳"
        });
      }
      
    } catch (error) {
      errAlert(error, "Can't Accept Order")
    }

  }
  
  const generateIpfs = async(dataObat, dataOrder, timestamps, orderId, batchName) => {
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
    timestamps.timestampShipped = formattedDate;
    console.log(dataOrder);
    dataOrder.statusOrder = statusOrderMap[dataOrder.statusOrder]

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
          orderQuantity: dataOrder.orderQuantity,
          senderInstanceName: dataOrder.buyerInstance,
          senderAddress: dataOrder.buyerAddress,
          statusOrder : dataOrder.statusOrder,
          targetInstanceName : dataOrder.sellerInstance,
          targetAddress: dataOrder.sellerAddress,
          timestampOrder: timestamps.timestampOrder,
          timestampShipped: timestamps.timestampShipped
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
                    <p>Factory Instance</p> 
                  </li>
                  <li className="input input-1">
                    <p>{dataOrder.sellerInstance}</p> 
                  </li>
                </ul>
  
                <ul>
                  <li className="label label-1">
                    <p>PBF Instance</p> 
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
          acceptOrder(orderId, batchName, newIpfsHashes)
        }
      })
    }

  }

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
            <li><button onClick={() => navigate('/obat-available-factory')}>Produksi Obat</button></li>
            <li><button className='active' onClick={() => navigate('/manage-orders-factory')}>Order Obat</button></li>
          </ul>
        </div>
        <div className="container-data ">
          <div className="data-list">
            {dataOrder ? (
              <ul>
                {dataOrder.map((item, index) => (
                  <li key={index}>
                    <button className='title' onClick={() => getDetailObat(item.obatId, item.orderId)} >{item.namaObat}</button>
                    <p></p>
                    <p>
                      {item.statusOrder !== 'Order Placed' ? 
                      `Total order: ${item.obatQuantity} Obat [${item.batchName}]` : 
                      `Total order: ${item.obatQuantity} Obat`}
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

export default ManageOrderFactoryPbf;