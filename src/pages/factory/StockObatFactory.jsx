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

function StockObatFactory() {
  const [contracts, setContracts] = useState([]);
  const navigate = useNavigate();
  const userdata = JSON.parse(sessionStorage.getItem('userdata'));
  const [dataObat, setDataObat] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fadeClass, setFadeClass] = useState('fade-in');
  const [fadeOutLoader, setFadeOutLoader] = useState(false);

  const stokStatusMap = {
    0: "Stok Tersedia",
    1: "Stok Kosong",
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
    document.title = "Stok Obat Tradisional Pabrik"; 
  }, []);

  useEffect(() => {
    async function connectWallet() {
      if (window.ethereum) {
        try {
          const provider = new BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
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

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  
  useEffect(() => {

    const loadData = async () => {
      if (contracts) {
        try {
          console.log(userdata.instanceName);
          const listProducedObatCt = await contracts.obatTradisional.getAllBatchProductionByInstance(userdata.instanceName);

          console.log(listProducedObatCt);
          const reconstructedData = listProducedObatCt.map((item) => {
            return {
              obatId: item[0],
              namaProduk: item[1],
              batchName: item[2],
              obatQuantity: parseInt(item[3]),
              statusStok: stokStatusMap[item[4]],
              factoryInstanceName: item[5]
            };
          });
          setDataObat(reconstructedData);
        } catch (error) {
          console.error("Error loading data: ", error);
        } finally {
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

  const getDetailObat = async (id, batchName) => {

    try {
      const detailObatCt = await contracts.obatTradisional.detailObat(id);
      const detailBatchCt = await contracts.obatTradisional.detailBatchProduction(id, batchName);
      const detailNieCt = await contracts.nieManager.getNieDetail(id)
      const [merk, namaProduk, klaim, komposisi, kemasan, factoryInstance, factoryAddr, tipeObat, cpotbHash, cdobHash, jenisObat] = detailObatCt;

      const [nieNumber, nieStatus, timestampProduction, timestampNieRequest, timestampNieApprove, timestampNieRejected, timestampNieRenewRequest, factoryInstanceee, bpomInstance, bpomAddr] = detailNieCt[0];

      const [dataObat, obatIpfs] = detailBatchCt

      const [statusStok, namaProduct, batchNamee, obatQuantity, factoryInstancee] = dataObat

      const detailObat = {
        obatId: id,
        merk: merk,
        namaObat: namaProduk,
        klaim: klaim,
        kemasan: kemasan,
        komposisi: komposisi,
        nieStatus: "NIE Disetujui", 
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

      console.log(detailObatCt);

      MySwal.fire({
        title: `Produksi Obat ${detailObat.namaObat}`,
        html: (
          <div className='form-swal'>
            <div className="row1">
              <div className="produce-obat">
                <div className="detailObat">
                  <div className="row row--obat">
                    <div className="col column-label">
                      <ul>
                        <li className="label-sm">
                          <p>Nama Obat</p>
                        </li>
                        <li className="input">
                          <p>{detailObat.namaObat}</p> 
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
                          <p>Di Produksi oleh</p>
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

                      <ul>
                        <li className="label-sm">
                          <p>Nama Batch</p>
                        </li>
                        <li className="input">
                          <p>{batchName}</p>
                        </li>
                      </ul>
                      

                      <ul>
                        <li className="label-sm">
                          <p>Stok Tersedia</p>
                        </li>
                        <li className="input">
                          <p>{obatQuantity.toString()} Obat ({stokStatusMap[statusStok]})</p>
                        </li>
                      </ul>
                    </div>
                      
                  </div>

                </div>
                <DataIpfsHash ipfsHashes={obatIpfs} />
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
                        <p>Jenis Obat</p>
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
        showConfirmButton: false,
        showCloseButton: true,
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
          <h1>Data Produksi Obat Tradisional</h1>
          <p>Di produksi oleh {userdata.instanceName}</p>
        </div>
        <div className="tab-menu">
          <ul>
            <li><button onClick={() => navigate('/obat')}>Pengajuan NIE</button></li>
            <li><button className='active' onClick={() => navigate('/obat-available-factory')}>Produksi Batch Obat</button></li>
            <li><button onClick={() => navigate('/manage-orders-factory')}>Daftar Order Obat </button></li>
          </ul>
        </div>
        <div className="container-data ">
          <div className="menu-data">
            <div className="btn">
              <button className='btn-menu' onClick={() => navigate('/add-quantity-obat')}>
                <i className="fa-solid fa-plus"></i>
                Tambah data baru
              </button>
            </div>
        </div>
          <div className="data-list">
            <div className="fade-container">
              <div className={`fade-layer loader-layer ${fadeOutLoader ? 'fade-out' : 'fade-in'}`}>
                <Loader />
              </div>

              <div className={`fade-layer content-layer ${!loading ? 'fade-in' : 'fade-out'}`}>
              { dataObat.length > 0 ? (
                <ul>
                  {dataObat.map((item, index) => (
                    <li key={index}>
                      <button className='title' onClick={() => getDetailObat(item.obatId, item.batchName)} > [{item.batchName}] {item.namaProduk}</button>
                      {item.statusStok === "Stok Tersedia" ? 
                        <p>Stok tersedia: {item.obatQuantity} Obat</p>  :
                        <p>Terjual: {item.obatQuantity} Obat</p>
                      }
                      <button className={`statusOrder ${item.statusStok}`}>
                        {item.statusStok}
                      </button>
                    </li>
                  ))}
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

export default StockObatFactory;