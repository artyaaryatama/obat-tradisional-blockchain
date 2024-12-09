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

function CreateOrderRetailer() {
  const [contracts, setContracts] = useState(null);
  const navigate = useNavigate();

  const userData = JSON.parse(sessionStorage.getItem('userdata'));
  const [dataObat, setDataObat] = useState([]);
  const [ipfsHashes, setIpfsHashes] = useState([])
  

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

          const tx = await contracts.orderManagement.getListAllReadyObatPbf(userData.instanceName);
          console.log(tx);

          const [obatIdArray, namaProdukArray, obatQuantityArray, batchNameArray] = tx

          // use map on obatIdArray, which iterates through each obatId
          const reconstructedData = obatIdArray.map((obatId, index) => ({
            idObat: obatIdArray[index],
            namaObat: namaProdukArray[index],
            obatQuantity: obatQuantityArray[index].toString(),
            batchName: batchNameArray[index]
          }));

          setDataObat(reconstructedData)
          console.log(reconstructedData);

        } catch (error) {
          errAlert(error, "Can't retrieve obat produced data.")
        }
      }
    };
  
    loadData();
  }, [contracts]);

  useEffect(() => {
    if (contracts) {
      
      contracts.orderManagement.on("evt_obatOrdered", (_namaProduk, _orderQuantity, _orderId, _pbfInstanceName, _targetInstanceName, _timestampOrder) => {

        const timestamp = new Date(Number(_timestampOrder) * 1000).toLocaleDateString('id-ID', options)
    
        MySwal.fire({
          title: "Success Order Obat Tradisional",
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
                  <p>Total Order</p> 
                </li>
                <li className="input">
                  <p>{_orderQuantity.toString()} Obat</p> 
                </li>
              </ul>
              <ul>
                <li className="label">
                  <p>Dari PBF</p> 
                </li>
                <li className="input">
                  <p>{_targetInstanceName}</p> 
                </li>
              </ul>
              <ul>
                <li className="label">
                  <p>Tanggal </p> 
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
        contracts.orderManagement.removeAllListeners("evt_obatOrdered");
      };
    }
  }, [contracts]);

  const orderDetail = async (id) => {

    try {
      const listDetailObatCt = await contracts.obatTradisional.getListObatById(id);
      const detailObatPbfCt = await contracts.orderManagement.getDetailPbfObat(id, userData.instanceName)
      
      const [obatDetails, factoryAddress, factoryInstanceName, factoryUserName, bpomAddress, bpomInstanceName, bpomUserName] = listDetailObatCt;
      
      const [orderId, batchName, obatIdProduk, namaProduk, statusStok, obatQuantity, obatIpfsHash, ownerInstanceName] = detailObatPbfCt;

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
        title: `Form Order Obat ${detailObat.namaObat}`,
        html: (
          <div className='form-swal'>
              <div className="row row--obat">
                <div className="col column">
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
                      <p>{detailObat.factoryInstanceName}</p>
                    </li>
                  </ul>

                  <ul>
                    <li className="label">
                      <p>Di Distribusikan oleh</p>
                    </li>
                    <li className="input">
                      <p>{ownerInstanceName}</p>
                    </li>
                  </ul>

                  <ul>
                    <li className="label">
                      <p>Stok Tersedia</p>
                    </li>
                    <li className="input">
                      <p>{obatQuantity.toString()} Obat</p>
                    
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
        ),
        width: '820',
        showCancelButton: true,
        confirmButtonText: 'Order Obat',
      }).then((result) => {

        if(result.isConfirmed){
          orderObat(id, namaProduk, parseInt(obatQuantity), userData.instanceName, userData.address, ownerInstanceName)
        }
      })
      
    } catch (e) {
      errAlert(e, "Can't retrieve data")
    }
  }

  const orderObat = async (idProduk, namaProduk, orderQuantity, retailerInstanceName, retailerAddr ,ownerInstanceName) => {

    MySwal.fire({
      title:"Processing your request...",
      text:"Your request is on its way. This won't take long. 🚀",
      icon: 'info',
      showCancelButton: false,
      showConfirmButton: false,
      allowOutsideClick: false,
    })
  
    try {
      const randomNumber = Math.floor(100000 + Math.random() * 900000); 
      const idOrder =  `ORDER-${randomNumber}`; 

      console.log(idProduk, idOrder, namaProduk, orderQuantity, retailerInstanceName, retailerAddr, ownerInstanceName);

      const createOrderCt = await contracts.orderManagement.createOrder(idProduk, idOrder, namaProduk, orderQuantity, retailerInstanceName, retailerAddr, ownerInstanceName);

      console.log(createOrderCt);

    } catch (error) {
      errAlert(error, "Can't make an obat order.")
    }

  }

  // const generateIpfs = async(dataObat, orderId, batchName) => {
  //   MySwal.fire({
  //     title:"Processing your request...",
  //     text:"Your request is on its way. This won't take long. 🚀",
  //     icon: 'info',
  //     showCancelButton: false,
  //     showConfirmButton: false,
  //     allowOutsideClick: false,
  //   })

  //   try {
  //     const detailOrderPbfCt = await contracts.orderManagement.getHistoryOrderObatPbf(batchName)
  //     const [orderIdPbf, namaProdukPbf, obatIdProdukPbf, batchNamePbf, obatQuantityPbf, senderPbf, targetPbf, statusOrderPbf, timestampOrderPbf, timestampShippedPbf, timestampCompletePbf] = detailOrderPbfCt

  //     const detailOrderPbf = {
  //       orderId: orderIdPbf,
  //       batchName: batchNamePbf,
  //       orderQuantity: parseInt(obatQuantityPbf),
  //       senderInstanceName: senderPbf,
  //       statusOrder : obatStatusMap[statusStok],
  //       targetInstanceName : targetPbf,
  //       timestampOrder: timestampOrderPbf ? new Date(Number(timestampOrderPbf) * 1000).toLocaleDateString('id-ID', options) : 0, 
  //       timestampShipped: timestampOrderPbf ? new Date(Number(timestampOrderPbf) * 1000).toLocaleDateString('id-ID', options) : 0,
  //       timestampComplete: timestampCompletePbf ?  new Date(Number(timestampCompletePbf) * 1000).toLocaleDateString('id-ID', options) : 0
  //     };

  //     let newIpfsHashes = [];
  //     const randomFourDigit = Math.floor(1000 + Math.random() * 9000); 
  //     const randomTwoLetters = String.fromCharCode(
  //       65 + Math.floor(Math.random() * 26),
  //       65 + Math.floor(Math.random() * 26)
  //     );
      
  //     for (let i = 0; i < dataOrder.orderQuantity; i++) {
  //       const obat = {
  //         batchName: batchName,
  //         obatIdPackage: `OT-${i * 23}${randomFourDigit}${randomTwoLetters}`,
  //         dataObat:  {
  //           obatIdProduk: dataObat.obatId,
  //           namaProduk: dataObat.namaObat,
  //           merk: dataObat.merk,
  //           klaim: dataObat.klaim,
  //           kemasan: dataObat.kemasan,
  //           komposisi: dataObat.komposisi,
  //           factoryAddr: dataObat.factoryAddr,
  //           factoryInstanceName: dataObat.factoryInstanceName,
  //           factoryUserName: dataObat.factoryUserName,
  //           tipeProduk: dataObat.tipeProduk,
  //           nieNumber: dataObat.nieNumber,
  //           nieRequestDate: dataObat.nieRequestDate,
  //           nieApprovalDate: dataObat.nieApprovalDate,
  //           bpomAddr: dataObat.bpomAddr,
  //           bpomInstanceName: dataObat.bpomInstanceName,
  //           bpomUserName: dataObat.bpomUserName
  //         },
  //         datOrderPbf: {
  //           orderQuantity: ,
  //           senderInstanceName: ,
  //           statusOrder : ,
  //           targetInstanceName : ,
  //           timestampOrder: ,
  //           timestampShipped: 
  //         },
  //         dataOrderRetailer: {
  //           orderQuantity: dataOrder.orderQuantity,
  //           senderInstanceName: dataOrder.senderInstanceName,
  //           statusOrder : dataOrder.statusOrder,
  //           targetInstanceName : dataOrder.targetInstanceName,
  //           timestampOrder: dataOrder.timestampOrder,
  //           timestampShipped: dataOrder.timestampShipped
  //         }
  //       };
        
  //       try {
  //         console.log(obat);
  //         const result = await client.add(JSON.stringify(obat), 
  //           { progress: (bytes) => 
  //             console.log(`Uploading ${i+1}/${dataOrder.orderQuantity}: ${bytes} bytes uploaded`) }
  //         );
  
  //         newIpfsHashes.push(result.path); 
  //       } catch (error) {
  //         errAlert(error, "Can't upload Data Obat to IPFS."); 
  //         break;
  //       }
  //     }
  
  //     console.log("Generated IPFS Hashes:", newIpfsHashes);
  
  //     if(newIpfsHashes.length !== 0){
  //       MySwal.fire({
  //         title: `Order Obat ${dataObat.namaObat}`,
  //         html: (
  //           <div className='form-swal'>
  //             <div className="row row--obat">
  //               <div className="col">
    
  //                 <ul>
  //                   <li className="label label-1">
  //                     <p>Nama Produk</p>
  //                   </li>
  //                   <li className="input input-1">
  //                     <p>{dataObat.namaObat}</p> 
  //                   </li>
  //                 </ul>
    
  //                 <ul>
  //                   <li className="label label-1">
  //                     <p>Nama PBF</p> 
  //                   </li>
  //                   <li className="input input-1">
  //                     <p>{dataOrder.targetInstanceName}</p> 
  //                   </li>
  //                 </ul>
    
  //                 <ul>
  //                   <li className="label label-1">
  //                     <p>Nama Retailer</p> 
  //                   </li>
  //                   <li className="input input-1">
  //                     <p>{dataOrder.senderInstanceName}</p> 
  //                   </li>
  //                 </ul>
    
  //                 <ul>
  //                   <li className="label label-1">
  //                     <p>Total Order</p> 
  //                   </li>
  //                   <li className="input input-1">
  //                     <p>{dataOrder.orderQuantity} Obat</p>
  //                   </li>
  //                 </ul>
    
  //                 <ul>
  //                   <li className="input full-width-table">
  //                     <DataIpfsHash ipfsHashes={newIpfsHashes} />
  //                   </li>
  //                 </ul>
  //               </div>
  //             </div>
            
  //           </div>
  //         ),
  //         width: '820',
  //         showCancelButton: true,
  //         confirmButtonText: 'Send Obat',
  //         allowOutsideClick: false,
    
  //       }).then((result) => {
  //         if(result.isConfirmed){
  //           acceptOrder(batchName, orderId, dataObat.obatId, newIpfsHashes)
  //         }
  //       })
  //     }

  //   } catch (error) {
  //     errAlert(error, "Can't find data history order PBF.")
  //   }

  // }

  return (
    <>
      <div id="ObatProduce" className='Layout-Menu layout-page'>
        <div className="title-menu">
          <h1>Pengajuan Order Obat Tradisional</h1>
          <p>Oleh {userData.instanceName}</p>
        </div>
        <div className="tab-menu">
          <ul>
            <li><button className='active' onClick={() => navigate('/create-retailer-order')}>Pengajuan Order</button></li>
            <li><button  onClick={() => navigate('/retailer-orders')}>Order Obat Tradisional</button></li>
            <li><button onClick={() => navigate('/obat-available-retailer')}>Obat Ready Stock</button></li>
          </ul>
        </div>
        <div className="container-data ">
          <div className="data-list">
            {dataObat.length > 0 ? (
              <ul>
                {dataObat.map((item, index) => (
                  <li key={index} className='row'>
                    <div className="detail">
                      <h5>{item.namaObat}</h5>
                      <p>Stok tersedia: {item.obatQuantity} Obat</p>
                    </div>
                    <div className="order">
                      <button className='order' onClick={() => orderDetail(item.idObat)} >
                        <i className="fa-solid fa-cart-shopping"></i>
                        Order Obat
                      </button>

                    </div>
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

export default CreateOrderRetailer;