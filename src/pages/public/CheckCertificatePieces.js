import { useEffect, useState } from 'react';
import { create } from 'ipfs-http-client';
import "../../styles/CheckObat.scss";
import JenisSediaanTooltip from '../../components/TooltipJenisSediaan';

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

  return (
    <div id="publicObat" className="layout-page">

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

        {certName? returnData() : <div></div>}
    </div>
  );
}

export default CheckCertificateIpfs;
