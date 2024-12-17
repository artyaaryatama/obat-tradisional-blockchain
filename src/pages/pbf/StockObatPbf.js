import { useEffect, useState } from 'react';
import { BrowserProvider, Contract } from "ethers";
import contractData from '../../auto-artifacts/deployments.json';
import { useNavigate } from 'react-router-dom';

import DataIpfsHash from '../../components/TableHash';
import OrderStatusStepper from '../../components/StepperOrder';

import "../../styles/MainLayout.scss"
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import './../../styles/SweetAlert.scss';

const MySwal = withReactContent(Swal);

function StockObatPbf() {
  const [contracts, setContracts] = useState(null);
  const navigate = useNavigate();

  const userData = JSON.parse(sessionStorage.getItem('userdata'));
  const [dataObatReady, setDataObatReady] = useState([]);
  
  const obatStatusMap = {
    0: "Order Placed",
    1: "Order Shipped",
    2: "Order Completed"
  };

  const stokStatusMap = {
    0: "Stok Available",
    1: "Stok Empty",
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
    document.title = "Stok Ready Obat Tradisional"; 
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

          const allPbfReadyObat = await contracts.orderManagement.getAllObatPbfReadyStock();
          console.log(allPbfReadyObat);
          // const [obatIdArray, namaProdukArray, obatQuantityArray, batchNameArray] = tx

          const reconstructedData = allPbfReadyObat.map((item, index) => ({
            orderId: item[0],
            obatId: item[1],
            namaProduk: item[2],
            batchName: item[3],
            obatQuantity: item[4],
            statusStok: stokStatusMap[item[5]],
            pbfInstance: item[6]
          }));

          setDataObatReady(reconstructedData)
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

      // contracts.orderManagement.on("evt_updateOrder", (_namaProduk, _batchName, _targetInstanceName, _senderInstanceName, _orderQuantity, _latestTimestamp) => {

      //   const timestamp = new Date(Number(_latestTimestamp) * 1000).toLocaleDateString('id-ID', options)

      //   MySwal.fire({
      //     title:  `Success Accept Order Delivery Obat ${_namaProduk}`,
      //     html: (
      //       <div className='form-swal'>
      //         <ul>
      //           <li className="label">
      //             <p>Nama Obat</p> 
      //           </li>
      //           <li className="input">
      //             <p>{_namaProduk}</p> 
      //           </li>
      //         </ul>
      //         <ul>
      //           <li className="label">
      //             <p>Batch Name</p> 
      //           </li>
      //           <li className="input">
      //             <p>{_batchName}</p> 
      //           </li>
      //         </ul>
      //         <ul>
      //           <li className="label">
      //             <p>Di produksi oleh</p> 
      //           </li>
      //           <li className="input">
      //             <p>{_targetInstanceName}</p> 
      //           </li>
      //         </ul>
      //         <ul>
      //           <li className="label">
      //             <p>Di order oleh</p> 
      //           </li>
      //           <li className="input">
      //             <p>{_senderInstanceName}</p> 
      //           </li>
      //         </ul>
      //         <ul>
      //           <li className="label">
      //             <p>Total order</p> 
      //           </li>
      //           <li className="input">
      //             <p>{_orderQuantity.toString()} Obat</p> 
      //           </li>
      //         </ul>
      //         <ul>
      //           <li className="label">
      //             <p>Tanggal pengiriman</p> 
      //           </li>
      //           <li className="input">
      //             <p>{timestamp}</p> 
      //           </li>
      //         </ul>
      //       </div>
      //     ),
      //     icon: 'success',
      //     width: '560',
      //     showCancelButton: false,
      //     confirmButtonText: 'Oke',
      //     allowOutsideClick: true,
      //   }).then((result) => {
      //     if (result.isConfirmed) {
      //       window.location.reload()
      //     }
      //   });
      // })
  
      // return () => {
      //   contracts.orderManagement.removeAllListeners("evt_updateOrder");
      // };
    }
  }, [contracts]);
  

  const getDetailObat = async (id) => {

    try {
      const listObatCt = await contracts.obatTradisional.getListObatById(id);
      const detailObatPbfCt = await contracts.orderManagement.getDetailPbfObat(id, userData.instanceName)
      console.log(detailObatPbfCt);

      const [obatDetails, factoryAddress, factoryInstanceName, factoryUserName, bpomAddress, bpomInstanceName, bpomUserName] = listObatCt;

      const [orderId, batchName, obatIdProduk, namaProduk, statusStok, obatQuantity, obatIpfsHash, ownerInstanceName] = detailObatPbfCt;

      const detailObat = {
        obatId: obatDetails.obatId,
        merk: obatDetails.merk,
        namaProduk: obatDetails.namaProduk,
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
        title: `Produksi Obat ${detailObat.namaProduk}`,
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
                          <p>{detailObat.namaProduk}</p> 
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
                          <p>Batch</p>
                        </li>
                        <li className="input">
                          <p>{batchName}</p>
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
                          <p>Di Distribusikan oleh</p>
                        </li>
                        <li className="input">
                          <p>{ownerInstanceName}</p>
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
        showCloseButton: true,
        showCancelButton: false,
        showConfirmButton: false
      })
      
    } catch (e) {
      errAlert(e, "Can't retrieve data")
    }
  }

  return (
    <>
      <div id="ObatProduce" className='Layout-Menu layout-page'>
        <div className="title-menu">
          <h1>Data Obat Tradisional PBF</h1>
          <p>Oleh {userData.instanceName}</p>
        </div>
        <div className="tab-menu">
          <ul>
            <li><button className='active' onClick={() => navigate('/obat-available-pbf')}>Ready Stok</button></li>
            <li><button onClick={() => navigate('/manage-orders-pbf')}>Order Obat</button></li>
          </ul>
        </div>
        <div className="container-data ">
          <div className="data-list">
            {dataObatReady.length > 0 ? (
              <ul>
                {dataObatReady.map((item, index) => (
                  <li key={index}>
                    <button className='title' onClick={() => getDetailObat(item.obatId)} >[{item.batchName}] {item.namaProduk}</button>
                    <p>
                      Total Stok: {item.obatQuantity.toString()} Obat
                    </p>
                    <button className={`statusOrder ${item.statusStok}`}>
                      {item.statusStok}
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

export default StockObatPbf;