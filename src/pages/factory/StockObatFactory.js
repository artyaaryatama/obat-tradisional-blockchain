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

const client = create({ url: 'http://127.0.0.1:5001/api/v0' });


function StockObatFactory() {
  const [contract, setContract] = useState();
  const navigate = useNavigate();

  const userData = JSON.parse(sessionStorage.getItem('userdata'));
  const [dataObat, setDataObat] = useState([]);
  const [namaObatArray, setNamaObatArray] = useState([""])
  

  const stokStatusMap = {
    0: "Stok Available",
    1: "Stok Empty",
  };

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
    document.title = "Produksi Obat Tradisional"; 
  }, []);

  useEffect(() => {
    async function connectWallet() {
      if (window.ethereum) {
        try {
          const provider = new BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const contr = new Contract(
            contractData.ObatTradisional.address, 
            contractData.ObatTradisional.abi, 
            signer
          );
            
          setContract(contr);
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
      if (contract && userData.instanceName) {
        try {

          const listProducedObatCt = await contract.getAllBatchProductionByInstance(userData.instanceName);
          
          console.log(listProducedObatCt);
          const reconstructedData = listProducedObatCt.map((item) => {
            return {
              obatId: item[0],
              namaProduk: item[1],
              batchName: item[2],
              obatQuantity: parseInt(item[3]),
              statusStok: stokStatusMap[item[4]],
              factoryInstanceName: item[5]
            }
          })
          setDataObat(reconstructedData)

        } catch (error) {
          console.error("Error loading data: ", error);
        }
      }
    };
  
    loadData();
  }, [contract, userData.instanceName]);

  useEffect(() => {
    if (contract) {

    }
  }, [contract]);

  const getDetailObat = async (id, batchName) => {

    try {
      const detailObatCt = await contract.detailObat(id);
      const detailBatchCt = await contract.detailBatchProduction(id, batchName);

      const [obatDetails, obatNie] = detailObatCt;

      const [merk, namaProduk, klaim, komposisi, kemasan, tipeProduk, factoryInstance, factoryAddr] = obatDetails;

      const [nieNumber, nieStatus, timestampProduction, timestampNieRequest, timestampNieApprove, bpomInstance, bpomAddr] = obatNie;

      const [statusStok, namaProduct, batchNamee, obatQuantity, obatIpfs, factoryInstancee] = detailBatchCt

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

      console.log(detailObatCt);


      MySwal.fire({
        title: `Produksi Obat ${detailObat.namaObat}`,
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
                          <p>{detailObat.factoryInstanceName}</p>
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
        showCancelButton: true,
        showConfirmButton: false,
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
          <p>Di produksi oleh {userData.instanceName}</p>
        </div>
        <div className="tab-menu">
          <ul>
            <li><button onClick={() => navigate('/obat')}>Pengajuan NIE</button></li>
            <li><button className='active' onClick={() => navigate('/obat-available-factory')}>Produksi Obat</button></li>
            <li><button onClick={() => navigate('/manage-orders-factory')}>Order Obat</button></li>
          </ul>
        </div>
        <div className="container-data ">
          <div className="menu-data">
            <div className="btn">
              <button className='btn-menu' onClick={() => navigate('/add-quantity-obat')}>
                <i className="fa-solid fa-plus"></i>
                Add new data
              </button>
            </div>
          </div>
          <div className="data-list">
            {dataObat.length > 0 ? (
              <ul>
                {dataObat.map((item, index) => (
                  <li key={index}>
                    <button className='title' onClick={() => getDetailObat(item.obatId, item.batchName)} > [ {item.batchName} ] {item.namaProduk}</button>
                    {item.statusStok === "Stok Available" ? 
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

export default StockObatFactory;