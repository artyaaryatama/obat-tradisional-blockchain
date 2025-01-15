import { useEffect, useState } from 'react';
import { BrowserProvider, Contract } from "ethers";
import contractData from '../../auto-artifacts/deployments.json';
import ReactDOM from 'react-dom/client';

import NieStatusStepper from '../../components/StepperNie'

import "../../styles/MainLayout.scss";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import './../../styles/SweetAlert.scss';
import JenisSediaanTooltip from '../../components/TooltipJenisSediaan';


const MySwal = withReactContent(Swal);

function NieApprove() {
  const [contracts, setContracts] = useState(null);
  const [dataObat, setDataObat] = useState([])
  
  const userdata = JSON.parse(sessionStorage.getItem('userdata'));

  const obatStatusMap = {
    0: "In Local Production",
    1: "Requested",
    2: "Approved",
    3: "Rejected"
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
    document.title = "NIE List"; 
  }, []);

  useEffect(() => {
    async function connectWallet() {
      if (window.ethereum) {
        try {
          const provider = new BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();

          const ObatTradisional = new Contract(
            contractData.ObatTradisional.address, 
            contractData.ObatTradisional.abi, 
            signer
          );
            
          const RejectManager = new Contract(
            contractData.RejectManager.address,
            contractData.RejectManager.abi,
            signer
          );
          
          setContracts({
            obatTradisional: ObatTradisional,
            rejectManager: RejectManager
          });
            
        } catch (err) {
          console.error("User access denied!");
          errAlert(err, "User access denied!");
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
          const listObatCt = await contracts.obatTradisional.getAllObat();

          const reconstructedData = listObatCt.map((item, index) => {

            let nieNumber = item[2] ? item[2] : 'TBA';

            if(item[3] === 3n){
              nieNumber= null
            }
            return {
              obatId: item[0],
              namaProduk: item[1],
              nieNumber: nieNumber,
              nieStatus: obatStatusMap[item[3]],
              factoryInstance: item[4]
            };
          })

          console.log(reconstructedData);
          setDataObat(reconstructedData);
  
        } catch (error) {
          console.error("Error loading data: ", error);
        }
      }
    };
  
    loadData();
  }, [contracts])

  const handleEventNieApproved = (status, namaProduk, bpomAddr, bpomInstance, detail, timestamp, txHash) => {

    const formattedTimestamp = new Date(Number(timestamp) * 1000).toLocaleDateString('id-ID', options)
  
    if (status === 'Approved') {
      MySwal.fire({
        title: "Success Approve NIE",
        html: (
          <div className='form-swal'>
            <ul>
              <li className="label">
                <p>Nama Produk</p> 
              </li>
              <li className="input">
                <p>{namaProduk}</p> 
              </li>
            </ul>
            <ul>
              <li className="label">
                <p>NIE Number</p> 
              </li>
              <li className="input">
                <p>{detail}</p> 
              </li>
            </ul>
            <ul>
              <li className="label">
                <p>BPOM Instance</p> 
              </li>
              <li className="input">
                <p>{bpomInstance}</p> 
              </li>
            </ul>
            <ul>
              <li className="label">
                <p>BPOM Address</p> 
              </li>
              <li className="input">
                <p>{bpomAddr}</p> 
              </li>
            </ul>
            <ul>
              <li className="label">
                <p>Tanggal Disetujui</p> 
              </li>
              <li className="input">
                <p>{formattedTimestamp}</p> 
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
      
    } else {
      MySwal.fire({
        title: "NIE Rejected",
        html: (
          <div className='form-swal'>
            <ul>
              <li className="label">
                <p>Nama Produk</p> 
              </li>
              <li className="input">
                <p>{namaProduk}</p> 
              </li>
            </ul>
            <ul>
              <li className="label">
                <p>BPOM Instance</p> 
              </li>
              <li className="input">
                <p>{bpomInstance}</p> 
              </li>
            </ul>
            <ul>
              <li className="label">
                <p>BPOM Address</p> 
              </li>
              <li className="input">
                <p>{bpomAddr}</p> 
              </li>
            </ul>
            <ul>
              <li className="label">
                <p>Tanggal Penolakan</p> 
              </li>
              <li className="input">
                <p>{formattedTimestamp}</p> 
              </li>
            </ul>
            <ul className='rejectMsg'>
              <li className="label">
                <p>Alasan Penolakan</p> 
              </li>
              <li className="input">
                <p>{detail}</p> 
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
  }

  const getDetailObat = async (id) => {
    
    console.log(id); 
    
    try {
      const detailObatCt = await contracts.obatTradisional.detailObat(id);

      const [obatDetails, obatNie] = detailObatCt;

      const [merk, namaProduk, klaim, komposisi, kemasan, factoryInstance, factoryAddr, tipeObat, cpotbHash,  cdobHash, jenisObat] = obatDetails;

      const [nieNumber, nieStatus, timestampProduction, timestampNieRequest, timestampNieApprove, bpomInstance, bpomAddr] = obatNie;

      console.log(nieStatus);

      const detailObat = {
        obatId: id,
        merk: merk,
        namaObat: namaProduk,
        klaim: klaim,
        kemasan: kemasan,
        komposisi: komposisi,
        tipeProduk: "Obat Tradisional", 
        nieStatus: obatStatusMap[nieStatus], 
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

      const timestamps = {
        timestampProduction : timestampProduction ? new Date(Number(timestampProduction) * 1000).toLocaleDateString('id-ID', options) : 0,
        timestampNieRequest :timestampNieRequest ? new Date(Number(timestampNieRequest) * 1000).toLocaleDateString('id-ID', options) : 0,
        timestampNieApprove : timestampNieApprove ? new Date(Number(timestampNieApprove) * 1000).toLocaleDateString('id-ID', options): 0
      }

      if(detailObat.nieStatus === 'Approved NIE'){
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

                <div className="col col1">
                  <ul className='status'>
                    <li className="label">
                      <p>Status Izin Edar</p>
                    </li>
                    <li className="input">
                      <p className={detailObat.nieStatus}>{detailObat.nieStatus}</p>
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
            )
          }
        })
     
      } else if(detailObat.nieStatus === 'Rejected NIE'){
        const detailCpotbRejected = await contracts.rejectManager.rejectedDetails(id);

        const [rejectMsg, bpomName, bpomInstanceName, jenisSediaanRejected, bpomAddr, timestampRejected] = detailCpotbRejected

        const newTimestamps = {
          timestampProduction : timestampProduction ? new Date(Number(timestampProduction) * 1000).toLocaleDateString('id-ID', options) : 0,
          timestampNieRequest :timestampNieRequest ? new Date(Number(timestampNieRequest) * 1000).toLocaleDateString('id-ID', options) : 0,
          timestampNieReject : timestampRejected ? new Date(Number(timestampRejected) * 1000).toLocaleDateString('id-ID', options): 0
        }
 
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

                <div className="col col1">
                  <ul className='status'>
                    <li className="label">
                      <p>Status Izin Edar</p>
                    </li>
                    <li className="input">
                      <p className={detailObat.nieStatus}>{detailObat.nieStatus}</p>
                    </li>
                  </ul>

                  <ul className='rejectMsg'>
                    <li className="label">
                      <p>Alasan Penolakan</p> 
                    </li>
                    <li className="input">
                      <p>{rejectMsg}</p> 
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
                      <p>Tanggal Penolakan NIE</p> 
                    </li>
                    <li className="input">
                    <p>{ new Date(Number(timestampRejected) * 1000).toLocaleDateString('id-ID', options)}</p> 
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
              <NieStatusStepper nieStatus={parseInt(nieStatus)} timestamps={newTimestamps} />
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
                  <ul className='status'>
                    <li className="label">
                      <p>Status Izin Edar</p>
                    </li>
                    <li className="input">
                      <p className={detailObat.nieStatus}>{detailObat.nieStatus}</p>
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
          showCancelButton: false,
          confirmButtonText: 'Approve',
          showDenyButton: true,
          denyButtonText: 'Reject ',
          didOpen: () => {
            const stepperOrder = document.getElementById('stepperOrder');
            const root = ReactDOM.createRoot(stepperOrder);
            root.render( 
              <NieStatusStepper nieStatus={parseInt(nieStatus)} timestamps={timestamps} />
            );
          }
        }).then((result) => {
          
          if(result.isConfirmed){
            const currentDate = new Date();
            const year = currentDate.getFullYear();
            const month = String(currentDate.getMonth() + 1).padStart(2, '0');
            const day = String(currentDate.getDate()).padStart(2, '0');
            const randomNumber = Math.floor(1000 + Math.random() * 9000); 
        
            let nieNum;
            
            if(jenisObat === "OHT"){
              detailObat.jenisObat = "Obat Herbal Terstandar"
              nieNum = `HT${year}${month}${day}${randomNumber}`;
            } else if (jenisObat === "Jamu"){
              nieNum = `TR${year}${month}${day}${randomNumber}`;
            } else {
              nieNum = `FF${year}${month}${day}${randomNumber}`;
            }

            MySwal.fire({
              title: "Approve NIE",
              html: (
                <div className='form-swal form'>
                  <div className="row row--obat">
                    <div className="col col3">
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
                          <label htmlFor="factoryAddr">Factory CPOTB</label>
                        </li>
                        <li className="input">
                          <span className='linked-i'>
                            <a
                              href={`http://localhost:3000/public/certificate/${cpotbHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              CPOTB Details
                              <i class="fa-solid fa-arrow-up-right-from-square"></i>
                            </a>
                          </span>
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
                          <label htmlFor="tipeProduk">Tipe Produk</label>
                        </li>
                        <li className="input">
                          <input
                            type="text"
                            id="tipeProduk"
                            value={detailObat.tipeProduk}
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
                          <label htmlFor="jenisObat">Jenis Obat</label>
                        </li>
                        <li className="input">
                          <input
                            type="text"
                            id="jenisObat"
                            value={detailObat.jenisObat}
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

                approveNie(id, nieNum, detailObat.namaObat)
              }
            })
          
          } else if(result.isDenied){
            MySwal.fire({
              title: "Reject NIE",
              html: (
                <div className='form-swal form'>
                  <div className="row row--obat">
                    <div className="col col3">
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
                          <label htmlFor="factoryAddr">Factory CPOTB</label>
                        </li>
                        <li className="input">
                          <span className='linked-i'>
                            <a
                              href={`http://localhost:3000/public/certificate/${cpotbHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              CPOTB Details
                              <i class="fa-solid fa-arrow-up-right-from-square"></i>
                            </a>
                          </span>
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
                          <label htmlFor="tipeProduk">Tipe Produk</label>
                        </li>
                        <li className="input">
                          <input
                            type="text"
                            id="tipeProduk"
                            value={detailObat.tipeProduk}
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
                          <label htmlFor="jenisObat">Jenis Obat</label>
                        </li>
                        <li className="input">
                          <input
                            type="text"
                            id="jenisObat"
                            value={detailObat.jenisObat}
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
                          <label htmlFor="rejectMsg">Alasan Reject</label>
                        </li>
                        <li className="input">
                          <textarea 
                            type="text" 
                            id="rejectMsg"
                            rows="3"
                            required
                          />
                        </li>
                      </ul>

                    </div>
                  </div>
                </div>
              ),
              width: '820',
              showCancelButton: false,
              showCloseButton: true,
              confirmButtonText: 'Reject',
              allowOutsideClick: false,
              preConfirm: () => {
                const rejectMsgInput = document.getElementById('rejectMsg').value;
                if (!rejectMsgInput) {
                  Swal.showValidationMessage('Alasan Reject is required!');
                }
                return { rejectMsgInput };
              },
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

                rejectNie(id, result.value.rejectMsgInput, detailObat.namaObat)
              }
            })
          }
        })

      }
      
    } catch (e) {
      errAlert(e, "Can't retrieve data")
    }
  }

  const approveNie = async(id, nieNumber, namaObat) => {

    try {
      const approveNieCt =  await contracts.obatTradisional.approveNie(id, nieNumber, userdata.instanceName)
      console.log(approveNieCt);

      if(approveNieCt){
        MySwal.update({
          title: "Processing your transaction...",
          text: "This may take a moment. Hang tight! ⏳"
        });
      }

      contracts.obatTradisional.on('evt_nieApproved',  (_instanceName, _instanceAddr, _nieNumber, _timestampApprove) => {
        handleEventNieApproved("Approved", namaObat, _instanceAddr, _instanceName, _nieNumber, _timestampApprove, approveNieCt.hash)
      });

    } catch (error) {
      errAlert(error, "Can't Approve NIE");
    }
  }

  const rejectNie = async(id, rejectMsg, namaObat) => {

    try {
      const rejectCt = await contracts.rejectManager.rejectedByBpom(rejectMsg, userdata.name, userdata.instanceName, id, "nie", 0);

      if(rejectCt){
        MySwal.update({
          title: "Processing your transaction...",
          text: "This may take a moment. Hang tight! ⏳"
        });
      }

      contracts.rejectManager.on('evt_nieRejected',  (_instanceName, _instanceAddr, _timestampRejected, _rejectMsg) => {
        handleEventNieApproved("Rejected", namaObat, _instanceAddr, _instanceName, _rejectMsg, _timestampRejected, rejectCt.hash)
      });

    } catch (error) {
      errAlert(error, "Can't Approve NIE");
    }
  }

  return (
    <>
      <div id="CpotbPage" className='Layout-Menu layout-page'>
        <div className="title-menu">
          <h1>Data Izin Edar Obat Tradisional</h1>
          <p>Dikelola oleh {userdata.instanceName}</p>
        </div>
        <div className="container-data">
          <div className="data-list">
            {dataObat.length !== 0 ? (
              <ul>
                {dataObat.map((item, index) => (
                  <li key={index}>
                    <button className='title' onClick={() => getDetailObat(item.obatId)}>{item.namaProduk}</button>
                    <p>Factory Instance: {item.factoryInstance}</p>
                    <p>
                      { item.nieNumber !== null ? `NIE Number : ${item.nieNumber}` : "NIE Number: Not Available"}
                    </p>
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