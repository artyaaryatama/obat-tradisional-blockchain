import { useEffect, useState } from 'react';
import { BrowserProvider, Contract } from "ethers";
import contractObatTradisional from '../../auto-artifacts/ObatTradisional.json';
import { useNavigate } from 'react-router-dom';

import "../../styles/MainLayout.scss";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import './../../styles/SweetAlert.scss';
import { Result } from 'ethers';

const MySwal = withReactContent(Swal);

function NieApprove() {

  const navigate = useNavigate();
  const [contract, setContract] = useState();
  const [loader, setLoader] = useState(false)
  
  const [isApproved, setIsApproved] = useState(false);
  const [nieNumber, setNieNumber] = useState("");
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
    second: '2-digit',
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
            contractObatTradisional.address, 
            contractObatTradisional.abi, 
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
      if (contract && userdata.instanceName) {
        try {
          const tx = await contract.getListAllObatNie();
          const [obatIdArray, namaProdukArray, factoryInstanceNameArray, latestTimestampArray, obatStatusArray] = tx;

          const reconstructedData = obatStatusArray.map((obatStatus, index) => {
            const readableObatStatus = obatStatusMap[obatStatus];
  
            const timestampDate = new Date(Number(latestTimestampArray[index]) * 1000);;
            const formattedTimestamp = timestampDate.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric',});
  

            return {
              namaObat : namaProdukArray[index],
              factoryInstanceName: factoryInstanceNameArray[index],
              latestTimestamp: formattedTimestamp,
              obatStatus: readableObatStatus,
              idObat: obatIdArray[index]
            };
          });
  
          setDataObat(reconstructedData);
          console.log(dataObat);
  
        } catch (error) {
          console.error("Error loading data: ", error);
        }
      }
    };
  
    loadData();
  }, [contract])

  useEffect(() => {
    if (!contract) {
      console.error("Contract is undefined");
      return;
    }
  
    try {
      console.log('TRIGERRED evt_nieApproved listener');
      contract.on('evt_nieApproved',  (nieNumber, namaProduk) => {
        setNieNumber(nieNumber); 
        setNamaProduk(namaProduk);
        setIsApproved(true);
      });
  
      return () => {
        console.log("Removing evt_nieApproved listener");
        contract.removeAllListeners("evt_nieApproved");
      };
    } catch (error) {
      console.error(error);
      errAlert(error);
    }
  }, [contract]);

  useEffect(() => {
    if (isApproved && nieNumber) {
      Swal.fire({
        title: `NIE Approved!`,
        text: `Success approve NIE (${nieNumber}) for produk ${namaProduk}`,
        icon: 'success',
        showCancelButton: false,
        confirmButtonText: 'Ok',
        allowOutsideClick: true
      }).then((result) => {
        if (result.isConfirmed) {
          setNieNumber('')
          setNamaProduk('')
          setIsApproved(false)
          window.location.reload();
        }
      });

    }
  }, [isApproved, nieNumber]);
  
  
  const getDetailObat = async (id) => {
    
    console.log(id); 
    
    try {
      const tx = await contract.getListObatById(id);

      const [obatDetails, factoryAddress, factoryInstanceName, factoryUserName, bpomAddress, bpomInstanceName, bpomUserName] = tx

      console.log(obatDetails);

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
          confirmButtonText: 'Approve NIE',
        }).then((result) => {
  
          if(result.isConfirmed){
            const currentDate = new Date();
            const year = currentDate.getFullYear();
            const month = String(currentDate.getMonth() + 1).padStart(2, '0');
            const day = String(currentDate.getDate()).padStart(2, '0');
            const randomNumber = Math.floor(1000 + Math.random() * 9000); 
  
            const nieNum = `TR${year}${month}${day}${randomNumber}`;
  
            MySwal.fire({
              title: "Approve NIE",
              html: (
                <div className='form-swal'>
                  <div className="row row--obat">
                    <div className="col col1">
        
                      <ul>
                        <li className="label">
                          <p>Nomor NIE</p>
                        </li>
                        <li className="input">
                          <p>{nieNum}</p> 
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
                          <p>{userdata.address}</p> 
                        </li>
                      </ul>
        
                      <ul>
                        <li className="label">
                          <p>Nama Penyutuju</p> 
                        </li>
                        <li className="input">
                          <p>{userdata.name}</p> 
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
              confirmButtonText: 'Yes, Approve!',
              allowOutsideClick: false,
              preConfirm: async () => {
                try {
                  console.log(userdata.address);
                  const tx =  await contract.approveNie(id, userdata.address, userdata.instanceName, userdata.name, nieNum)
                  console.log(tx);
                  console.log(id, nieNum, userdata.name);
                  return tx;
                } catch (error) {
                  errAlert(error);
                  return null;
                }
              }
            }).then((result) => {
              if(result.isConfirmed){
                if (result.isConfirmed && result.value) {
                  MySwal.fire({
                    title:"Processing your request...",
                    text:"Your request is on its way. This won't take long. 🚀",
                    icon: 'info',
                    showCancelButton: false,
                    showConfirmButton: false,
                    allowOutsideClick: false
                  })
                }
              }
            })
          }
        })

      }
      

    } catch (e) {
      errAlert(e, "Can't retrieve data")
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
            {dataObat.length > 0 ? (
              <ul>
                {dataObat.map((item, index) => (
                  <li key={index}>
                    <button className='title' onClick={() => getDetailObat(item.idObat)}>{item.namaObat}</button>
                    <p>Diproduksi oleh : {item.factoryInstanceName}</p>
                    <p>Tanggal Pengajuan: {item.latestTimestamp}</p>
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


export default NieApprove;