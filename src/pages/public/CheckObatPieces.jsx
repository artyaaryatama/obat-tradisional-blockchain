import { useEffect, useState } from 'react';
import { create } from 'ipfs-http-client';
import oht from '../../assets/images/oht.png';
import fitofarmaka from '../../assets/images/fitofarmaka.png';
import Jamu from '../../assets/images/jamu.png';
import TableObat from '../../components/TablePublicDataObat';
import { collection, getDocs, doc as docRef, getDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig"; 
import "../../styles/CheckObat.scss"
import JenisSediaanTooltip from '../../components/TooltipJenisSediaan';

const client = create({ url: 'http://127.0.0.1:5001/api/v0' });

function CheckObatPieces() {
  const [batchName, setBatchName] = useState(null);
  const [obatIdPackage, setObatIdPackage] = useState(null);
  const [dataOrderPbf, setDataOrderPbf] = useState(false);
  const [dataOrderRetailer, setDataOrderRetailer] = useState(false);
  const [detailOrderPbf, setDetailOrderPbf] = useState([]);
  const [detailOrderRetailer, setDetailOrderRetailer] = useState([]);
  const [kemasanKeterangan, setKemasanKeterangan] = useState("")
  const [namaObat, setNamaObat] = useState("");
  const [merkObat, setMerkObat] = useState("");
  const [klaim, setKlaim] = useState([]);
  const [jenisObat, setJenisObat] = useState("")
  const [tipeObat, setTipeObat] = useState("")
  const [komposisi, setKomposisi] = useState([]);
  const [kemasan, setKemasan] = useState("");
  const [factoryAddr, setFactoryAddr] = useState("");
  const [factoryInstanceName, setFactoryInstanceName] = useState("");
  const [factoryType, setFactoryType] = useState("")
  const [nieNumber, setNieNumber] = useState("");
  const [nieRequestDate, setNieRequestDate] = useState("");
  const [nieApprovalDate, setNieApprovalDate] = useState("");
  const [bpomAddr, setBpomAddr] = useState("");
  const [bpomInstanceName, setBpomInstanceName] = useState("");
  const [statusNie, setStatusNie] = useState("");
  const [cpotbHash, setCpotbHash] = useState("");
  const [cdobHash, setCdobHash] = useState("");
  const [bpomAddressInstance, setBpomAddressInstance] = useState("");
  const [factoryAddressInstance, setFactoryAddressInstance] = useState("");
  const [pbfInstanceAddress, setPbfInstanceAddress] = useState("");
  const [retailerInstanceAddress, setRetailerInstanceAddress] = useState("");
  const [retailerNPWP, setRetailerNPWP] = useState("");
  const [pbfNPWP, setPBFNPWP] = useState("");
  const [factoryNPWP, setFactoryNPWP] = useState("");
  const [bpomNPWP, setBPOMNPWP] = useState("");
  const [retailerNib, setRetailerNib] = useState("");
  const [pbfNib, setPBFNib] = useState("");
  const [factoryNib, setFactoryNib] = useState("");
  const [bpomNib, setBPOMNib] = useState("");
  const [url, setUrl] = useState("")
  const [rowsData, setRowsData] = useState([])

  useEffect(() => {
    document.title = "Pencarian Obat Tradisional"; 
  }, []);

  useEffect(() => {
    renderTableObat()
  }, []);

  const imageMap = {
    "Jamu": Jamu,
    "Obat Herbal Terstandar": oht, 
    "Fitofarmaka": fitofarmaka,
  };
  
  const imgSrc = imageMap[jenisObat]

  const searchData = async() => {
    console.log(url)

    try {
      const stream = client.cat(url); 
  
      let data = '';
      for await (const chunk of stream) {
        data += new TextDecoder().decode(chunk);
      }
  
      const obatData = JSON.parse(data);
      console.log("Parsed Data from IPFS:", obatData);
      
      const detailObat = {
        merk: obatData.dataObat.merk,
        namaObat: obatData.dataObat.namaProduk,
        klaim: obatData.dataObat.klaim,
        kemasan: obatData.dataObat.kemasan,
        komposisi: obatData.dataObat.komposisi,
        factoryAddr: obatData.dataObat.factoryAddr,
        factoryType: obatData.dataObat.factoryType,
        factoryInstanceName: obatData.dataObat.factoryInstanceName,
        nieStatus: obatData.dataObat.obatStatus,
        nieRequestDate: obatData.dataObat.nieRequestDate, 
        nieApprovalDate: obatData.dataObat.nieApprovalDate,
        nieNumber: obatData.dataObat.nieNumber,
        bpomAddr: obatData.dataObat.bpomAddr,
        bpomInstanceName: obatData.dataObat.bpomInstanceName,
        factoryAddressInstance: obatData.dataObat.factoryAddressInstance, 
        bpomAddressInstance: obatData.dataObat.bpomAddressInstance,
        tipeObat: obatData.dataObat.tipeObat,
        jenisObat: obatData.dataObat.jenisObat,
        nibFactory :obatData.dataObat.nibFactory,
        npwpFactory :obatData.dataObat.npwpFactory,
        nibBpom :obatData.dataObat.nibBpom,
        npwpBpom :obatData.dataObat.npwpBpom,
      };
      
      if(obatData.dataObat.obatStatus === 'NIE Approved'){
        detailObat.nieStatus='Nie Disetujui'
      }
  
      if (detailObat.factoryType === "UMOT"){
        setFactoryType("Usaha Mikro Obat Tradisional (UMOT)")
      } else if (detailObat.factoryType === "UKOT"){
        setFactoryType("Usaha Kecil Obat Tradisional (UKOT) ")
      } else{
        setFactoryType("Industri Obat Tradisional (IOT)")
      }
  
      if(detailObat.jenisObat === "OHT"){
        setJenisObat("Obat Herbal Terstandar")
      } else {
        setJenisObat(detailObat.jenisObat)
      }
      
      const ketmasanKet = detailObat.kemasan.match(/@(.+?)\s*\(/);
  
      if(obatData.dataOrderPbf && Object.keys(obatData.dataOrderPbf).length > 0) {
        setDataOrderPbf(true)
        const detailOrderPbf = {
          orderQuantity: obatData.dataOrderPbf.orderQuantity,
          senderInstanceName: obatData.dataOrderPbf.senderInstanceName,
          targetInstanceName : obatData.dataOrderPbf.targetInstanceName,
          statusOrder : obatData.dataOrderPbf.statusOrder ,
          timestampOrder: obatData.dataOrderPbf.timestampOrder,
          senderAddress : obatData.dataOrderPbf.senderAddress === '0x0000000000000000000000000000000000000000' ? "-" : obatData.dataOrderPbf.senderAddress,
          targetAddress : obatData.dataOrderPbf.targetAddress,
          timestampShipped: obatData.dataOrderPbf.timestampShipped,
          timestampComplete: obatData.dataOrderPbf.timestampComplete ? obatData.dataOrderPbf.timestampComplete  : "-"
        }
        console.log(detailOrderPbf);
        setDetailOrderPbf(detailOrderPbf)
        setPBFNPWP(obatData.dataOrderPbf.NpwpPbf)
        setPBFNib(obatData.dataOrderPbf.NibPbf)
        setCdobHash(obatData.cdobHash)
        setPbfInstanceAddress(obatData.dataOrderPbf.pbfInstanceAddress)
        if(obatData.dataOrderPbf.statusOrder === 'Order Completed'){
          detailOrderPbf.statusOrder='Order Selesai'
        } else if(obatData.dataOrderPbf.statusOrder === 'Order Shipped'){
          detailOrderPbf.statusOrder='Order Dikirim'
        }
      }
      
      if(obatData.dataOrderRetailer && Object.keys(obatData.dataOrderRetailer).length > 0) {
        setDataOrderRetailer(true)
        const detailOrderRetailer = {
          orderQuantity: obatData.dataOrderRetailer.orderQuantity,
          senderInstanceName: obatData.dataOrderRetailer.senderInstanceName,
          statusOrder : obatData.dataOrderRetailer.statusOrder,
          targetInstanceName : obatData.dataOrderRetailer.targetInstanceName,
          senderAddress : obatData.dataOrderRetailer.senderAddress === '0x0000000000000000000000000000000000000000' ? "-" : obatData.dataOrderRetailer.senderAddress,
          targetAddress : obatData.dataOrderRetailer.targetAddress,
          timestampOrder: obatData.dataOrderRetailer.timestampOrder,
          timestampShipped: obatData.dataOrderRetailer.timestampShipped,
          timestampComplete: obatData.dataOrderRetailer.timestampComplete ?  obatData.dataOrderRetailer.timestampComplete : "-",
        }
        if(obatData.dataOrderRetailer.statusOrder === 'Order Completed'){
          detailOrderRetailer.statusOrder='Order Selesai'
        } else if(obatData.dataOrderRetailer.statusOrder === 'Order Shipped'){
          detailOrderRetailer.statusOrder='Order Dikirim'
        }
        setRetailerNPWP(obatData.dataOrderRetailer.NpwpRetailer)
        setRetailerNib(obatData.dataOrderRetailer.NibRetailer)
        setRetailerInstanceAddress(obatData.dataOrderRetailer.retailerInstanceAddress)
        setDetailOrderRetailer(detailOrderRetailer)
      }
  
      setKemasanKeterangan(ketmasanKet[1])
      setBatchName(obatData.batchName);
      setObatIdPackage(obatData.obatIdPackage);
      setNamaObat(detailObat.namaObat);
      setTipeObat(detailObat.tipeObat);
      setMerkObat(detailObat.merk);
      setKlaim(detailObat.klaim);
      setKemasan(detailObat.kemasan)
      setKomposisi(detailObat.komposisi);
      setFactoryAddr(detailObat.factoryAddr);
      setFactoryInstanceName(detailObat.factoryInstanceName);
      setNieNumber(detailObat.nieNumber);
      setNieRequestDate(detailObat.nieRequestDate);
      setNieApprovalDate(detailObat.nieApprovalDate);
      setBpomAddr(detailObat.bpomAddr);
      setBpomInstanceName(detailObat.bpomInstanceName);
      setStatusNie(detailObat.nieStatus);
      setCpotbHash(obatData.cpotbHash);
      setBpomAddressInstance(detailObat.bpomAddressInstance);
      setBPOMNPWP(detailObat.npwpBpom)
      setFactoryNPWP(detailObat.npwpFactory)
      setFactoryNib(detailObat.nibFactory)
      setBPOMNib(detailObat.nibBpom)
      setFactoryAddressInstance(detailObat.factoryAddressInstance);
  
    } catch (error) {
      alert('Error')
      console.error("Error fetching data from IPFS:", error);
    }
  }

  const renderTableObat = async () => {
    const snapshot = await getDocs(collection(db, "obat_data"));
    const rowsData = [];

    for (const doc of snapshot.docs) {
      const companyName = doc.id;
      const docData = doc.data();

      const companyDoc = await getDoc(docRef(db, "company_data", companyName));
      const company = companyDoc.exists() ? companyDoc.data() : {};
      const alamat = company?.userLocation || "-";
      const nib = company?.userNib || "-";

      console.log(docData)

      Object.entries(docData).forEach(([namaProduk, obatData]) => {
        if (obatData?.status !== 1) return; 
        console.log(namaProduk)
        console.log(obatData)

        rowsData.push({
          id: rowsData.length + 1,
          fixedNumber: rowsData.length + 1,
          approvedTimestamp: obatData.historyNie.approvedTimestamp || null,
          approvedHash: obatData.historyNie.approvedHash || "-",
          nieNumber: obatData.historyNie.nieNumber || "-",
          namaProduk:namaProduk,
          companyName: companyName,
          ipfsCid: obatData.historyNie.ipfsCid || "-",
          bpomInstance: obatData.historyNie.bpomInstance || "-",
          companyAddress: alamat,
          companyNib: nib,
        });
      });
    }

    console.log("HASIL rowsData:", rowsData);
    setRowsData(rowsData);
  };

  const returnData = () => {
    return (
    <>
      <div className="container">
        <div className="data-obat">

          <div className="section">
            <div className="title">
              <h5>Data Obat</h5>
            </div>
            <div className="content">
              <div className="list-detail">
                <ul className="info-list">
                  <li className="info-item">
                    <span className="label">Nama Obat</span>
                    <span>{namaObat}</span>
                  </li>
                  <li className="info-item">
                    <span className="label">Merk Obat</span>
                    <span>{merkObat}</span>
                  </li>
                  <li className="info-item">
                    <span className="label">Jenis Obat</span>
                    <span>{jenisObat}</span>
                    <JenisSediaanTooltip
                      jenisSediaan={jenisObat}
                    />
                  </li>
                  <li className="info-item">
                    <span className="label">Tipe Obat</span>
                    <span>{tipeObat}</span>
                    <JenisSediaanTooltip
                      jenisSediaan={tipeObat}
                    />
                  </li>
                  <li className="info-item">
                    <span className="label">Kemasan Obat</span>
                    <span>{kemasan}</span>
                    <JenisSediaanTooltip
                      jenisSediaan={kemasanKeterangan}
                    />
                  </li>
                  <li className="info-item list-item">
                    <span className="label">Klaim</span>
                    <div className="list">
                      <ol>
                        {
                          klaim.map((item) => (
                            
                            <li key={item}>{item}</li>
                          ))
                        }
                      </ol>
                    </div>
                  </li>
                  <li className="info-item list-item">
                    <span className="label">Komposisi</span>
                    <div className="list">
                      <ol>
                        {
                          komposisi.map((item) => (
                            
                            <li key={item}>{item}</li>
                          ))
                        }
                      </ol>
                    </div>
                  </li>
                  <li className="info-item">
                    <span className="label">Nama Instansi Pabrik</span>
                    <span>{factoryInstanceName}</span>
                    <span className='addr'> ({factoryAddr})</span>
                    <span className='linked'>
                      <a
                        href={`http://localhost:3000/public/certificate/${cpotbHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Detail CPOTB
                        <i className="fa-solid fa-arrow-up-right-from-square"></i>
                      </a>
                    </span>
                  </li>

                  <li className="info-item">
                    <span className="label">Tipe Industri Farmasi</span>
                    <span className='address'>{factoryType}</span>
                  </li>
                  <li className="info-item">
                    <span className="label">Lokasi Pabrik</span>
                    <span className='address'>{factoryAddressInstance}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="section">
            <div className="title">
              <h5>Data NIE</h5>
              <span className={statusNie}>{statusNie}</span>
            </div>
            <div className="content">
              <div className="list-detail">
                <ul className="info-list">
                  <li className="info-item">
                    <span className="label">Nomor NIE</span>
                    <span>{nieNumber}</span>
                  </li>
                  <li className="info-item">
                    <span className="label">Tanggal Pengajuan NIE</span>
                    <span>{nieRequestDate}</span>
                  </li>
                  <li className="info-item">
                    <span className="label">Tanggal Penerbitan NIE </span>
                    <span>{nieApprovalDate}</span>
                  </li>
                  <li className="info-item">
                    <span className="label">Nama Instansi BPOM</span>
                    <span>{bpomInstanceName}</span>
                    <span className='addr'>({bpomAddr})</span>
                  </li>
                  <li className="info-item">
                    <span className="label">Lokasi BPOM</span>
                    <span>{bpomAddressInstance}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {
            dataOrderPbf? 
              <div className="section">
                <div className="title">
                  <h5>Data Order PBF</h5>
                  <span className={detailOrderPbf.statusOrder}>{detailOrderPbf.statusOrder}</span>
                </div>
                <div className="content">
                  <div className="list-detail">
                    <ul className="info-list">
                      <li className="info-item">
                        <span className="label">Nama Instansi PBF</span>
                        <span>{detailOrderPbf.senderInstanceName}</span>
                        <span className='addr'>({detailOrderPbf.senderAddress})</span>
                        <span className='linked'>
                          <a
                            href={`http://localhost:3000/public/certificate/${cdobHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Detail CDOB
                            <i className="fa-solid fa-arrow-up-right-from-square"></i>
                          </a>
                        </span>
                      </li>
                      <li className="info-item">
                        <span className="label">Lokasi PBF</span>
                        <span>{pbfInstanceAddress}</span>
                      </li>
                      <li className="info-item">
                        <span className="label">Tangal order diajukan</span>
                        <span>{detailOrderPbf.timestampOrder}</span>
                      </li>
                      <li className="info-item">
                        <span className="label">Tanggal order dikirim</span>
                        <span>{detailOrderPbf.timestampShipped}</span>
                      </li>
                      <li className="info-item">
                        <span className="label">Tanggal order selesai</span>
                        <span>{detailOrderPbf.timestampComplete}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div> 
            : (
              <div></div>
            )
          }

          {
            dataOrderRetailer? 
              <div className="section">
                <div className="title">
                  <h5>Data Order Retailer</h5>
                  <span className={detailOrderRetailer.statusOrder}>{detailOrderRetailer.statusOrder}</span>

                </div>
                <div className="content">
                  <div className="list-detail">
                    <ul className="info-list">
                      <li className="info-item">
                        <span className="label">Nama Instansi Retailer</span>
                        <span>{detailOrderRetailer.senderInstanceName}</span>
                        <span className='addr'>({detailOrderRetailer.senderAddress})</span>
                      </li>
                      <li className="info-item">
                        <span className="label">Lokasi Retailer </span>
                        <span>{retailerInstanceAddress}</span>
                      </li>
                      <li className="info-item">
                        <span className="label">Tangal order diajukan</span>
                        <span>{detailOrderRetailer.timestampOrder}</span>
                      </li>
                      <li className="info-item">
                        <span className="label">Tanggal order dikirim</span>
                        <span>{detailOrderRetailer.timestampShipped}</span>
                      </li>
                      <li className="info-item">
                        <span className="label">Tanggal order selesai</span>
                        <span>{detailOrderRetailer.timestampComplete}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div> 
            : (
              <div></div>
            )
          }

        </div>
      </div>
    </>
    )
  }

  return (
    <>
      <div id="publicObat" className="layout-page">

        <form className="register-form" onSubmit={(e) => { e.preventDefault(); searchData(); }}>
          <h3>Pencarian Detail Obat Tradisional</h3>

          <div className="group">
            <input 
              type="text" 
              placeholder="Silahkan masukan CID IPFS" 
              value={url}
              onChange={(e) => setUrl(e.target.value)} 
              required 
            />
            
            <button type="submit">
              Cari Data Obat
            </button>
          </div>
        </form>

        {namaObat? returnData() : <div></div>}

        <div className="container-table">
          <h3>List Data Izin Edar Obat Tradisional</h3>
  
          <TableObat rowsData={rowsData} />
        </div>
      </div>


    </>
  );
}

export default CheckObatPieces;