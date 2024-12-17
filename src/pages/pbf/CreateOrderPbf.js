import { useEffect, useState } from 'react';
import { BrowserProvider, Contract } from "ethers";
import contractData from '../../auto-artifacts/deployments.json';
import { useNavigate } from 'react-router-dom';

import "../../styles/MainLayout.scss"
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import './../../styles/SweetAlert.scss';

const MySwal = withReactContent(Swal);

function CreateOrderPbf() {
  const [contracts, setContracts] = useState(null);
  const navigate = useNavigate();

  const userData = JSON.parse(sessionStorage.getItem('userdata'));
  const [dataObat, setDataObat] = useState([]);
  const [ipfsHashes, setIpfsHashes] = useState([])
  

  const obatStatusMap = {
    0: "In Local Production",
    1: "Requested NIE",
    2: "Approved NIE"
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
            obatTradisional: obatTradisionalContract,
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
          const allProduceObatCt = await contracts.obatTradisional.getAllBatchProductionReadyStock();
          console.log(allProduceObatCt);

          const reconstructedData = allProduceObatCt.map(item => ({
            obatId: item[0],
            namaProduk: item[1],
            batchName: item[2],
            obatQuantity: parseInt(item[3]),
            factoryInstanceName: item[5]
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
      
      contracts.orderManagement.on("evt_orderUpdate", (_batchName, _namaProduk,  _buyerInstance, _sellerInstance, _orderQuantity, _timestampOrder) => {

        const timestamp = new Date(Number(_timestampOrder) * 1000).toLocaleDateString('id-ID', options)
    
        MySwal.fire({
          title: "Success Create Order Obat Tradisional",
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
                  <p>Timestamp Request Order</p> 
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
            navigate('/pbf-orders')
          }
        });

      });

  
      return () => {
        contracts.orderManagement.removeAllListeners("evt_orderUpdate");
      };
    }
  }, [contracts]);
  

  const orderDetail = async (id, batchName) => {
    console.log(id, batchName);
    try {
      const detailObatCt = await contracts.obatTradisional.detailObat(id);
      const detailBatchCt = await contracts.obatTradisional.detailBatchProduction(id, batchName)

      console.log(detailBatchCt);

      const [obatDetails, obatNie] = detailObatCt;

      const [dataObat, obatIpfs] = detailBatchCt

      const [statusStok, namaProduct, batchNamee, obatQuantity, factoryInstancee] = dataObat

      const [merk, namaProduk, klaim, komposisi, kemasan, tipeProduk, factoryInstance, factoryAddr] = obatDetails;

      const [nieNumber, nieStatus, timestampProduction, timestampNieRequest, timestampNieApprove, bpomInstance, bpomAddr] = obatNie;

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
        factoryInstanceName: factoryInstance,
        bpomAddr: bpomAddr === "0x0000000000000000000000000000000000000000" ? "-" : bpomAddr,
        bpomInstanceNames:  bpomInstance ?  bpomInstance : "-"
      };

      MySwal.fire({
        title: `Form Order Obat ${detailObat.namaObat}`,
        html: (
          <div className='form-swal'>
              <div className="row row--obat">
                <div className="col">
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
                        <ul className='numbered1'>
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
                        <ul className='numbered1'>
                          {detailObat.komposisi.map((item, index) => (
                            <li key={index}><p>{item}</p></li>
                          ))}
                        </ul>
                      </li>
                    </ul>

                    <ul>
                      <li className="label">
                        <p>Factory Instance</p>
                      </li>
                      <li className="input">
                        <p>{detailObat.factoryInstanceName}</p>
                      </li>
                    </ul>

                    <ul>
                      <li className="label">
                        <p>Factory Address</p>
                      </li>
                      <li className="input">
                        <p>{detailObat.factoryAddr}</p>
                      </li>
                    </ul>

                </div>
              </div>
          </div>
        ),
        width: '620',
        showCancelButton: true,
        confirmButtonText: 'Order Obat',
      }).then((result) => {

        if(result.isConfirmed){

          MySwal.fire({
            title:"Processing your request...",
            text:"Your request is on its way. This won't take long. 🚀",
            icon: 'info',
            showCancelButton: false,
            showConfirmButton: false,
            allowOutsideClick: false,
          })

          orderObat(id, factoryInstance, namaProduk, obatQuantity, batchName)
        }
      })
      
    } catch (e) {
      errAlert(e, "Can't retrieve data")
    }
  }

  const orderObat = async (id, factoryInstance, namaProduk, orderQuantity, batchName) => {

    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0'); 
    const year = today.getFullYear();
    const randomNumber = Math.floor(100000 + Math.random() * 900000); 

    const orderId = `ORDER-PBF-${day}${month}${year}-${randomNumber}` 
  
    try {
      console.log(orderId, id, namaProduk, factoryInstance, userData.instanceName, orderQuantity);
      const createOrderCt = await contracts.orderManagement.createOrderPbf(orderId, id, batchName, namaProduk, userData.instanceName, factoryInstance, orderQuantity);

      if(createOrderCt){
        MySwal.update({
          title: "Processing your transaction...",
          text: "This may take a moment. Hang tight! ⏳"
        });
      }

    } catch (error) {
      errAlert(error, "Can't make an obat order.")
    }

  }

  return (
    <>
      <div id="ObatProduce" className='Layout-Menu layout-page'>
        <div className="title-menu">
          <h1>Pengajuan Order Obat Tradisional</h1>
          <p>Oleh {userData.instanceName}</p>
        </div>
        <div className="tab-menu">
          <ul>
            <li><button className='active' onClick={() => navigate('/create-pbf-order')}>Pengajuan Order</button></li>
            <li><button  onClick={() => navigate('/pbf-orders')}>Order Obat Tradisional</button></li>
          </ul>
        </div>
        <div className="container-data ">
          <div className="data-list">
            {dataObat.length > 0 ? (
              <ul>
                {dataObat.map((item, index) => (
                  <li key={index} className='row'>
                    <div className="detail">
                      <h5>{item.namaProduk}</h5>
                      <p>Batchname : {item.batchName}</p>
                      <p>Stok tersedia: {item.obatQuantity} Obat</p>
                      <p>Factory Instance: {item.factoryInstanceName}</p>

                    </div>
                    <div className="order">
                      <button className='order' onClick={() => orderDetail(item.obatId, item.batchName)} >
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

export default CreateOrderPbf;