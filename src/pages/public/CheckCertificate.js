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
  const [bpomInstanceAddress, setBpomInstanceAddress] = useState("");
  const [senderInstanceAddress, setSenderInstanceAddress] = useState("");
  const [factoryType, setFactoryType] = useState("");

  useEffect(() => {
    document.title = "Check Instance Certificate";
  }, []);

  const getHashFromUrl = () => {
    const urlPath = window.location.pathname;
    return urlPath.split('/').pop();
  };

  useEffect(() => {
    const getDetailData = async () => {
      const ipfsCid = getHashFromUrl();
      const stream = client.cat(ipfsCid);

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
    };

    getDetailData();
  }, []);

  const renderCpotbDetails = () => (
    <>
      <li className="info-item">
        <span className="label">Factory Type</span>
        <span>{factoryType}</span>
      </li>
      <li className="info-item">
        <span className="label">Factory Address</span>
        <span>{senderInstanceAddress}</span>
      </li>
    </>
  );

  const renderCdobDetails = () => (
    <li className="info-item">
      <span className="label">PBF Address</span>
      <span>{senderInstanceAddress}</span>
    </li>
  );

  const renderDetails = () => (
    <>
      <li className="info-item">
        <span className="label">Certificate Number</span>
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
        <span className="label">Tanggal Penyetujuan</span>
        <span>{timestampApp}</span>
      </li>
      <li className="info-item">
        <span className="label">{certName === "CPOTB" ? "Factory Instance" : "PBF Instance"}</span>
        <span>{senderInstance}</span>
        <span className='addr'>({senderAddr})</span>
      </li>
      {certName === "CPOTB" ? renderCpotbDetails() : renderCdobDetails()}
      <li className="info-item">
        <span className="label">BPOM Instance</span>
        <span>{bpomInstance}</span>
        <span className='addr'>({bpomAddr})</span>
      </li>
      <li className="info-item">
        <span className="label">BPOM Address</span>
        <span>{bpomInstanceAddress}</span>
      </li>
    </>
  );

  return (
    <div id="publicObat" className="layout-page">
      <div className="title-menu">
        <h2>
          {certName === "CPOTB" ? "Detail CPOTB" : "Detail CDOB"} <span>{senderInstance}</span>
        </h2>
      </div>
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
    </div>
  );
}

export default CheckCertificateIpfs;
