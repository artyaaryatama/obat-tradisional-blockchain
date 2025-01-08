/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react';
import { BrowserProvider, Contract } from "ethers";
import contractData from '../../auto-artifacts/deployments.json';
import { useNavigate } from 'react-router-dom';
import ReactDOM from 'react-dom/client';

import NieStatusStepper from '../../components/StepperNie'

import "../../styles/MainLayout.scss"
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import './../../styles/SweetAlert.scss';

const MySwal = withReactContent(Swal);

function ManageNieFactory() {
  const [contract, setContract] = useState();
  const navigate = useNavigate();

  const userData = JSON.parse(sessionStorage.getItem('userdata'));
  const [dataObat, setDataObat] = useState([]);

  const obatStatusMap = {
    0n: "In Local Production",
    1n: "Requested NIE",
    2n: "Approved NIE"
  };
  
  const tipeProdukMap = {
    0n: "Obat Tradisional",
    1n: "Suplemen Kesehatan"
  };

  const tipeObatMap = {
    0n: "Obat Lain",
    1n: "Cold Chain Product",
    2n: "Narkotika"
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
    document.title = "List Obat Tradisional"; 
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
      if (contract && userData.instanceName) {
        try {
          const listAllObatCt = await contract.getAllObatByInstance(userData.instanceName);
          console.log(listAllObatCt);

          const reconstructedData = listAllObatCt.map((item, index) => {

            const nie = item[2] !== "" ? item[2] : "TBA"
            return {
              obatId: item[0],
              namaProduk: item[1],
              nieNumber: nie,
              nieStatus: obatStatusMap[item[3]],
              factoryInstance: item[4]
            }
          })
          
          setDataObat(reconstructedData);
          console.log(reconstructedData); 
          
        } catch (error) {
          console.error("Error loading data: ", error);
        }
      }
    };
    
    loadData();
  }, [contract, userData.instanceName]);

  const handleEventNieRequsted = ( _factoryInstance, _factoryAddr, _timestampRequestNie, txHash) =>{

    const timestamp = new Date(Number(_timestampRequestNie) * 1000).toLocaleDateString('id-ID', options)
    
    MySwal.fire({
      title: "Success Request NIE",
      html: (
        <div className='form-swal'>
          <ul>
            <li className="label">
              <p>Factory Instance</p> 
            </li>
            <li className="input">
              <p>{_factoryInstance}</p> 
            </li>
          </ul>
          <ul>
            <li className="label">
              <p>Factory Address</p> 
            </li>
            <li className="input">
              <p>{_factoryAddr}</p> 
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
          <ul className="txHash">
            <li className="label">
              <p>Transaction Hash</p>
            </li>
            <li className="input">
              <a
                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noreferrer"
              >
                View Transaction on Etherscan
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
    }).then((result) => {
      if (result.isConfirmed) {
        window.location.reload()
      }
    });
  }

  const getDetailObat = async (id) => {

    try {
      const detailObatCt = await contract.detailObat(id);

      const [obatDetails, obatNie] = detailObatCt;

      const [merk, namaProduk, klaim, komposisi, kemasan, factoryInstance, factoryAddr, tipeObat, cpotbHash] = obatDetails;

      const [nieNumber, nieStatus, timestampProduction, timestampNieRequest, timestampNieApprove, bpomInstance, bpomAddr] = obatNie;
      console.log(cpotbHash);

      const detailObat = {
        obatId: id,
        merk: merk,
        namaObat: namaProduk,
        klaim: klaim,
        kemasan: kemasan,
        komposisi: komposisi,
        nieStatus: obatStatusMap[nieStatus], 
        produtionTimestamp: timestampProduction ? new Date(Number(timestampProduction) * 1000).toLocaleDateString('id-ID', options) : '-', 
        nieRequestDate: timestampNieRequest ? new Date(Number(timestampNieRequest) * 1000).toLocaleDateString('id-ID', options) : '-', 
        nieApprovalDate:  timestampNieApprove ? new Date(Number(timestampNieApprove) * 1000).toLocaleDateString('id-ID', options): "-",
        nieNumber: nieNumber ? nieNumber : "-",
        factoryAddr: factoryAddr,
        factoryInstanceName: factoryInstance,
        bpomAddr: bpomAddr === "0x0000000000000000000000000000000000000000" ? "-" : bpomAddr,
        bpomInstanceNames:  bpomInstance ?  bpomInstance : "-",
        tipeObat: tipeObatMap[tipeObat]
      };

      console.log(detailObatCt);

      const timestamps = {
        timestampProduction : timestampProduction ? new Date(Number(timestampProduction) * 1000).toLocaleDateString('id-ID', options) : 0,
        timestampNieRequest :timestampNieRequest ? new Date(Number(timestampNieRequest) * 1000).toLocaleDateString('id-ID', options) : 0,
        timestampNieApprove : timestampNieApprove ? new Date(Number(timestampNieApprove) * 1000).toLocaleDateString('id-ID', options): 0
      }

      console.log(detailObat);
      
      if(detailObat.nieStatus === 'In Local Production'){
        MySwal.fire({
          title: `Detail Obat ${detailObat.namaObat}`,
          html: (
            <div className='form-swal'>
              <div className="row row--row">
                
                <div className="col col2">
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
                      <p>Tipe Produk</p>
                    </li>
                    <li className="input">
                      <p>Obat Tradisional</p> 
                    </li>
                  </ul>

                  <ul>
                    <li className="label">
                      <p>Tipe Obat</p>
                    </li>
                    <li className="input">
                      <p>{detailObat.tipeObat}</p> 
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
                      <p>Factory Instance</p>
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
                      <p>Factory Address</p> 
                    </li>
                    <li className="input">
                      <p>{detailObat.factoryAddr}</p> 
                    </li>
                  </ul>

                  <ul>
                    <li className="label">
                      <p>BPOM Instance</p> 
                    </li>
                    <li className="input">
                      <p>{detailObat.bpomInstanceNames}
                      </p> 
                    </li>
                  </ul>

                  <ul>
                    <li className="label">
                      <p>BPOM Address</p> 
                    </li>
                    <li className="input">
                      <p>{detailObat.bpomAddr}</p> 
                    </li>
                  </ul>

                </div>

                <div className="container-stepper">
                  <div id="stepperOrder"></div>
                </div>
              </div>
            
            </div>
          ),
          width: '1020',
          showCancelButton: true,
          confirmButtonText: 'Request NIE',
          didOpen: () => {
            const stepperOrder = document.getElementById('stepperOrder');
            const root = ReactDOM.createRoot(stepperOrder);
            root.render( 
              <NieStatusStepper nieStatus={parseInt(nieStatus)} timestamps={timestamps} />
            );
          }
        }).then((result) => {
  
          if(result.isConfirmed){
            MySwal.fire({
              title: `Request NIE`,
              html: (
                <div className='form-swal'>
                  <div className="row">
                    <div className="col">
                       <ul>
                          <li className="label">
                            <label htmlFor="namaObat">Nama Obat</label>
                          </li>
                          <li className="input">
                            <input
                              type="text"
                              id="namaObat"
                              value={detailObat.namaObat}
                              readOnly
                            />
                          </li>
                        </ul>
                        
                        <ul>
                          <li className="label">
                            <label htmlFor="tipeObat">Tipe Obat</label>
                          </li>
                          <li className="input">
                            <input
                              type="text"
                              id="tipeObat"
                              value={detailObat.tipeObat}
                              readOnly
                            />
                          </li>
                        </ul>

                        <ul>
                          <li className="label">
                            <label htmlFor="kemasan">Kemasan Obat</label>
                          </li>
                          <li className="input">
                            <input
                              type="text"
                              id="kemasan"
                              value={detailObat.kemasan}
                              readOnly
                            />
                          </li>
                        </ul>

                        <ul>
                          <li className="label">
                            <label htmlFor="klaim">Klaim Obat</label>
                          </li>
                          <li className="input">
                            <ul className="numbered">
                              {detailObat.klaim.map((item, index) => (
                                <li className='klaim' key={index}>
                                  <p>
                                  {item}
                                  </p>
                                </li>
                              ))}
                            </ul>
                          </li>
                        </ul>

                        <ul>
                          <li className="label">
                            <label htmlFor="komposisi">Komposisi Obat</label>
                          </li>
                          <li className="input">
                            <ul className="numbered">
                              {detailObat.komposisi.map((item, index) => (
                                <li className='klaim' key={index}>
                                  <p>
                                  {item}
                                  </p>
                                </li>
                              ))}
                            </ul>
                          </li>
                        </ul>
                    </div>
                  </div>
                
                </div>
              ),
              width: '520',
              showCancelButton: true,
              confirmButtonText: 'Request',
              allowOutsideClick: false
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

                requestNie(detailObat.obatId)
              }
            })
          }
        })
        
      } else{
        MySwal.fire({
          title: `Detail Obat ${detailObat.namaObat}`,
          html: (
            <div className='form-swal'>
              <div className="row row--row">
                
                <div className="col col2">
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
                      <p>Tipe Produk</p>
                    </li>
                    <li className="input">
                      <p>Obat Tradisional</p> 
                    </li>
                  </ul>
  
                  <ul>
                    <li className="label">
                      <p>Tipe Obat</p>
                    </li>
                    <li className="input">
                      <p>{detailObat.tipeObat}</p> 
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
                      <p>Factory Instance</p>
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
                      <p>Factory Address</p> 
                    </li>
                    <li className="input">
                      <p>{detailObat.factoryAddr}</p> 
                    </li>
                  </ul>

                  <ul>
                    <li className="label">
                      <p>BPOM Instance</p> 
                    </li>
                    <li className="input">
                      <p>{detailObat.bpomInstanceNames}
                        {
                        detailObat.bpomUserName? (
                          <span className='username'>({detailObat.bpomUserName})</span>) : <span></span>                        
                        }
                      </p> 
                    </li>
                  </ul>

                  <ul>
                    <li className="label">
                      <p>BPOM Address</p> 
                    </li>
                    <li className="input">
                      <p>{detailObat.bpomAddr}</p> 
                    </li>
                  </ul>

                </div>

                <div className="container-stepper">
                  <div id="stepperOrder"></div>
                </div>
              </div>
            
            </div>
          ),
          width: '1020',
          showCloseButton: true,
          showConfirmButton: false,
          showCancelButton: false,
          didOpen: () => {
            const stepperOrder = document.getElementById('stepperOrder');
            const root = ReactDOM.createRoot(stepperOrder);
            root.render( 
              <NieStatusStepper nieStatus={parseInt(nieStatus)} timestamps={timestamps} />
            );
          }
        })
        
      }


    } catch (e) {
      errAlert(e, "Can't retrieve data")
    }
  }

  const requestNie = async(id) => {

    try {
      const requestNieCt = await contract.requestNie(id, userData.instanceName);
      
      if(requestNieCt){
        MySwal.update({
          title: "Processing your transaction...",
          text: "This may take a moment. Hang tight! ⏳"
        });
      }

      contract.once("evt_nieRequested", ( _factoryInstance, _factoryAddr, _timestampRequestNie) => {
        handleEventNieRequsted(_factoryInstance, _factoryAddr, _timestampRequestNie, requestNieCt.hash)
      });
      
    } catch (error) {
      errAlert(error, "Can't Request NIE.")
    }
  }

  const autoFilledCreateObat = async(id, name) => {

    try {
      const tx = await contract.createObat(
        id,
        name,
        name,
        ["Memelihara kesehatan", "Membantu memperbaiki nafsu makan", "Secara tradisional digunakan pada penderita kecacingan"],
        "Dus, 11 @Tablet (5 gram)",
        ["Cinnamomum Burmanii Cortex", "Curcuma Aeruginosa Rhizoma", "Curcuma Domestica Rhizoma", "Curcuma Xanthorrhiza Rhizoma"],
        userData.instanceName,
        0
      );
  
      await tx.wait();
      console.log('Receipt:', tx);
      
    } catch (error) {
      errAlert(error, "Can't Create Obat")
    }

  }

  return (
    <>
      <div id="ObatNie" className='Layout-Menu layout-page'>
        <div className="title-menu">
          <h1>Data Obat Tradisional</h1>
          <p>Di produksi oleh {userData.instanceName}</p>
        </div>
        <div className="tab-menu">
          <ul>
            <li><button className='active' onClick={() => navigate('/obat')}>Pengajuan NIE</button></li>
            <li><button onClick={() => navigate('/obat-available-factory')}>Produksi Obat</button></li>
            <li><button onClick={() => navigate('/manage-orders-factory')}>Order Obat</button></li>
          </ul>
        </div>
        <div className="container-data">
          <div className="menu-data">
            <div className="btn">
              <button className='btn-menu' onClick={() => {navigate('/create-obat')}}>
                <i className="fa-solid fa-plus"></i>
                Add new data
              </button>
              {/* <button className='btn-auto-filled' onClick={() => autoFilledCreateObat("ot-3385CI", "Upik Instan Rasa Coklat")}>
                Auto Rasa Coklat
              </button>
              <button className='btn-auto-filled' onClick={() => autoFilledCreateObat("ot-2485CI", "Upik Instan Rasa Stoberi")}>
                Auto Rasa Stoberi
              </button> */}
            </div>
          </div>
          <div className="data-list">
            {dataObat.length > 0 ? (
              <ul>
                {dataObat.map((item, index) => (
                  <li key={index}>
                    <button className='title' onClick={() => getDetailObat(item.obatId)} >{item.namaProduk}</button>
                    <p>NIE Number: {item.nieNumber}</p>
                    <button className={`statusPengajuan ${item.nieStatus}`}>
                      {item.nieStatus}
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

export default ManageNieFactory;