import { useEffect, useState } from 'react';
import { BrowserProvider, Contract } from "ethers";
import contractData from '../../auto-artifacts/deployments.json';
import { useNavigate } from 'react-router-dom';
import DataIpfsHash from '../../components/TableHash';
import "../../styles/MainLayout.scss"
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import './../../styles/SweetAlert.scss';
import JenisSediaanTooltip from '../../components/TooltipJenisSediaan';
import Loader from '../../components/Loader';
import imgSad from '../../assets/images/3.png'

const MySwal = withReactContent(Swal);

function StockObatRetailer() {
  const [contracts, setContracts] = useState(null);
  const navigate = useNavigate();
  const userdata = JSON.parse(sessionStorage.getItem('userdata'));
  const [dataObatReady, setDataObatReady] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fadeClass, setFadeClass] = useState('fade-in');
  const [fadeOutLoader, setFadeOutLoader] = useState(false);

  const stokStatusMap = {
    0: "Stock Tersedia",
    1: "Stock Kosong",
  };

  const tipeObatMap = {
    0n: "Obat Lain",
    1n: "Cold Chain Product"
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
    document.title = "Stok Obat Tradisional Retailer"; 
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

          const NieManager = new Contract(
            contractData.NieManager.address, 
            contractData.NieManager.abi, 
            signer
          );

          setContracts({
            orderManagement: orderManagementContract,
            obatTradisional: obatTradisionalContract,
            nieManager: NieManager,
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
          const allRetailerReadyObat = await contracts.orderManagement.getAllOrderFromBuyer(userdata.instanceName);
          console.log(allRetailerReadyObat);

          const reconstructedData = allRetailerReadyObat
          .filter(item => item[7] === 2n) 
          .map(item => ({
            orderId: item[0],
            obatId: item[1],
            namaProduk: item[2],
            batchName: item[3],
            obatQuantity: item[4],
            statusOrder: item[7],
            pbfInstance: item[6]
          }));
        
          setDataObatReady(reconstructedData)
          console.log(reconstructedData);

        } catch (error) {
          errAlert(error, "Can't access obat ready data.");
        } finally{
          setLoading(false);
        }
      }
    };
  
    loadData();
  }, [contracts, userdata.instanceName]);
  
  useEffect(() => {
    if (!loading) {
      setFadeOutLoader(true);
  
      setTimeout(() => {
        setFadeClass('fade-in');
      }, 400);
    }
  }, [loading]);

  const getDetailObat = async (id, orderId) => {
    console.log(id, orderId);
    try {
      const detailObatCt = await contracts.obatTradisional.detailObat(id);
      const detailOrderCt = await contracts.orderManagement.detailOrder(orderId);
      const orderTimestampCt = await contracts.orderManagement.orderTimestamp(orderId);
      const orderObatIpfs = await contracts.orderManagement.obatIpfs(orderId);
      const detailNieCt = await contracts.nieManager.getNieDetail(id)

      const [merk, namaProduk, klaim, komposisi, kemasan, factoryInstance, factoryAddr, tipeObat, cpotbHash, cdobHash, jenisObat] = detailObatCt;

      const [nieNumber, nieStatus, timestampProduction, timestampNieRequest, timestampNieApprove, timestampNieRejected, timestampNieRenewRequest, factoryInstanceee, bpomInstance, bpomAddr] = detailNieCt[0];

      const [orderIdProduk, obatIdProduk, namaProdukk, batchName, orderQuantity, buyerUser, sellerUser, statusOrder] = detailOrderCt;

      const [timestampOrder, timestampShipped, timestampComplete] = orderTimestampCt;

      const detailObat = {
        obatId: id,
        merk: merk,
        namaProduk: namaProduk,
        klaim: klaim,
        kemasan: kemasan,
        komposisi: komposisi,
        nieStatus: 'NIE Approved', 
        produtionTimestamp: timestampProduction ? new Date(Number(timestampProduction) * 1000).toLocaleDateString('id-ID', options) : '-', 
        nieRequestDate: timestampNieRequest ? new Date(Number(timestampNieRequest) * 1000).toLocaleDateString('id-ID', options) : '-', 
        nieApprovalDate:  timestampNieApprove ? new Date(Number(timestampNieApprove) * 1000).toLocaleDateString('id-ID', options): "-",
        nieNumber: nieNumber ? nieNumber : "-",
        factoryAddr: factoryAddr,
        factoryInstance: factoryInstance,
        bpomAddr: bpomAddr ,
        bpomInstance:  bpomInstance,
        tipeObat: tipeObatMap[tipeObat],
        jenisObat: jenisObat,
      };

      const timestamps = {
        timestampOrder: timestampOrder ? new Date(Number(timestampOrder) * 1000).toLocaleDateString('id-ID', options) : 0, 
        timestampShipped: timestampShipped ? new Date(Number(timestampShipped) * 1000).toLocaleDateString('id-ID', options) : 0,
        timestampComplete: timestampComplete ?  new Date(Number(timestampComplete) * 1000).toLocaleDateString('id-ID', options) : 0
      }

      const kemasanKeterangan = kemasan.match(/@(.+?)\s*\(/);

      MySwal.fire({
        title: `Detail ${detailObat.namaProduk}`,
        html: (
          <div className='form-swal order'>
            <div className="row1">
              <div className="produce-obat">
                <div className="detailObat">
                  <div className="row row--obat">
                    <div className="col column-label">

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
                          <p>Nama Instansi Pabrik</p>
                        </li>
                        <li className="input">
                          <p>{factoryInstance}
                            <span className='linked'>
                              <a
                                href={`http://localhost:3000/public/certificate/${cpotbHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                (Detail CPOTB
                                <i class="fa-solid fa-arrow-up-right-from-square"></i>)
                              </a>
                            </span>
                          </p>
                        </li>
                      </ul>
                    
                      <ul className='klaim'>
                        <li className="label">
                          <p>Alamat Akun Pabrik (Pengguna)</p>
                        </li>
                        <li className="input">
                          <p>{factoryAddr}</p>
                        </li>
                      </ul>

                      <ul>
                        <li className="label">
                          <p>Nama Instansi PBF</p>
                        </li>
                        <li className="input">
                          <p>{sellerUser[0]}
                            <span className='linked'>
                              <a
                                href={`http://localhost:3000/public/certificate/${cdobHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                (Detail CDOB
                                <i class="fa-solid fa-arrow-up-right-from-square"></i>)
                              </a>
                            </span>
                          </p>
                        </li>
                      </ul>
                    
                      <ul className='klaim'>
                        <li className="label">
                          <p>Alamat Akun PBF (Pengguna)</p>
                        </li>
                        <li className="input">
                          <p>{sellerUser[1]}</p>
                        </li>
                      </ul>
                    
                      <ul>
                        <li className="label">
                          <p>Nama Instansi Retailer</p>
                        </li>
                        <li className="input">
                          <p>{buyerUser[0]}</p>
                        </li>
                      </ul>
                    
                      <ul>
                        <li className="label">
                          <p>Nama Instansi Retailer</p>
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
                <DataIpfsHash ipfsHashes={orderObatIpfs} />
              </div>
              <div className="row row--obat">
                <div className="col column">

                    <ul>
                      <li className="label">
                        <p>Nama Batch</p>
                      </li>
                      <li className="input">
                        <p>{batchName}</p> 
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
        width: '1000',
        showCancelButton: false,
        showCloseButton: true,
        showConfirmButton: false,
        customClass: {
          htmlContainer: 'scrollable-modal'
        },
      })
      
    } catch (e) {
      errAlert(e, "Can't retrieve data")
    }
  }

  return (
    <>
      <div id="ObatProduce" className='Layout-Menu layout-page'>
        <div className="title-menu">
          <h1>Data Obat Tradisional Retailer</h1>
          <p>Oleh {userdata.instanceName}</p>
        </div>
        <div className="tab-menu">
          <ul>
          <li><button onClick={() => navigate('/create-retailer-order')}>Pengajuan Order</button></li>
          <li><button onClick={() => navigate('/retailer-orders')}>Order Obat Tradisional</button></li>
            <li><button className='active' onClick={() => navigate('/obat-available-retailer')}>Inventaris Batch Obat</button></li>
          </ul>
        </div>
        <div className="container-data ">
          <div className="data-list">
            <div className="fade-container">
              <div className={`fade-layer loader-layer ${fadeOutLoader ? 'fade-out' : 'fade-in'}`}>
                <Loader />
              </div>

              <div className={`fade-layer content-layer ${!loading ? 'fade-in' : 'fade-out'}`}>
              {dataObatReady.length > 0 ? (
              <ul>
                {dataObatReady.map((item, index) => 
                  <li key={index}>
                    <button className='title' onClick={() => getDetailObat(item.obatId, item.orderId)}> 
                      [{item.batchName}] {item.namaProduk}
                    </button>
                    <p>Total Stok: {item.obatQuantity.toString()} Obat</p>
                    <button className={`statusOrder ${item.statusStok}`}>{item.statusStok}</button>
                  </li>
                )}
              </ul>
              ) : (
                  <div className="image">
                    <img src={imgSad}/>
                    <p className='small'>Maaf, belum ada data obat yang tersedia.</p>
                  </div>
                )}
              </div>
            </div>
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
    confirmButtonText: 'Coba Lagi',
    didOpen: () => {
      const actions = Swal.getActions();
      actions.style.justifyContent = "center";
    }
  });

  console.error(customMsg)
  console.error(errorObject);
}

export default StockObatRetailer;