import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import "../../styles/CheckObat.scss";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

function CheckTransactions() {
 const [factoryName, setFactoryName] = useState("");
  const [allObatData, setAllObatData] = useState([]);
  const [allObatNames, setAllObatNames] = useState([]);
  const [selectedBpomInstance, setSelectedBpomInstance] = useState(null);
  const [selectedIpfsCid, setSelectedIpfsCid] = useState(null);
  const [selectedNieNumber, setSelectedNieNumber] = useState(null);
  const [allBatchNames, setAllBatchNames] = useState([]);
  const [selectedHistoryNie, setSelectedHistoryNie] = useState(null);
  const [selectedCpotbDetails, setSelectedCpotbDetails] = useState(null);
  const [selectedCdobDetails, setSelectedCdobDetails] = useState(null);
  const [selectedHistoryTxCpotb, setSelectedHistoryTxCpotb] = useState([]);
  const [selectedHistoryTxCdob, setSelectedHistoryTxCdob] = useState([]);
  const [selectedJenisSediaan, setSelectedJenisSediaan] = useState(null);
  const [selectedTipeObat, setSelectedTipeObat] = useState(null);
  const [selectedObatData, setSelectedObatData] = useState(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [pbfInstance, setPbfInstance] = useState(null);
  const [retailerInstance, setRetailerInstance] = useState(null);
  const [quantity, setQuantity] = useState(null);

  useEffect(() => {
    document.title = "Riwayat Hash Transaksi";
  }, []);

  const formatTimestamp = (timestamp) => {
    const ts = timestamp < 1e12 ? timestamp * 1000 : timestamp;
    const date = new Date(ts);
    return date.toLocaleString("id-ID", {
      timeZone: "Asia/Makassar",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const showAlert = (title, text, icon) => {
    MySwal.fire({
      title,
      text,
      icon,
      confirmButtonText: "OK",
    });
  };

  const isTestData = (input) => {
    return input.includes("[TEST]");
  };

  const fetchDocuments = async (instanceName) => {

    if(isTestData(instanceName)){
      const Toast = Swal.mixin({
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 6000,
      width:600,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.onmouseenter = Swal.stopTimer;
        toast.onmouseleave = Swal.resumeTimer;
      }
      });
      Toast.fire({
        icon: "warning",
        title: "⚠️ Entri dengan label [TEST] adalah data uji coba. Karena sering digunakan berulang dalam pengujian, timestamp yang tercantum bisa tidak berurutan secara kronologis."
      });
    }

    setAllObatNames([])

    try {
      const querySnapshot = doc(db, "company_data", instanceName);
      const instanceSnapshot = await getDoc(querySnapshot);
      
      if (!instanceSnapshot.exists()) {
        showAlert("Tidak ada data", `Tidak ada data yang ditemukan untuk "${instanceName}".`, "warning");
        return;
      }

      const selectedInstance = instanceSnapshot.data(); 
      console.log(selectedInstance);

      const querySnapshotObat = doc(db, "obat_data", instanceName);
        const obatSnapshot = await getDoc(querySnapshotObat);
        const selectedObat = obatSnapshot.exists() ? obatSnapshot.data() : {};

        const obatNames = Object.keys(selectedObat);
        console.log(obatNames);

        setAllObatData(selectedObat);
        setAllObatNames(obatNames);
      setFactoryName(instanceName);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const fetchObatDetails = async (docId) => {
    setAllBatchNames([])
    try {
      console.log(allObatData);
      const obatData = allObatData[docId];
      console.log(obatData);
      setSelectedHistoryNie(obatData.historyNie);

      const allKeys = Object.keys(obatData);
      const batchNames = allKeys.filter(key => key.startsWith("batch_"));
      setAllBatchNames(batchNames);

      const selectedNie= {
        'Obat Diproduksi': {
          hash: obatData.historyNie.createObatHash,
          timestamp: obatData.historyNie.createObatTimestamp,
        },
        'Pengajuan NIE': {
          hash: obatData.historyNie.requestNie,
          timestamp: obatData.historyNie.requestNieTimestamp,
        },
        'Penerbitan NIE': {
          hash: obatData.historyNie.approvedNie,
          timestamp: obatData.historyNie.approvedNieTimestamp,
        },
        'Penolakan NIE': {
          hash: obatData.historyNie.approvedNie,
          timestamp: obatData.historyNie.approvedNieTimestamp,
        },
        'Perpanjangan NIE': {
          hash: obatData.historyNie.renewRequestHash,
          timestamp: obatData.historyNie.renewRequestTimestamp,
        },
        'Permintaan Perpanjangan NIE': {
          hash: obatData.historyNie.extendedRequestHash,
          timestamp: obatData.historyNie.extendedRequestTimestamp,
        },  
        'Pengajuan Perpanjangan NIE': {
          hash: obatData.historyNie.renewRequestHash,
          timestamp: obatData.historyNie.renewRequestTimestamp,
          },
      }
      setSelectedHistoryNie(selectedNie);
      setSelectedNieNumber(obatData.nieNumber);
      setSelectedBpomInstance(obatData.bpomInstance);
      setSelectedIpfsCid(obatData.ipfsCid);
      setSelectedJenisSediaan(obatData.jenisSediaan);
      setSelectedTipeObat(obatData.tipeObat);
      setSelectedObatData(obatData)

    } catch (error) {
      showAlert("Error", "Gagal mengakses data transaksi.", "error");
    }
  };
  
  const fetchBatchDetails = async (batchName) => {
    const batchNames = selectedObatData[batchName]

    const outputOrder= [
      {
        name: 'Produksi Batch',
        hash: batchNames.batchCreatedHash,
        timestamp: batchNames.batchCreatedTimestamp,
      },
      {
          name: 'Pengajuan Order dari Retailer',
          hash: batchNames.OrderRetCreatedHash, 
          timestamp: batchNames.OrderRetCreatedTimestamp, 
      },
      {
          name: 'Pengiriman Order dari Retailer',
          hash: batchNames.orderRetSendHash,
          timestamp: batchNames.orderRetSendTimestamp,
      },
      {
          name: 'Penyelesaian Order dari Retailer', 
          hash: batchNames.orderRetCompletedHash,
          timestamp: batchNames.orderRetCompletedTimestamp,
      },
      {
          name: 'Pengajuan Order dari PBF',
          hash: batchNames.OrderPbfCreatedHash,
          timestamp: batchNames.OrderPbfCreatedTimestamp,
      },
      {
          name: 'Pengiriman Order dari PBF',
          hash: batchNames.OrderPbfSendHash,
          timestamp: batchNames.OrderPbfSendTimestamp,
      },
      {
          name: 'Penyelesaian Order dari PBF', 
          hash: batchNames.OrderPbfCompletedHash,
          timestamp: batchNames.OrderPbfCompletedTimestamp,
      }
    ]

    console.log(batchNames)

    setSelectedOrderDetails(outputOrder);
    setPbfInstance(batchNames.pbf);
    setRetailerInstance(batchNames.retailer);
    setQuantity(batchNames.quantity);
    
    await fetchCertficates(selectedObatData.jenisSediaan, selectedObatData.tipeObat, batchNames.pbf);

  };

  const fetchCertficates = async (jenisSediaan, tipePermohonan, pbfName) => {
    try {
      if (!factoryName || !pbfName) {
        console.warn("Missing required data:", { factoryName, pbfName });
        setSelectedHistoryTxCpotb([]);
        setSelectedHistoryTxCdob([]);
        return;
      }

      const querySnapshotCpotb = doc(db, "cpotb_list", factoryName);
        const cpotbSnapshot = await getDoc(querySnapshotCpotb);
        const selectedCpotb = cpotbSnapshot.exists() ? cpotbSnapshot.data() : {};

        const querySnapshotCdob = doc(db, "cdob_list", pbfName);
        const cdobSnapshot = await getDoc(querySnapshotCdob);
        const selectedCdob = cdobSnapshot.exists() ? cdobSnapshot.data() : {};

        const selectedCpotbObat = selectedCpotb[jenisSediaan]

        setSelectedCpotbDetails(selectedCpotbObat)

        let historyTxCpotb = [];
        let historyTxCdob = [];

        try {
          if (factoryName) {
            const querySnapshotTxCpotb = doc(db, "transaction_hash", `pengajuan_cpotb_${factoryName}`);
            const txSnapshotCpotb = await getDoc(querySnapshotTxCpotb);
            
            if (txSnapshotCpotb.exists()) {
              const allFactoryCpotb = txSnapshotCpotb.data();
              const selectedCpotbTx = allFactoryCpotb?.[jenisSediaan];

              if (selectedCpotbTx) {
                historyTxCpotb = [
                  {
                    name: 'Pengajuan CPOTB',
                    hash: selectedCpotbTx?.request?.hash ?? 0,
                    timestamp: selectedCpotbTx?.request?.timestamp ?? 0,
                  },
                  {
                    name: 'Penerbitan CPOTB',
                    hash: selectedCpotbTx?.approve?.hash ?? 0,
                    timestamp: selectedCpotbTx?.approve?.timestamp ?? 0,
                  },
                  {
                    name: 'Penolakan CPOTB',
                    hash: selectedCpotbTx?.reject?.hash ?? 0,
                    timestamp: selectedCpotbTx?.reject?.timestamp ?? 0,
                  },
                  {
                    name: 'Pengajuan Ulang CPOTB',
                    hash: selectedCpotbTx?.renew_request?.hash ?? 0,
                    timestamp: selectedCpotbTx?.renew_request?.timestamp ?? 0,
                  },
                  {
                    name: 'Pengajuan Perpanjangan CPOTB',
                    hash: selectedCpotbTx?.extend_request?.hash ?? 0,
                    timestamp: selectedCpotbTx?.extend_request?.timestamp ?? 0,
                  },
                  {
                    name: 'Perpanjangan Disetujui CPOTB',
                    hash: selectedCpotbTx?.extend_approve?.hash ?? 0,
                    timestamp: selectedCpotbTx?.extend_approve?.timestamp ?? 0,
                  },
                  {
                    name: 'Pengajuan Ditolak CPOTB',
                    hash: selectedCpotbTx?.extend_reject?.hash ?? 0,
                    timestamp: selectedCpotbTx?.extend_reject?.timestamp ?? 0,
                  },
                  {
                    name: 'Pengajuan Perpanjangan Ulang CPOTB',
                    hash: selectedCpotbTx?.extend_renew_request?.hash ?? 0,
                    timestamp: selectedCpotbTx?.extend_renew_request?.timestamp ?? 0,
                  }
                ];
              }
            }
          }
        } catch (cpotbError) {
          console.error("Error fetching CPOTB data:", cpotbError);
        }

        try {
          if (pbfName) {
            const querySnapshotTxCdob = doc(db, "transaction_hash", `pengajuan_cdob_${pbfName}`);
            const txSnapshotCdob = await getDoc(querySnapshotTxCdob);
            
            if (txSnapshotCdob.exists()) {
              const allPbfCdob = txSnapshotCdob.data();
              const selectedCdobTx = allPbfCdob?.[tipePermohonan];

              if (selectedCdobTx) {
                historyTxCdob = [
                  {
                    name: 'Pengajuan CDOB',
                    hash: selectedCdobTx?.request?.hash ?? 0,
                    timestamp: selectedCdobTx?.request?.timestamp ?? 0,
                  },
                  {
                    name: 'Penerbitan CDOB',
                    hash: selectedCdobTx?.approve?.hash ?? 0,
                    timestamp: selectedCdobTx?.approve?.timestamp ?? 0,
                  },
                  {
                    name: 'Penolakan CDOB',
                    hash: selectedCdobTx?.reject?.hash ?? 0,
                    timestamp: selectedCdobTx?.reject?.timestamp ?? 0,
                  },
                  {
                    name: 'Pengajuan Ulang CDOB',
                    hash: selectedCdobTx?.renew_request?.hash ?? 0,
                    timestamp: selectedCdobTx?.renew_request?.timestamp ?? 0,
                  },
                  {
                    name: 'Pengajuan Perpanjangan CDOB',
                    hash: selectedCdobTx?.extend_request?.hash ?? 0,
                    timestamp: selectedCdobTx?.extend_request?.timestamp ?? 0,
                  },
                  {
                    name: 'Perpanjangan Disetujui CDOB',
                    hash: selectedCdobTx?.extend_approve?.hash ?? 0,
                    timestamp: selectedCdobTx?.extend_approve?.timestamp ?? 0,
                  },
                  {
                    name: 'Pengajuan Ditolak CDOB',
                    hash: selectedCdobTx?.extend_reject?.hash ?? 0,
                    timestamp: selectedCdobTx?.extend_reject?.timestamp ?? 0,
                  },
                  {
                    name: 'Pengajuan Perpanjangan Ulang CDOB',
                    hash: selectedCdobTx?.extend_renew_request?.hash ?? 0,
                    timestamp: selectedCdobTx?.extend_renew_request?.timestamp ?? 0,
                  }
                ];
              }
            }
          }
        } catch (cdobError) {
          console.error("Error fetching CDOB data:", cdobError);
        }
        
        setSelectedHistoryTxCpotb(historyTxCpotb)
        setSelectedHistoryTxCdob(historyTxCdob)
    

    } catch (error) {
      console.error("Error in fetchCertficates:", error);
      setSelectedHistoryTxCpotb([]);
      setSelectedHistoryTxCdob([]);
    }

  }                                   
  
  const renderTableHistoryTx = (data, title) => {
    if (!data || !Array.isArray(data)) {
      return (
        <div>
          <h4>{title}</h4>
          <p>Data tidak tersedia atau masih dimuat...</p>
        </div>
      );
    }

    

    return (
      <div>
        {
          title === "Data CPOTB" ? 
          <div className="batch-summary">
            <p>
              <b>Jenis Sediaan:</b> {selectedJenisSediaan}
            </p>
          </div> 
          :
          <div className="batch-summary">
            <p>
              <b>Tipe Permohonan:</b> {selectedTipeObat}
            </p>
          </div>

        }
        <table>
          <thead>
            <tr>
              <th>Kegiatan</th>
              <th>Tanggal</th>
              <th>Hash</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {data.map((entry, index) => {
              const isHashAvailable = entry.hash && entry.hash !== 0;
              const isTimestampAvailable = entry.timestamp && entry.timestamp !== 0;

              return (
                <tr key={index}>
                  <td>{entry.name}</td>
                  <td>{isTimestampAvailable ? formatTimestamp(entry.timestamp) : "Data tidak tersedia"}</td>
                  <td>{isHashAvailable ? entry.hash : "Data tidak tersedia"}</td>
                  <td>
                    <button
                      className="copy"
                      disabled={!isHashAvailable}
                      onClick={() => {
                        if (isHashAvailable) navigator.clipboard.writeText(entry.hash);
                      }}
                    >
                      Copy Hash
                    </button>
                    <button
                      className="view"
                      disabled={!isHashAvailable}
                      onClick={() => {
                        if (isHashAvailable) window.open(`https://etherscan.io/tx/${entry.hash}`, "_blank");
                      }}
                    >
                      Lihat di Etherscan
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  
  const renderBatchTable = () => { 
    console.log(selectedOrderDetails);
    
    return (
      <div>
        <h4>Detail Batch</h4>
        <table>
          <thead>
            <tr>
              <th>Aktivitas</th>
              <th>Timestamp</th>
              <th>Hash</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {selectedOrderDetails.map((entry, index) => (
              <tr key={index}>
                <td>{entry.name}</td>
                <td>{entry.timestamp ? formatTimestamp(Number(entry.timestamp)) : "Data tidak tersedia"}</td>
                <td>{entry.hash || "Data tidak tersedia"}</td>
                <td>
                  <button className="copy" onClick={() => navigator.clipboard.writeText(entry.hash || "Data tidak tersedia")}>
                    Copy Hash
                  </button>
                  <button className="view" onClick={() => entry.hash && window.open(`https://etherscan.io/tx/${entry.hash}`, "_blank")}>
                    Lihat di Etherscan
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="batch-summary">
          <p>
            <b>Batch Quantity:</b> {quantity || "Data tidak tersedia"} Obat
          </p>
          <p>
            <b>Nama Instansi PBF:</b> {pbfInstance || "Data tidak tersedia"}
          </p>
          <p>
            <b>Nama Instansi Retailer:</b>{" "}
            {retailerInstance ? retailerInstance : "Data tidak tersedia"}
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
                  fetchDocuments(factoryName);
                }}
                >
                <h3>Riwayat Hash Transaksi</h3>
                <div className="group">
                <input
                  type="text"
                  placeholder="Input Factory Name"
                  value={factoryName}
                  onChange={(e) => setFactoryName(e.target.value)}
                  required
                />
                <button type="submit">Cari</button>

                </div>
              </form>
            </div>

            {allObatNames.length > 0 && (
              <div className="document-selection">
                <h3>Silahkan Pilih Produk Obat Tradisonal</h3>
                <select
                  onChange={(e) => fetchObatDetails(e.target.value)}
                  defaultValue=""
                >
                  <option value="" disabled>
                    Pilih Nama Obat
                  </option>
                  {allObatNames.map((obatName, index) => (
                    <option key={index} value={obatName}> 
                      {obatName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {allObatNames.length > 0 && allBatchNames.length > 0 && (

              <>
                <h3>Silahkan Pilih Batch</h3>
                <select
                  onChange={(e) => fetchBatchDetails(e.target.value)}
                  defaultValue=""
                >
                  <option value="" disabled>
                    Pilih Batch
                  </option>
                  {allBatchNames.map((batchName) => (
                    <option key={batchName} value={batchName}>
                      {batchName.replace('batch_', '')}
                    </option>
                  ))}
                </select>
              </>
            )}

            {allObatNames.length > 0 && allBatchNames.length > 0 && selectedOrderDetails &&  (
              <div className="document-details">
                <hr></hr>
                <h3>Data Detail Batch</h3>

                <div className="">
                  {renderBatchTable()}
                </div>

                <hr />

                <div>
                  <h3>History Transaksi CPOTB</h3>
                  <div className="">
                    {renderTableHistoryTx(selectedHistoryTxCpotb, "Data CPOTB")}
                  </div>
                </div>

                <div>
                  <h3>History Transaksi CDOB</h3>
                  <div className="">
                    {renderTableHistoryTx(selectedHistoryTxCdob, "Data CDOB")}
                  </div> 
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
export default CheckTransactions;