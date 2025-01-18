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
    document.title = "Check Transaction Data";
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
    if (!timestamp) return "N/A";
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
        showAlert("Error", "Please enter a valid factory name.", "error");
        return;
      }

      const querySnapshot = await getDocs(collection(db, factoryName));
      const fetchedDocuments = [];
      querySnapshot.forEach((doc) => {
        fetchedDocuments.push({ id: doc.id, ...doc.data() });
      });

      if (fetchedDocuments.length === 0) {
        showAlert("No Data", `No documents found for "${factoryName}".`, "warning");
      }

      setDocuments(fetchedDocuments);
      setSelectedDocument(null);
      setDocumentDetails(null);
    } catch (error) {
      console.error("Error fetching data:", error);
      showAlert("Error", "Failed to fetch documents. Please try again.", "error");
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
            'Created Obat': {
              hash: historyNie.createObat,
              timestamp: historyNie.createObatTimestamp,
            },
            'Request NIE': {
              hash: historyNie.requestNie,
              timestamp: historyNie.requestNieTimestamp,
            },
            'Approved NIE': {
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
        setSelectedBatch(null); // Reset batch when switching documents
        setSelectedDocument(docId);
      }
    } catch (error) {
      console.error("Error fetching document details:", error);
      showAlert("Error", "Failed to fetch document details. Please try again.", "error");
    }
  };
  

  const fetchBatchDetails = async (batchName) => {
    try {
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
      }
  
      setSelectedBatch({
        ...selectedBatchData,
        historyHash,
        cpotbData: {
          'Request CPOTB' : {
            hash: cpotbData.requestCpotb,
            timestamp: cpotbData.requestTimestamp
          },
          'Approved CPOTB' : {
            hash: cpotbData.approvedCpotb,
            timestamp:  cpotbData.approvedTimestamp
          }
        },
        cdobData: {
          'Request CDOB' : {
            hash: cdobData.requestCdob,
            timestamp: cdobData.requestTimestamp
          },
          'Approved CDOB' : {
            hash: cdobData.approvedCdob,
            timestamp:  cdobData.approvedTimestamp
          }
        },
        pbfInstance: pbfInstance, 
        retailerInstance: retailerInstance? retailerInstance : false,
        quantity: quantity
      });
    } catch (error) {
      console.error("Error fetching batch details:", error);
      showAlert("Error", "Failed to fetch batch details. Please try again.", "error");
    }
  };
  

  const renderTable = (data, title) => {
    const sortedData = Object.entries(data).sort(
      ([, a], [, b]) => Number(a.timestamp || 0) - Number(b.timestamp || 0) // Sort by timestamp
    );
  
    return (
      <div>
        <h4>{title}</h4>
        <table>
          <thead>
            <tr>
              <th>Key</th>
              <th>Timestamp</th>
              <th>Hash</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map(([key, value]) => (
              <tr key={key}>
                <td>{key}</td>
                <td>{formatTimestamp(value.timestamp)}</td>
                <td>{value.hash || "N/A"}</td>
                <td>
                  <button onClick={() => navigator.clipboard.writeText(value.hash || "N/A")}>
                    Copy Hash
                  </button>
                  <button
                    onClick={() =>
                      value.hash && window.open(`https://etherscan.io/tx/${value.hash}`, "_blank")
                    }
                  >
                    View on Etherscan
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  
  
  const renderBatchTable = (batchData) => {
    // Define a mapping for batch keys to their display names
    const keyDisplayMap = {
      orderCreatedRetailer: "Order Created by Retailer",
      orderShippedRetailer: "Order Shipped to Retailer",
      orderCreatedPbf: "Order Created by PBF",
      orderCompletedPbf: "Order Completed by PBF",
      orderCompletedRetailer: "Order Completed by Retailer",
      orderShippedPbf: "Order Shipped to PBF",
      batchCreated: "Batch Created",
    };
  
    // Filter out keys containing 'Timestamp'
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
        <h4>Batch Details</h4>
        <table>
          <thead>
            <tr>
              <th>Key</th>
              <th>Timestamp</th>
              <th>Hash</th>
              <th>Actions</th>
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
                  <td>{value || "N/A"}</td>
                  <td>
                    <button onClick={() => navigator.clipboard.writeText(value || "N/A")}>
                      Copy Hash
                    </button>
                    <button
                      onClick={() =>
                        value && window.open(`https://etherscan.io/tx/${value}`, "_blank")
                      }
                    >
                      View on Etherscan
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="batch-summary">
        <p>
          <b>PBF Instance:</b> {batchData.pbfInstance || "N/A"}
        </p>
        <p>
          <b>Retailer Instance:</b>{" "}
          {batchData.retailerInstance ? batchData.retailerInstance : "N/A"}
        </p>
        <p>
          <b>Batch Quantity:</b> {batchData.quantity || "N/A"}
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
              <h1>Check Transaction Hash</h1>
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
                <button type="submit">Fetch Documents</button>
              </form>
            </div>

            {documents.length > 0 && (
              <div className="document-selection">
                <h3>Available Documents</h3>
                <select
                  value={selectedDocument || ""}
                  onChange={(e) => fetchDocumentDetails(e.target.value)}
                >
                  <option value="" disabled>
                    Select a Document
                  </option>
                  {documents.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.id}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {documentDetails && (
              <div className="document-details">
                <h3>General Details</h3>
                {renderTable(documentDetails.historyNie, "History NIE")}
                <p><b>Jenis Sediaan:</b> {documentDetails.jenisSediaan || "N/A"}</p>
                <p><b>Tipe Obat:</b> {documentDetails.tipeObat || "N/A"}</p>

                {documentDetails.batchNames.length > 0 && (
                  <>
                    <h3>Batch Selection</h3>
                    <select
                      onChange={(e) => fetchBatchDetails(e.target.value)}
                      defaultValue=""
                    >
                      <option value="" disabled>
                        Select a Batch
                      </option>
                      {documentDetails.batchNames.map((batchName) => (
                        <option key={batchName} value={batchName}>
                          {batchName}
                        </option>
                      ))}
                    </select>
                  </>
                )}

              {selectedBatch && (
                <div>
                  {renderTable(
                    selectedBatch.cpotbData,
                    "CPOTB Data",
                    
                  )}
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
