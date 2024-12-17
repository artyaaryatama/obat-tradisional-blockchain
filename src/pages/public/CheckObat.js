import { useEffect, useState } from 'react';
import { create } from 'ipfs-http-client';
import ReactDOM from 'react-dom/client';
import { CID } from 'multiformats/cid'

import "../../styles/CheckObat.scss"

const client = create({ url: 'http://127.0.0.1:5001/api/v0' });


function CheckObatIpfs() {
  const [batchName, setBatchName] = useState(null);
  const [obatIdPackage, setObatIdPackage] = useState(null);
  const [dataOrderPbf, setDataOrderPbf] = useState(false);
  const [dataOrderRetailer, setDataOrderRetailer] = useState(false);
  const [detailOrderPbf, setDetailOrderPbf] = useState([]);
  const [detailOrderRetailer, setDetailOrderRetailer] = useState([]);
  
  // These states will be used for displaying detailed information
  const [namaObat, setNamaObat] = useState("");
  const [merkObat, setMerkObat] = useState("");
  const [klaim, setKlaim] = useState([]);
  const [komposisi, setKomposisi] = useState([]);
  const [factoryAddr, setFactoryAddr] = useState("");
  const [factoryInstanceName, setFactoryInstanceName] = useState("");
  const [tipeProduk, setTipeProduk] = useState("");
  const [nieNumber, setNieNumber] = useState("");
  const [nieRequestDate, setNieRequestDate] = useState("");
  const [nieApprovalDate, setNieApprovalDate] = useState("");
  const [bpomAddr, setBpomAddr] = useState("");
  const [bpomInstanceName, setBpomInstanceName] = useState("");
  const [statusNie, setStatusNie] = useState("");
  const [statusOrderPbf, setStatusOrderPbf] = useState("");
  const [statusOrderRetailer, setStatusOrderRetailer] = useState("");

  useEffect(() => {
    document.title = "Check Obat Tradisional"; 
  }, []);

  const getHashFromUrl = () => {
    const urlPath = window.location.pathname;  
    const hash = urlPath.split('/').pop();   
    return hash;
  };

  // const obatDataFull = {"batchName":"BN-8047-JIGV","obatIdPackage":"OT-02838OL","dataObat":{"obatIdProduk":"ot-3385CI","namaProduk":"Buyung Upik Instan Rasa Coklat","merk":"Buyung Upik Instan Rasa Coklat","klaim":["Memelihara kesehatan","Membantu memperbaiki nafsu makan","Secara tradisional digunakan pada penderita kecacingan"],"kemasan":"Dus, 11 @Tablet (5 gram)","komposisi":["Cinnamomum Burmanii Cortex","Curcuma Aeruginosa Rhizoma","Curcuma Domestica Rhizoma","Curcuma Xanthorrhiza Rhizoma"],"factoryAddr":"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266","factoryInstanceName":"PT. Budi Pekerti","factoryUserName":"TAKAKI YUYA","tipeProduk":"Obat Tradisional","nieNumber":"TETSDFSDF","nieRequestDate":"-","nieApprovalDate":"-","bpomAddr":"-","bpomInstanceName":"-"},"datOrderPbf":{"orderQuantity":2,"senderInstanceName":"PT. Mangga Arum","targetInstanceName":"PT. Budi Pekerti","timestampOrder":"9 Desember 2024 pukul 00.29 WITA","timestampShipped":"9 Desember 2024 pukul 00.29 WITA","timestampComplete":"9 Desember 2024 pukul 00.30 WITA"},"dataOrderRetailer":{"orderQuantity":2,"senderInstanceName":"Apotek Sejahtera","targetInstanceName":"PT. Mangga Arum","timestampOrder":"9 Desember 2024 pukul 00.32 WITA","timestampShipped":"9 Desember 2024 pukul 00.32 WITA","timestampComplete":"9 Desember 2024 pukul 00.33 WITA"}}

  
  useEffect(() => {
    const getDetailData = async () => {

      const ipfsCid = getHashFromUrl()
      const stream = client.cat(ipfsCid); 

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
        factoryInstanceName: obatData.dataObat.factoryInstanceName,
        tipeProduk: obatData.dataObat.tipeProduk, 
        nieStatus: obatData.dataObat.obatStatus,
        nieRequestDate: obatData.dataObat.nieRequestDate, 
        nieApprovalDate: obatData.dataObat.nieApprovalDate,
        nieNumber: obatData.dataObat.nieNumber,
        bpomAddr: obatData.dataObat.bpomAddr,
        bpomInstanceName: obatData.dataObat.bpomInstanceName,
      };

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
          timestampComplete: obatData.dataOrderRetailer.timestampComplete ?  obatData.dataOrderRetailer.timestampComplete : "-" 
        }
        
        setDetailOrderRetailer(detailOrderRetailer)
      }

      setBatchName(obatData.batchName);
      setObatIdPackage(obatData.obatIdPackage);
      setNamaObat(detailObat.namaObat);
      setMerkObat(detailObat.merk);
      setKlaim(detailObat.klaim);
      setKomposisi(detailObat.komposisi);
      setFactoryAddr(detailObat.factoryAddr);
      setFactoryInstanceName(detailObat.factoryInstanceName);
      setTipeProduk(detailObat.tipeProduk);
      setNieNumber(detailObat.nieNumber);
      setNieRequestDate(detailObat.nieRequestDate);
      setNieApprovalDate(detailObat.nieApprovalDate);
      setBpomAddr(detailObat.bpomAddr);
      setBpomInstanceName(detailObat.bpomInstanceName);
      setStatusNie(detailObat.nieStatus)
    }

    getDetailData();
  }, []);

  function getData() {
  }

  getData()

  return (
    <>
      <div id="publicObat" className='layout-page'>
        <div className="title-menu">
          <h2>{namaObat} <span>{tipeProduk}</span></h2>

        </div>
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
                      <span className="label">Batch Name</span>
                      <span>{batchName}</span>
                    </li>
                    <li className="info-item">
                      <span className="label">Obat ID Package</span>
                      <span>{obatIdPackage}</span>
                    </li>
                    <li className="info-item">
                      <span className="label">Nama Obat</span>
                      <span>{namaObat}</span>
                    </li>
                    <li className="info-item">
                      <span className="label">Nomor NIE</span>
                      <span>{nieNumber}</span>
                    </li>
                    <li className="info-item">
                      <span className="label">Factory Instance</span>
                      <span>{factoryInstanceName}</span>
                      <span className='addr'> ({factoryAddr})</span>
                    </li>
                    <li className="info-item">
                      <span className="label">Merk</span>
                      <span>{merkObat}</span>
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
                  </ul>
                </div>
              </div>
            </div>

            <div className="section">
              <div className="title">
                <h5>Data NIE</h5>
                <span>{statusNie}</span>
              </div>
              <div className="content">
                <div className="list-detail">
                  <ul className="info-list">
                    <li className="info-item">
                      <span className="label">NIE Number</span>
                      <span>{nieNumber}</span>
                    </li>
                    <li className="info-item">
                      <span className="label">NIE Request Date</span>
                      <span>{nieRequestDate}</span>
                    </li>
                    <li className="info-item">
                      <span className="label">NIE Approval Date</span>
                      <span>{nieApprovalDate}</span>
                    </li>
                    <li className="info-item">
                      <span className="label">BPOM Instance</span>
                      <span>{bpomInstanceName}</span>
                      <span className='addr'>({bpomAddr})</span>
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
                    <span>{detailOrderPbf.statusOrder}</span>
                  </div>
                  <div className="content">
                    <div className="list-detail">
                      <ul className="info-list">
                        <li className="info-item">
                          <span className="label">Instance PBF</span>
                          <span>{detailOrderPbf.senderInstanceName}</span>
                          <span className='addr'>({detailOrderPbf.senderAddress})</span>
                        </li>
                        <li className="info-item">
                          <span className="label">instance Factory</span>
                          <span>{detailOrderPbf.targetInstanceName}</span>
                          <span className='addr'>({detailOrderPbf.targetAddress})</span>
                        </li>
                        <li className="info-item">
                          <span className="label">Timestamp Order</span>
                          <span>{detailOrderPbf.timestampOrder}</span>
                        </li>
                        <li className="info-item">
                          <span className="label">Timestamp Shipped</span>
                          <span>{detailOrderPbf.timestampShipped}</span>
                        </li>
                        <li className="info-item">
                          <span className="label">Timestamp Complete</span>
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
                    <span>{detailOrderRetailer.statusOrder}</span>

                  </div>
                  <div className="content">
                    <div className="list-detail">
                      <ul className="info-list">
                        <li className="info-item">
                          <span className="label">Instance Retailer</span>
                          <span>{detailOrderRetailer.senderInstanceName}</span>
                          <span className='addr'>({detailOrderRetailer.senderAddress})</span>
                        </li>
                        <li className="info-item">
                          <span className="label">instance PBF</span>
                          <span>{detailOrderRetailer.targetInstanceName}</span>
                          <span className='addr'>({detailOrderRetailer.targetAddress})</span>
                        </li>
                        <li className="info-item">
                          <span className="label">Timestamp Order</span>
                          <span>{detailOrderRetailer.timestampOrder}</span>
                        </li>
                        <li className="info-item">
                          <span className="label">Timestamp Shipped</span>
                          <span>{detailOrderRetailer.timestampShipped}</span>
                        </li>
                        <li className="info-item">
                          <span className="label">Timestamp Complete</span>
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

          {/* <div className="data-timestamp">
            <h3>INi data timestamp</h3>
          </div> */}

        </div>
      </div>
    </>
  );
}

export default CheckObatIpfs;