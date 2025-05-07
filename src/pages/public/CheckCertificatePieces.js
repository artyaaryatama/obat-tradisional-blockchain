import { useEffect, useState } from 'react';
import { create } from 'ipfs-http-client';
import "../../styles/CheckObat.scss";
import TableData from '../../components/TablePublicDataSertifikat';
import JenisSediaanTooltip from '../../components/TooltipJenisSediaan';
import { collection, getDocs, doc as docRef, getDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig"; 

const client = create({ url: 'http://127.0.0.1:5001/api/v0' });

function CheckCertificateIpfs() {
  const [certName, setCertName] = useState("");
  const [tipePermohonan, setTipePermohonan] = useState("");
  const [certNumber, setCertNumber] = useState("");
  const [timestampReq, setTimestampReq] = useState("");
  const [timestampApp, setTimestampApp] = useState("");
  const [senderInstance, setSenderInstance] = useState("");
  const [senderAddr, setSenderAddr] = useState("");
  const [bpomInstance, setBpomInstance] = useState("");
  const [bpomAddr, setBpomAddr] = useState("");
  const [nib, setNib] = useState("");
  const [npwp, setNpwp] = useState("");
  const [bpomInstanceAddress, setBpomInstanceAddress] = useState("");
  const [senderInstanceAddress, setSenderInstanceAddress] = useState("");
  const [factoryType, setFactoryType] = useState("");
  const [url, setUrl] = useState("")
  const [rowsData, setRowsData] = useState([])
  const [isActive, setIsActive] = useState(null);
  const [isChoosen, setIsChoosen] = useState('');

  useEffect(() => {
    document.title = "Pencarian Sertifikat";
  }, []);

  const searchData = async () => {
    const stream = client.cat(url);

    let data = '';
    for await (const chunk of stream) {
      data += new TextDecoder().decode(chunk);
    }

    const certData = JSON.parse(data);
    console.log(certData);

    setCertName(certData.certName);
    setTipePermohonan(certData.tipePermohonan);
    setCertNumber(certData.certNumber);
    setTimestampReq(certData.timestampRequest);
    setTimestampApp(certData.timestampApprove);
    setSenderInstance(certData.senderInstance);
    setSenderAddr(certData.senderAddress);
    setBpomInstance(certData.bpomInstance);
    setBpomAddr(certData.bpomAddress);
    setBpomInstanceAddress(certData.bpomInstanceAddress);
    setSenderInstanceAddress(certData.senderInstanceAddress);
    setFactoryType(certData.factoryType);
    setNpwp(certData.senderNPWP);
    setNib(certData.senderNIB);
  };

  useEffect(() => {
    renderTableCdob();
  }, []);

  const renderTableCdob = async () => {
    const snapshot = await getDocs(collection(db, "cdob_list"));
    const rowsData = [];

    for (const doc of snapshot.docs) {
      const companyName = doc.id;
      const docData = doc.data();

      const companyDoc = await getDoc(docRef(db, "company_data", companyName));
      const company = companyDoc.exists() ? companyDoc.data() : {};
      const alamat = company?.userLocation || "-";
      const nib = company?.userNib || "-";

      Object.entries(docData).forEach(([tipePermohonan, permohonanData]) => {
        if (permohonanData?.status !== 1) return; 

        rowsData.push({
          id: rowsData.length + 1,
          // nomor: rowsData.length + 1,
          fixedNumber: rowsData.length + 1,
          approvedTimestamp: permohonanData.approvedTimestamp || null,
          certNumber: permohonanData.cdobNumber || "-",
          tipePermohonan: tipePermohonan,
          companyName: companyName,
          approvedHash: permohonanData.approvedHash || "-",
          ipfsCid: permohonanData.ipfsCid || "-",
          bpomInstance: permohonanData.bpomInstance || "-",
          companyAddress: alamat,
          companyNib: nib,
        });
      });
    }

    console.log("HASIL rowsData:", rowsData);
    setRowsData(rowsData);
  };

  const renderTableCpotb = async() => {
    const snapshot = await getDocs(collection(db, "cpotb_list"));
    const rowsData = [];

    for (const doc of snapshot.docs) {
      const factoryName = doc.id;
      const docData = doc.data();

      const companyDoc = await getDoc(docRef(db, "company_data", factoryName));
      const company = companyDoc.exists() ? companyDoc.data() : {};
      const alamat = company?.userLocation || "-";
      const nib = company?.userNib || "-";
      const factoryType= company?.factoryType || '-';

      Object.entries(docData).forEach(([jenisSediaan, permohonanData]) => {
        if (permohonanData?.status !== 1 && permohonanData?.status !== 3) return; 

        // edit dlu status certificate

        rowsData.push({
          id: rowsData.length + 1,
          // nomor: rowsData.length + 1,
          fixedNumber: rowsData.length + 1,
          certNumber: permohonanData.cpotbNumber || "-",
          jenisSertifikasi: permohonanData?.status === 1? "Sertifikasi Baru" : "Resertifikasi",
          approvedTimestamp: permohonanData.approvedTimestamp || null,
          tipePermohonan: jenisSediaan,
          companyName: factoryName,
          approvedHash: permohonanData.approvedHash || "-",
          ipfsCid: permohonanData.ipfsCid || "-",
          bpomInstance: permohonanData.bpomInstance || "-",
          companyAddress: alamat,
          companyNib: nib,
        });
      });
    }

    console.log("HASIL rowsData:", rowsData);
    setRowsData(rowsData);
  }

  const renderCpotbDetails = () => (
    <>
      <li className="info-item">
        <span className="label">Tipe Industri Farmasi</span>
        <span>{factoryType}</span>
      </li>
      <li className="info-item">
        <span className="label">Lokasi Pabrik</span>
        <span>{senderInstanceAddress}</span>
      </li>
    </>
  );

  const renderCdobDetails = () => (
    <li className="info-item">
      <span className="label">Lokasi PBF</span>
      <span>{senderInstanceAddress}</span>
    </li>
  );

  const renderDetails = () => (
    <>
      <li className="info-item">
        <span className="label">Nomor Sertifikat</span>
        <span>{certNumber}</span>
      </li>
      <li className="info-item">
        <span className="label">Tipe Permohonan</span>
        <span>{tipePermohonan}</span>
        <JenisSediaanTooltip
          jenisSediaan={tipePermohonan}
        />
      </li>
      <li className="info-item">
        <span className="label">Tanggal Pengajuan</span>
        <span>{timestampReq}</span>
      </li>
      <li className="info-item">
        <span className="label">Tanggal Disetujui</span>
        <span>{timestampApp}</span>
      </li>
      <li className="info-item">
        <span className="label">{certName === "CPOTB" ? "Nama Instansi Pabrik" : "Nama Instansi PBF"}</span>
        <span>{senderInstance}</span>
        <span className='addr'>({senderAddr})</span>
      </li>
      {/* <li className="info-item">
        <span className="label">{certName === "CPOTB" ? "NIB Pabrik" : "NIB PBF"}</span>
        <span>{nib}</span>
      </li>
      <li className="info-item">
        <span className="label">{certName === "CPOTB" ? "NPWP Pabrik" : "NPWP PBF"}</span>
        <span>{npwp}</span>
      </li> */}
      {certName === "CPOTB" ? renderCpotbDetails() : renderCdobDetails()}
      <li className="info-item">
        <span className="label">Nama Instansi BPOM</span>
        <span>{bpomInstance}</span>
        <span className='addr'>({bpomAddr})</span>
      </li>
      <li className="info-item">
        <span className="label">Lokasi BPOM</span>
        <span>{bpomInstanceAddress}</span>
      </li>
    </>
  );

  const returnData = () => {
    return (

      <div className="container">
        <div className="data-obat">
          <div className="section">
            <div className="title">
              <h5>Data Sertifikat</h5>
            </div>
            <div className="content">
              <div className="list-detail">
                <ul className="info-list">{renderDetails()}</ul>
              </div>
            </div>
          </div>
        </div>
      </div>

  )}

  const dataChosen = (e, num) => {
    e.preventDefault();
    
    setIsActive(num);

    if (num === 1) {
      setIsChoosen('CPOTB')
      renderTableCpotb()
    } else {
      setIsChoosen('CDOB')
      renderTableCdob()
    }
  }

  console.log("ISI ROWS:", rowsData);

  return (
    <div id="publicObat" className="layout-page">

      <div className="container-form">
        <form className="register-form" onSubmit={(e) => { e.preventDefault(); searchData(); }}>
          <h3>Pencarian Detail Sertifikat</h3>

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

        <div className="btn-wrapper">
          <button type='button' className={`btn ${isActive === 2 ? 'active' : ''}`} onClick={(e) => {dataChosen(e, 2)}}>CDOB</button>
          <button type='button' className={`btn ${isActive === 1 ? 'active' : ''}`} onClick={(e) => {dataChosen(e, 1)}}>CPOTB</button>
        </div>
      </div>


      {certName? returnData() : <div></div>}
      
      <div className="container-table">
        <h3>List Data {isChoosen? isChoosen: 'CDOB'}</h3>

        <TableData rowsData={rowsData} />
      </div>
    </div>
  );
}

export default CheckCertificateIpfs;
