import { useEffect, useState } from 'react';
import { BrowserProvider, Contract } from "ethers";
import contractData from '../../auto-artifacts/deployments.json';
import { useNavigate } from 'react-router-dom';

import "../../styles/MainLayout.scss"
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import './../../styles/SweetAlert.scss';

const MySwal = withReactContent(Swal);

function ObatPage() {
  const [contract, setContract] = useState();
  const navigate = useNavigate();

  const userData = JSON.parse(sessionStorage.getItem('userdata'));
  const [dataObat, setDataObat] = useState([]);

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
  }

  useEffect(() => {
    document.title = "Obat Tradisional"; 
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
          const tx = await contract.getListObatByFactory(userData.instanceName);
          const [obatIdArray, namaProdukArray, obatStatusArray, tipeProdukArray] = tx;

          const reconstructedData = obatStatusArray.map((obatStatus, index) => {
            const readableObatStatus = obatStatusMap[obatStatus];
            const readableTipeProduk = tipeProdukMap[tipeProdukArray[index]];
  
            return {
              namaObat : namaProdukArray[index],
              tipeProduk: readableTipeProduk,
              obatStatus: readableObatStatus,
              idObat: obatIdArray[index]
            };
          });
  
          setDataObat(reconstructedData);
  
        } catch (error) {
          console.error("Error loading data: ", error);
        }
      }
    };
  
    loadData();
  }, [contract, userData.instanceName]);

  useEffect(() => {
    if (contract) {
      console.log("Setting up listener for evt_nieRequested on contract", contract);
      
      contract.on("evt_nieRequested", ( _obatId, _timestampRequestNie,_namaProduk) => {

        const timestamp = new Date(Number(_timestampRequestNie) * 1000).toLocaleDateString('id-ID', options)
    
        MySwal.fire({
          title: "Success Request NIE",
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
        console.log("Removing evt_nieRequested listener");
        contract.removeAllListeners("evt_nieRequested");
      };
    }
  }, [contract]);

  const getDetailObat = async (id) => {

    try {
      const tx = await contract.getListObatById(id);

      const [obatDetails, factoryAddress, factoryInstanceName, factoryUserName, bpomAddress, bpomInstanceName, bpomUserName] = tx

      console.log(typeof(obatDetails.klaim));

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

      console.log(detailObat);
      
      if(detailObat.obatStatus === 'Approved NIE'){
        MySwal.fire({
          title: `Detail Obat ${detailObat.namaObat}`,
          html: (
            <div className='form-swal'>
              <div className="row row--obat">
                <div className="col col1">
  
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
                      <p>Tanggal Pengajuan NIE</p> 
                    </li>
                    <li className="input">
                      <p>{detailObat.nieRequestDate}</p> 
                    </li>
                  </ul>
  
                  <ul>
                    <li className="label">
                      <p>Tanggal Disertifikasi NIE</p> 
                    </li>
                    <li className="input">
                      <p>{detailObat.nieApprovalDate}</p> 
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
                      <p>Address Pengirim</p> 
                    </li>
                    <li className="input">
                      <p>{detailObat.factoryAddr}</p> 
                    </li>
                  </ul>
  
                  <ul>
                    <li className="label">
                      <p>Nama Pengirim</p> 
                    </li>
                    <li className="input">
                      <p>{detailObat.factoryUserName}</p> 
                    </li>
                  </ul>
  
                  <ul>
                    <li className="label">
                      <p>Address BPOM</p> 
                    </li>
                    <li className="input">
                      <p>{detailObat.bpomAddr}</p> 
                    </li>
                  </ul>
  
                  <ul>
                    <li className="label">
                      <p>Nama Penyutuju</p> 
                    </li>
                    <li className="input">
                      <p>{detailObat.bpomUserName}</p> 
                    </li>
                  </ul>
                </div>
  
                <div className="col col2">
                  <ul>
                    <li className="label">
                      <p>Status Obat</p>
                    </li>
                    <li className="input">
                      <p className={detailObat.obatStatus}>{detailObat.obatStatus}</p>
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
          ),
          width: '820',
          showCancelButton: false,
          confirmButtonText: 'Oke',
        })

      } else{
        MySwal.fire({
          title: `Detail Obat ${detailObat.namaObat}`,
          html: (
            <div className='form-swal'>
              <div className="row row--obat">
                <div className="col col1">
  
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
                      <p>Tanggal Pengajuan NIE</p> 
                    </li>
                    <li className="input">
                      <p>{detailObat.nieRequestDate}</p> 
                    </li>
                  </ul>
  
                  <ul>
                    <li className="label">
                      <p>Tanggal Disertifikasi NIE</p> 
                    </li>
                    <li className="input">
                      <p>{detailObat.nieApprovalDate}</p> 
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
                      <p>Address Pengirim</p> 
                    </li>
                    <li className="input">
                      <p>{detailObat.factoryAddr}</p> 
                    </li>
                  </ul>
  
                  <ul>
                    <li className="label">
                      <p>Nama Pengirim</p> 
                    </li>
                    <li className="input">
                      <p>{detailObat.factoryUserName}</p> 
                    </li>
                  </ul>
  
                  <ul>
                    <li className="label">
                      <p>Address BPOM</p> 
                    </li>
                    <li className="input">
                      <p>{detailObat.bpomAddr}</p> 
                    </li>
                  </ul>
  
                  <ul>
                    <li className="label">
                      <p>Nama Penyutuju</p> 
                    </li>
                    <li className="input">
                      <p>{detailObat.bpomUserName}</p> 
                    </li>
                  </ul>
                </div>
  
                <div className="col col2">
                  <ul>
                    <li className="label">
                      <p>Status Obat</p>
                    </li>
                    <li className="input">
                      <p className={detailObat.obatStatus}>{detailObat.obatStatus}</p>
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
          ),
          width: '820',
          showCancelButton: true,
          confirmButtonText: 'Request NIE',
        }).then((result) => {
  
          if(result.isConfirmed){
            MySwal.fire({
              title: "Request NIE",
              html: (
                <div className='form-swal'>
                  <div className="row row--obat">
                    <div className="col col1">
        
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
                          <p>Tanggal Pengajuan NIE</p> 
                        </li>
                        <li className="input">
                          <p>{detailObat.nieRequestDate}</p> 
                        </li>
                      </ul>
        
                      <ul>
                        <li className="label">
                          <p>Tanggal Disertifikasi NIE</p> 
                        </li>
                        <li className="input">
                          <p>{detailObat.nieApprovalDate}</p> 
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
                          <p>Address Pengirim</p> 
                        </li>
                        <li className="input">
                          <p>{detailObat.factoryAddr}</p> 
                        </li>
                      </ul>
        
                      <ul>
                        <li className="label">
                          <p>Nama Pengirim</p> 
                        </li>
                        <li className="input">
                          <p>{detailObat.factoryUserName}</p> 
                        </li>
                      </ul>
        
                      <ul>
                        <li className="label">
                          <p>Address BPOM</p> 
                        </li>
                        <li className="input">
                          <p>{detailObat.bpomAddr}</p> 
                        </li>
                      </ul>
        
                      <ul>
                        <li className="label">
                          <p>Nama Penyutuju</p> 
                        </li>
                        <li className="input">
                          <p>{detailObat.bpomUserName}</p> 
                        </li>
                      </ul>
                    </div>
        
                    <div className="col col2">
                      <ul>
                        <li className="label">
                          <p>Status Obat</p>
                        </li>
                        <li className="input">
                          <p className={detailObat.obatStatus}>{detailObat.obatStatus}</p>
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
              ),
              width: '820',
              showCancelButton: true,
              confirmButtonText: 'Request',
              allowOutsideClick: false
            }).then((result) => {
              if(result.isConfirmed){
                requestNie(detailObat.obatId)
              }
            })
          }
        })

      }


    } catch (e) {
      errAlert(e, "Can't retrieve data")
    }
  }

  const requestNie = async(id) => {

    MySwal.fire({
      title:"Processing your request...",
      text:"Your request is on its way. This won't take long. 🚀",
      icon: 'info',
      showCancelButton: false,
      showConfirmButton: false,
      allowOutsideClick: false,
    })

    const tx = await contract.requestNie(id);
    tx.wait()
  }

  return (
    <>
      <div id="ObatPage" className='Layout-Menu layout-page'>
        <div className="title-menu">
          <h1>Data Obat Tradisional</h1>
          <p>Di produksi oleh {userData.instanceName}</p>
        </div>
        <div className="container-data">
          <div className="menu-data">
            <div className="btn">
              <button className='btn-menu' onClick={() => {navigate('/create-obat')}}>
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
                    <button className='title' onClick={() => getDetailObat(item.idObat)} >{item.namaObat}</button>
                    <p>{item.tipeProduk}</p>
                    <button className={`statusPengajuan ${item.obatStatus}`}>
                      {item.obatStatus}
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

export default ObatPage;