import { useEffect, useState } from 'react';
import { BrowserProvider, Contract } from "ethers";
import contractData from '../../auto-artifacts/deployments.json';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc, setDoc  } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import "../../styles/MainLayout.scss"
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import './../../styles/SweetAlert.scss';
import JenisSediaanTooltip from '../../components/TooltipJenisSediaan';
import Loader from '../../components/Loader';
import imgSad from '../../assets/images/3.png'

const MySwal = withReactContent(Swal);

function ManageNieFactory() {
  const [contracts, setContracts] = useState(null);
  const navigate = useNavigate();
  const userdata = JSON.parse(sessionStorage.getItem('userdata'));
  const [dataObat, setDataObat] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fadeClass, setFadeClass] = useState('fade-in');
  const [fadeOutLoader, setFadeOutLoader] = useState(false);

  const statusMap = {
    0n: "Dalam Produksi",
    1n: "Pengajuan NIE",
    2n: "Disetujui NIE",
    3n: "Tidak Disetujui NIE",
    4n: "Pengajuan Ulang",
    5n: "NIE Kadaluarsa",
    6n: "Pengajuan Perpanjangan NIE",
    7n: "Perpanjangan NIE"
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
    if (!loading) {
      setFadeOutLoader(true);
  
      setTimeout(() => {
        setFadeClass('fade-in');
      }, 400);
    }
  }, [loading]);

  useEffect(() => { 
    const loadData = async () => {
      if (contracts && userdata.instanceName) {
        try {
          const listAllObatCt = await contracts.obatTradisional.getAllObatByInstance(userdata.instanceName);
          console.log(listAllObatCt);

          const reconstructedData = listAllObatCt.map((item, index) => {

            let nieNumber = item[2] ? item[2] : 'Belum Tersedia';
            console.log(item);

            if(item[3] === 3n){
              nieNumber= null
            }

            let nieStatus;
            if (item[3] === 2n || item[3] === 7n) {
              if (Math.floor(Date.now() / 1000) > Number(item[5])) {
                nieStatus = statusMap[4n];  
              } else {
                nieStatus = statusMap[item[4]]; 
              }
            } else {
              nieStatus = statusMap[item[4]];
            }

            return {
              obatId: item[0],
              namaProduk: item[1],
              nieNumber: nieNumber,
              nieStatus: nieStatus,
              factoryInstance: item[4],
            };
          })
          
          setDataObat(reconstructedData);
          console.log(reconstructedData); 
          
        } catch (error) {
          console.error("Error loading data: ", error);
        } finally{
          setLoading(false);
        }
        
      }
    };
    
    loadData();
  }, [contracts]);

  const handleEventNie = (factoryAddr, timestamp, txHash, nieNumber, namaObat) => {

    const formattedTimestamp = new Date(Number(timestamp) * 1000).toLocaleDateString('id-ID', options)

    MySwal.fire({
      title: "Permintaan perpanjangan NIE terkirim",
      html: (
        <div className='form-swal event'>
          <ul className='klaim'>
            <li className="label">
              <p>Nama Produk</p> 
            </li>
            <li className="input">
              <p>{namaObat}</p> 
            </li>
          </ul>
          <ul className='klaim'>
            <li className="label">
              <p>Nomor NIE</p> 
            </li>
            <li className="input">
              <p>{nieNumber}</p> 
            </li>
          </ul>
          <ul>
            <li className="label">
              <p>Nama Instansi Pabrik</p> 
            </li>
            <li className="input">
              <p>{userdata.instanceName}</p> 
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
              <p>Tanggal Dikirim Perpanjangan</p> 
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
        window.location.reload();
      }
    });
  }

  const getDetailObat = async (id) => {

    try {
      const detailObatCt = await contracts.obatTradisional.detailObat(id);
      const detailNieCt = await contracts.nieManager.getNieDetail(id)
      let rejectMsg;

      const [merk, namaProduk, klaim, komposisi, kemasan, factoryInstance, factoryAddr, tipeObat, cpotbHash, cdobHash, jenisObat] = detailObatCt;
      const [nieDetails, dokumenObat, dokumenSpesifikasi] = detailNieCt;
      const [nieNumber, nieStatus, timestampProduction, timestampNieRequest, timestampNieApprove, timestampNieRejected, timestampNieRenewRequest, timestampNieExpired, timestampNieExtendRequest, factoryInstancee, bpomInstance, bpomAddr] = nieDetails;
      const [masterFormula, suratKuasa, suratPernyataan, komposisiProduk, caraPembuatanProduk, spesifikasiKemasan, hasilUjiStabilitas] = dokumenObat;
      const [sertifikatAnalisaBahanBaku, sertifikatAnalisaProdukJadi, spesifikasiProdukJadi, sistemPenomoranBets, desainKemasan, dataPendukungKeamanan] = dokumenSpesifikasi;

      console.log(bpomInstance);

      let statusNie;
      if (nieStatus[3] === 2n || nieStatus[3] === 7n) {
        if (Math.floor(Date.now() / 1000) > Number(nieStatus[5])) {
          statusNie = statusMap[4n];  
        } else {
          statusNie = statusMap[nieStatus[4]]; 
        }
      } else {
        statusNie = statusMap[nieStatus[4]];
      }

      const detailObat = {
        obatId: id,
        merk: merk,
        namaObat: namaProduk,
        klaim: klaim,
        kemasan: kemasan,
        komposisi: komposisi,
        nieStatus: statusNie, 
        timestampProduction: timestampProduction ? new Date(Number(timestampProduction) * 1000).toLocaleDateString('id-ID', options) : '-', 
        timestampNieRequest: timestampNieRequest ? new Date(Number(timestampNieRequest) * 1000).toLocaleDateString('id-ID', options) : '-', 
        timestampNieApprove:  timestampNieApprove ? new Date(Number(timestampNieApprove) * 1000).toLocaleDateString('id-ID', options): "-",
        timestampNieReject:  timestampNieRejected ? new Date(Number(timestampNieRejected) * 1000).toLocaleDateString('id-ID', options): "-",
        timestampNieRenewRequest:  timestampNieRenewRequest ? new Date(Number(timestampNieRenewRequest) * 1000).toLocaleDateString('id-ID', options): "-",
        timestampNieExpired: parseInt(timestampNieExpired) !== 0 ? new Date(Number(timestampNieExpired) * 1000).toLocaleDateString('id-ID', options): "-",
        timestampNieExtendRequest: parseInt(timestampNieExtendRequest) !== 0 ? new Date(Number(timestampNieExtendRequest) * 1000).toLocaleDateString('id-ID', options): "-",
        nieNumber: nieNumber ? nieNumber : "-",
        factoryAddr: factoryAddr,
        factoryInstanceName: factoryInstance,
        bpomAddr: bpomAddr === "0x0000000000000000000000000000000000000000" ? "-" : bpomAddr,
        bpomInstanceNames:  bpomInstance ?  bpomInstance : "-",
        tipeObat: tipeObatMap[tipeObat],
        jenisObat: jenisObat,
        dokumenNie: {
          masterFormula: masterFormula ? masterFormula : "-",
          suratKuasa: suratKuasa ? suratKuasa : "-",
          suratPernyataan: suratPernyataan ? suratPernyataan : "-",
          komposisiProduk: komposisiProduk ? komposisiProduk : "-",
          caraPembuatanProduk: caraPembuatanProduk ? caraPembuatanProduk : "-",
          sertifikatAnalisaBahanBaku: sertifikatAnalisaBahanBaku ? sertifikatAnalisaBahanBaku : "-",
          sertifikatAnalisaProdukJadi: sertifikatAnalisaProdukJadi ? sertifikatAnalisaProdukJadi : "-",
          spesifikasiProdukJadi: spesifikasiProdukJadi ? spesifikasiProdukJadi : "-",
          spesifikasiKemasan: spesifikasiKemasan ? spesifikasiKemasan : "-",
          sistemPenomoranBets: sistemPenomoranBets ? sistemPenomoranBets : "-",
          hasilUjiStabilitas: hasilUjiStabilitas ? hasilUjiStabilitas : "-",
          desainKemasan: desainKemasan ? desainKemasan : "-",
          dataPendukungKeamanan: dataPendukungKeamanan ? dataPendukungKeamanan : "-"          
        }
      };

      const kemasanKeterangan = kemasan.match(/@(.+?)\s*\(/);

      console.log(detailObat);

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

                  <ul  className='klaim'>
                    <li className="label">
                      <p>Alamat Akun BPOM (Pengguna)</p> 
                    </li>
                    <li className="input">
                      <p>{detailObat.bpomAddr}</p> 
                    </li>
                  </ul>

                </div>
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

                {/* <div className="container-stepper">
                  <div id="stepperOrder"></div>
                </div> */}
              </div>
              <div className="row row--row">
                <div className='col doku'>
                  <h5>Dokumen Pengajuan NIE</h5>
                  <div className="doku-row">
                    <div className="doku-1">
                      <ul>
                        <li className="label">
                          <p>Dokumen Master Formula</p>
                        </li>
                        <li className="input">
                          <p>Data belum tersedia</p>
                        </li>
                      </ul>
                      <ul>
                        <li className="label">
                          <p>Surat Kuasa</p>
                        </li>
                        <li className="input">
                          <p>Data belum tersedia</p>
                        </li>
                      </ul>
                      <ul>
                        <li className="label">
                          <p>Surat Pernyataan</p>
                        </li>
                        <li className="input">
                          <p>Data belum tersedia</p>
                        </li>
                      </ul>
                      <ul>
                        <li className="label">
                          <p>Dokumen Komposisi Produk</p>
                        </li>
                        <li className="input">
                          <p>Data belum tersedia</p>
                        </li>
                      </ul>
                      <ul>
                        <li className="label">
                          <p>Dokumen Cara Pembuatan Produk</p>
                        </li>
                        <li className="input">
                          <p>Data belum tersedia</p>
                        </li>
                      </ul>
                      <ul>
                        <li className="label">
                          <p>Dokumen Spesifikasi Produk Jadi</p>
                        </li>
                        <li className="input">
                          <p>Data belum tersedia</p>
                        </li>
                      </ul>
                      <ul>
                        <li className="label">
                          <p>Dokumen Sistem Penomoran Bets</p>
                        </li>
                        <li className="input">
                          <p>Data belum tersedia</p>
                        </li>
                      </ul>

                    </div>
                    <div className="doku-1">
                      <ul>
                        <li className="label">
                          <p>Sertifikat Analisa Bahan Baku</p>
                        </li>
                        <li className="input">
                          <p>Data belum tersedia</p>
                        </li>
                      </ul>
                      <ul>
                        <li className="label">
                          <p>Sertifikat Analisa Produk Jadi</p>
                        </li>
                        <li className="input">
                          <p>Data belum tersedia</p>
                        </li>
                      </ul>
                      <ul>
                        <li className="label">
                          <p>Dokumen Spesifikasi Kemasan</p>
                        </li>
                        <li className="input">
                          <p>Data belum tersedia</p>
                        </li>
                      </ul>
                      
                      <ul>
                        <li className="label">
                          <p>Dokumen Hasil Uji Stabilitas</p>
                        </li>
                        <li className="input">
                          <p>Data belum tersedia</p>
                        </li>
                      </ul>
                      <ul>
                        <li className="label">
                          <p>Desain Kemasan</p>
                        </li>
                        <li className="input">
                          <p>Data belum tersedia</p>
                        </li>
                      </ul>
                      <ul>
                        <li className="label">
                          <p>Data Pendukung Keamanan</p>
                        </li>
                        <li className="input">
                          <p>Data belum tersedia</p>
                        </li>
                      </ul>
                    </div>

                  </div>
                </div>
              </div>

            
            </div>
          ),
          width: '1120',
          showCancelButton: false,
          showCloseButton: true,
          confirmButtonText: 'Pengajuan NIE',
          customClass: {
            htmlContainer: 'scrollable-modal'
          },
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
            const obatData = {
              obatId: id,
              namaObat: namaProduk
            }
            sessionStorage.setItem('obatData', JSON.stringify(obatData)) 
            navigate('/request-nie')
          }
        })
        
      } else if(detailObat.nieStatus === 'Tidak Disetujui NIE'){

        rejectMsg = await contracts.nieManager.getRejectMsgNie(id);

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
                
              <div className="col col1">
    
                <ul className='status'>
                  <li className="label">
                    <p>Status Izin Edar</p>
                  </li>
                  <li className="input">
                    <p className={detailObat.nieStatus}>{detailObat.nieStatus}</p>
                  </li>
                </ul>

                <ul className='rejectMsg klaim'>
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

                <ul className='klaim'>
                  <li className="label">
                    <p>Alamat Akun BPOM (Pengguna)</p> 
                  </li>
                  <li className="input">
                    <p>{bpomAddr}</p> 
                  </li>
                </ul>

              </div>
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
                {/* <div className="container-stepper">
                  <div id="stepperOrder"></div>
                </div> */}
              </div>

              <div className="row row--row">
                <div className='col doku'>
                  <h5>Dokumen Pengajuan NIE</h5>
                  <div className="doku-row">
                    <div className="doku-1">
                      <ul>
                        <li className="label">
                          <p>Dokumen Master Formula</p>
                        </li>
                        <li className="input">
                          <a
                            href={`http://localhost:8080/ipfs/${detailObat.dokumenNie.masterFormula}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Lihat Dokumen Master Formula
                            <i className="fa-solid fa-arrow-up-right-from-square"></i>
                          </a>
                        </li>
                      </ul>
                      <ul>
                        <li className="label">
                          <p>Surat Kuasa</p>
                        </li>
                        <li className="input">
                          <a
                            href={`http://localhost:8080/ipfs/${detailObat.dokumenNie.suratKuasa}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Lihat Surat Kuasa
                            <i className="fa-solid fa-arrow-up-right-from-square"></i>
                          </a>
                        </li>
                      </ul>
                      <ul>
                        <li className="label">
                          <p>Surat Pernyataan</p>
                        </li>
                        <li className="input">
                          <a
                            href={`http://localhost:8080/ipfs/${detailObat.dokumenNie.suratPernyataan}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Lihat Surat Pernyataan
                            <i className="fa-solid fa-arrow-up-right-from-square"></i>
                          </a>
                        </li>
                      </ul>
                      <ul>
                        <li className="label">
                          <p>Dokumen Komposisi Produk</p>
                        </li>
                        <li className="input">
                          <a
                            href={`http://localhost:8080/ipfs/${detailObat.dokumenNie.komposisiProduk}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Lihat Dokumen Komposisi Produk
                            <i className="fa-solid fa-arrow-up-right-from-square"></i>
                          </a>
                        </li>
                      </ul>
                      <ul>
                        <li className="label">
                          <p>Dokumen Cara Pembuatan Produk</p>
                        </li>
                        <li className="input">
                          <a
                            href={`http://localhost:8080/ipfs/${detailObat.dokumenNie.caraPembuatanProduk}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Lihat Dokumen Cara Pembuatan Produk
                            <i className="fa-solid fa-arrow-up-right-from-square"></i>
                          </a>
                        </li>
                      </ul>
                      <ul>
                        <li className="label">
                          <p>Dokumen Spesifikasi Produk Jadi</p>
                        </li>
                        <li className="input">
                          <a
                            href={`http://localhost:8080/ipfs/${detailObat.dokumenNie.spesifikasiProdukJadi}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Lihat Dokumen Spesifikasi Produk Jadi
                            <i className="fa-solid fa-arrow-up-right-from-square"></i>
                          </a>
                        </li>
                      </ul>
                      <ul>
                        <li className="label">
                          <p>Dokumen Sistem Penomoran Bets</p>
                        </li>
                        <li className="input">
                          <a
                            href={`http://localhost:8080/ipfs/${detailObat.dokumenNie.sistemPenomoranBets}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Lihat Dokumen Sistem Penomoran Bets
                            <i className="fa-solid fa-arrow-up-right-from-square"></i>
                          </a>
                        </li>
                      </ul>
                    </div>

                    <div className="doku-1">
                      <ul>
                        <li className="label">
                          <p>Sertifikat Analisa Bahan Baku</p>
                        </li>
                        <li className="input">
                          <a
                            href={`http://localhost:8080/ipfs/${detailObat.dokumenNie.sertifikatAnalisaBahanBaku}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Lihat Sertifikat Analisa Bahan Baku
                            <i className="fa-solid fa-arrow-up-right-from-square"></i>
                          </a>
                        </li>
                      </ul>
                      <ul>
                        <li className="label">
                          <p>Sertifikat Analisa Produk Jadi</p>
                        </li>
                        <li className="input">
                          <a
                            href={`http://localhost:8080/ipfs/${detailObat.dokumenNie.sertifikatAnalisaProdukJadi}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Lihat Sertifikat Analisa Produk Jadi
                            <i className="fa-solid fa-arrow-up-right-from-square"></i>
                          </a>
                        </li>
                      </ul>
                      <ul>
                        <li className="label">
                          <p>Dokumen Spesifikasi Kemasan</p>
                        </li>
                        <li className="input">
                          <a
                            href={`http://localhost:8080/ipfs/${detailObat.dokumenNie.spesifikasiKemasan}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Lihat Dokumen Spesifikasi Kemasan
                            <i className="fa-solid fa-arrow-up-right-from-square"></i>
                          </a>
                        </li>
                      </ul>
                      <ul>
                        <li className="label">
                          <p>Dokumen Hasil Uji Stabilitas</p>
                        </li>
                        <li className="input">
                          <a
                            href={`http://localhost:8080/ipfs/${detailObat.dokumenNie.hasilUjiStabilitas}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Lihat Dokumen Hasil Uji Stabilitas
                            <i className="fa-solid fa-arrow-up-right-from-square"></i>
                          </a>
                        </li>
                      </ul>
                      <ul>
                        <li className="label">
                          <p>Desain Kemasan</p>
                        </li>
                        <li className="input">
                          <a
                            href={`http://localhost:8080/ipfs/${detailObat.dokumenNie.desainKemasan}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Lihat Desain Kemasan
                            <i className="fa-solid fa-arrow-up-right-from-square"></i>
                          </a>
                        </li>
                      </ul>
                      <ul>
                        <li className="label">
                          <p>Data Pendukung Keamanan</p>
                        </li>
                        <li className="input">
                          <a
                            href={`http://localhost:8080/ipfs/${detailObat.dokumenNie.dataPendukungKeamanan}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Lihat Data Pendukung Keamanan
                            <i className="fa-solid fa-arrow-up-right-from-square"></i>
                          </a>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

            
            </div>
          ),
          width: '1120',
          showCloseButton: true,
          showConfirmButton: true,
          confirmButtonText: "Ajukan Ulang NIE",
          showCancelButton: false,
          customClass: {
            htmlContainer: 'scrollable-modal'
          },
          // didOpen: () => {
          //   const stepperOrder = document.getElementById('stepperOrder');
          //   const root = ReactDOM.createRoot(stepperOrder);
          //   root.render( 
          //     <NieStatusStepper nieStatus={parseInt(nieStatus)} timestamps={newTimestamps} />
          //   )
          // }
        }).then((result) => {
          if(result.isConfirmed){
            const obatData = {
              obatId: id,
              namaObat: namaProduk
            }
            sessionStorage.setItem('obatData', JSON.stringify(obatData)) 
            navigate('/renew-request-nie')
          }
        })

      } else if(detailObat.nieStatus === 'NIE Kadaluarsa'){

        rejectMsg = await contracts.nieManager.getRejectMsgNie(id);
        MySwal.fire({
          title: `Detail Obat ${detailObat.namaObat}`,
          html: (
            <div className='form-swal'>
              <div className="row row--row">
                
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
                  <ul className='rejectMsg klaim'>
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
                    <p>NIE Berlaku Sampai</p> 
                  </li>
                  <li className="input">
                    <p>{Math.floor(Date.now() / 1000) > Number(timestampNieExpired)
                      ? `${detailObat.timestampNieExpired} (Kadaluarsa)`
                      : detailObat.timestampNieExpired}
                    </p> 
                  </li>
                </ul>
                <ul>
                  <li className="label">
                    <p>Tanggal Perpanjangan NIE</p> 
                  </li>
                  <li className="input"> 
                    <p>{detailObat.timestampNieExtendRequest}</p> 
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

                <ul className='klaim'>
                  <li className="label">
                    <p>Alamat Akun BPOM (Pengguna)</p> 
                  </li>
                  <li className="input">
                    <p>{bpomAddr}</p> 
                  </li>
                </ul>

              </div>
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
                {/* <div className="container-stepper">
                  <div id="stepperOrder"></div>
                </div> */}
              </div>

              <div className="row row--row">
                <div className='col doku'>
                  <h5>Dokumen Pengajuan NIE</h5>
                  <div className="doku-row">
                    <div className="doku-1">
                      <ul>
                        <li className="label">
                          <p>Dokumen Master Formula</p>
                        </li>
                        <li className="input">
                          <a
                            href={`http://localhost:8080/ipfs/${detailObat.dokumenNie.masterFormula}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Lihat Dokumen Master Formula
                            <i className="fa-solid fa-arrow-up-right-from-square"></i>
                          </a>
                        </li>
                      </ul>
                      <ul>
                        <li className="label">
                          <p>Surat Kuasa</p>
                        </li>
                        <li className="input">
                          <a
                            href={`http://localhost:8080/ipfs/${detailObat.dokumenNie.suratKuasa}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Lihat Surat Kuasa
                            <i className="fa-solid fa-arrow-up-right-from-square"></i>
                          </a>
                        </li>
                      </ul>
                      <ul>
                        <li className="label">
                          <p>Surat Pernyataan</p>
                        </li>
                        <li className="input">
                          <a
                            href={`http://localhost:8080/ipfs/${detailObat.dokumenNie.suratPernyataan}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Lihat Surat Pernyataan
                            <i className="fa-solid fa-arrow-up-right-from-square"></i>
                          </a>
                        </li>
                      </ul>
                      <ul>
                        <li className="label">
                          <p>Dokumen Komposisi Produk</p>
                        </li>
                        <li className="input">
                          <a
                            href={`http://localhost:8080/ipfs/${detailObat.dokumenNie.komposisiProduk}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Lihat Dokumen Komposisi Produk
                            <i className="fa-solid fa-arrow-up-right-from-square"></i>
                          </a>
                        </li>
                      </ul>
                      <ul>
                        <li className="label">
                          <p>Dokumen Cara Pembuatan Produk</p>
                        </li>
                        <li className="input">
                          <a
                            href={`http://localhost:8080/ipfs/${detailObat.dokumenNie.caraPembuatanProduk}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Lihat Dokumen Cara Pembuatan Produk
                            <i className="fa-solid fa-arrow-up-right-from-square"></i>
                          </a>
                        </li>
                      </ul>
                      <ul>
                        <li className="label">
                          <p>Dokumen Spesifikasi Produk Jadi</p>
                        </li>
                        <li className="input">
                          <a
                            href={`http://localhost:8080/ipfs/${detailObat.dokumenNie.spesifikasiProdukJadi}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Lihat Dokumen Spesifikasi Produk Jadi
                            <i className="fa-solid fa-arrow-up-right-from-square"></i>
                          </a>
                        </li>
                      </ul>
                      <ul>
                        <li className="label">
                          <p>Dokumen Sistem Penomoran Bets</p>
                        </li>
                        <li className="input">
                          <a
                            href={`http://localhost:8080/ipfs/${detailObat.dokumenNie.sistemPenomoranBets}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Lihat Dokumen Sistem Penomoran Bets
                            <i className="fa-solid fa-arrow-up-right-from-square"></i>
                          </a>
                        </li>
                      </ul>
                    </div>

                    <div className="doku-1">
                      <ul>
                        <li className="label">
                          <p>Sertifikat Analisa Bahan Baku</p>
                        </li>
                        <li className="input">
                          <a
                            href={`http://localhost:8080/ipfs/${detailObat.dokumenNie.sertifikatAnalisaBahanBaku}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Lihat Sertifikat Analisa Bahan Baku
                            <i className="fa-solid fa-arrow-up-right-from-square"></i>
                          </a>
                        </li>
                      </ul>
                      <ul>
                        <li className="label">
                          <p>Sertifikat Analisa Produk Jadi</p>
                        </li>
                        <li className="input">
                          <a
                            href={`http://localhost:8080/ipfs/${detailObat.dokumenNie.sertifikatAnalisaProdukJadi}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Lihat Sertifikat Analisa Produk Jadi
                            <i className="fa-solid fa-arrow-up-right-from-square"></i>
                          </a>
                        </li>
                      </ul>
                      <ul>
                        <li className="label">
                          <p>Dokumen Spesifikasi Kemasan</p>
                        </li>
                        <li className="input">
                          <a
                            href={`http://localhost:8080/ipfs/${detailObat.dokumenNie.spesifikasiKemasan}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Lihat Dokumen Spesifikasi Kemasan
                            <i className="fa-solid fa-arrow-up-right-from-square"></i>
                          </a>
                        </li>
                      </ul>
                      <ul>
                        <li className="label">
                          <p>Dokumen Hasil Uji Stabilitas</p>
                        </li>
                        <li className="input">
                          <a
                            href={`http://localhost:8080/ipfs/${detailObat.dokumenNie.hasilUjiStabilitas}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Lihat Dokumen Hasil Uji Stabilitas
                            <i className="fa-solid fa-arrow-up-right-from-square"></i>
                          </a>
                        </li>
                      </ul>
                      <ul>
                        <li className="label">
                          <p>Desain Kemasan</p>
                        </li>
                        <li className="input">
                          <a
                            href={`http://localhost:8080/ipfs/${detailObat.dokumenNie.desainKemasan}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Lihat Desain Kemasan
                            <i className="fa-solid fa-arrow-up-right-from-square"></i>
                          </a>
                        </li>
                      </ul>
                      <ul>
                        <li className="label">
                          <p>Data Pendukung Keamanan</p>
                        </li>
                        <li className="input">
                          <a
                            href={`http://localhost:8080/ipfs/${detailObat.dokumenNie.dataPendukungKeamanan}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Lihat Data Pendukung Keamanan
                            <i className="fa-solid fa-arrow-up-right-from-square"></i>
                          </a>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

            
            </div>
          ),
          width: '1120',
          showCloseButton: true,
          showConfirmButton: true,
          confirmButtonText: "Ajukan Ulang NIE",
          showCancelButton: false,
          customClass: {
            htmlContainer: 'scrollable-modal'
          },
          // didOpen: () => {
          //   const stepperOrder = document.getElementById('stepperOrder');
          //   const root = ReactDOM.createRoot(stepperOrder);
          //   root.render( 
          //     <NieStatusStepper nieStatus={parseInt(nieStatus)} timestamps={newTimestamps} />
          //   )
          // }
        }).then((result) => {
          if(result.isConfirmed){

            extendNie(id, timestampNieExpired, detailObat.namaObat)
          }
        })

      } else{
        rejectMsg = await contracts.nieManager.getRejectMsgNie(id);
        MySwal.fire({
          title: `Detail Obat ${detailObat.namaObat}`,
          html: (
            <div className='form-swal'>
              <div className="row row--row">
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
                    <ul className='rejectMsg klaim'>
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
                      <p>NIE Berlaku Sampai</p> 
                    </li>
                    <li className="input">
                      <p>{Math.floor(Date.now() / 1000) > Number(timestampNieExpired)
                        ? `${detailObat.timestampNieExpired} (Kadaluarsa)`
                        : detailObat.timestampNieExpired}
                      </p> 
                    </li>
                  </ul>
                  <ul>
                    <li className="label">
                      <p>Tanggal Perpanjangan NIE</p> 
                    </li>
                    <li className="input"> 
                      <p>{detailObat.timestampNieExtendRequest}</p> 
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

                  <ul className='klaim'>
                    <li className="label">
                      <p>Alamat Akun BPOM (Pengguna)</p> 
                    </li>
                    <li className="input">
                      <p>{detailObat.bpomAddr}</p> 
                    </li>
                  </ul>

                </div>
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
                {/* <div className="container-stepper">
                  <div id="stepperOrder"></div>
                </div> */}
              </div>
              <div className="row row--row">
                <div className='col doku'>
                  <h5>Dokumen Pengajuan NIE</h5>
                  <div className="doku-row">
                    <div className="doku-1">
                      <ul>
                        <li className="label">
                          <p>Dokumen Master Formula</p>
                        </li>
                        <li className="input">
                          <a
                            href={`http://localhost:8080/ipfs/${detailObat.dokumenNie.masterFormula}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Lihat Dokumen Master Formula
                            <i className="fa-solid fa-arrow-up-right-from-square"></i>
                          </a>
                        </li>
                      </ul>
                      <ul>
                        <li className="label">
                          <p>Surat Kuasa</p>
                        </li>
                        <li className="input">
                          <a
                            href={`http://localhost:8080/ipfs/${detailObat.dokumenNie.suratKuasa}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Lihat Surat Kuasa
                            <i className="fa-solid fa-arrow-up-right-from-square"></i>
                          </a>
                        </li>
                      </ul>
                      <ul>
                        <li className="label">
                          <p>Surat Pernyataan</p>
                        </li>
                        <li className="input">
                          <a
                            href={`http://localhost:8080/ipfs/${detailObat.dokumenNie.suratPernyataan}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Lihat Surat Pernyataan
                            <i className="fa-solid fa-arrow-up-right-from-square"></i>
                          </a>
                        </li>
                      </ul>
                      <ul>
                        <li className="label">
                          <p>Dokumen Komposisi Produk</p>
                        </li>
                        <li className="input">
                          <a
                            href={`http://localhost:8080/ipfs/${detailObat.dokumenNie.komposisiProduk}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Lihat Dokumen Komposisi Produk
                            <i className="fa-solid fa-arrow-up-right-from-square"></i>
                          </a>
                        </li>
                      </ul>
                      <ul>
                        <li className="label">
                          <p>Dokumen Cara Pembuatan Produk</p>
                        </li>
                        <li className="input">
                          <a
                            href={`http://localhost:8080/ipfs/${detailObat.dokumenNie.caraPembuatanProduk}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Lihat Dokumen Cara Pembuatan Produk
                            <i className="fa-solid fa-arrow-up-right-from-square"></i>
                          </a>
                        </li>
                      </ul>
                      <ul>
                        <li className="label">
                          <p>Dokumen Spesifikasi Produk Jadi</p>
                        </li>
                        <li className="input">
                          <a
                            href={`http://localhost:8080/ipfs/${detailObat.dokumenNie.spesifikasiProdukJadi}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Lihat Dokumen Spesifikasi Produk Jadi
                            <i className="fa-solid fa-arrow-up-right-from-square"></i>
                          </a>
                        </li>
                      </ul>
                      <ul>
                        <li className="label">
                          <p>Dokumen Sistem Penomoran Bets</p>
                        </li>
                        <li className="input">
                          <a
                            href={`http://localhost:8080/ipfs/${detailObat.dokumenNie.sistemPenomoranBets}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Lihat Dokumen Sistem Penomoran Bets
                            <i className="fa-solid fa-arrow-up-right-from-square"></i>
                          </a>
                        </li>
                      </ul>
                    </div>

                    <div className="doku-1">
                      <ul>
                        <li className="label">
                          <p>Sertifikat Analisa Bahan Baku</p>
                        </li>
                        <li className="input">
                          <a
                            href={`http://localhost:8080/ipfs/${detailObat.dokumenNie.sertifikatAnalisaBahanBaku}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Lihat Sertifikat Analisa Bahan Baku
                            <i className="fa-solid fa-arrow-up-right-from-square"></i>
                          </a>
                        </li>
                      </ul>
                      <ul>
                        <li className="label">
                          <p>Sertifikat Analisa Produk Jadi</p>
                        </li>
                        <li className="input">
                          <a
                            href={`http://localhost:8080/ipfs/${detailObat.dokumenNie.sertifikatAnalisaProdukJadi}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Lihat Sertifikat Analisa Produk Jadi
                            <i className="fa-solid fa-arrow-up-right-from-square"></i>
                          </a>
                        </li>
                      </ul>
                      <ul>
                        <li className="label">
                          <p>Dokumen Spesifikasi Kemasan</p>
                        </li>
                        <li className="input">
                          <a
                            href={`http://localhost:8080/ipfs/${detailObat.dokumenNie.spesifikasiKemasan}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Lihat Dokumen Spesifikasi Kemasan
                            <i className="fa-solid fa-arrow-up-right-from-square"></i>
                          </a>
                        </li>
                      </ul>
                      <ul>
                        <li className="label">
                          <p>Dokumen Hasil Uji Stabilitas</p>
                        </li>
                        <li className="input">
                          <a
                            href={`http://localhost:8080/ipfs/${detailObat.dokumenNie.hasilUjiStabilitas}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Lihat Dokumen Hasil Uji Stabilitas
                            <i className="fa-solid fa-arrow-up-right-from-square"></i>
                          </a>
                        </li>
                      </ul>
                      <ul>
                        <li className="label">
                          <p>Desain Kemasan</p>
                        </li>
                        <li className="input">
                          <a
                            href={`http://localhost:8080/ipfs/${detailObat.dokumenNie.desainKemasan}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Lihat Desain Kemasan
                            <i className="fa-solid fa-arrow-up-right-from-square"></i>
                          </a>
                        </li>
                      </ul>
                      <ul>
                        <li className="label">
                          <p>Data Pendukung Keamanan</p>
                        </li>
                        <li className="input">
                          <a
                            href={`http://localhost:8080/ipfs/${detailObat.dokumenNie.dataPendukungKeamanan}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Lihat Data Pendukung Keamanan
                            <i className="fa-solid fa-arrow-up-right-from-square"></i>
                          </a>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ),
          width: '1120',
          showCloseButton: true,
          showConfirmButton: false,
          showCancelButton: false,
          customClass: {
            htmlContainer: 'scrollable-modal'
          },
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

  const extendNie = async(obatId, expTimestamp, namaObat) =>{
 
    try {
      const extendNieCt = await contracts.nieManager.extendRequestNie(obatId, expTimestamp)
      console.log(extendNieCt);

      if (extendNieCt) {
        MySwal.update({
          title: "Memproses transaksi...",
          text: "Proses transaksi sedang berlangsung, harap tunggu. ⏳"
        });
      }

      contracts.nieManager.on('NieExtendRequest',  (factoryAddr, _nieNumber,  _timestamp) => {
        updateCpotbFb(extendNieCt.hash, Number(_timestamp), namaObat);
        recordHashFb(extendNieCt.hash, Number(_timestamp), namaObat)
        handleEventNie(factoryAddr, _timestamp, extendNieCt.hash, _nieNumber, namaObat)
      });
    } catch (error) {
      errAlert(error)
    }
  }

  const updateCpotbFb = async (nieHash, timestamp, namaObat) => {

    try { 
      const docRef = doc(db, 'obat_data', userdata.instanceName)

      await setDoc(docRef, {
        [`${namaObat}`]: {
          historyNie: {
            extendRequestNieHash: nieHash,
            extendRequestNieTimestamp: timestamp,
          },
          status: 4
        }
      }, { merge: true }); 
  
    } catch (err) {
      errAlert(err);
    }
  };

  const recordHashFb = async(txHash, timestamp, namaObat) => {
    try {
      const collectionName = `obat_${namaObat}_${userdata.instanceName}`
      const docRef = doc(db, 'transaction_hash', collectionName);
  
      await setDoc(docRef, {
        [`produksi`]: {
          'extend_request_nie': {
            hash: txHash,
            timestamp: timestamp,
          }
        },
      }, { merge: true }); 
    } catch (err) {
      errAlert(err);
    }
  }

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
            <li><button onClick={() => navigate('/obat-available-factory')}>Produksi Batch Obat</button></li>
            <li><button onClick={() => navigate('/manage-orders-factory')}>Daftar Order Obat </button></li>
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
            <div className="fade-container">
              <div className={`fade-layer loader-layer ${fadeOutLoader ? 'fade-out' : 'fade-in'}`}>
                <Loader />
              </div>

              <div className={`fade-layer content-layer ${!loading ? 'fade-in' : 'fade-out'}`}>
              {dataObat.length > 0 ? (
                <ul>
                  {dataObat.map((item, index) => (
                    <li key={index}>
                      <button className='title' onClick={() => getDetailObat(item.obatId)} >{item.namaProduk}</button>
                      <p>
                        { item.nieNumber !== null ? `NIE : ${item.nieNumber}` : "NIE: Not Available"}
                      </p>
                      <button className={`statusPengajuan ${item.nieStatus}`}>
                        {item.nieStatus}
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

export default ManageNieFactory;