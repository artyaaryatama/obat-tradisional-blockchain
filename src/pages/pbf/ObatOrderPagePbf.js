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


function ObatOrderPbf() {
  const [contracts, setContracts] = useState(null);
  const navigate = useNavigate();

  const userData = JSON.parse(sessionStorage.getItem('userdata'));
  const [dataObatOrder, setDataObatOrder] = useState([]);
  

  const obatStatusMap = {
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
      if (contracts) {
        try {

          const tx = await contracts.orderManagement.getListAllOrderedObatFromSender(userData.instanceName);
          const [orderIdArray, namaProdukArray, statusOrderArray, obatQuantityArray, obatIdArray, batchNameArray] = tx

          const reconstructedData = orderIdArray.map((obatId, index) => ({
            namaObat: namaProdukArray[index],
            orderId: orderIdArray[index],
            obatQuantity: obatQuantityArray[index].toString(),
            statusOrder: obatStatusMap[statusOrderArray[index]],
            obatId: obatIdArray[index],
            batchName: batchNameArray[index]
          }));

          setDataObatOrder(reconstructedData)
          console.log(reconstructedData);

        } catch (error) {
          errAlert(error, "Can't access order data.");
        }
      }
    };
  
    loadData();
  }, [contracts, userData.instanceName]);

  useEffect(() => {
    if (contracts) {

      contracts.orderManagement.on("evt_updateOrder", (_namaProduk, _batchName, _targetInstanceName, _senderInstanceName, _orderQuantity, _latestTimestamp) => {

        const timestamp = new Date(Number(_latestTimestamp) * 1000).toLocaleDateString('id-ID', options)

        MySwal.fire({
          title:  `Success Accept Order Delivery Obat ${_namaProduk}`,
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

    try {
      const tx = await contracts.obatTradisional.getListObatById(id);
      const tx1 = await contracts.orderManagement.getDetailOrderedObat(orderId)

      const [obatDetails, factoryAddress, factoryInstanceName, factoryUserName, bpomAddress, bpomInstanceName, bpomUserName] = tx;

      const [orderQuantity, senderInstanceName, statusOrder, targetInstanceName, orderObatIpfsHash, timestampOrder, timestampShipped, timestampComplete] = tx1;
      
      const timestamps = {
        timestampOrder: new Date(Number(timestampOrder) * 1000).toLocaleDateString('id-ID', options), 
        timestampShipped: timestampShipped ? new Date(Number(timestampShipped) * 1000).toLocaleDateString('id-ID', options) : 0,
        timestampComplete: timestampComplete ?  new Date(Number(timestampComplete) * 1000).toLocaleDateString('id-ID', options) : 0
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
        obatStatus: obatStatusMap[obatDetails.obatStatus], 
        nieRequestDate: obatDetails.nieRequestDate ? new Date(Number(obatDetails.nieRequestDate) * 1000).toLocaleDateString('id-ID', options) : '-', 
        nieApprovalDate: Number(obatDetails.nieApprovalDate) > 0 ? new Date(Number(obatDetails.nieApprovalDate) * 1000).toLocaleDateString('id-ID', options): "-",
        nieNumber: obatDetails.nieNumber ? obatDetails.nieNumber : "-",
        bpomAddr: bpomAddress === "0x0000000000000000000000000000000000000000" ? "-" : bpomAddress,
        bpomUserName:  bpomUserName ? bpomUserName : "-",
        bpomInstanceNames:  bpomInstanceName ?  bpomInstanceName : "-"
      };

      const detailOrder = {
        orderQuantity: parseInt(orderQuantity),
        senderInstanceName: senderInstanceName,
        statusOrder : statusOrder,
        targetInstanceName : targetInstanceName,
        orderObatIpfsHash : orderObatIpfsHash,
        timestampOrder: timestampOrder.toString(),
        timestampShipped: timestampShipped.toString(),
        timestampComplete: timestampComplete.toString()
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
                            <p>{obatStatusMap[statusOrder]}</p> 
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
                            <p>Di Produksi oleh</p>
                          </li>
                          <li className="input">
                            <p>{targetInstanceName}</p>
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
            completeOrder(orderId)
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
                            <p>{obatStatusMap[statusOrder]}</p> 
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
                            <p>Di Produksi oleh</p>
                          </li>
                          <li className="input">
                            <p>{targetInstanceName}</p>
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

  const completeOrder = async (orderId) => {
    MySwal.fire({
      title:"Processing your request...",
      text:"Your request is on its way. This won't take long. 🚀",
      icon: 'info',
      showCancelButton: false,
      showConfirmButton: false,
      allowOutsideClick: false,
    })

    const completeOrderCt = await contracts.orderManagement.completeOrder(orderId)

    console.log(completeOrderCt);
  }
  
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
      const tx = await contracts.obatTradisional.produceObat(namaObat, obatId, quantity, factoryInstanceName, ipfsHash);
      tx.wait()
      
    } catch (error) {
      errAlert(error, "Can't upload data.")
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
            <li><button onClick={() => navigate('/obat-order-create-pbf')}>Pengajuan Order</button></li>
            <li><button className='active' onClick={() => navigate('/obat-order-pbf')}>Order Obat Tradisional</button></li>
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

export default ObatOrderPbf;