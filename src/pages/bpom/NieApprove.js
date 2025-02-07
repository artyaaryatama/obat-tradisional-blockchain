import { useEffect, useState } from 'react';
import { BrowserProvider, Contract } from "ethers";
import contractData from '../../auto-artifacts/deployments.json';
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig"; 
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
    0n: "Dalam Produksi",
    1n: "Pengajuan NIE",
    2n: "Disetujui NIE",
    3n: "Tidak Disetujui NIE",
    4n: "Pengajuan Ulang"
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

  const handleEventNieApproved = (status, namaProduk, bpomAddr, bpomInstance, historyNie, timestamp, txHash) => {

    const formattedTimestamp = new Date(Number(timestamp) * 1000).toLocaleDateString('id-ID', options)
  
    if (status === 'Approved') {
      MySwal.fire({
        title: "Sukses Menyetujui NIE",
        html: (
          <div className='form-swal event'>
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
                <p>{historyNie}</p> 
              </li>
            </ul>
            <ul>
              <li className="label">
                <p>Nama Instansi BPOM</p> 
              </li>
              <li className="input">
                <p>{bpomInstance}</p> 
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
      
    } else {
      MySwal.fire({
        title: "Pengajuan NIE ditolak",
        html: (
          <div className='form-swal event'>
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
                <p>Nama Instansi BPOM</p> 
              </li>
              <li className="input">
                <p>{bpomInstance}</p> 
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
                <p>{historyNie}</p> 
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
  }

  const getDetailObat = async (id) => {
    
    console.log(id); 
    
    try {
      const detailObatCt = await contracts.obatTradisional.detailObat(id);
      const detailNieCt = await contracts.nieManager.getNieDetail(id)
      let rejectMsg;

      const [merk, namaProduk, klaim, komposisi, kemasan, factoryInstance, factoryAddr, tipeObat, cpotbHash, cdobHash, jenisObat] = detailObatCt;
      const [nieDetails, dokumenObat, dokumenSpesifikasi] = detailNieCt;
      const [nieNumber, nieStatus, timestampProduction, timestampNieRequest, timestampNieApprove, timestampNieRejected, timestampNieRenewRequest, factoryInstancee, bpomInstance, bpomAddr] = nieDetails;
      const [masterFormula, suratKuasa, suratPernyataan, komposisiProduk, caraPembuatanProduk, spesifikasiKemasan, hasilUjiStabilitas] = dokumenObat;
      const [sertifikatAnalisaBahanBaku, sertifikatAnalisaProdukJadi, spesifikasiProdukJadi, sistemPenomoranBets, desainKemasan, dataPendukungKeamanan] = dokumenSpesifikasi;
      
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

      const timestamps = {
        timestampProduction : timestampProduction ? new Date(Number(timestampProduction) * 1000).toLocaleDateString('id-ID', options) : 0,
        timestampNieRequest :timestampNieRequest ? new Date(Number(timestampNieRequest) * 1000).toLocaleDateString('id-ID', options) : 0,
        timestampNieApprove : timestampNieApprove ? new Date(Number(timestampNieApprove) * 1000).toLocaleDateString('id-ID', options): 0
      }

      if(detailObat.nieStatus === 'Disetujui NIE'){
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
                    <ul className='rejectMsg'>
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
          //   )
          // }
        })
     
      } else if(detailObat.nieStatus === 'Tidak Disetujui NIE'){
        rejectMsg = await contracts.nieManager.getRejectMsgNie(id);
        console.log(rejectMsg);

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
          //     <NieStatusStepper nieStatus={parseInt(nieStatus)} timestamps={newTimestamps} />
          //   )
          // }
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
                    <ul className='rejectMsg'>
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
                            (Detail CPOTB
                            <i class="fa-solid fa-arrow-up-right-from-square"></i>)
                          </a>
                        </span>
                      </p>
                    </li>
                  </ul>

                  <ul  className='klaim'>
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
          showCancelButton: false,
          showDenyButton: true,
          confirmButtonText: 'Setujui',
          denyButtonText: 'Tolak',
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
                          <label htmlFor="factoryAddr">Nama Instansi Pabrik</label>
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
                              Detail CPOTB
                              <i class="fa-solid fa-arrow-up-right-from-square"></i>
                            </a>
                          </span>
                        </li>
                      </ul>

                      <ul className='klaim'>
                        <li className="label">
                          <label htmlFor="factoryAddr">Alamat Akun Pabrik (Pengguna)</label>
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
                      <ul className='klaim'>
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

                      <ul className='klaim'>
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
                            value={detailObat.tipeObat}
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
              confirmButtonText: 'Setujui',
              cancelButtonText: 'Batal',
              allowOutsideClick: false,
              customClass: {
                htmlContainer: 'scrollable-modal-small'
              },
            }).then((result) => {
              if(result.isConfirmed){

                MySwal.fire({
                  title: "Menunggu koneksi Metamask...",
                  text: "Jika proses ini memakan waktu terlalu lama, coba periksa koneksi Metamask Anda. 🚀",
                  icon: 'info',
                  showCancelButton: false,
                  showConfirmButton: false,
                  allowOutsideClick: false,
                });

                approveNie(id, nieNum, detailObat.namaObat, factoryInstance)
              }
            })
          
          } else if(result.isDenied){
            MySwal.fire({
              title: "Tolak Pengajuan NIE",
              html: (
                <div className='form-swal form'>
                  <ul>
                    <li className="label">
                      <label htmlFor="factoryAddr">Nama Instansi Pabrik</label>
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
                      <label htmlFor="rejectReason">Alasan Penolakan</label>
                    </li>
                    <li className="input">
                      <select id="rejectReason" required onChange={(e) => handleRejectReasonChange(e)}>
                        <option value="">Pilih alasan</option>
                        <option value="Dokumen Master Formula tidak sesuai">Dokumen Master Formula tidak sesuai</option>
                        <option value="Surat Kuasa tidak sesuai">Surat Kuasa tidak sesuai</option>
                        <option value="Surat Pernyataan tidak sesuai">Surat Pernyataan tidak sesuai</option>
                        <option value="Dokumen Komposisi Produk tidak sesuai">Dokumen Komposisi Produk tidak sesuai</option>
                        <option value="Dokumen Cara Pembuatan Produk tidak sesuai">Dokumen Cara Pembuatan Produk tidak sesuai</option>
                        <option value="Dokumen Spesifikasi Produk Jadi tidak sesuai">Dokumen Spesifikasi Produk Jadi tidak sesuai</option>
                        <option value="Dokumen Sistem Penomoran Bets tidak sesuai">Dokumen Sistem Penomoran Bets tidak sesuai</option>
                        <option value="Sertifikat Analisa Bahan Baku tidak sesuai">Sertifikat Analisa Bahan Baku tidak sesuai</option>
                        <option value="Sertifikat Analisa Produk Jadi tidak sesuai">Sertifikat Analisa Produk Jadi tidak sesuai</option>
                        <option value="Dokumen Spesifikasi Kemasan tidak sesuai">Dokumen Spesifikasi Kemasan tidak sesuai</option>
                        <option value="Dokumen Hasil Uji Stabilitas tidak sesuai">Dokumen Hasil Uji Stabilitas tidak sesuai</option>
                        <option value="Desain Kemasan tidak sesuai">Desain Kemasan tidak sesuai</option>
                        <option value="Data Pendukung Keamanan tidak sesuai">Data Pendukung Keamanan tidak sesuai</option>
                        <option value="Lainnya">Lainnya (Input Manual)</option>
                      </select>
                    </li>
                  </ul>

                  <ul id="customRejectMsgWrapper" style={{ display: 'none' }}>
                    <li className="label">
                      <label htmlFor="customRejectMsg">Alasan Penolakan</label>
                    </li>
                    <li className="input">
                      <textarea
                        id="customRejectMsg"
                        rows="3"
                        placeholder="Masukkan alasan manual di sini"
                      />
                    </li>
                  </ul>
                </div>
              ),
              width: '638',
              showCancelButton: true,
              showCloseButton: true,
              confirmButtonText: 'Tolak',
              confirmButtonColor: '#E33333',
              cancelButtonText: 'Batal',
              cancelButtonColor: '#A6A6A6',
              allowOutsideClick: false,
              preConfirm: () => {
                const rejectReason = document.getElementById('rejectReason').value;
                const customRejectMsg = document.getElementById('customRejectMsg').value;

                if (!rejectReason) {
                  Swal.showValidationMessage('Pilih alasan reject!');
                } else if (rejectReason === 'Lainnya' && !customRejectMsg.trim()) {
                  Swal.showValidationMessage('Masukkan alasan manual jika memilih "Lainnya"!');
                }

                return {
                  rejectReason: rejectReason === 'Lainnya' ? customRejectMsg : rejectReason,
                };
              },
            }).then((result) => {
              if(result.isConfirmed){
                console.log(result.value.rejectReason);

                MySwal.fire({
                  title: "Menunggu koneksi Metamask...",
                  text: "Jika proses ini memakan waktu terlalu lama, coba periksa koneksi Metamask Anda. 🚀",
                  icon: 'info',
                  showCancelButton: false,
                  showConfirmButton: false,
                  allowOutsideClick: false,
                });

                rejectNie(id, result.value.rejectReason, detailObat.namaObat, factoryInstance)
              }
            })
          }
        })

      }
      
    } catch (e) {
      errAlert(e, "Can't retrieve data")
    }
  }

  function handleRejectReasonChange(e) {
    const customMsgWrapper = document.getElementById('customRejectMsgWrapper');
    if (e.target.value === 'Lainnya') {
      customMsgWrapper.style.display = 'flex';
    } else {
      customMsgWrapper.style.display = 'none';
    }
  }

  const approveNie = async(id, nieNumber, namaObat, factoryInstance) => {

    console.log(id, nieNumber, userdata.instanceName);
    try {
      const approveNieCt =  await contracts.nieManager.approveNie(id, nieNumber, userdata.instanceName)

      if(approveNieCt){
        updateObatFb(factoryInstance, namaObat, approveNieCt.hash, true)
        MySwal.update({
          title: "Memproses transaksi...",
          text: "Proses transaksi sedang berlangsung, harap tunggu. ⏳"
        });
      }

      contracts.nieManager.on('evt_nieApproved',  (_instanceName, _instanceAddr, _nieNumber, _timestampApprove) => {
        handleEventNieApproved("Approved", namaObat, _instanceAddr, _instanceName, _nieNumber, _timestampApprove, approveNieCt.hash)
      });

    } catch (error) {
      errAlert(error, "Gagal menyetujui pengajuan NIE");
    }
  }

  const rejectNie = async(id, rejectMsg, namaObat, factoryInstance) => {

    try {
      console.log(id, userdata.instanceName, rejectMsg);
      const rejectCt = await contracts.nieManager.rejectNie(id, userdata.instanceName, rejectMsg);

      if(rejectCt){
        updateObatFb(factoryInstance, namaObat, rejectCt.hash, false)
        MySwal.update({
          title: "Memproses transaksi...",
          text: "Proses transaksi sedang berlangsung, harap tunggu. ⏳"
        });
      }

      contracts.nieManager.on('evt_nieRejected',  (_instanceName, _instanceAddr, _rejectMsg, _timestampRejected) => {
        handleEventNieApproved("Rejected", namaObat, _instanceAddr, _instanceName, _rejectMsg, _timestampRejected, rejectCt.hash)
      });

    } catch (error) {
      errAlert(error, "Can't Reject NIE");
    }
  }

  const updateObatFb = async (instanceName, namaProduk, obatHash, status) => {
    try {
      const documentId = `[OT] ${namaProduk}`;
      const factoryDocRef = doc(db, instanceName, documentId);

      if(status){
        await updateDoc(factoryDocRef, {
          "historyNie.approvedNie": obatHash, 
          "historyNie.approvedNieTimestamp": Date.now(), 
        }); 
      } else {
        await updateDoc(factoryDocRef, {
          "historyNie.rejectedNie": obatHash, 
          "historyNie.rejectedNieTimestamp": Date.now(), 
        });  

      }
  
    } catch (err) {
      errAlert(err);
    }
  };

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
                    <p>Nama Instansi Pabrik: {item.factoryInstance}</p>
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
    confirmButtonText: 'Coba Lagi',
    didOpen: () => {
      const actions = Swal.getActions();
      actions.style.justifyContent = "center";
    }
  });

  console.error(customMsg)
  console.error(errorObject);
}


export default NieApprove;