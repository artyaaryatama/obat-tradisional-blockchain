import { useEffect, useState } from "react";
import { getDocs, doc, getDoc, collection } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import "../../styles/CheckObat.scss";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

function CheckTransaction() {
  const [factoryName, setFactoryName] = useState("");
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [documentDetails, setDocumentDetails] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState(null);

  useEffect(() => {
    document.title = "History Transaksi Obat Tradisonal";
  }, []);

  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "Tidak Tersedia";
    return new Date(Number(timestamp)).toLocaleDateString("id-ID", options);
  };

  const showAlert = (title, text, icon) => {
    MySwal.fire({
      title,
      text,
      icon,
      confirmButtonText: "OK",
    });
  };

  const fetchDocuments = async () => {
    try {
      if (!factoryName.trim()) {
        showAlert("Error", "Harap masukkan nama pabrik yang sesuai.", "error");
        return;
      }

      const querySnapshot = await getDocs(collection(db, factoryName));
      const fetchedDocuments = [];
      querySnapshot.forEach((doc) => {
        fetchedDocuments.push({ id: doc.id, ...doc.data() });
      });

      if (fetchedDocuments.length === 0) {
        showAlert("Tidak ada data", `Tidak ada data yang ditemukan untuk "${factoryName}".`, "warning");
      }

      setDocuments(fetchedDocuments);
      setSelectedDocument(null);
      setDocumentDetails(null);
    } catch (error) {
      console.error("Error fetching data:", error);
      showAlert("Error", "Gagal mengakses data transaksi.", "error");
    }
  };

  const fetchDocumentDetails = async (docId) => {
    try {
      const selectedDoc = documents.find((doc) => doc.id === docId);
      if (selectedDoc) {
        const { historyNie, batchData, jenisSediaan, tipeObat } = selectedDoc;
  
        const output = {
          id: selectedDoc.id,
          historyNie: {
            'Obat Diproduksi': {
              hash: historyNie.createObat,
              timestamp: historyNie.createObatTimestamp,
            },
            'Pengajuan NIE': {
              hash: historyNie.requestNie,
              timestamp: historyNie.requestNieTimestamp,
            },
            'Penerbitan NIE': {
              hash: historyNie.approvedNie,
              timestamp: historyNie.approvedNieTimestamp,
            },
          },
          batchNames: Object.keys(batchData || {}),
          batchData,
          jenisSediaan,
          tipeObat,
        };
  
        setDocumentDetails(output);
        setSelectedBatch(null); 
        setSelectedDocument(docId);
      }
    } catch (error) {
      showAlert("Error", "Gagal mengakses data transaksi.", "error");
    }
  };
  
  const fetchBatchDetails = async (batchName) => {
    try {
      console.log(batchName);
      setSelectedBatch(null)
      const selectedBatchData = documentDetails.batchData[batchName];
      const { pbfInstance, historyHash, quantity, retailerInstance } = selectedBatchData;
  
      console.log(quantity);
      console.log(retailerInstance);
      // Fetch CPOTB data
      const cpotbDocRef = doc(db, factoryName, "cpotb-lists");
      const cpotbDocSnap = await getDoc(cpotbDocRef);
      let cpotbData = {};
      if (cpotbDocSnap.exists()) {
        const cpotbDocData = cpotbDocSnap.data();
        cpotbData = cpotbDocData[documentDetails.jenisSediaan] || {};
        console.log("CPOTB Data:", cpotbData);
      } else {
        console.warn("No CPOTB data found for:", documentDetails.jenisSediaan);
      }
  
      // Fetch CDOB data if pbfInstance exists
      let cdobData = null;
      if (pbfInstance) {
        const cdobDocRef = doc(db, pbfInstance, "cdob-lists");
        const cdobDocSnap = await getDoc(cdobDocRef);
        if (cdobDocSnap.exists()) {
          const cdobDocData = cdobDocSnap.data();
          cdobData = cdobDocData[documentDetails.tipeObat] || {};
          console.log("CDOB Data:", cdobData);
        } else {
          console.warn("No CDOB data found for:", documentDetails.tipeObat);
        }
      } else {
        console.warn("No pbfInstance available for batch:", batchName);
        cdobData = {};
      }
  
      setSelectedBatch({
        ...selectedBatchData,
        historyHash,
        cpotbData: {
          'Pengajuan CPOTB' : {
            hash: cpotbData.requestCpotb,
            timestamp: cpotbData.requestTimestamp
          },
          'Penerbitan CPOTB' : {
            hash: cpotbData.approvedCpotb,
            timestamp:  cpotbData.approvedTimestamp
          }
        },
        cdobData: {
          'Pengajuan CDOB' : {
            hash: cdobData.requestCdob,
            timestamp: cdobData.requestTimestamp
          },
          'Penerbitan CDOB' : {
            hash: cdobData.approvedCdob,
            timestamp:  cdobData.approvedTimestamp
          }
        },
        pbfInstance: pbfInstance, 
        retailerInstance: retailerInstance? retailerInstance : false,
        quantity: quantity
      });
    } catch (error) {
      console.error("Gagal mengakses data transaksi.", error);
      showAlert("Error", "", "error");
    }
  };
  
  const renderTable = (data, title) => {
    const sortedData = Object.entries(data).sort(
      ([, a], [, b]) => Number(a.timestamp || 0) - Number(b.timestamp || 0)
    );
  
    const allDataUnavailable = sortedData.every(([_, value]) => value.timestamp === undefined);
  
    return (
      <div>
        <h4>{title}</h4>
        <table>
          <thead>
            <tr>
              <th></th>
              <th>Tanggal</th>
              <th>Hash</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {allDataUnavailable ? (
              <tr>
                <td colSpan="4" style={{ textAlign: "center" }}>
                  Data tidak tersedia
                </td>
              </tr>
            ) : (
              sortedData.map(([key, value]) => (
                <tr key={key}>
                  <td>{key}</td>
                  <td>
                    {value.timestamp !== undefined
                      ? formatTimestamp(value.timestamp)
                      : "Data tidak tersedia"}
                  </td>
                  <td>{value.hash || "Data tidak tersedia"}</td>
                  <td>
                    {/* <button className="copy"
                      onClick={() =>
                        navigator.clipboard.writeText(value.hash || "Data tidak tersedia")
                      }
                    >
                      Copy Hash
                    </button> */}
                    <button className="view"
                      onClick={() =>
                        value.hash &&
                        window.open(`https://etherscan.io/tx/${value.hash}`, "_blank")
                      }
                    >
                      Lihat di Etherscan
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  };
  
  
  const renderBatchTable = (batchData) => {
    const keyDisplayMap = {
      orderCreatedRetailer: "Pengajuan Order dari Retailer",
      orderShippedRetailer: "Pengiriman Order dari Retailer",
      orderCreatedPbf: "Pengajuan Order dari PBF",
      orderCompletedPbf: "Penyelesaian Order dari PBF",
      orderCompletedRetailer: "Penyelesaian Order dari Retailer",
      orderShippedPbf: "Pengiriman Order dari PBF",
      batchCreated: "Batch Dibuat",
    };
  
    const filteredBatchData = Object.entries(batchData.historyHash || {}).filter(
      ([key]) => !key.toLowerCase().includes("timestamp")
    );
  
    const sortedBatchData = filteredBatchData.sort(
      ([a], [b]) =>
        Number(batchData.historyHash[`${a}Timestamp`] || 0) -
        Number(batchData.historyHash[`${b}Timestamp`] || 0)
    );
  
    return (
      <div>
        <h4>Detail Batch</h4>
        <table>
          <thead>
            <tr>
              <th></th>
              <th>Timestamp</th>
              <th>Hash</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sortedBatchData.map(([key, value]) => {
              const timestampKey = `${key}Timestamp`;
              const displayKey = keyDisplayMap[key] || key; // Use mapped display name or fallback to original key
              return (
                <tr key={key}>
                  <td>{displayKey}</td>
                  <td>{formatTimestamp(batchData.historyHash[timestampKey])}</td>
                  <td>{value || "Data tidak tersedia"}</td>
                  <td>
                    {/* <button className="copy" onClick={() => navigator.clipboard.writeText(value || "Data tidak tersedia")}>
                      Copy Hash
                    </button> */}
                    <button className="view"
                      onClick={() =>
                        value && window.open(`https://etherscan.io/tx/${value}`, "_blank")
                      }
                    >
                      Lihat di Etherscan
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="batch-summary">
        <p>
          <b>Batch Quantity:</b> {batchData.quantity || "Data tidak tersedia"} Obat
        </p>
        <p>
          <b>Nama Instansi PBF:</b> {batchData.pbfInstance || "Data tidak tersedia"}
        </p>
        <p>
          <b>Nama Instansi Retailer:</b>{" "}
          {batchData.retailerInstance ? batchData.retailerInstance : "Data tidak tersedia"}
        </p>
      </div>
      </div>
    );
  };

  return (
    <div id="publicObat" className="txHash">
      <div className="title-menu">
        <h2>ot-blockchain.</h2>
      </div>
      <div className="container">
        <div className="data-obat">
          <div className="section">
            <div className="form-container">
              <h1>History Transaksi</h1>
              <form
                className="register-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  fetchDocuments();
                }}
              >
                <input
                  type="text"
                  placeholder="Input Factory Name"
                  value={factoryName}
                  onChange={(e) => setFactoryName(e.target.value)}
                  required
                />
                <button type="submit">Cari</button>
              </form>
            </div>

            {documents.length > 0 && (
              <div className="document-selection">
                <h3>Silahkan Pilih Produk Obat Tradisonal</h3>
                <select
                  value={selectedDocument || ""}
                  onChange={(e) => fetchDocumentDetails(e.target.value)}
                >
                  <option value="" disabled>
                    Pilih Nama Obat
                  </option>
                  {documents.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.id}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {documentDetails && documentDetails.batchNames && documentDetails.batchNames.length > 0 && (

            <>
              <h3>Silahkan Pilih Batch</h3>
              <select
                onChange={(e) => fetchBatchDetails(e.target.value)}
                defaultValue=""
              >
                <option value="" disabled>
                  Pilih Batch
                </option>
                {documentDetails.batchNames.map((batchName) => (
                  <option key={batchName} value={batchName}>
                    {batchName}
                  </option>
                ))}
              </select>
            </>
          )}

            {documentDetails && (
              <div className="document-details">
                <hr></hr>
                <h3>Data Obat</h3>
                {renderTable(documentDetails.historyNie, "History NIE")}
                {/* <p><b>Jenis Sediaan:</b> {documentDetails.jenisSediaan || "Data tidak tersedia"}</p>
                <p><b>Tipe Obat:</b> {documentDetails.tipeObat || "Data tidak tersedia"}</p> */}

                {selectedBatch && (
                  <div>
                    {renderTable(
                      selectedBatch.cpotbData,
                      "CPOTB Data",
                      
                    )}
                  </div>
                )}
          

                {selectedBatch && (
                  <div>
                    {selectedBatch.cdobData &&
                      renderTable(
                        selectedBatch.cdobData,
                        "CDOB Data",
                      
                      )}
                    {renderBatchTable(selectedBatch)}
                  </div>
                )}

              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CheckTransaction;
