import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserProvider, Contract } from "ethers";
import contractData from '../../auto-artifacts/deployments.json';
import { useNavigate } from 'react-router-dom';
import { create } from 'ipfs-http-client';
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import DataIpfsHash from '../../components/TableHash';
import OrderStatusStepper from '../../components/StepperOrder';
import "../../styles/MainLayout.scss"
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import './../../styles/SweetAlert.scss';
import JenisSediaanTooltip from '../../components/TooltipJenisSediaan';
import Loader from '../../components/Loader';
import imgSad from '../../assets/images/3.png'

const MySwal = withReactContent(Swal);
const client = create({ url: 'http://127.0.0.1:5001/api/v0' });

function ManageOrderFactoryPbf() {
  const [contracts, setContracts] = useState(null);
  const navigate = useNavigate();
  const userdata = JSON.parse(sessionStorage.getItem('userdata'));
  const [dataOrder, setDataOrder] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fadeClass, setFadeClass] = useState('fade-in');
  const [fadeOutLoader, setFadeOutLoader] = useState(false);

  const orderStatusMap = {
    0n: "Order Diajukan",
    1n: "Order Dikirim",
    2n: "Order Selesai"
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

          const RoleManager = new Contract(
            contractData.RoleManager.address,
            contractData.RoleManager.abi,
            signer
          );
          

          const ObatShared = new Contract(
            contractData.ObatShared.address, 
            contractData.ObatShared.abi, 
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
            roleManager: RoleManager,
            nieManager: NieManager,
            obatShared: ObatShared
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
      window.ethereum.once("accountsChanged", () => {
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
    if (!loading) {
      setFadeOutLoader(true);
  
      setTimeout(() => {
        setFadeClass('fade-in');
      }, 400);
    }
  }, [loading]);

  useEffect(() => {
    const loadData = async () => {
      if (contracts && userdata.instanceName) {

        try {
          const listOrderedObatCt = await contracts.orderManagement.getAllOrderFromSeller(userdata.instanceName);
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
          console.error("Error loading data: ", error);
        } finally{
          setLoading(false);
        }
        
      }
    };
  
    loadData();
  }, [contracts]);

  const handleEventOrderUpdate = (_batchName, _namaProduk,  _buyerInstance, _sellerInstance, _orderQuantity, _timestampOrder, txHash) => {
    const timestamp = new Date(Number(_timestampOrder) * 1000).toLocaleDateString('id-ID', options)
    
    MySwal.fire({
      title: "Sukses Mengirimkan Order!",
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
              <p>Tanggal Order Dikirim</p> 
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
        window.location.reload()
      }
    });
  }

  const getDetailObat = async (id, orderId, selectedBatchName) => {
    console.log(id, orderId, selectedBatchName);

    try {
      const detailObatCt = await contracts.obatTradisional.detailObat(id);
      const detailOrderCt = await contracts.orderManagement.detailOrder(orderId);
      const orderTimestampCt = await contracts.orderManagement.orderTimestamp(orderId);
      const orderObatIpfs = await contracts.orderManagement.obatIpfs(orderId);
      const detailNieCt = await contracts.nieManager.getNieDetail(id)

      const [merk, namaProduk, klaim, komposisi, kemasan, factoryInstance, factoryAddr, tipeObat, cpotbHash, cdobHash, jenisObat] = detailObatCt;

      const [nieNumber, nieStatus, timestampProduction, timestampNieRequest, timestampNieApprove, timestampNieRejected, timestampNieRenewRequest, timestampNieExpired, timestampNieExtendRequest,timestampNieExtendApprove, timestampNieExtendReject, timestampNieExtendRenew, factoryInstancee, bpomInstance, bpomAddr, nieIpfs] = detailNieCt[0];

      const [orderIdd, obatId, namaProdukk, batchName, orderQuantity, buyerUser, sellerUser, statusOrder] = detailOrderCt

      const [timestampOrder, timestampShipped, timestampComplete] = orderTimestampCt

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
        factoryInstance: factoryInstance,
        bpomAddr: bpomAddr ,
        bpomInstance:  bpomInstance,
        tipeObat: tipeObatMap[tipeObat],
        jenisObat: jenisObat
      };

      const detailOrder = {
        orderId: orderId,
        batchName: batchName,
        orderQuantity: parseInt(orderQuantity),
        buyerInstance: buyerUser[0],
        buyerAddress: buyerUser[1],
        sellerInstance: sellerUser[0],
        sellerAddress: userdata.address,
        statusOrder: orderStatusMap[statusOrder],
        orderObatIpfs: orderObatIpfs
      }
      
      const timestamps = {
        timestampOrder: timestampOrder ? new Date(Number(timestampOrder) * 1000).toLocaleDateString('id-ID', options) : 0, 
        timestampShipped: timestampShipped ? new Date(Number(timestampShipped) * 1000).toLocaleDateString('id-ID', options) : 0,
        timestampComplete: timestampComplete ?  new Date(Number(timestampComplete) * 1000).toLocaleDateString('id-ID', options) : 0
      }

      const kemasanKeterangan = kemasan.match(/@(.+?)\s*\(/);

      if(statusOrder === 0n){
        MySwal.fire({
          title: `Detail Order Obat ${detailObat.namaObat}`,
          html: (
            <div className='form-swal order'>
              <div className="row1">
                <div className="produce-obat">
                  <div className="detailObat">
                    <div className="row row--obat">
                      <div className="col column-label">

                        <ul className=''>
                          <li className="label">
                            <p>Status Order</p>
                          </li>
                          <li className="input">
                            <p className={orderStatusMap[statusOrder]}>{orderStatusMap[statusOrder]}</p> 
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
                            <p>Nama Batch</p>
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
                            <p>Nama Instansi PBF</p>
                          </li>
                          <li className="input">
                            <p>{detailOrder.buyerInstance}
                              <span className='linked'>
                                <a
                                  href={`http://localhost:3000/public/certificate/${cdobHash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  (Detail CDOB
                                  <i className="fa-solid fa-arrow-up-right-from-square"></i>)
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
  
                      <ul className='klaim'>
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
  
                      <ul className='klaim'>
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
          cancelButtonText: 'Batal',
          confirmButtonText: 'Kirim Order',
          didOpen: async () => {

            const stepperOrder = document.getElementById('stepperOrder');
            const root = ReactDOM.createRoot(stepperOrder);
            root.render( 
              <OrderStatusStepper orderStatus={statusOrder} timestamps={timestamps} />
            );
  
          }
        }).then((result) => {
          if (result.isConfirmed) {

            MySwal.fire({
              title: `Konfirmasi Terima Order Batch Obat ${namaProduk}`,
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
                          <p>Nama Batch</p>
                        </li>
                        <li className="input input-1">
                          <p>{batchName}</p> 
                        </li>
                      </ul>
        
                      <ul>
                        <li className="label label-1">
                          <p>Nama PBF</p> 
                        </li>
                        <li className="input input-1">
                          <p>{detailOrder.buyerInstance}</p> 
                        </li>
                      </ul>
                      <ul>
                        <li className="label label-1">
                          <p>Nama Pabrik</p> 
                        </li>
                        <li className="input input-1">
                          <p>{userdata.instanceName}</p> 
                        </li>
                      </ul>
                      <ul>
                        <li className="label label-1">
                          <p>Total Stok</p>
                        </li>
                        <li className="input input-1">
                          <p>{orderQuantity} Obat</p> 
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
                generateIpfs(detailObat, detailOrder, timestamps, orderId, selectedBatchName, cpotbHash, cdobHash)
              }
            })

          }
        })
      } else {
        MySwal.fire({
          title: `Detail Order Obat ${detailObat.namaObat}`,
          html: (
            <div className='form-swal order'>
              <div className="row1">
                <div className="produce-obat">
                  <div className="detailObat">
                    <div className="row row--obat">
                      <div className="col column-label">
                        
                      <ul className=''>
                          <li className="label">
                            <p>Status Order</p>
                          </li>
                          <li className="input">
                            <p className={orderStatusMap[statusOrder]}>{orderStatusMap[statusOrder]}</p> 
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
                            <p>Nama Batch</p>
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
                            <p>Nama Instansi PBF</p>
                          </li>
                          <li className="input">
                            <p>{detailOrder.buyerInstance}</p>
                          </li>
                        </ul>

                        <ul className='klaim'>
                          <li className="label">
                            <p>Alamat Akun PBF (Pengguna)</p>
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
  
                      <ul className='klaim'>
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
  
                      <ul className='klaim'>
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
          customClass: {
            htmlContainer: 'scrollable-modal'
          },
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

  const acceptOrder = async (orderId, ipfsHashes, namaObat, batchName, tipeObat, pbfInstance) => {
    
    MySwal.fire({
      title: "Menunggu koneksi Metamask...",
      text: "Jika proses ini memakan waktu terlalu lama, coba periksa koneksi Metamask Anda. 🚀",
      icon: 'info',
      showCancelButton: false,
      showConfirmButton: false,
      allowOutsideClick: false,
    });
    
    try {
      const acceptOrderCt = await contracts.orderManagement.acceptOrderPbf(orderId, ipfsHashes)
      console.log(acceptOrderCt);
      
      if(acceptOrderCt){
        MySwal.update({
          title: "Memproses transaksi...",
          text: "Proses transaksi sedang berlangsung, harap tunggu. ⏳"
        });
      }
      
      contracts.orderManagement.once("OrderUpdate", (_batchName, _namaProduk,  _buyerInstance, _sellerInstance, _orderQuantity, _timestampOrder) => {
        updateBatchHistoryHash(userdata.instanceName, namaObat, acceptOrderCt.hash, batchName, Number(_timestampOrder))
        handleEventOrderUpdate(_batchName, _namaProduk,  _buyerInstance, _sellerInstance, _orderQuantity, _timestampOrder, acceptOrderCt.hash); 
      });
      
    } catch (error) {
      errAlert(error, "Can't Accept Order")
    }

  }
  
  const generateIpfs = async(dataObat, dataOrder, timestamps, orderId, batchName, cpotbHash, cdobHash) => {
    MySwal.fire({ 
      title: "Mengunggah data order ke IPFS...",
      text: "Harap tunggu. Jika proses ini memakan waktu terlalu lama, coba periksa koneksi IPFS. 🚀",
      icon: 'info',
      showCancelButton: false,
      showConfirmButton: false,
      allowOutsideClick: false,
    })

    let newIpfsHashes = [];

    const date = new Date();
    const formattedDate = new Intl.DateTimeFormat('id-ID', options).format(date);
    timestamps.timestampShipped = formattedDate;
    const timestampYear = new Date().getFullYear().toString().slice(-4);
    const randomFourLetters = Array.from({ length: 4 }, () =>
      String.fromCharCode(65 + Math.floor(Math.random() * 26))
    ).join(''); 

    const userFactoryCt = await contracts.roleManager.getUserData(dataObat.factoryAddr);
    const userBpomCt = await contracts.roleManager.getUserData(dataObat.bpomAddr);
    const userPbfCt = await contracts.roleManager.getUserData(dataOrder.buyerAddress);

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
          factoryType:  userFactoryCt[5],
          nieNumber: dataObat.nieNumber,
          obatStatus: "NIE Disetujui",
          nieRequestDate: dataObat.nieRequestDate,
          nieApprovalDate: dataObat.nieApprovalDate,
          bpomAddr: dataObat.bpomAddr,
          bpomInstanceName: dataObat.bpomInstance,
          bpomAddressInstance: userBpomCt[4],
          tipeObat: dataObat.tipeObat,
          jenisObat: dataObat.jenisObat,
          nibFactory: userFactoryCt[6],
          npwpFactory: userFactoryCt[7],
          nibBpom: userBpomCt[6],
          npwpBpom: userBpomCt[7],
        },
        dataOrderPbf: {
          orderQuantity: dataOrder.orderQuantity,
          senderInstanceName: dataOrder.buyerInstance,
          senderAddress: dataOrder.buyerAddress,
          pbfInstanceAddress: userPbfCt[4],
          NpwpPbf:userPbfCt[6],
          NibPbf:userPbfCt[7],
          statusOrder : "Order Shipped",
          targetInstanceName : dataOrder.sellerInstance,
          targetAddress: userdata.address,
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
        errAlert(error, "Tidak bisa mengunggah data obat ke IPFS."); 
        break;
      }
    }

    console.log("Generated IPFS Hashes:", newIpfsHashes);

    if(newIpfsHashes.length !== 0){
      MySwal.fire({
        title: `Konfirmasi Pengiriman Order ${dataObat.namaObat}`,
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
                    <p>Nama Batch</p>
                  </li>
                  <li className="input input-1">
                    <p>{batchName}</p> 
                  </li>
                </ul>
  
                <ul>
                  <li className="label label-1">
                    <p>Nama Instansi Pabrik</p> 
                  </li>
                  <li className="input input-1">
                    <p>{dataOrder.sellerInstance}</p> 
                  </li>
                </ul>
  
                <ul>
                  <li className="label label-1">
                    <p>Nama Instansi PBF</p> 
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
        confirmButtonText: 'Konfirmasi',
        cancelButtonText: 'Batal',
        allowOutsideClick: false,
        customClass: {
          htmlContainer: 'scrollable-modal'
        },
      }).then((result) => {
        if(result.isConfirmed){
          acceptOrder(orderId, newIpfsHashes, dataObat.namaObat, batchName, dataObat.tipeObat, dataOrder.buyerInstance)
        }
      })
    }

  }

  const updateBatchHistoryHash = async (factoryInstance, namaProduk, obatHash, batchName, timestamp) => {
    try {
      const collectionName = `obat_${namaProduk}_${factoryInstance}`
      const docRef = doc(db, 'obat_data', factoryInstance)
      const docRefTx = doc(db, 'transaction_hash', collectionName);
  
      await setDoc(docRefTx, {
        [`batch_${batchName}`]: {
          'order_pbf': {
            sendHash: obatHash,
            sendTimestamp: timestamp,
          }
        },
      }, { merge: true }); 

      await setDoc(docRef, {
        [`${namaProduk}`]: {
          [`batch_${batchName}`]: {
            OrderPbfSendHash: obatHash,
            OrderPbfSendTimestamp: timestamp
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
          <h1>Data Order Obat Tradisional</h1>
          <p>Di kelola oleh {userdata.instanceName}</p>
        </div>
        <div className="tab-menu">
          <ul>
            <li><button onClick={() => navigate('/obat')}>Pengajuan NIE</button></li>
            <li><button onClick={() => navigate('/obat-available-factory')}>Produksi Batch Obat</button></li>
            <li><button className='active' onClick={() => navigate('/manage-orders-factory')}>Daftar Order Obat </button></li>
          </ul>
        </div>
        <div className="container-data ">
          <div className="data-list">
            <div className="fade-container">
              <div className={`fade-layer loader-layer ${fadeOutLoader ? 'fade-out' : 'fade-in'}`}>
                <div className="image">
                  <Loader />

                </div>
              </div>

              <div className={`fade-layer content-layer ${!loading ? 'fade-in' : 'fade-out'}`}>
              {dataOrder.length !== 0 ? (
              <ul>
                {dataOrder.map((item, index) => (
                  <li key={index}>
                    <button className='title' onClick={() => getDetailObat(item.obatId, item.orderId, item.batchName)} >{item.namaObat}</button>
                    <p>Nama Batch: {item.batchName}</p>
                    <p>Order Quantity : {item.orderQuantity.toString()} Obat</p>
                    <button className={`statusOrder ${item.statusOrder}`}>
                      {item.statusOrder}
                    </button>
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

export default ManageOrderFactoryPbf;