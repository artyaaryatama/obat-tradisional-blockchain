import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserProvider, Contract } from "ethers";
import contractData from '../../auto-artifacts/deployments.json';
import { create } from 'ipfs-http-client';
import DataIpfsHash from '../../components/TableHash';
import OrderStatusStepper from '../../components/StepperOrder';
import "../../styles/MainLayout.scss"
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import './../../styles/SweetAlert.scss';
import JenisSediaanTooltip from '../../components/TooltipJenisSediaan';
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";

const MySwal = withReactContent(Swal);

const client = create({ url: 'http://127.0.0.1:5001/api/v0' });


function ManageOrderPbfRetailer() {
  const [contracts, setContracts] = useState(null);;

  const userdata = JSON.parse(sessionStorage.getItem('userdata'));
  const [dataOrder, setDataOrder] = useState([]);

  const obatStatusMap = {
    0: "In Local Production",
    1: "Requested NIE",
    2: "Approved NIE"
  };

  const tipeObatMap = {
    0n: "Obat Lain",
    1n: "Cold Chain Product"
  };

  const orderStatusMap = {
    0: "Order Placed",
    1: "Order Shipped",
    2: "Order Completed"
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

          const RoleManager = new Contract(
            contractData.RoleManager.address,
            contractData.RoleManager.abi,
            signer
          );

          setContracts({
            orderManagement: orderManagementContract,
            obatTradisional: obatTradisionalContract,
            roleManager: RoleManager
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
      if (contracts && userdata.instanceName) {

        try {
          const listOrderedObatCt = await contracts.orderManagement.getAllOrderFromSeller(userdata.instanceName);

          const tempData = [];

          for (let index = 0; index < listOrderedObatCt.length; index++) {
            const [orderId, obatId, namaProduk, batchName, orderQuantity, buyerUser, sellerUser, statusOrder] = listOrderedObatCt[index];

            const obj = {
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

          setDataOrder(tempData)
          console.log(dataOrder);

        } catch (error) {
          console.error("Error loading data: ", error);
        }
      }
    };
  
    loadData();
  }, [contracts, userdata.instanceName]);

  const handleEventOrderUpdate = (_batchName, _namaProduk,  _buyerInstance, _sellerInstance, _orderQuantity, _timestampOrder, txHash) => {
    const timestamp = new Date(Number(_timestampOrder) * 1000).toLocaleDateString('id-ID', options)
  
    MySwal.fire({
     title: "Order Shipped Successfully!",
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
              <p>Timestamp Order Shipped</p> 
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
    console.log(id, orderId);

    try {
      const detailObatCt = await contracts.obatTradisional.detailObat(id);
      const detailOrderCt = await contracts.orderManagement.detailOrder(orderId);
      const orderTimestampCt = await contracts.orderManagement.orderTimestamp(orderId);
      const orderObatIpfs = await contracts.orderManagement.obatIpfs(orderId);

      const [obatDetails, obatNie] = detailObatCt;

      const [merk, namaProduk, klaim, komposisi, kemasan, factoryInstance, factoryAddr, tipeObat, cpotbHash, cdobHash, jenisObat] = obatDetails;

      const [nieNumber, nieStatus, timestampProduction, timestampNieRequest, timestampNieApprove, bpomInstance, bpomAddr] = obatNie;

      const [orderIdProduk, obatIdProduk, namaProdukk, batchName, orderQuantity, buyerUser, sellerUser, statusOrder, prevOrderId] = detailOrderCt;

      const [timestampOrder, timestampShipped, timestampComplete] = orderTimestampCt;

      const detailObat = {
        obatId: id,
        merk: merk,
        namaProduk: namaProduk,
        klaim: klaim,
        kemasan: kemasan,
        komposisi: komposisi,
        tipeProduk: "Obat Tradisional", 
        nieStatus: obatStatusMap[nieStatus], 
        produtionTimestamp: timestampProduction ? new Date(Number(timestampProduction) * 1000).toLocaleDateString('id-ID', options) : '-', 
        nieRequestDate: timestampNieRequest ? new Date(Number(timestampNieRequest) * 1000).toLocaleDateString('id-ID', options) : '-', 
        nieApprovalDate:  timestampNieApprove ? new Date(Number(timestampNieApprove) * 1000).toLocaleDateString('id-ID', options): "-",
        nieNumber: nieNumber ? nieNumber : "-",
        factoryAddr: factoryAddr,
        factoryInstance: factoryInstance,
        bpomAddr: bpomAddr ,
        bpomInstance:  bpomInstance,
        tipeObat: tipeObatMap[tipeObat],
        jenisObat: jenisObat
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
        sellerAddress: sellerUser[1],
        statusOrder: orderStatusMap[statusOrder],
        orderObatIpfs: orderObatIpfs
      }

      const kemasanKeterangan = kemasan.match(/@(.+?)\s*\(/);

      if(statusOrder === 0n){
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
                            <p>Nama Obat</p>
                          </li>
                          <li className="input">
                            <p>{detailObat.namaProduk}</p> 
                          </li>
                        </ul>

                        <ul>
                          <li className="label">
                            <p>Batch Name</p>
                          </li>
                          <li className="input">
                            <p>{batchName}</p> 
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
                            <p>Total Order</p>
                          </li>
                          <li className="input">
                            <p>{orderQuantity.toString()} Obat</p>
                          
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

                        <ul>
                          <li className="label">
                            <p>Retailer Instance</p>
                          </li>
                          <li className="input">
                            <p>{detailOrder.buyerInstance}</p>
                          </li>
                        </ul>

                        <ul>
                          <li className="label">
                            <p>Retailer Address</p>
                          </li>
                          <li className="input">
                            <p>{detailOrder.buyerAddress}</p>
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
                          <p>Merk Obat</p>
                        </li>
                        <li className="input">
                          <p>{detailObat.merk}</p> 
                        </li>
                      </ul>

                      <ul>
                        <li className="label">
                          <p>Tipe Produk</p>
                        </li>
                        <li className="input colJenisSediaan">
                          <p>{
                          detailObat.jenisObat === "OHT" ? "Obat Herbal Terstandar" : detailObat.jenisObat}</p> 
                          <JenisSediaanTooltip
                            jenisSediaan={detailObat.jenisObat}
                          />
                        </li>
                      </ul>

                      <ul>
                        <li className="label">
                          <p>Tipe Obat</p>
                        </li>
                        <li className="input colJenisSediaan">
                          <p>{detailObat.tipeObat}</p> 
                          <JenisSediaanTooltip
                            jenisSediaan={detailObat.tipeObat}
                          />
                        </li>
                      </ul>
      
                      <ul>
                        <li className="label">
                          <p>Kemasan Obat</p>
                        </li>
                        <li className="input colJenisSediaan">
                          <p>{detailObat.kemasan}</p> 
                          <JenisSediaanTooltip
                            jenisSediaan={kemasanKeterangan[1]}
                          />
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
            generateIpfs(prevOrderId, detailObat, detailOrder, timestamps, orderId, batchName, cpotbHash, cdobHash)
          }
        })
      } else {
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
                            <p>Nama Obat</p>
                          </li>
                          <li className="input">
                            <p>{detailObat.namaProduk}</p> 
                          </li>
                        </ul>

                        <ul>
                          <li className="label">
                            <p>Batch Name</p>
                          </li>
                          <li className="input">
                            <p>{batchName}</p> 
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
                            <p>Total Order</p>
                          </li>
                          <li className="input">
                            <p>{orderQuantity.toString()} Obat</p>
                          
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

                        <ul>
                          <li className="label">
                            <p>Retailer Instance</p>
                          </li>
                          <li className="input">
                            <p>{detailOrder.buyerInstance}</p>
                          </li>
                        </ul>

                        <ul>
                          <li className="label">
                            <p>Retailer Address</p>
                          </li>
                          <li className="input">
                            <p>{detailOrder.buyerAddress}</p>
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
                          <p>Merk Obat</p>
                        </li>
                        <li className="input">
                          <p>{detailObat.merk}</p> 
                        </li>
                      </ul>

                      <ul>
                        <li className="label">
                          <p>Tipe Produk</p>
                        </li>
                        <li className="input colJenisSediaan">
                          <p>{
                          detailObat.jenisObat === "OHT" ? "Obat Herbal Terstandar" : detailObat.jenisObat}</p> 
                          <JenisSediaanTooltip
                            jenisSediaan={detailObat.jenisObat}
                          />
                        </li>
                      </ul>

                      <ul>
                        <li className="label">
                          <p>Tipe Obat</p>
                        </li>
                        <li className="input colJenisSediaan">
                          <p>{detailObat.tipeObat}</p> 
                          <JenisSediaanTooltip
                            jenisSediaan={detailObat.tipeObat}
                          />
                        </li>
                      </ul>
      
                      <ul>
                        <li className="label">
                          <p>Kemasan Obat</p>
                        </li>
                        <li className="input colJenisSediaan">
                          <p>{detailObat.kemasan}</p> 
                          <JenisSediaanTooltip
                            jenisSediaan={kemasanKeterangan[1]}
                          />
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

  const acceptOrder = async (orderId, ipfsHashes, instanceName, namaProduk, batchName, retailerInstance) => {
    
    MySwal.fire({
      title:"Processing your request...",
      text:"Your request is on its way. This won't take long. 🚀",
      icon: 'info',
      showCancelButton: false,
      showConfirmButton: false,
      allowOutsideClick: false,
    })
    console.log(orderId)
    try {
      const acceptOrderCt = await contracts.orderManagement.acceptOrderRetailer(orderId, ipfsHashes)
      console.log(acceptOrderCt);

      if(acceptOrderCt){
        updateBatchHistoryHash(instanceName, namaProduk, batchName, acceptOrderCt.hash, retailerInstance)
        MySwal.update({
          title: "Processing your transaction...",
          text: "This may take a moment. Hang tight! ⏳"
        });
      }

      contracts.orderManagement.once("evt_orderUpdate", (_batchName, _namaProduk,  _buyerInstance, _sellerInstance, _orderQuantity, _timestampOrder) => {
        handleEventOrderUpdate(_batchName, _namaProduk,  _buyerInstance, _sellerInstance, _orderQuantity, _timestampOrder, acceptOrderCt.hash)
      });

      
    } catch (error) {
      errAlert(error, "Can't Accept Order")
    }

  }
  
  const generateIpfs = async(prevOrderId, dataObat, dataOrder, timestamps, orderId, batchName, cpotbHash, cdobHash) => {
    MySwal.fire({ 
      title:"Processing your request...",
      text:"Your request is on its way. This won't take long. 🚀",
      icon: 'info',
      showCancelButton: false,
      showConfirmButton: false,
      allowOutsideClick: false,
    })

    let newIpfsHashes = [];

    const date = new Date();
    const formattedDate = new Intl.DateTimeFormat('id-ID', options).format(date);
    timestamps.timestampShipped = formattedDate;

    console.log(dataOrder);

    const timestampYear = new Date().getFullYear().toString().slice(-4);
    const randomFourLetters = Array.from({ length: 4 }, () =>
      String.fromCharCode(65 + Math.floor(Math.random() * 26))
    ).join(''); 

    try {
      const prevOrderPbfCt = await contracts.orderManagement.detailOrder(prevOrderId)
      const orderTimestampCt = await contracts.orderManagement.orderTimestamp(prevOrderId);

      console.log(orderTimestampCt);

      const pbfTimestampOrder =  new Date(Number(orderTimestampCt[0]) * 1000).toLocaleDateString('id-ID', options);
      const pbfTimestampShipped = orderTimestampCt[1] !== 0n ? new Date(Number(orderTimestampCt[1]) * 1000).toLocaleDateString('id-ID', options) : "-";
      const pbfTimestampCompleted = orderTimestampCt[2] !== 0n ? new Date(Number(orderTimestampCt[2]) * 1000).toLocaleDateString('id-ID', options) : "-";

      const userFactoryCt = await contracts.roleManager.getUserData(dataObat.factoryAddr);
      const userBpomCt = await contracts.roleManager.getUserData(dataObat.bpomAddr);
      const userRetailerCt = await contracts.roleManager.getUserData(dataOrder.buyerAddress);
      const userPbfCt = await contracts.roleManager.getUserData(userdata.address);

      for (let i = 0; i < dataOrder.orderQuantity; i++) {
        const obat = {
          batchName: batchName,
          obatIdPackage: `OT-${i}${timestampYear}-${randomFourLetters}`,
          cpotbHash: cpotbHash,
          cdobHash: cdobHash,
          dataObat:  {
            namaProduk: dataObat.namaProduk,
            merk: dataObat.merk,
            klaim: dataObat.klaim,
            kemasan: dataObat.kemasan,
            komposisi: dataObat.komposisi,
            factoryAddr: dataObat.factoryAddr,
            factoryInstanceName: dataObat.factoryInstance,
            factoryAddressInstance: userFactoryCt[4],
            nieNumber: dataObat.nieNumber,
            obatStatus: "NIE Approved",
            nieRequestDate: dataObat.nieRequestDate,
            nieApprovalDate: dataObat.nieApprovalDate,
            bpomAddr: dataObat.bpomAddr,
            bpomInstanceName: dataObat.bpomInstance,
            bpomAddressInstance: userBpomCt[4],
            tipeObat: dataObat.tipeObat,
            jenisObat: dataObat.jenisObat,
            factoryType:  userFactoryCt[5]
          },
          dataOrderPbf: {
            orderQuantity: parseInt(prevOrderPbfCt[4]),
            senderInstanceName: prevOrderPbfCt[5][0],
            senderAddress: prevOrderPbfCt[5][1],
            pbfInstanceAddress: userPbfCt[4],
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
            retailerInstanceAddress: userRetailerCt[4],
            statusOrder : "Order Shipped",
            targetInstanceName : dataOrder.sellerInstance,
            targetAddress: userdata.address,
            timestampOrder: timestamps.timestampOrder,
            timestampShipped: timestamps.timestampShipped
          }
        };

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
                    <p>Batch Name</p>
                  </li>
                  <li className="input input-1">
                    <p>{batchName}</p> 
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
        confirmButtonText: 'Confirm Obat',
        allowOutsideClick: false,
  
      }).then((result) => {
        if(result.isConfirmed){
          acceptOrder(orderId, newIpfsHashes, dataObat.factoryInstance, dataObat.namaProduk, batchName, dataOrder.buyerInstance)
        }
      })
    }

  }

  const updateBatchHistoryHash = async(factoryInstance, namaProduk, batchName, hash, retailerInstance) => {
    const documentId = `[OT] ${namaProduk}`;
    const factoryDocRef = doc(db, factoryInstance, documentId); 

    try {
      const docSnap = await getDoc(factoryDocRef);
      if (docSnap.exists()) {

        const data = docSnap.data();

        if (data.batchData && data.batchData[batchName]) {
          await updateDoc(factoryDocRef, {
            [`batchData.${batchName}.historyHash.orderShippedRetailer`]: hash,
            [`batchData.${batchName}.historyHash.orderShippedRetailerTimestamp`]: Date.now(),
            [`batchData.${batchName}.retailerInstance`]: retailerInstance
          });
          console.log(`Batch ${batchName} updated successfully.`);
        } else {
          errAlert({ reason: `Batch ${batchName} not found in batchData!` });
        }
      
      } else {
        errAlert({ reason: `Document ${documentId} not found!` });
      }
    } catch (error) {
      errAlert(error)
    }
  }

  return (
    <>
      <div id="ObatProduce" className='Layout-Menu layout-page'>
        <div className="title-menu">
          <h1>Data Order Obat Tradisional PBF</h1>
          <p>Di kelola oleh {userdata.instanceName}</p>
        </div>
        {/* <div className="tab-menu">
          <ul>
            <li><button className='active'  onClick={() => navigate('/manage-orders-pbf')}>Order Obat</button></li>
          </ul>
        </div> */}
        <div className="container-data ">
        <div className="data-list">
            {dataOrder.length !== 0 ? (
              <ul>
                {dataOrder.map((item, index) => (
                  <li key={index}>
                    <button className='title' onClick={() => getDetailObat(item.obatId, item.orderId)} >{item.namaProduk}</button>
                    <p>Batchname : {item.batchName}</p>
                    <p>Order Quantity : {item.orderQuantity.toString()} Obat</p>
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

export default ManageOrderPbfRetailer;