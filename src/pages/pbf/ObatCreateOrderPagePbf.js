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


function ObatCreateOrderPbf() {
  const [contract, setContract] = useState();
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
    second: '2-digit',
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
      if (contract) {
        try {

          const tx = await contract.getAllProducedObat();
          console.log(tx);

          // use map on obatIdArray, which iterates through each obatId
          const reconstructedData = tx.map((item, index) => ({
            batchName: item.batchName,
            namaObat: item.namaProduk,
            idObat: item.obatId,
            obatQuantity: item.obatQuantity.toString(),
            factoryInstanceName: item.factoryInstanceNames,
            obatIpfshash: item.obatIpfsHash
          }));

          setDataObat(reconstructedData)
          console.log(reconstructedData);

        } catch (error) {
          errAlert(error, "Can't retrieve obat produced data.")
        }
      }
    };
  
    loadData();
  }, [contract]);

  useEffect(() => {
    if (contract) {
      
      contract.on("evt_obatOrdered", (_namaProduk, _orderQuantity, _orderId, _pbfInstanceName, _targetInstanceName, _timestampOrder) => {

        const timestamp = new Date(Number(_timestampOrder) * 1000).toLocaleDateString('id-ID', options)
    
        MySwal.fire({
          title: "Success Order Obat Tradisional",
          html: (
            <div className='form-swal'>
              <ul>
                <li className="label">
                  <p>Nama Obat</p> 
                </li>
                <li className="input">
                  <p>{_namaProduk}</p> 
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
                  <p>Dari Pabrik</p> 
                </li>
                <li className="input">
                  <p>{_targetInstanceName}</p> 
                </li>
              </ul>
              <ul>
                <li className="label">
                  <p>Timestamp Request</p> 
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
            window.location.reload()
          }
        });

      });

  
      return () => {
        contract.removeAllListeners("evt_obatOrdered");
      };
    }
  }, [contract]);
  

  const orderDetail = async (id, batchName) => {

    try {
      const tx = await contract.getListObatById(id);
      const tx1 = await contract.getDetailProducedObat(batchName)
      console.log(2);

      const [obatDetails, factoryAddress, factoryInstanceName, factoryUserName, bpomAddress, bpomInstanceName, bpomUserName] = tx;

      const [obatQuantity, obatIpfsHash] = tx1;

      const detailObat = {
        obatId: obatDetails.obatId,
        merk: obatDetails.merk,
        namaObat: obatDetails.namaProduk,
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
        title: `Form Order Obat ${detailObat.namaObat}`,
        html: (
          <div className='form-swal'>
              <div className="row row--obat">
                <div className="col column">
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
                      <p>Di Produksi oleh</p>
                    </li>
                    <li className="input">
                      <p>{detailObat.factoryInstanceName}</p>
                    </li>
                  </ul>

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
            <div className="col2">

            </div>
          
          </div>
        ),
        width: '820',
        showCancelButton: true,
        confirmButtonText: 'Order Obat',
      }).then((result) => {

        if(result.isConfirmed){
          orderObat(id, factoryInstanceName)
        }
      })
      
    } catch (e) {
      errAlert(e, "Can't retrieve data")
    }
  }

  const orderObat = async (id, factoryInstanceName) => {

    MySwal.fire({
      title:"Processing your request...",
      text:"Your request is on its way. This won't take long. 🚀",
      icon: 'info',
      showCancelButton: false,
      showConfirmButton: false,
      allowOutsideClick: false,
    })

    const idOrderObat = dataObat.find(obat => obat.idObat === id)
    let orderObat = {}
    if (idOrderObat) {
      orderObat = {
        obatId: idOrderObat.idObat,
        namaProduk: idOrderObat.namaObat,
        orderQuantity: parseInt(idOrderObat.obatQuantity, 10),
        pbfAddr: userData.address,
        pbfInstanceName: userData.instanceName,
        orderObatIpfsHash: idOrderObat.obatIpfshash
      };
    } else {
      errAlert("Obat not found");
      return;
    }
  
    try {
      const randomNumber = Math.floor(100000 + Math.random() * 900000); 
      const idOrder =  `ORDER-${randomNumber}`; 

      console.log(orderObat.orderObatIpfsHash);

      console.log(orderObat.obatId, idOrder, orderObat.namaProduk, orderObat.orderQuantity, orderObat.pbfAddr, orderObat.pbfInstanceName, factoryInstanceName);

      const tx = await contract.createOrder(orderObat.obatId, idOrder, orderObat.namaProduk, orderObat.orderQuantity, orderObat.pbfInstanceName, factoryInstanceName);
      tx.wait()
      console.log(tx);

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
            <li><button className='active' onClick={() => navigate('/obat-order-create-pbf')}>Pengajuan Order</button></li>
            <li><button  onClick={() => navigate('/obat-order-pbf')}>Order Obat Tradisional</button></li>
          </ul>
        </div>
        <div className="container-data ">
          <div className="data-list">
            {dataObat.length > 0 ? (
              <ul>
                {dataObat.map((item, index) => (
                  <li key={index} className='row'>
                    <div className="detail">
                      <h5>{item.namaObat}</h5>
                      <p>Stok tersedia: {item.obatQuantity} Obat</p>
                      <p>{item.factoryInstanceName}</p>

                    </div>
                    <div className="order">
                      <button className='order' onClick={() => orderDetail(item.idObat, item.batchName)} >
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

export default ObatCreateOrderPbf;