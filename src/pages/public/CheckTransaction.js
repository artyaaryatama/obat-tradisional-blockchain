import { useEffect, useState } from 'react';
import { BrowserProvider, Contract, Interface } from "ethers";
import { useNavigate } from 'react-router-dom';
import contractData from '../../auto-artifacts/deployments.json';

import "../../styles/CheckObat.scss";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import './../../styles/SweetAlert.scss';
import { getDocs, collection  } from "firebase/firestore";
import { db } from "../../firebaseConfig";

const MySwal = withReactContent(Swal);

function CheckTransaction() {
  const [namaObat, setNamaObat] = useState("");
  const [transactionData, setTransactionData] = useState(null);
  const [receiptData, setReceiptData] = useState(null);
  const [consensusData, setConsensusData] = useState(null);
  const [blockData, setBlockData] = useState(null);
  const [decodedData, setDecodedData] = useState(null);
  const [decodedLogs, setDecodedLogs] = useState(null);
  // const [decodedLogs, setDecodedLogs] = useState(null);

  useEffect(() => {
    document.title = "Check Transaction Data"; 
  }, []);

  const retrieveCpotbDataFb = async() => {
    try {
      const querySnapshot = await getDocs(collection(db, namaObat));
      querySnapshot.forEach((doc) => {
        console.log(`${doc.id} =>`, doc.data());
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }
  

  return (
    <>
      <div id="publicObat" className="txHash">
        <div className="title-menu">
          <h2>ot-blockchain.</h2>
        </div>
        <div className="container">
          <div className="data-obat">
            <div className="section">
              <div className="form-container">
                <h1>Check Transaction Hash</h1>
                <form className="register-form" onSubmit={retrieveCpotbDataFb}>
                  <input 
                    type="text" 
                    placeholder="Input Hash" 
                    value={namaObat} 
                    onChange={(e) => setNamaObat(e.target.value)} 
                    required 
                  />
                  <button type="submit">Submit</button>
                </form>
              </div>
              {transactionData && (
                <div className="transaction-data">
                  <h3>Transaction Details</h3>
                  <pre>{JSON.stringify(transactionData, null, 2)}</pre>
                </div>
              )}
              {receiptData && (
                <div className="receipt-data">
                  <h3>Receipt Details</h3>
                  <pre>{JSON.stringify(receiptData, null, 2)}</pre>
                </div>
              )}
              {consensusData && (
                <div className="receipt-data">
                  <h3>Consensus Data Details</h3>
                  <pre>{JSON.stringify(consensusData, null, 2)}</pre>
                </div>
              )}
              {blockData && (
                <div className="receipt-data">
                  <h3>Block Data Details</h3>
                  <pre>{JSON.stringify(blockData, null, 2)}</pre>
                </div>
              )}
              {decodedData && (
                <div className="receipt-data">
                  <h3>Decoded Data Details</h3>
                  <pre>
                    {JSON.stringify(
                      decodedData,
                      (key, value) => (typeof value === "bigint" ? value.toString()+"n" : value),
                      2
                    )}
                  </pre>
                </div>
              )}
              {decodedLogs && (
                <div className="receipt-data">
                  <h3>Decoded Logs Details</h3>
                  <pre>
                    {JSON.stringify(
                      decodedLogs,
                      (key, value) => (typeof value === "bigint" ? value.toString()+"n" : value),
                      2
                    )}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// function CheckTransaction() {
//   const [hash, setHash] = useState("");
//   const [transactionData, setTransactionData] = useState(null);
//   const [receiptData, setReceiptData] = useState(null);
//   const [consensusData, setConsensusData] = useState(null);
//   const [blockData, setBlockData] = useState(null);
//   const [decodedData, setDecodedData] = useState(null);
//   const [decodedLogs, setDecodedLogs] = useState(null);

//   useEffect(() => {
//     document.title = "Check Transaction Data"; 
//   }, []);


//   const getHash = async (e) => {
//     e.preventDefault();
//     if (!hash) {
//       errAlert({}, "Please input a valid hash.");
//       return;
//     }
//     try {
//       const provider = new BrowserProvider(window.ethereum);
  
//       // Fetch transaction
//       const tx = await provider.getTransaction(hash);
//       console.log("Transaction Data:", tx);
//       setTransactionData(tx)
  
//       // Fetch receipt
//       const receipt = await provider.getTransactionReceipt(hash);
//       console.log("Receipt Data:", receipt);
//       setReceiptData(receipt)
  
//       // Fetch block details
//       if (tx.blockNumber) {
//         const block = await provider.getBlock(tx.blockNumber);
//         console.log("Block Data:", block);
  
//         const consensusDetails = {
//           blockNumber: block.number,
//           blockHash: block.hash,
//           miner: block.miner,
//           gasLimit: block.gasLimit.toString(),
//           gasUsed: block.gasUsed.toString(),
//           timestamp: new Date(block.timestamp * 1000).toLocaleString(),
//           transactions: block.transactions.length,
//         };
//         setBlockData(block)
//         setConsensusData(consensusDetails)
//         console.log("Consensus Details:", consensusDetails);
//       }
  
//       // Decode transaction input
//       const iface = new Interface(contractData.RoleManager.abi);
//       if (tx.data) {
//         const decodedData = iface.parseTransaction({ data: tx.data });
//         console.log("Decoded Transaction Data:", decodedData);
//         setDecodedData(decodedData)
//       }
  
//       // Decode logs
//       if (receipt.logs.length > 0) {
//         const decodedLogs = receipt.logs.map((log) => {
//           try {
//             return iface.parseLog(log);
//           } catch (err) {
//             return null;
//           }
//         }).filter(Boolean);
//         console.log("Decoded Logs:", decodedLogs);
//         setDecodedLogs(decodedLogs)
//       }
  
//       MySwal.fire({
//         title: "Transaction Details Fetched",
//         text: "Check the console for detailed information.",
//         icon: 'success',
//         confirmButtonText: 'OK',
//       });
  
//     } catch (err) {
//       errAlert(err, "Failed to fetch transaction details.");
//     }
//   };
  

//   return (
//     <>
//       <div id="publicObat" className="txHash">
//         <div className="title-menu">
//           <h2>ot-blockchain.</h2>
//         </div>
//         <div className="container">
//           <div className="data-obat">
//             <div className="section">
//               <div className="form-container">
//                 <h1>Check Transaction Hash</h1>
//                 <form className="register-form" onSubmit={getHash}>
//                   <input 
//                     type="text" 
//                     placeholder="Input Hash" 
//                     value={hash} 
//                     onChange={(e) => setHash(e.target.value)} 
//                     required 
//                   />
//                   <button type="submit">Submit</button>
//                 </form>
//               </div>
//               {transactionData && (
//                 <div className="transaction-data">
//                   <h3>Transaction Details</h3>
//                   <pre>{JSON.stringify(transactionData, null, 2)}</pre>
//                 </div>
//               )}
//               {receiptData && (
//                 <div className="receipt-data">
//                   <h3>Receipt Details</h3>
//                   <pre>{JSON.stringify(receiptData, null, 2)}</pre>
//                 </div>
//               )}
//               {consensusData && (
//                 <div className="receipt-data">
//                   <h3>Consensus Data Details</h3>
//                   <pre>{JSON.stringify(consensusData, null, 2)}</pre>
//                 </div>
//               )}
//               {blockData && (
//                 <div className="receipt-data">
//                   <h3>Block Data Details</h3>
//                   <pre>{JSON.stringify(blockData, null, 2)}</pre>
//                 </div>
//               )}
//               {decodedData && (
//                 <div className="receipt-data">
//                   <h3>Decoded Data Details</h3>
//                   <pre>
//                     {JSON.stringify(
//                       decodedData,
//                       (key, value) => (typeof value === "bigint" ? value.toString()+"n" : value),
//                       2
//                     )}
//                   </pre>
//                 </div>
//               )}
//               {decodedLogs && (
//                 <div className="receipt-data">
//                   <h3>Decoded Logs Details</h3>
//                   <pre>
//                     {JSON.stringify(
//                       decodedLogs,
//                       (key, value) => (typeof value === "bigint" ? value.toString()+"n" : value),
//                       2
//                     )}
//                   </pre>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// }

function errAlert(err, customMsg) {
  const errorObject = {
    message: err.reason || err.message || "Unknown error",
    data: err.data || {},
    transactionHash: err.transactionHash || null,
  };

  MySwal.fire({
    title: errorObject.message,
    text: customMsg,
    icon: 'error',
    confirmButtonText: 'Try Again',
  });

  console.error(customMsg);
  console.error(errorObject);
}

export default CheckTransaction;
