import { useEffect, useState } from 'react';
import { BrowserProvider, Contract } from "ethers";
import contractData from '../../auto-artifacts/deployments.json';
import { useNavigate } from 'react-router-dom';
import ReactDOM from 'react-dom/client';

import NieStatusStepper from '../../components/StepperNie'

import "../../styles/MainLayout.scss";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import './../../styles/SweetAlert.scss';
import { Result } from 'ethers';

const MySwal = withReactContent(Swal);

function NieApprove() {

  const [contract, setContract] = useState();
  const [namaProduk, setNamaProduk] = useState("")
  const [dataObat, setDataObat] = useState([])
  
  const userdata = JSON.parse(sessionStorage.getItem('userdata'));

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
    document.title = "NIE List"; 
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
          console.error("User access denied!");
          errAlert(err, "User access denied!");
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
          const listObatCt = await contract.getAllObat();
          console.log(listObatCt);
          const reconstructedData = listObatCt.map((item, index) => {
            if (item[0] === "") {
              return null; 
            }
            const nie = item[2] !== "" ? item[2] : "-"

            return {
              obatId: item[0],
              namaProduk: item[1],
              nieNumber: nie,
              nieStatus: obatStatusMap[item[3]],
              factoryInstance: item[4]
            };
          }).filter(item => item !== null);

          console.log(reconstructedData);
          setDataObat(reconstructedData);
  
        } catch (error) {
          console.error("Error loading data: ", error);
        }
      }
    };
  
    loadData();
  }, [contract])

  useEffect(() => {
    if (contract) {

      contract.on('evt_nieApproved',  (_instanceName, _instanceAddr, _nieNumber, _timestampApprove) => {

        const timestamp = new Date(Number(_timestampApprove) * 1000).toLocaleDateString('id-ID', options)
    
        MySwal.fire({
          title: "Success Request NIE",
          html: (
            <div className='form-swal'>
              <ul>
                <li className="label">
                  <p>NIE Number</p> 
                </li>
                <li className="input">
                  <p>{_nieNumber}</p> 
                </li>
              </ul>
              <ul>
                <li className="label">
                  <p>BPOM Instance</p> 
                </li>
                <li className="input">
                  <p>{_instanceName}</p> 
                </li>
              </ul>
              <ul>
                <li className="label">
                  <p>BPOM Address</p> 
                </li>
                <li className="input">
                  <p>{_instanceAddr}</p> 
                </li>
              </ul>
              <ul>
                <li className="label">
                  <p>Timestamp Approve</p> 
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
        contract.removeAllListeners("evt_nieApproved");
      };
    }
  
  }, [contract]);
  
  const getDetailObat = async (id) => {
    
    console.log(id); 
    
    try {
      const detailObatCt = await contract.detailObat(id);

      const [obatDetails, obatNie] = detailObatCt;

      const [merk, namaProduk, klaim, komposisi, kemasan, tipeProduk, factoryInstance, factoryAddr] = obatDetails;

      const [nieNumber, nieStatus, timestampProduction, timestampNieRequest, timestampNieApprove, bpomInstance, bpomAddr] = obatNie;
      console.log(parseInt(nieStatus));
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

      const timestamps = {
        timestampProduction : timestampProduction ? new Date(Number(timestampProduction) * 1000).toLocaleDateString('id-ID', options) : 0,
        timestampNieRequest :timestampNieRequest ? new Date(Number(timestampNieRequest) * 1000).toLocaleDateString('id-ID', options) : 0,
        timestampNieApprove : timestampNieApprove ? new Date(Number(timestampNieApprove) * 1000).toLocaleDateString('id-ID', options): 0
      }

      console.log(detailObat);

      if(detailObat.obatStatus === 'Approved NIE'){
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
            )
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
          showCancelButton: true,
          confirmButtonText: 'Approve NIE',
          didOpen: () => {
            const stepperOrder = document.getElementById('stepperOrder');
            const root = ReactDOM.createRoot(stepperOrder);
            root.render( 
              <NieStatusStepper nieStatus={parseInt(nieStatus)} timestamps={timestamps} />
            );
          }
        }).then((result) => {
            const currentDate = new Date();
            const year = currentDate.getFullYear();
            const month = String(currentDate.getMonth() + 1).padStart(2, '0');
            const day = String(currentDate.getDate()).padStart(2, '0');
            const randomNumber = Math.floor(1000 + Math.random() * 9000); 
        
            const nieNum = `TR${year}${month}${day}${randomNumber}`;
    
            if(result.isConfirmed){

            MySwal.fire({
              title: "Approve NIE",
              html: (
                <div className='form-swal form'>
                  <div className="row row--obat">
                  <div className="col col3">
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
                    <div className="col col3">
                      <ul>
                        <li className="label">
                          <label htmlFor="factoryInstanceName">NIE Number</label>
                        </li>
                        <li className="input">
                          <input
                            type="text"
                            id="factoryInstanceName"
                            value={nieNum}
                            readOnly
                          />
                        </li>
                      </ul>

                      <ul>
                        <li className="label">
                          <label htmlFor="factoryInstanceName">Nama Produk</label>
                        </li>
                        <li className="input">
                          <input
                            type="text"
                            id="factoryInstanceName"
                            value={namaProduk}
                            readOnly
                          />
                        </li>
                      </ul>
              
                      <ul>
                        <li className="label">
                          <label htmlFor="factoryInstanceName">Tipe Produk</label>
                        </li>
                        <li className="input">
                          <input
                            type="text"
                            id="factoryInstanceName"
                            value={detailObat.tipeProduk}
                            readOnly
                          />
                        </li>
                      </ul>
              
                      <ul>
                        <li className="label">
                          <label htmlFor="factoryInstanceName">Kemasan</label>
                        </li>
                        <li className="input">
                          <input
                            type="text"
                            id="factoryInstanceName"
                            value={kemasan}
                            readOnly
                          />
                        </li>
                      </ul>

                      <ul>
                        <li className="label">
                          <label htmlFor="factoryAddr">Factory Instance</label>
                        </li>
                        <li className="input">
                          <input
                            type="text"
                            id="factoryAddr"
                            value={detailObat.factoryInstanceName}
                            readOnly
                          />
                        </li>
                      </ul>

                      <ul>
                        <li className="label">
                          <label htmlFor="factoryAddr">Factory Address</label>
                        </li>
                        <li className="input">
                          <input
                            type="text"
                            id="factoryAddr"
                            value={detailObat.factoryAddr}
                            readOnly
                          />
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              ),
              width: '820',
              showCancelButton: true,
              confirmButtonText: 'Yes, Approve!',
              allowOutsideClick: false,
            }).then((result) => {
              if(result.isConfirmed){

                MySwal.fire({
                  title:"Processing your request...",
                  text:"Your request is on its way. This won't take long. 🚀",
                  icon: 'info',
                  showCancelButton: false,
                  showConfirmButton: false,
                  allowOutsideClick: false
                })

                approveNie(id, nieNum)
              }
            })
          }
        })

      }
      

    } catch (e) {
      errAlert(e, "Can't retrieve data")
    }
  }

  const approveNie = async(id, nieNumber) => {

    try {
      const approveNieCt =  await contract.approveNie(id, nieNumber, userdata.instanceName)
      console.log(approveNieCt);

      if(approveNieCt){
        MySwal.update({
          title: "Processing your transaction...",
          text: "This may take a moment. Hang tight! ⏳"
        });
      }

    } catch (error) {
      errAlert(error, "Can't Approve NIE");
    }
  }

  return (
    <>
      <div id="CpotbPage" className='Layout-Menu layout-page'>
        <div className="title-menu">
          <h1>Data Izin Edar</h1>
        </div>
        <div className="container-data">
          <div className="data-list">
            {dataObat !== 0 ? (
              <ul>
                {dataObat.map((item, index) => (
                  <li key={index}>
                    <button className='title' onClick={() => getDetailObat(item.obatId)}>{item.namaProduk}</button>
                    <p>Factory Instance: {item.factoryInstance}</p>
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


export default NieApprove;