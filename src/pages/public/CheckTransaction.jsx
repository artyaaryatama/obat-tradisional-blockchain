import { useEffect, useState } from "react";
import { getDocs, doc, getDoc,  collection, query } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import "../../styles/CheckObat.scss";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

function CheckTransaction() {
  const [instanceName, setInstanceName] = useState("");
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [documentDetails, setDocumentDetails] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [instanceData, setInstanceData] = useState(null)
  const [obatData, setObatData] = useState(null)
  const [cpotbData, setCpotbData] = useState(null)
  const [cdobData, setCdobData] = useState(null)
  const [txCpotbData, setTxCpotbData] = useState(null)
  const [txCdobData, setTxCdobData] = useState(null)
  const [txObatData, setTxObatData] = useState(null)
  const [batchData, setBatchData] = useState(null)
  const [obatName, setObatName] = useState(null)

  useEffect(() => {
    document.title = "Riwayat Hash Transaksi";
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
      if (!instanceName.trim()) {
        showAlert("Error", "Harap masukkan nama pabrik yang sesuai.", "error");
        return;
      }

      console.log(instanceName)

      const querySnapshot = doc(db, "company_data", instanceName);
      const instanceSnapshot = await getDoc(querySnapshot);
      const selectedInstance = instanceSnapshot.data(); 

      console.log(selectedInstance);

      if(selectedInstance.role === 'Pabrik'){
        const querySnapshotCpotb = doc(db, "cpotb_list", instanceName);
        const cpotbSnapshot = await getDoc(querySnapshotCpotb);
        const selectedCpotb = cpotbSnapshot.data();

        const querySnapshotObat = doc(db, "obat_data", instanceName) ;
        const obatSnapshot = await getDoc(querySnapshotObat);
        const selectedObat = obatSnapshot.data()

        const obatName = Object.keys(selectedObat)
          .map((obatName) => {
            return obatName
            
          });

        console.log(obatName);

        console.log(selectedCpotb)
        console.log(selectedObat)

        setInstanceData(selectedInstance)
        setCpotbData(selectedCpotb)
        setObatData(selectedObat)
        setObatName(obatName)

        fetchBatchData('DermaHerb Lotion')
        fetchTxCpotbData("Cairan Obat Dalam")
        fetchTxObatData('DermaHerb Lotion')
      } else if(selectedInstance.role === 'PBF'){
        
        const querySnapshotCdob = doc(db, "cdob_list", instanceName);
        const cdobSnapshot = await getDoc(querySnapshotCdob);
        const selectedCdob = cdobSnapshot.data();
        
        console.log((selectedCdob));
        setCdobData(selectedCdob)
        fetchTxCdobData('Obat Lain')
      }
                                                        
      if (selectedInstance.length === 0) {
        showAlert("Tidak ada data", `Tidak ada data yang ditemukan untuk "${instanceName}".`, "warning");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      showAlert("Error", "Gagal mengakses data transaksi.", "error");
    }
  };

  const fetchBatchData = async (obatName) => {
    try {
      console.log(obatData);
      const batchArray = Object.keys(obatData[obatName])
        .filter((key) => key.startsWith("batch_")) 
        .map((batchName) => {
          return {
            batchName: batchName,
            batchData: obatName[batchName],
          };
        });

        console.log(batchArray);
        setBatchData(batchArray);
        
      if (batchArray.length === 0) {
        showAlert("Tidak ada data", `Tidak ada data batch yang ditemukan untuk "${obatName}".`, "warning");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      showAlert("Error", "Gagal mengakses data transaksi.", "error");
    }
  };

  const fetchTxObatData = async (obatName) => {
    try {
      const querySnapshotTxObat = doc(db, "transaction_hash", `obat_${obatName}_${instanceName}`) ;
      const txSnapshot = await getDoc(querySnapshotTxObat);
      const selectedTx = txSnapshot.data()

      console.log(selectedTx);
      setTxObatData(selectedTx);
        
      if (selectedTx.length === 0) {
        showAlert("Tidak ada data", `Tidak ada data transaksi yang ditemukan untuk "${obatName}".`, "warning");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      showAlert("Error", "Gagal mengakses data transaksi.", "error");
    }
  };

  const fetchTxCpotbData = async (jenisSediaan) => {
    try {
      const querySnapshotTxObat = doc(db, "transaction_hash", `pengajuan_cpotb_${instanceName}`) ;
      const txSnapshot = await getDoc(querySnapshotTxObat);
      const selectedTx = txSnapshot.data()

      console.log(selectedTx[jenisSediaan]);
      setTxCpotbData(selectedTx[jenisSediaan]);
        
      if (selectedTx[jenisSediaan].length === 0) {
        showAlert("Tidak ada data", `Tidak ada data transaksi yang ditemukan untuk CPOTB "${jenisSediaan}".`, "warning");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      showAlert("Error", "Gagal mengakses data transaksi.", "error");
    }
  };

  const fetchTxCdobData = async (tipePermohonan) => {
    try {
      const querySnapshotTxObat = doc(db, "transaction_hash", `pengajuan_cdob_${instanceName}`) ;
      const txSnapshot = await getDoc(querySnapshotTxObat);
      const selectedTx = txSnapshot.data()

      console.log(selectedTx[tipePermohonan]);
      setTxCpotbData(selectedTx[tipePermohonan]);
        
      if (selectedTx[tipePermohonan].length === 0) {
        showAlert("Tidak ada data", `Tidak ada data transaksi yang ditemukan untuk CDOB "${tipePermohonan}".`, "warning");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      showAlert("Error", "Gagal mengakses data transaksi.", "error");
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
                    <button className="copy"
                      onClick={() =>
                        navigator.clipboard.writeText(value.hash || "Data tidak tersedia")
                      }
                    >
                      Copy Hash
                    </button>
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
                    <button className="copy" onClick={() => navigator.clipboard.writeText(value || "Data tidak tersedia")}>
                      Copy Hash
                    </button>
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
      <div className="container">
        <div className="data-obat">
          <div className="section">
            <div className="form-container">
              <form
                className="register-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  fetchDocuments();
                }}
                >
                <h3>Riwayat Hash Transaksi</h3>
                <div className="group">
                <input
                  type="text"
                  placeholder="Input Factory Name"
                  value={instanceName}
                  onChange={(e) => setInstanceName(e.target.value)}
                  required
                />
                <button type="submit">Cari</button>

                </div>
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
