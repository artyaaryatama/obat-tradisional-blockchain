import { useEffect, useState } from 'react';
import { create } from 'ipfs-http-client';
import ReactDOM from 'react-dom/client';
import { CID } from 'multiformats/cid'

import "../../styles/CheckObat.scss"

const client = create({ url: 'http://127.0.0.1:5001/api/v0' });


function ChechCerticateIpfs() {
  
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

  useEffect(() => {
    document.title = "Check Instance Certificate"; 
  }, []);

  const getHashFromUrl = () => {
    const urlPath = window.location.pathname;  
    const hash = urlPath.split('/').pop();   
    return hash;
  };
  
  useEffect(() => {
    const getDetailData = async () => {

      const ipfsCid = getHashFromUrl()
      const stream = client.cat(ipfsCid); 

      let data = '';
      for await (const chunk of stream) {
        data += new TextDecoder().decode(chunk);
      }
  
      const certData = JSON.parse(data);
      console.log("Parsed Data from IPFS:", certData);

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
    }

    getDetailData();
  }, []);
  return (
    <>
      <div id="publicObat" className='layout-page'>
        <div className="title-menu">
          <h2>{
              certName === "CPOTB" ? "Detail CPOTB" : "Detail CDOB" 
            } <span>{senderInstance}</span></h2>

        </div>
        <div className="container">
          <div className="data-obat">

            <div className="section">
              <div className="title">
                <h5>Data Sertifikat </h5>
              </div>
              <div className="content">
                <div className="list-detail">
                  <ul className="info-list">
                    <li className="info-item">
                      <span className="label">Certificate Number</span>
                      <span>{certNumber}</span>
                    </li>
                    <li className="info-item">
                      <span className="label">Tipe Permohonan</span>
                      <span>{tipePermohonan}</span>
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
                        {
                        certName === "CPOTB" ?
                          <span className="label">
                          Factory Instance</span> : 
                          <span className="label">
                          PBF Instance</span>
                        }
                      <span>{senderInstance}</span>
                      <span className='addr'>({senderAddr})</span>
                    </li>
                    <li className="info-item">
                        {
                        certName === "CPOTB" ?
                          <span className="label">
                          Factory Address</span> : 
                          <span className="label">
                          PBF Address</span>
                        }
                      <span>{senderInstanceAddress}</span>
                    </li>
                    <li className="info-item">
                      <span className="label">BPOM Instance</span>
                      <span>{bpomInstance}</span>
                      <span className='addr'>({bpomAddr})</span>
                    </li>
                    <li className="info-item">
                      <span className="label">BPOM Address</span>
                      <span>{bpomInstanceAddress}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

export default ChechCerticateIpfs;