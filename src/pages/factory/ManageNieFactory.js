import { useEffect, useState } from 'react';
import { BrowserProvider, Contract } from "ethers";
import contractData from '../../auto-artifacts/deployments.json';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig"; 
import ReactDOM from 'react-dom/client';
import NieStatusStepper from '../../components/StepperNie'
import "../../styles/MainLayout.scss"
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import './../../styles/SweetAlert.scss';
import JenisSediaanTooltip from '../../components/TooltipJenisSediaan';

const MySwal = withReactContent(Swal);

function ManageNieFactory() {
  const [contracts, setContracts] = useState(null);
  const navigate = useNavigate();

  const userdata = JSON.parse(sessionStorage.getItem('userdata'));
  const [dataObat, setDataObat] = useState([]);

  const obatStatusMap = {
    0n: "Dalam Produksi",
    1n: "Pengajuan NIE",
    2n: "Disetujui NIE",
    3: "Tidak Disetujui NIE"
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
    document.title = "List Obat Tradisional"; 
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

          const NieManager = new Contract(
            contractData.NieManager.address, 
            contractData.NieManager.abi, 
            signer
          );

          setContracts({
            obatTradisional: ObatTradisional,
            nieManager: NieManager
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
          const listAllObatCt = await contracts.obatTradisional.getAllObatByInstance(userdata.instanceName);
          console.log(listAllObatCt);

          const reconstructedData = listAllObatCt.map((item, index) => {

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
          
          setDataObat(reconstructedData);
          console.log(reconstructedData); 
          
        } catch (error) {
          console.error("Error loading data: ", error);
        }
      }
    };
    
    loadData();
  }, [contracts]);

  const handleEventNieRequsted = (namaProduk, factoryAddr, factoryInstance, timestamp, txHash) =>{

    const formattedTimestamp = new Date(Number(timestamp) * 1000).toLocaleDateString('id-ID', options)
    
    MySwal.fire({
      title: "Sukses Mengajukan NIE",
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
              <p>Nama Instansi Pabrik</p> 
            </li>
            <li className="input">
              <p>{factoryInstance}</p> 
            </li>
          </ul>
          <ul>
            <li className="label">
              <p>Alamat Akun Pabrik (Pengguna)</p> 
            </li>
            <li className="input">
              <p>{factoryAddr}</p> 
            </li>
          </ul>
          <ul>
            <li className="label">
              <p>Tanggal Pengajuan</p> 
            </li>
            <li className="input">
              <p>{formattedTimestamp}</p> 
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

  const getDetailObat = async (id) => {

    try {
      const detailObatCt = await contracts.obatTradisional.detailObat(id);
      const detailNieCt = await contracts.nieManager.getNieDetail(id)
      let rejectMsg;

      const [merk, namaProduk, klaim, komposisi, kemasan, factoryInstance, factoryAddr, tipeObat, cpotbHash, cdobHash, jenisObat] = detailObatCt;

      const [nieNumber, nieStatus, timestampProduction, timestampNieRequest, timestampNieApprove, timestampNieRejected, timestampNieRenewRequest, factoryInstancee, bpomInstance, bpomAddr] = detailNieCt;

      const detailObat = {
        obatId: id,
        merk: merk,
        namaObat: namaProduk,
        klaim: klaim,
        kemasan: kemasan,
        komposisi: komposisi,
        nieStatus: obatStatusMap[nieStatus], 
        timestampProduction: timestampProduction ? new Date(Number(timestampProduction) * 1000).toLocaleDateString('id-ID', options) : '-', 
        timestampNieRequest: timestampNieRequest ? new Date(Number(timestampNieRequest) * 1000).toLocaleDateString('id-ID', options) : '-', 
        timestampNieApprove:  timestampNieApprove ? new Date(Number(timestampNieApprove) * 1000).toLocaleDateString('id-ID', options): "-",
        timestampNieReject:  timestampNieRejected ? new Date(Number(timestampNieRejected) * 1000).toLocaleDateString('id-ID', options): "-",
        timestampNieRenewRequest:  timestampNieRenewRequest ? new Date(Number(timestampNieRenewRequest) * 1000).toLocaleDateString('id-ID', options): "-",
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

      const timestamps = {
        timestampProduction : timestampProduction ? new Date(Number(timestampProduction) * 1000).toLocaleDateString('id-ID', options) : 0,
        timestampNieRequest :timestampNieRequest ? new Date(Number(timestampNieRequest) * 1000).toLocaleDateString('id-ID', options) : 0,
        timestampNieApprove : timestampNieApprove ? new Date(Number(timestampNieApprove) * 1000).toLocaleDateString('id-ID', options): 0
      }

      console.log(detailObat);
      
      if(detailObat.nieStatus === 'Dalam Produksi'){
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
                      <p>Tanggal Produksi</p>
                    </li>
                    <li className="input">
                      <p>{detailObat.timestampProduction}</p> 
                    </li>
                  </ul>

                  <ul>
                    <li className="label">
                      <p>Tanggal Pengajuan NIE</p>
                    </li>
                    <li className="input">
                      <p>{detailObat.timestampNieRequest}</p> 
                    </li>
                  </ul>

                  <ul>
                    <li className="label">
                      <p>Tanggal Disetujui NIE</p>
                    </li>
                    <li className="input">
                      <p>{detailObat.timestampNieApprove}</p> 
                    </li>
                  </ul>

                  <ul>
                    <li className="label">
                      <p>Nama Instansi Pabrik</p>
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
                      <p>Alamat Akun Pabrik (Pengguna)</p> 
                    </li>
                    <li className="input">
                      <p>{detailObat.factoryAddr}</p> 
                    </li>
                  </ul>

                  <ul>
                    <li className="label">
                      <p>Nama Instansi BPOM</p> 
                    </li>
                    <li className="input">
                      <p>{detailObat.bpomInstanceNames}
                      </p> 
                    </li>
                  </ul>

                  <ul>
                    <li className="label">
                      <p>Alamat Akun BPOM (Pengguna)</p> 
                    </li>
                    <li className="input">
                      <p>{detailObat.bpomAddr}</p> 
                    </li>
                  </ul>

                </div>

                {/* <div className="container-stepper">
                  <div id="stepperOrder"></div>
                </div> */}
              </div>
            
            </div>
          ),
          width: '1020',
          showCancelButton: false,
          showCloseButton: true,
          confirmButtonText: 'Pengajuan  NIE',
          // didOpen: () => {
          //   const stepperOrder = document.getElementById('stepperOrder');
          //   const root = ReactDOM.createRoot(stepperOrder);
          //   root.render( 
          //     <NieStatusStepper nieStatus={parseInt(nieStatus)} timestamps={timestamps} />
          //   );
          // }
        }).then((result) => {
  
          if(jenisObat === "OHT"){
            detailObat.jenisObat = "Obat Herbal Terstandar"
          }

          if(result.isConfirmed){
            MySwal.fire({
              title: `Pengajuan  NIE`,
              html: (
                <div className='form-swal full'>
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
              confirmButtonText: 'Pengajuan NIE',
              allowOutsideClick: false,
              cancelButtonText: 'Batal',
            }).then((result) => {
              if(result.isConfirmed){
                MySwal.fire({
                  title: "Memproses Permintaan...",
                  text: "Permintaan Anda sedang diproses. Ini tidak akan memakan waktu lama. 🚀",
                  icon: 'info',
                  showCancelButton: false,
                  showConfirmButton: false,
                  allowOutsideClick: false,
                });
                
                

                requestNie(detailObat.obatId, detailObat.namaObat)
              }
            })
          }
        })
        
      } else if(detailObat.nieStatus === 'Tidak Disetujui NIE'){

        rejectMsg = await contracts.NieManager.getRejectMsgNie(id);

        const newTimestamps = {
          timestampProduction : timestampProduction ? new Date(Number(timestampProduction) * 1000).toLocaleDateString('id-ID', options) : 0,
          timestampNieRequest :timestampNieRequest ? new Date(Number(timestampNieRequest) * 1000).toLocaleDateString('id-ID', options) : 0,
          timestampNieReject : timestampNieRejected ? new Date(Number(timestampNieRejected) * 1000).toLocaleDateString('id-ID', options): 0 
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
                      <p>Jenis Obat</p>
                    </li>
                    <li className="input colJenisSediaan">
                      <p><p>{
                      detailObat.jenisObat === "OHT" ? "Obat Herbal Terstandar" : detailObat.jenisObat}</p> </p> 
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
                        jenisSediaan= {detailObat.tipeObat}
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
                      <p>Tanggal Produksi</p>
                    </li>
                    <li className="input">
                      <p>{detailObat.timestampProduction}</p> 
                    </li>
                  </ul>

                  <ul>
                    <li className="label">
                      <p>Tanggal Pengajuan NIE</p>
                    </li>
                    <li className="input">
                      <p>{detailObat.timestampNieRequest}</p> 
                    </li>
                  </ul>

                  <ul>
                    <li className="label">
                      <p>Tanggal Penolakan NIE</p>
                    </li>
                    <li className="input">
                      <p>{detailObat.timestampNieReject}</p> 
                    </li>
                  </ul>
  
                  <ul>
                    <li className="label">
                      <p>Nama Instansi Pabrik</p>
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
                      <p>Alamat Akun Pabrik (Pengguna)</p> 
                    </li>
                    <li className="input">
                      <p>{detailObat.factoryAddr}</p> 
                    </li>
                  </ul>
  
                  <ul>
                    <li className="label">
                      <p>Nama Instansi BPOM</p> 
                    </li>
                    <li className="input">
                      <p>{detailObat.bpomInstance}
                      </p> 
                    </li>
                  </ul>
  
                  <ul>
                    <li className="label">
                      <p>Alamat Akun BPOM (Pengguna)</p> 
                    </li>
                    <li className="input">
                      <p>{bpomAddr}</p> 
                    </li>
                  </ul>
  
                </div>
  
                {/* <div className="container-stepper">
                  <div id="stepperOrder"></div>
                </div> */}
              </div>
            
            </div>
          ),
          width: '1020',
          showCloseButton: true,
          showConfirmButton: true,
          confirmButtonText: "Ajukan Ulang NIE",
          showCancelButton: false,
          // didOpen: () => {
          //   const stepperOrder = document.getElementById('stepperOrder');
          //   const root = ReactDOM.createRoot(stepperOrder);
          //   root.render( 
          //     <NieStatusStepper nieStatus={parseInt(nieStatus)} timestamps={newTimestamps} />
          //   )
          // }
        }).then((result) => {
          const today = new Date();
          const formattedDate = today.toLocaleDateString('id-ID', options);
          if (result.isConfirmed) {
            MySwal.fire({
              title: "Pengajuan Ulang Sertifikat CPOTB",
              html: (
                <div className='form-swal form'>
                  <div className="row row--obat">
                    <div className="col col3">
                      <ul>
                        <li className="label">
                          <label htmlFor="factoryAddr">Nama Instansi Pabrik</label>
                        </li>
                        <li className="input">
                          <input
                            type="text"
                            id="factoryInstanceName"
                            value={detailObat.factoryInstanceName}
                            readonly
                          />
                        </li>
                      </ul>

                      <ul>
                        <li className="label">
                          <label htmlFor="factoryAddr">Alamat Akun Pabrik (Pengguna)</label>
                        </li>
                        <li className="input">
                          <input
                            type="text"
                            id="factoryAddr"
                            value={detailObat.factoryAddr}
                            readonly
                          />
                        </li>
                      </ul>
                      <ul>
                        <li className="label">
                          <label htmlFor="klaim">Klaim Obat</label>
                        </li>
                        <li className="input">
                          <ul className="numbered">
                            <textarea 
                              id="klaimObat"
                              rows="4"
                              cols="50"
                              value={detailObat.klaim}
                              >
                            </textarea>
                          </ul>
                        </li>
                      </ul>

                      <ul>
                        <li className="label">
                          <label htmlFor="komposisi">Komposisi Obat</label>
                        </li>
                        <li className="input">
                          <ul className="numbered">
                            <textarea 
                              id="komposisiObat"
                              rows="4"
                              cols="50"
                              value={detailObat.komposisi}
                              >
                            </textarea>
                          </ul>
                        </li>
                      </ul>
                    </div>
                    <div className="col col3">
                      <ul>
                        <li className="label">
                          <label htmlFor="factoryInstanceName">Tanggal Pengajuan Ulang NIE</label>
                        </li>
                        <li className="input">
                          <input
                            type="text"
                            id="factoryInstanceName"
                            value={formattedDate}
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
                            id="namaProduk"
                            value={namaProduk}
                            
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
                            id="kemasan"
                            value={kemasan}
                            
                          />
                        </li>
                      </ul>

                    </div>
                  </div>
                </div>
              ),
              width: '800',
              showCloseButton: true,
              showCancelButton: false,
              showConfirmButton: true,
              confirmButtonText: 'Pengajuan Ulang CPOTB',
              preConfirm: async () => {
                const inputs = document.querySelectorAll(".swal2-container input");
                const formData = {};
              
                inputs.forEach((input) => {
                  formData[input.id] = input.value;
                });
              
                console.log("Collected Data:", formData);
                return formData;
              }
            }).then(async (result) => {
              if (result.isConfirmed) {
                console.log("Pengajuan ulang dengan data:", result.value);

                MySwal.fire({
                  title: "Memproses Permintaan...",
                  text: "Permintaan Anda sedang diproses. Ini tidak akan memakan waktu lama. 🚀",
                  icon: 'info',
                  showCancelButton: false,
                  showConfirmButton: false,
                  allowOutsideClick: false,
                });

                // renewRequestCpotb(id, parseInt(result.value));
                
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
                      <p>Jenis Obat</p>
                    </li>
                    <li className="input colJenisSediaan">
                      <p><p>{
                      detailObat.jenisObat === "OHT" ? "Obat Herbal Terstandar" : detailObat.jenisObat}</p> </p> 
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
                        jenisSediaan= {detailObat.tipeObat}
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
                      <p>Tanggal Produksi</p>
                    </li>
                    <li className="input">
                      <p>{detailObat.timestampProduction}</p> 
                    </li>
                  </ul>

                  <ul>
                    <li className="label">
                      <p>Tanggal Pengajuan NIE</p>
                    </li>
                    <li className="input">
                      <p>{detailObat.timestampNieRequest}</p> 
                    </li>
                  </ul>

                  {detailObat.timestampNieReject !== '-'?
                    <ul>
                      <li className="label">
                        <p>Tanggal Penolakan NIE</p>
                      </li>
                      <li className="input">
                        <p>{detailObat.timestampNieReject}</p> 
                      </li>
                    </ul> 
                    : <div></div>
                  }
                  {rejectMsg?
                    <ul>
                      <li className="label">
                        <p>Alasan Penolakan</p>
                      </li>
                      <li className="input">
                        <p>{rejectMsg}</p> 
                      </li>
                    </ul> 
                    : <div></div>
                  }
                  {detailObat.timestampNieRenewRequest !== '-'?
                    <ul>
                      <li className="label">
                        <p>Tanggal Pengajuan Ulang NIE</p>
                      </li>
                      <li className="input">
                        <p>{detailObat.timestampNieRenewRequest}</p> 
                      </li>
                    </ul> 
                    : <div></div>
                  }

                  <ul>
                    <li className="label">
                      <p>Tanggal Disetujui NIE</p>
                    </li>
                    <li className="input">
                      <p>{detailObat.timestampNieApprove}</p> 
                    </li>
                  </ul>

                  <ul>
                    <li className="label">
                      <p>Nama Instansi Pabrik</p>
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
                      <p>Alamat Akun Pabrik (Pengguna)</p> 
                    </li>
                    <li className="input">
                      <p>{detailObat.factoryAddr}</p> 
                    </li>
                  </ul>

                  <ul>
                    <li className="label">
                      <p>Nama Instansi BPOM</p> 
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
                      <p>Alamat Akun BPOM (Pengguna)</p> 
                    </li>
                    <li className="input">
                      <p>{detailObat.bpomAddr}</p> 
                    </li>
                  </ul>

                </div>

                {/* <div className="container-stepper">
                  <div id="stepperOrder"></div>
                </div> */}
              </div>
            
            </div>
          ),
          width: '1020',
          showCloseButton: true,
          showConfirmButton: false,
          showCancelButton: false,
          // didOpen: () => {
          //   const stepperOrder = document.getElementById('stepperOrder');
          //   const root = ReactDOM.createRoot(stepperOrder);
          //   root.render( 
          //     <NieStatusStepper nieStatus={parseInt(nieStatus)} timestamps={timestamps} />
          //   );
          // }
        })
        
      }


    } catch (e) {
      errAlert(e, "Can't retrieve data")
    }
  }

  const requestNie = async(id, namaObat) => {

    try {
      const requestNieCt = await contracts.nieManager.requestNie(id);
      
      if(requestNieCt){
        updateObatFb(userdata.instanceName, namaObat, requestNieCt.hash)
        MySwal.update({
          title: "Memproses transaksi...",
          text: "Proses ini mungkin memerlukan sedikit waktu. Harap tunggu. ⏳"
        });
      }

      contracts.nieManager.once("evt_nieRequested", ( _factoryInstance, _factoryAddr, _timestampRequestNie) => {
        handleEventNieRequsted(namaObat, _factoryAddr, _factoryInstance,_timestampRequestNie, requestNieCt.hash)
      });
      
    } catch (error) {
      errAlert(error, "Can't Request NIE.")
    }
  }

  const renewRequestNie = async(id, merk, namaProduk, klaim, kemasan, komposisi, tipeObat, jenisObat) => {

    try {
      const renewRequestNieCt = await contracts.obatTradisional.renewRequestedNie(id, merk, namaProduk, klaim, kemasan, komposisi, tipeObat, jenisObat);
      
      if(renewRequestNieCt){
        updateObatFb(userdata.instanceName, namaProduk, renewRequestNieCt.hash)
        MySwal.update({
          title: "Memproses transaksi...",
          text: "Proses ini mungkin memerlukan sedikit waktu. Harap tunggu. ⏳"
        });
      }

      contracts.nieManager.once("evt_renewRejectedNie", ( _namaProduk, _timestampRenewRequestNie) => {
        handleEventNieRequsted(_namaProduk, userdata.address, userdata.instance,_timestampRenewRequestNie, renewRequestNieCt.hash)
      });
      
    } catch (error) {
      errAlert(error, "Can't Request NIE.")
    }
  }

  const autoFilledCreateObat = async(id, name) => {

    try {
      const tx = await contracts.obatTradisional.createObat(
        id,
        name,
        name,
        ["Memelihara kesehatan", "Membantu memperbaiki nafsu makan", "Secara tradisional digunakan pada penderita kecacingan"],
        "Dus, 11 @Tablet (5 gram)",
        ["Cinnamomum Burmanii Cortex", "Curcuma Aeruginosa Rhizoma", "Curcuma Domestica Rhizoma", "Curcuma Xanthorrhiza Rhizoma"],
        userdata.instanceName,
        0
      );
  
      await tx.wait();
      console.log('Receipt:', tx);
      
    } catch (error) {
      errAlert(error, "Can't Create Obat")
    }

  }

  const updateObatFb = async (instanceName, namaProduk, obatHash ) => {
    try {
      const documentId = `[OT] ${namaProduk}`;
      const factoryDocRef = doc(db, instanceName, documentId); 

      await updateDoc(factoryDocRef, {
        "historyNie.requestNie": obatHash, 
        "historyNie.requestNieTimestamp": Date.now(), 
      }); 
  
    } catch (err) {
      console.error("Error writing cpotb data:", err);
    }
  };

  return (
    <>
      <div id="ObatNie" className='Layout-Menu layout-page'>
        <div className="title-menu">
          <h1>Data Obat Tradisional</h1>
          <p>Di produksi oleh {userdata.instanceName}</p>
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
                Tambah data baru
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
    confirmButtonText: 'Try Again',
    didOpen: () => {
      const actions = Swal.getActions();
      actions.style.justifyContent = "center";
    }
  });

  console.error(customMsg)
  console.error(errorObject);
}

export default ManageNieFactory;