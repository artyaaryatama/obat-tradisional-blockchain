import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
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
    0: "Stock Available",
    1: "Stock Empty",
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

          const allPbfReadyObat = await contracts.orderManagement.getAllObatPbfByInstance(userData.instanceName);
          console.log(allPbfReadyObat);

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

  const getDetailObat = async (id, orderId) => {

    try {
      const detailObatCt = await contracts.obatTradisional.detailObat(id);
      const detailOrderCt = await contracts.orderManagement.detailOrder(orderId);
      const orderTimestampCt = await contracts.orderManagement.orderTimestamp(orderId);
      const orderObatIpfs = await contracts.orderManagement.obatIpfs(orderId);

      const [obatDetails, obatNie] = detailObatCt;

      const [merk, namaProduk, klaim, komposisi, kemasan, tipeProduk, factoryInstance, factoryAddr] = obatDetails;

      const [nieNumber, nieStatus, timestampProduction, timestampNieRequest, timestampNieApprove, bpomInstance, bpomAddr] = obatNie;

      const [orderIdd, obatId, namaProdukk, batchName, orderQuantity, buyerUser, sellerUser, statusOrder] = detailOrderCt

      const [timestampOrder, timestampShipped, timestampComplete] = orderTimestampCt

      const detailObat = {
        obatId: id,
        merk: merk,
        namaProduk: namaProduk,
        klaim: klaim,
        kemasan: kemasan,
        komposisi: komposisi,
        tipeProduk: tipeProdukMap[tipeProduk], 
        nieStatus: 'NIE Approved', 
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
                          <p>{buyerUser[0]}</p>
                        </li>
                      </ul>
                    
                      <ul>
                        <li className="label">
                          <p>PBF Instance</p>
                        </li>
                        <li className="input">
                          <p>{buyerUser[1]}</p>
                        </li>
                      </ul>

                      <ul>
                        <li className="label">
                          <p>Total Stok</p>
                        </li>
                        <li className="input">
                          {
                            statusOrder === 2n ? 
                            <p> {orderQuantity.toString()} Obat (Stock Empty)</p> : 
                            <p> {orderQuantity.toString()} Obat (Stock Available)</p>
                          }
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
            <li><button onClick={() => navigate('/create-pbf-order')}>Pengajuan Order</button></li>
            <li><button onClick={() => navigate('/pbf-orders')}>Order Obat Tradisional</button></li>
            <li><button className='active' onClick={() => navigate('/obat-available-pbf')}>Obat Ready Stok</button></li>
          </ul>
        </div>
        <div className="container-data ">
          <div className="data-list">
            {dataObatReady.length > 0 ? (
              <ul>
                {dataObatReady.map((item, index) => (
                  <li key={index}>
                    <button className='title' onClick={() => getDetailObat(item.obatId, item.orderId)} >[{item.batchName}] {item.namaProduk}</button>
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