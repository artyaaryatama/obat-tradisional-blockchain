import { useEffect, useState } from 'react';
import { BrowserProvider, Contract } from "ethers";
import contractData from '../../auto-artifacts/deployments.json';
import { useNavigate } from 'react-router-dom';
import "../../styles/MainLayout.scss"
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import './../../styles/SweetAlert.scss';
import JenisSediaanTooltip from '../../components/TooltipJenisSediaan';
import { doc, getDoc, updateDoc, setDoc} from "firebase/firestore";
import { db } from "../../firebaseConfig";
import Loader from '../../components/Loader';
import imgSad from '../../assets/images/3.png'

const MySwal = withReactContent(Swal);

function CreateOrderRetailer() {
  const [contracts, setContracts] = useState(null);
  const navigate = useNavigate();
  const userdata = JSON.parse(sessionStorage.getItem('userdata'));
  const [dataObat, setDataObat] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fadeClass, setFadeClass] = useState('fade-in');
  const [fadeOutLoader, setFadeOutLoader] = useState(false);
  
  const obatStatusMap = {
    0: "Order Placed",
    1: "Order Shipped",
    2: "Order Completed"
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
    document.title = "Order Obat Tradisional"; 
  }, []);

  useEffect(() => {
    async function connectWallet() {
      if (window.ethereum) {
        try {
          const provider = new BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const OrderManagement = new Contract(
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
            orderManagement: OrderManagement,
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

          const allPbfReadyObat = await contracts.orderManagement.getAllObatPbfReadyStock();
          console.log(allPbfReadyObat);

          const reconstructedData = allPbfReadyObat.map((item, index) => ({
            prevOrderId: item[0],
            obatId: item[1],
            namaProduk: item[2],
            batchName: item[3],
            obatQuantity: item[4],
            pbfInstance: item[6],
          }));

          setDataObat(reconstructedData)
          console.log(reconstructedData);

        } catch (error) {
          errAlert(error, "Can't retrieve obat produced data.")
        } finally{
          setLoading(false);
        }
    }
    };
  
    loadData();
  }, [contracts]);

  useEffect(() => {
    if (!loading) {
      setFadeOutLoader(true);
  
      setTimeout(() => {
        setFadeClass('fade-in');
      }, 400);
    }
  }, [loading]);

  const handleEventOrderUpdate = (_batchName, _namaProduk,  _buyerInstance, _sellerInstance, _orderQuantity, _timestampOrder, txHash) => {

    const timestamp = new Date(Number(_timestampOrder) * 1000).toLocaleDateString('id-ID', options)
  
    MySwal.fire({
      title: "Sukses Mengajukan Order!",
      html: (
        <div className='form-swal event'>
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
              <p>Nama Batch</p> 
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
              <p>Nama Instansi Retail</p> 
            </li>
            <li className="input">
              <p>{_buyerInstance}</p> 
            </li>
          </ul>
          <ul>
            <li className="label">
              <p>Nama Instansi PBF</p> 
            </li>
            <li className="input">
              <p>{_sellerInstance}</p> 
            </li>
          </ul>
          <ul>
            <li className="label">
              <p>Tanggal Pengajuan Order</p> 
            </li>
            <li className="input">
              <p>{timestamp}</p> 
            </li>
          </ul>
          <ul className="txHash">
            <li className="label">
              <p>Hash Transaksi</p>
            </li>
            <li className="input">
              <a
                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noreferrer"
              >
                Lihat transaksi di Etherscan
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
      didOpen: () => {
        const actions = Swal.getActions();
       actions.style.justifyContent = "center";
      }
    }).then((result) => {
      if (result.isConfirmed) {
        navigate('/retailer-orders')
      }
    });
  }

  const orderDetail = async (id, prevOrderId, batchName) => {
    console.log(id, prevOrderId, batchName);
    try {
      const detailObatCt = await contracts.obatTradisional.detailObat(id);
      const detailBatchCt = await contracts.obatTradisional.detailBatchProduction(id, batchName);
      const detailPastOrderCt = await contracts.orderManagement.detailOrder(prevOrderId);
      const detailNieCt = await contracts.nieManager.getNieDetail(id)
      
      const [dataObat, obatIpfs] = detailBatchCt
      const [statusStok, namaProduct, batchNamee, obatQuantity, factoryInstancee] = dataObat
      
      const [merk, namaProduk, klaim, komposisi, kemasan, factoryInstance, factoryAddr, tipeObat, cpotbHash, cdobHash, jenisObat] = detailObatCt;

      const [nieNumber, nieStatus, timestampProduction, timestampNieRequest, timestampNieApprove, timestampNieRejected, timestampNieRenewRequest, factoryInstanceee, bpomInstance, bpomAddr] = detailNieCt[0];

      const [pbfInstance, pbfAddr] = detailPastOrderCt[5]

      console.log(cdobHash);

      const detailObat = {
        obatId: id,
        merk: merk,
        namaObat: namaProduk,
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
        factoryInstanceName: factoryInstance,
        bpomAddr: bpomAddr,
        bpomInstanceNames:  bpomInstance,
        tipeObat: tipeObatMap[tipeObat],
        jenisObat: jenisObat
      };

      const kemasanKeterangan = kemasan.match(/@(.+?)\s*\(/);

      MySwal.fire({
        title: `Detail Obat ${namaProduk}`,
        html: (
          <div className='form-swal'>
              <div className="stok">
                <ul>
                  <li className="label">
                    <p>Stok Tersedia</p>
                  </li>
                  <li className="input">
                    <p>{obatQuantity.toString()} Obat</p>
                  </li>
                </ul>
              </div>
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

                  <ul className='klaim'>
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

                  <ul className='klaim'>
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
                      <p>Nama Instansi Pabrik</p>
                    </li>
                    <li className="input">
                      <p>{detailObat.factoryInstanceName}
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
                      <p>{detailObat.factoryAddr}</p>
                    </li>
                  </ul>

                  <ul>
                    <li className="label">
                      <p>Nama Instansi PBF</p>
                    </li>
                    <li className="input">
                      <p>{pbfInstance}
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
                      <p>{pbfAddr}</p>
                    </li>
                  </ul>

                </div>
              </div>
          </div>
        ),
        width: '620',
        showCancelButton: false,
        showCloseButton: true,
        confirmButtonText: 'Kirim Pengajuan Order Obat',
        customClass: {
          htmlContainer: 'scrollable-modal'
        },
      }).then((result) => {

        if(result.isConfirmed){

          MySwal.fire({
            title: `Konfirmasi Order Obat ${namaProduk}`,
            html: (
              <div className='form-swal'>
                <div className="row row--obat">
                  <div className="col">
      
                    <ul>
                      <li className="label label-1">
                        <p>Nama Produk</p>
                      </li>
                      <li className="input input-1">
                        <p>{namaProduk}</p> 
                      </li>
                    </ul>
      
                    <ul>
                      <li className="label label-1">
                        <p>Jenis Obat</p>
                      </li>
                      <li className="input input-1">
                        <p>{detailObat.jenisObat}</p> 
                      </li>
                    </ul>
      
                    <ul>
                      <li className="label label-1">
                        <p>Nama Batch</p>
                      </li>
                      <li className="input input-1">
                        <p>{batchName}</p> 
                      </li>
                    </ul>
      
                    <ul>
                      <li className="label label-1">
                        <p>Nama Pabrik</p> 
                      </li>
                      <li className="input input-1">
                        <p>{factoryInstance}</p> 
                      </li>
                    </ul>
                    <ul>
                      <li className="label label-1">
                        <p>Total Stok</p>
                      </li>
                      <li className="input input-1">
                        <p>{obatQuantity.toString()} Obat</p> 
                      </li>
                    </ul>
      
                  </div>
                </div>
              </div>
            ),
            width: '620',
            showCancelButton: true,
            confirmButtonText: 'Konfirmasi',
            cancelButtonText: "Batal",
            allowOutsideClick: false
          }).then((result) => {
            if(result.isConfirmed){

              MySwal.fire({
                title: "Menunggu koneksi Metamask...",
                text: "Jika proses ini memakan waktu terlalu lama, coba periksa koneksi Metamask Anda. 🚀",
                icon: 'info',
                showCancelButton: false,
                showConfirmButton: false,
                allowOutsideClick: false,
              });
    
              orderObat(detailPastOrderCt[0], id, pbfInstance, namaProduk, obatQuantity, batchName, factoryInstance)
            }
          })
        }
      })
      
    } catch (e) {
      errAlert(e, "Can't retrieve data")
    }
  }

  const orderObat = async (prevOrderIdPbf, id, pbfInstance, namaProduk, orderQuantity, batchName, factoryInstance) => {

    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0'); 
    const year = today.getFullYear();
    const randomNumber = Math.floor(100000 + Math.random() * 900000); 

    const orderId = `order-ret-${day}${month}${year}-${randomNumber}` 
    
    try {
      console.log(prevOrderIdPbf, orderId, id, batchName, namaProduk, userdata.instanceName, pbfInstance, orderQuantity);
      
      const createOrderCt = await contracts.orderManagement.createOrder(prevOrderIdPbf, orderId, id, batchName, namaProduk, userdata.instanceName, pbfInstance, orderQuantity, '');
      
      if(createOrderCt){
        MySwal.update({
          title: "Memproses transaksi...",
          text: "Proses transaksi sedang berlangsung, harap tunggu. ⏳"
        });
      }
      
      contracts.orderManagement.on("OrderUpdate", (_batchName, _namaProduk,  _buyerInstance, _sellerInstance, _orderQuantity, _timestampOrder) => {
        updateBatchHistoryHash(factoryInstance, namaProduk, createOrderCt.hash, batchName, Number(_timestampOrder))
        handleEventOrderUpdate(_batchName, _namaProduk,  _buyerInstance, _sellerInstance, _orderQuantity, _timestampOrder, createOrderCt.hash);
      });

    } catch (error) {
      errAlert(error, "Can't make an obat order.")
    }

  }

  const updateBatchHistoryHash = async (factoryInstance, namaProduk, obatHash, batchName, timestamp) => {
    try {
      const collectionName = `obat_${namaProduk}_${factoryInstance}`
      const docRef = doc(db, 'obat_data', factoryInstance)
      const docRefTx = doc(db, 'transaction_hash', collectionName);
  
      await setDoc(docRefTx, {
        [`batch_${batchName}`]: {
          'order_retailer': {
            createdHash: obatHash,
            createdTimestamp: timestamp,
          }
        },
      }, { merge: true }); 

      await setDoc(docRef, {
        [`${namaProduk}`]: {
          [`batch_${batchName}`]: {
            OrderRetCreatedHash: obatHash,
            OrderRetCreatedTimestamp: timestamp,
            retailer: userdata.instanceName,
          },
        }
      }, { merge: true }); 
  
    } catch (err) {
      errAlert(err);
    }
  };

  return (
    <>
      <div id="ObatProduce" className='Layout-Menu layout-page'>
        <div className="title-menu">
          <h1>Pengajuan Order Obat Tradisional</h1>
          <p>Oleh {userdata.instanceName}</p>
        </div>
        <div className="tab-menu">
          <ul>
            <li><button className='active' onClick={() => navigate('/create-retailer-order')}>Pengajuan Order</button></li>
            <li><button  onClick={() => navigate('/retailer-orders')}>Order Obat Tradisional</button></li>
            <li><button onClick={() => navigate('/obat-available-retailer')}>Inventaris Batch Obat</button></li>
          </ul>
        </div>
        <div className="container-data ">
          <div className="data-list">
            <div className="fade-container">
              <div className={`fade-layer loader-layer ${fadeOutLoader ? 'fade-out' : 'fade-in'}`}>
                <Loader />
              </div>

              <div className={`fade-layer content-layer ${!loading ? 'fade-in' : 'fade-out'}`}>
              {dataObat.length > 0 ? (
              <ul>
                {dataObat.map((item, index) => (
                  <li key={index} className='row'>
                    <div className="detail">
                      <h5>{item.namaProduk}</h5>
                      <p>Batchname: {item.batchName}</p>
                      <p>Nama Instansi PBF: {item.pbfInstance}</p>
                      <p>Stok tersedia: {item.obatQuantity.toString()} Obat</p>
                    </div>
                    <div className="order">
                      <button className='order' onClick={() => orderDetail(item.obatId, item.prevOrderId, item.batchName)} >
                        <i className="fa-solid fa-cart-shopping"></i>
                        Order Obat
                      </button>

                    </div>
                  </li>
                ))}
              </ul>
            ) : (
                  <div className="image">
                    <img src={imgSad}/>
                    <p className='small'>Maaf, belum ada data order yang tersedia.</p>
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

export default CreateOrderRetailer;