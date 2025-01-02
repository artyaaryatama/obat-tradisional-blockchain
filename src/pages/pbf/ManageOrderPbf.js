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

function ManageOrderPbf() {
  const [contracts, setContracts] = useState(null);
  const navigate = useNavigate();

  const userData = JSON.parse(sessionStorage.getItem('userdata'));
  const [dataOrder, setDataOrder] = useState([]);

  const obatStatusMap = {
    0: "In Local Production",
    1: "Requested NIE",
    2: "Approved NIE"
  };

  const orderStatusMap = {
    0n: "Order Placed",
    1n: "Order Shipped",
    2n: "Order Completed"
  };

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

          const MainSupplyChain = new Contract(
            contractData.MainSupplyChain.address,
            contractData.MainSupplyChain.abi,
            signer
          );

          setContracts({
            orderManagement: orderManagementContract,
            obatTradisional: obatTradisionalContract,
            mainSupplyChain: MainSupplyChain,
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
    const loadData = async () => {
      if (contracts) {
        try {
          const listOrderedObatCt = await contracts.orderManagement.getAllOrderFromBuyer(userData.instanceName);
          console.log(listOrderedObatCt);

          const reconstructedDataorder = listOrderedObatCt.map((item, index) => ({
            orderId: item[0],
            obatId: item[1],
            namaObat: item[2],
            batchName: item[3],
            orderQuantity: item[4],
            buyerUser: item[5],
            sellerUser: item[6],
            statusOrder: orderStatusMap[item[7]],
          }));

          setDataOrder(reconstructedDataorder)
          console.log(reconstructedDataorder);

        } catch (error) {
          errAlert(error, "Can't access order data.");
        }
      }
    };
  
    loadData();
  }, [contracts]);
  
  const handleEventOrderUpdate = (_batchName, _namaProduk,  _buyerInstance, _sellerInstance, _orderQuantity, _timestampOrder, txHash) => {
    
    const timestamp = new Date(Number(_timestampOrder) * 1000).toLocaleDateString('id-ID', options)
  
    MySwal.fire({
      title: "Order Completed Successfully!",
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
              <p>PBF Instance</p> 
            </li>
            <li className="input">
              <p>{_buyerInstance}</p> 
            </li>
          </ul>
          <ul>
            <li className="label">
              <p>Factory Instance</p> 
            </li>
            <li className="input">
              <p>{_sellerInstance}</p> 
            </li>
          </ul>
          <ul>
            <li className="label">
              <p>Timestamp Accept Order</p> 
            </li>
            <li className="input">
              <p>{timestamp}</p> 
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
        window.location.reload()
      }
    });
  }

  const getDetailObat = async (id, orderId) => {

    try {
      const detailObatCt = await contracts.obatTradisional.detailObat(id);
      const detailOrderCt = await contracts.orderManagement.detailOrder(orderId);
      const orderTimestampCt = await contracts.orderManagement.orderTimestamp(orderId);
      const orderObatIpfs = await contracts.orderManagement.obatIpfs(orderId);

      const [obatDetails, obatNie] = detailObatCt;

      const [merk, namaProduk, klaim, komposisi, kemasan, tipeProduk, factoryInstance, factoryAddr, tipeObat, cpotbHash, cdobHash] = obatDetails;

      const [nieNumber, nieStatus, timestampProduction, timestampNieRequest, timestampNieApprove, bpomInstance, bpomAddr] = obatNie;

      const [orderIdd, obatId, namaProdukk, batchName, orderQuantity, buyerUser, sellerUser, statusOrder] = detailOrderCt

      const [timestampOrder, timestampShipped, timestampComplete] = orderTimestampCt

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
        bpomInstance:  bpomInstance,
        tipeObat: tipeObatMap[tipeObat]
      };
      
      const detailOrder = {
        orderId: orderId,
        batchName: batchName,
        orderQuantity: parseInt(orderQuantity),
        buyerInstance: buyerUser[0],
        buyerAddress: buyerUser[1],
        sellerInstance: sellerUser[0],
        sellerAddress: sellerUser[1],
        statusOrder: orderStatusMap[statusOrder],
        orderObatIpfs: orderObatIpfs
      }

      const timestamps = {
        timestampOrder: timestampOrder ? new Date(Number(timestampOrder) * 1000).toLocaleDateString('id-ID', options) : 0, 
        timestampShipped: timestampShipped ? new Date(Number(timestampShipped) * 1000).toLocaleDateString('id-ID', options) : 0,
        timestampComplete: timestampComplete ?  new Date(Number(timestampComplete) * 1000).toLocaleDateString('id-ID', options) : 0
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
                            <p>{orderStatusMap[statusOrder]}</p> 
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
                            <p>Batchname</p>
                          </li>
                          <li className="input">
                            <p>{batchName}</p> 
                          </li>
                        </ul>
  
                        <ul>
                          <li className="label">
                            <p>Total Order</p>
                          </li>
                          <li className="input">
                            <p> {orderQuantity.toString()} Obat</p>
                          </li>
                        </ul>

                        <ul>
                          <li className="label">
                            <p>Factory Instance</p>
                          </li>
                          <li className="input">
                            <p>{factoryInstance}
                              <span className='linked'>
                                <a
                                  href={`http://localhost:3000/public/certificate/${cpotbHash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  (CPOTB Details
                                  <i class="fa-solid fa-arrow-up-right-from-square"></i>)
                                </a>
                              </span>
                            </p>
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
                        <li className="label">
                          <p>Tipe Obat</p>
                        </li>
                        <li className="input">
                          <p>{detailObat.tipeObat}</p> 
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
            generateIpfs(detailObat, detailOrder, timestamps, orderId, batchName, cpotbHash, cdobHash)
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
                            <p>{orderStatusMap[statusOrder]}</p> 
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
                            <p>Batchname</p>
                          </li>
                          <li className="input">
                            <p>{batchName}</p> 
                          </li>
                        </ul>
  
                        <ul>
                          <li className="label">
                            <p>Total Order</p>
                          </li>
                          <li className="input">
                            <p> {orderQuantity.toString()} Obat</p>
                          </li>
                        </ul>

                        <ul>
                          <li className="label">
                            <p>Factory Instance</p>
                          </li>
                          <li className="input">
                            <p>{factoryInstance}
                              <span className='linked'>
                                <a
                                  href={`http://localhost:3000/public/certificate/${cpotbHash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  (CPOTB Details
                                  <i class="fa-solid fa-arrow-up-right-from-square"></i>)
                                </a>
                              </span>
                            </p>
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
                        <li className="label">
                          <p>Tipe Obat</p>
                        </li>
                        <li className="input">
                          <p>{detailObat.tipeObat}</p> 
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

  const completeOrder = async (orderId, ipfsHashes) => {

    MySwal.fire({
      title:"Preparing your data",
      text:"Your request is on its way. This won't take long. 🚀",
      icon: 'info',
      showCancelButton: false,
      showConfirmButton: false,
      allowOutsideClick: false,
    })

    try {
      const completeOrderCt = await contracts.orderManagement.completeOrderPbf(orderId, ipfsHashes)

      if(completeOrderCt){
        MySwal.update({
          title: "Processing your transaction...",
          text: "This may take a moment. Hang tight! ⏳"
        });
      }

      contracts.orderManagement.once("evt_orderUpdate", (_batchName, _namaProduk,  _buyerInstance, _sellerInstance, _orderQuantity, _timestampOrder) => {

        handleEventOrderUpdate(_batchName, _namaProduk,  _buyerInstance, _sellerInstance, _orderQuantity, _timestampOrder, completeOrderCt.hash); 
      });

    } catch (error) {
      errAlert(error, "Can't Complete Order");
    }
  }
  
  const generateIpfs = async(dataObat, dataOrder, timestamps, orderId, batchName, cpotbHash, cdobHash) => {
    MySwal.fire({
      title:"Preparing your data",
      text:"Your request is on its way. This won't take long. 🚀",
      icon: 'info',
      showCancelButton: false,
      showConfirmButton: false,
      allowOutsideClick: false,
    })

    console.log(dataOrder);
    
    let newIpfsHashes = [];

    const date = new Date();
    const formattedDate = new Intl.DateTimeFormat('id-ID', options).format(date);
    timestamps.timestampComplete = formattedDate;
    const timestampYear = new Date().getFullYear().toString().slice(-4);
    const randomFourLetters = Array.from({ length: 4 }, () =>
      String.fromCharCode(65 + Math.floor(Math.random() * 26))
    ).join(''); 

    const userFactoryCt = await contracts.mainSupplyChain.getRegisteredUser(dataObat.factoryAddr);
    const userBpomCt = await contracts.mainSupplyChain.getRegisteredUser(dataObat.bpomAddr);
    const userPbfCt = await contracts.mainSupplyChain.getRegisteredUser(dataOrder.buyerAddress);

    for (let i = 0; i < dataOrder.orderQuantity; i++) {
      const obat = {
        batchName: batchName,
        obatIdPackage: `OT-${i}${timestampYear}-${randomFourLetters}`,
        cpotbHash: cpotbHash,
        cdobHash: cdobHash,
        dataObat:  {
          namaProduk: dataObat.namaObat,
          merk: dataObat.merk,
          klaim: dataObat.klaim,
          kemasan: dataObat.kemasan,
          komposisi: dataObat.komposisi,
          factoryAddr: dataObat.factoryAddr,
          factoryInstanceName: dataObat.factoryInstance,
          factoryAddressInstance: userFactoryCt[4],
          tipeProduk: dataObat.tipeProduk,
          nieNumber: dataObat.nieNumber,
          obatStatus: "NIE Approved",
          nieRequestDate: dataObat.nieRequestDate,
          nieApprovalDate: dataObat.nieApprovalDate,
          bpomAddr: dataObat.bpomAddr,
          bpomInstanceName: dataObat.bpomInstance,
          bpomAddressInstance: userBpomCt[4],
        },
        dataOrderPbf: {
          orderQuantity: dataOrder.orderQuantity,
          senderInstanceName: dataOrder.buyerInstance,
          senderAddress: dataOrder.buyerAddress,
          pbfInstanceAddress: userPbfCt[4],
          statusOrder : "Order Shipped",
          targetInstanceName : dataOrder.sellerInstance,
          targetAddress: userData.address,
          timestampOrder: timestamps.timestampOrder,
          timestampShipped: timestamps.timestampShipped
        }
      };
      
      try {
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
        title: `Complete Order Obat ${dataObat.namaObat}`,
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
        confirmButtonText: 'Confirm Obat',
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
            <li><button onClick={() => navigate('/create-pbf-order')}>Pengajuan Order</button></li>
            <li><button className='active' onClick={() => navigate('/pbf-orders')}>Order Obat Tradisional</button></li>
            <li><button onClick={() => navigate('/obat-available-pbf')}>Obat Ready Stok</button></li>
          </ul>
        </div>
        <div className="container-data ">
          <div className="data-list">
            {dataOrder.length > 0 ? (
              <ul>
                {dataOrder.map((item, index) => (
                  <li key={index}>
                    <button className='title' onClick={() => getDetailObat(item.obatId, item.orderId)} >{item.namaObat}</button>
                    <p>Batchname : {item.batchName}</p>
                    <p> Total Order: {item.orderQuantity.toString()} Obat
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

export default ManageOrderPbf;