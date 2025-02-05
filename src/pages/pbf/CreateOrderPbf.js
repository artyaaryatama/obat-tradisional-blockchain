import { useEffect, useState } from 'react';
import { BrowserProvider, Contract } from "ethers";
import contractData from '../../auto-artifacts/deployments.json';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import "../../styles/MainLayout.scss"
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import './../../styles/SweetAlert.scss';
import JenisSediaanTooltip from '../../components/TooltipJenisSediaan';

const MySwal = withReactContent(Swal);

function CreateOrderPbf() {
  const [contracts, setContracts] = useState(null);
  const navigate = useNavigate();

  const userdata = JSON.parse(sessionStorage.getItem('userdata'));
  const [dataObat, setDataObat] = useState([]);

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

          const orderManagementContract = new Contract(
            contractData.OrderManagement.address,
            contractData.OrderManagement.abi,
            signer
          );
          const CertificateManager = new Contract(
            contractData.CertificateManager.address,
            contractData.CertificateManager.abi,
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
            certificateManager: CertificateManager
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

  const handleEventCreateOrder = (_instanceName, _orderId, _obatId, _batchName, _namaProduk, _buyerInstance, _sellerInstance, _orderQuantity, _timestampOrder, txHash) => {
    const timestamp = new Date(Number(_timestampOrder) * 1000).toLocaleDateString('id-ID', options)
  
    MySwal.fire({
      title: "Sukses membuat order",
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
              <p>Nama Instansi PBF</p> 
            </li>
            <li className="input">
              <p>{_buyerInstance}</p> 
            </li>
          </ul>
          <ul>
            <li className="label">
              <p>Nama Instansi Pabrik</p> 
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
        navigate('/pbf-orders')
      }
    });
    
  }

  const orderDetail = async (id, batchName) => {
    console.log(id, batchName);
    try {
      const detailObatCt = await contracts.obatTradisional.detailObat(id);
      const detailBatchCt = await contracts.obatTradisional.detailBatchProduction(id, batchName)
      const detailNieCt = await contracts.nieManager.getNieDetail(id)

      console.log(detailBatchCt);

      const [dataObat, obatIpfs] = detailBatchCt

      const [statusStok, namaProduct, batchNamee, obatQuantity, factoryInstancee] = dataObat

      const [merk, namaProduk, klaim, komposisi, kemasan, factoryInstance, factoryAddr, tipeObat, cpotbHash, cdobHash, jenisObat] = detailObatCt;

      const [nieNumber, nieStatus, timestampProduction, timestampNieRequest, timestampNieApprove, timestampNieRejected, timestampNieRenewRequest, factoryInstanceee, bpomInstance, bpomAddr] = detailNieCt[0];

      const detailObat = {
        obatId: id,
        merk: merk,
        namaObat: namaProduk,
        klaim: klaim,
        kemasan: kemasan,
        komposisi: komposisi,
        nieStatus: "Disetujui NIE", 
        produtionTimestamp: timestampProduction ? new Date(Number(timestampProduction) * 1000).toLocaleDateString('id-ID', options) : '-', 
        nieRequestDate: timestampNieRequest ? new Date(Number(timestampNieRequest) * 1000).toLocaleDateString('id-ID', options) : '-', 
        nieApprovalDate:  timestampNieApprove ? new Date(Number(timestampNieApprove) * 1000).toLocaleDateString('id-ID', options): "-",
        nieNumber: nieNumber ? nieNumber : "-",
        factoryAddr: factoryAddr,
        factoryInstanceName: factoryInstance,
        bpomAddr: bpomAddr === "0x0000000000000000000000000000000000000000" ? "-" : bpomAddr,
        bpomInstanceNames:  bpomInstance ?  bpomInstance : "-",
        tipeObat: tipeObatMap[tipeObat],
        jenisObat: jenisObat
      };

      const kemasanKeterangan = kemasan.match(/@(.+?)\s*\(/);

      MySwal.fire({
        title: `Form Order Obat`,
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
                      <p>Merk Obat</p>
                    </li>
                    <li className="input">
                      <p>{detailObat.merk}</p> 
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
                              (CPOTB Details
                              <i class="fa-solid fa-arrow-up-right-from-square"></i>)
                            </a>
                          </span>
                        </p>
                      </li>
                    </ul>

                    <ul>
                      <li className="label">
                        <p>Alamat Akun Pabrik (Pengguna)</p>
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
        confirmButtonText: 'Pengajuan Order Obat',
        cancelButtonText: 'Batal',
      }).then((result) => {

        if(result.isConfirmed){

          MySwal.fire({
            title:"Memproses transaksi...",
            text:"Jika proses ini memakan waktu terlalu lama, coba periksa koneksi Metamask Anda. 🚀",
            icon: 'info',
            showCancelButton: false,
            showConfirmButton: false,
            allowOutsideClick: false,
          })

          orderObat(id, factoryInstance, namaProduk, obatQuantity, batchName, tipeObat)
        }
      })
      
    } catch (e) {
      errAlert(e, "Can't retrieve data")
    }
  }

  const orderObat = async (id, factoryInstance, namaProduk, orderQuantity, batchName, tipeObat) => {

    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0'); 
    const year = today.getFullYear();
    const randomNumber = Math.floor(100000 + Math.random() * 900000); 

    const orderId = `order-pbf-${day}${month}${year}-${randomNumber}` 
  
    const pbfCdobHash = await checkAvailCdob(userdata.instanceName, tipeObat)
    try {
      console.log(pbfCdobHash);

      if(pbfCdobHash) {
        
        const createOrderCt = await contracts.orderManagement.createOrder("",orderId, id, batchName, namaProduk, userdata.instanceName, factoryInstance, orderQuantity, pbfCdobHash[5]);
        
        if(createOrderCt){
          updateBatchHistoryHash(factoryInstance, namaProduk, batchName, createOrderCt.hash, tipeObat)

          MySwal.update({
            title: "Processing your transaction...",
            text: "Proses transaksi sedang berlangsung, harap tunggu. ⏳"
          });
        }
  
        contracts.orderManagement.once("evt_orderUpdate", (_batchName, _namaProduk,  _buyerInstance, _sellerInstance, _orderQuantity, _timestampOrder) => {
          handleEventCreateOrder(userdata.instanceName, orderId, id, _batchName, _namaProduk, _buyerInstance, _sellerInstance, _orderQuantity, _timestampOrder, createOrderCt.hash);
        });

      } else {
        errAlert({reason: `Unable to order obat`}, `${userdata.instanceName} does not have a CDOB Certification for ${namaProduk}`)
      }


    } catch (error) {
      errAlert(error, "Gagal mengajukan order")
    }
  }


  const checkAvailCdob = async(pbfInstance, tipePermohonan) => {
    console.log(pbfInstance, tipePermohonan);

    try {
      const listAllCt = await contracts.certificateManager.getCdobByInstance(pbfInstance);
      const isMatch = listAllCt.find(item => item[3] === tipePermohonan);
      console.log(isMatch);
      if(isMatch){
        return isMatch
      } else{
        return false
      }
      
    } catch (error) {
      errAlert(error, "Gagal mengakses data CDOB")
    }

  }

  const updateBatchHistoryHash = async(factoryInstance, namaProduk, batchName, hash) => {
    const documentId = `[OT] ${namaProduk}`;
    const factoryDocRef = doc(db, factoryInstance, documentId); 

    try {
      const docSnap = await getDoc(factoryDocRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
  
        if (data.batchData && data.batchData[batchName]) {
          await updateDoc(factoryDocRef, {
            [`batchData.${batchName}.historyHash.orderCreatedPbf`]: hash,
            [`batchData.${batchName}.historyHash.orderCreatedPbfTimestamp`]: Date.now()

          });
          console.log(`Batch ${batchName} updated successfully.`);
        } else {
          errAlert({ reason: `Batch ${batchName} not found in batchData!` });
        }
      } else {
        errAlert({ reason: `Document ${documentId} not found!` });
      }
    } catch (error) {
      errAlert(error);
    }
  }

  return (
    <>
      <div id="ObatProduce" className='Layout-Menu layout-page'>
        <div className="title-menu">
          <h1>Pengajuan Order Obat Tradisional</h1>
          <p>Oleh {userdata.instanceName}</p>
        </div>
        <div className="tab-menu">
          <ul>
            <li><button className='active' onClick={() => navigate('/create-pbf-order')}>Pengajuan Order</button></li>
            <li><button  onClick={() => navigate('/pbf-orders')}>Order Obat Tradisional</button></li>
            <li><button onClick={() => navigate('/obat-available-pbf')}>Obat Ready Stok</button></li>
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
                      <p>Batch Name : {item.batchName}</p>
                      <p>Stok tersedia: {item.obatQuantity} Obat</p>
                      <p>Nama Instansi Pabrik: {item.factoryInstanceName}</p>

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
    confirmButtonText: 'Coba Lagi',
    didOpen: () => {
      const actions = Swal.getActions();
      actions.style.justifyContent = "center";
    }
  });

  console.error(customMsg)
  console.error(errorObject);
}

export default CreateOrderPbf;