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
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import Loader from '../../components/Loader';
import imgSad from '../../assets/images/3.png'

const MySwal = withReactContent(Swal);

const client = create({ url: 'http://127.0.0.1:5001/api/v0' });


function ManageOrderPbfRetailer() {
  const [contracts, setContracts] = useState(null);
  const userdata = JSON.parse(sessionStorage.getItem('userdata'));
  const [dataOrder, setDataOrder] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fadeClass, setFadeClass] = useState('fade-in');
  const [fadeOutLoader, setFadeOutLoader] = useState(false);

  const tipeObatMap = {
    0n: "Obat Lain",
    1n: "Cold Chain Product"
  };

  const orderStatusMap = {
    0n: "Order Diajukan",
    1n: "Order Dikirim",
    2n: "Order Selesai"
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

          const orderManagementPbfContract = new Contract(
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

          const NieManager = new Contract(
            contractData.NieManager.address, 
            contractData.NieManager.abi, 
            signer
          );

          const orderManagementRetailContract = new Contract(
            contractData.OrderManagement.address,
            contractData.OrderManagement.abi,
            signer
          );

          const ObatShared = new Contract(
            contractData.ObatShared.address, 
            contractData.ObatShared.abi, 
            signer
          );
          setContracts({
            orderManagementPbf: orderManagementPbfContract,
            orderManagementRetail: orderManagementRetailContract,
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
          const listOrderedObatCt = await contracts.orderManagementRetail.getAllOrderFromSeller(userdata.instanceName);

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

  const getDetailObat = async (id, orderId) => {
    console.log(id, orderId);

    try {
      const detailObatCt = await contracts.obatTradisional.detailObat(id);
      const detailOrderCt = await contracts.orderManagementRetail.detailOrder(orderId);
      const orderTimestampCt = await contracts.orderManagementPbf.orderTimestamp(orderId);
      const orderObatIpfs = await contracts.orderManagementRetail.obatIpfs(orderId);
      const detailNieCt = await contracts.nieManager.getNieDetail(id)
      const [merk, namaProduk, klaim, komposisi, kemasan, factoryInstance, factoryAddr, tipeObat, cpotbHash, cdobHash, jenisObat] = detailObatCt;

      const [nieNumber, nieStatus, timestampProduction, timestampNieRequest, timestampNieApprove, timestampNieRejected, timestampNieRenewRequest, factoryInstanceee, bpomInstance, bpomAddr] = detailNieCt[0];

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
        nieStatus: "NIE DIsetujui", 
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
                            <p>Nama Instansi Retail</p>
                          </li>
                          <li className="input">
                            <p>{detailOrder.buyerInstance}</p>
                          </li>
                        </ul>

                        <ul className='klaim'>
                          <li className="label">
                            <p>Alamat Akun Retail (Pengguna)</p>
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
          customClass: {
            htmlContainer: 'scrollable-modal'
          },
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
                          <p>{userdata.instanceName}</p> 
                        </li>
                      </ul>
                      <ul>
                        <li className="label label-1">
                          <p>Nama Retailer</p> 
                        </li>
                        <li className="input input-1">
                          <p>{detailOrder.buyerInstance}</p> 
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
                generateIpfs(prevOrderId, detailObat, detailOrder, timestamps, orderId, batchName, cpotbHash, cdobHash)
              }
            })
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
                            <p>Nama Instansi Retail</p>
                          </li>
                          <li className="input">
                            <p>{detailOrder.buyerInstance}</p>
                          </li>
                        </ul>

                        <ul className='klaim'>
                          <li className="label">
                            <p>Alamat Akun Retail (Pengguna)</p>
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

  const acceptOrder = async (orderId, ipfsHashes, instanceName, namaProduk, batchName, retailerInstance) => {
    
    MySwal.fire({
      title: "Menunggu koneksi Metamask...",
      text: "Jika proses ini memakan waktu terlalu lama, coba periksa koneksi Metamask Anda. 🚀",
      icon: 'info',
      showCancelButton: false,
      showConfirmButton: false,
      allowOutsideClick: false,
    });
    console.log(orderId)
    try {
      const acceptOrderCt = await contracts.orderManagementRetail.acceptOrderRetailer(orderId, ipfsHashes)
      console.log(acceptOrderCt);

      if(acceptOrderCt){
        MySwal.update({
          title: "Memproses transaksi...",
          text: "Proses transaksi sedang berlangsung, harap tunggu. ⏳"
        });
      }
      
      contracts.orderManagementRetail.on("OrderUpdate", (_batchName, _namaProduk,  _buyerInstance, _sellerInstance, _orderQuantity, _timestampOrder) => {
        updateBatchHistoryHash(instanceName, namaProduk, acceptOrderCt.hash, batchName, Number(_timestampOrder))
        handleEventOrderUpdate(_batchName, _namaProduk,  _buyerInstance, _sellerInstance, _orderQuantity, _timestampOrder, acceptOrderCt.hash)
      });

      
    } catch (error) {
      errAlert(error, "Tidak dapat menyetujui order.")
    }
  }
  
  const generateIpfs = async(prevOrderId, dataObat, dataOrder, timestamps, orderId, batchName, cpotbHash, cdobHash) => {
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

    console.log(dataOrder);

    const timestampYear = new Date().getFullYear().toString().slice(-4);
    const randomFourLetters = Array.from({ length: 4 }, () =>
      String.fromCharCode(65 + Math.floor(Math.random() * 26))
    ).join(''); 

    try {
      const prevOrderPbfCt = await contracts.orderManagementPbf.detailOrder(prevOrderId)
      const orderTimestampCt = await contracts.orderManagementPbf.orderTimestamp(prevOrderId);

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
            factoryType:  userFactoryCt[5],
            nibFactory: userFactoryCt[6],
            npwpFactory: userFactoryCt[7],
            nibBpom: userBpomCt[6],
            npwpBpom: userBpomCt[7],
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
            timestampComplete: pbfTimestampCompleted,
            NpwpPbf:userPbfCt[6],
            NibPbf:userPbfCt[7],
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
            timestampShipped: timestamps.timestampShipped,
            NpwpRetailer:userRetailerCt[6],
            NibRetailer:userRetailerCt[7],
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
        title: `Konfirmasi Pengiriman Order ${dataObat.namaProduk}`,
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
                    <p>Nama Batch</p>
                  </li>
                  <li className="input input-1">
                    <p>{batchName}</p> 
                  </li>
                </ul>
  
                <ul>
                  <li className="label label-1">
                    <p>Nama Instansi PBF</p> 
                  </li>
                  <li className="input input-1">
                    <p>{dataOrder.sellerInstance}</p> 
                  </li>
                </ul>
  
                <ul>
                  <li className="label label-1">
                    <p>Nama Instansi Retail</p> 
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
        cancelButtonText: 'Batal',
        confirmButtonText: 'Konfirmasi',
        allowOutsideClick: false,
        customClass: {
          htmlContainer: 'scrollable-modal'
        },
  
      }).then((result) => {
        if(result.isConfirmed){
          acceptOrder(orderId, newIpfsHashes, dataObat.factoryInstance, dataObat.namaProduk, batchName, dataOrder.buyerInstance)
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
          'order_retailer': {
            sendHash: obatHash,
            sendTimestamp: timestamp,
          }
        },
      }, { merge: true }); 

      await setDoc(docRef, {
        [`${namaProduk}`]: {
          [`batch_${batchName}`]: {
            orderRetSendHash: obatHash,
            orderRetSendTimestamp: timestamp,
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
                    <button className='title' onClick={() => getDetailObat(item.obatId, item.orderId)} >{item.namaProduk}</button>
                    <p>Nama Batch: {item.batchName}</p>
                    <p>Nama Instansi Retailer: {item.buyerUser[0]}</p>
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

export default ManageOrderPbfRetailer;