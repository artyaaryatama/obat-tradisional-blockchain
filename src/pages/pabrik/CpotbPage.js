import { useEffect, useState } from 'react';
import { BrowserProvider, Contract } from "ethers";
import contractMainSupplyChain from '../../auto-artifacts/MainSupplyChain.json';
import { useNavigate } from 'react-router-dom';

import "../../styles/MainLayout.scss"
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import './../../styles/SweetAlert.scss';
import imgLoader from '../../assets/images/loader.svg';

const MySwal = withReactContent(Swal);

function CpotbPage() {
  const [contract, setContract] = useState();
  const navigate = useNavigate();

  const userData = JSON.parse(sessionStorage.getItem('userdata')) || {};
  const [loader, setLoader] = useState(false)
  const [dataCpotb, setDataCpotb] = useState(null);

  useEffect(() => {
    async function connectWallet() {
      if (window.ethereum) {
        try {
          const provider = new BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const contr = new Contract(
            contractMainSupplyChain.address, 
            contractMainSupplyChain.abi, 
            signer
          );
            
          setContract(contr);
        } catch (err) {
          console.error("User access denied!")
          errAlert(err, "User access denied!")
        }
      } else {
        console.error("MetaMask is not installed");
      }
    }
    connectWallet();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      if (contract && userData.instanceName) {
        try {
          const tx = await contract.getListCpotbByFactory(userData.instanceName);
          const [jenisSediaanArray, factoryNameArray, statusArray, latestTimestampArray] = tx;

          // Reconstruct the data into an array of objects
          const reconstructedData = jenisSediaanArray.map((jenisSediaan, index) => ({
            jenisSediaan: jenisSediaan.toNumber(), // Convert BigInt if needed
            factoryName: factoryNameArray[index],
            status: statusArray[index].toNumber(), // Convert BigInt if needed
            latestTimestamp: new Date(latestTimestampArray[index].toNumber() * 1000) // Convert timestamp to Date
          }));

          console.log(reconstructedData);

          // showDatas(tx);
          // const dummyCpotbData = {
          //   cpotbId: "abc123", // Unique CPOTB identifier
          //   senderName: "John Doe", // Name of the person submitting the request
          //   factoryAddr: "0x1234567890abcdef1234567890abcdef12345678", // Address of the factory submitting the request
          //   factoryName: "Doe Pharmaceuticals", // Name of the factory
          //   jenisSediaan: 1n, // Enum value representing the type of product (Kapsul Keras Non Betalaktam)
          //   status: 0n, // Enum value representing the status (Pending)
          //   timestampRequest: Math.floor(Date.now() / 1000), // Unix timestamp for when the request was made
          //   timestampApprove: 0, // Unix timestamp for when the request was approved (0 if not approved)
          //   cpotbNumber: "", // Empty if not yet assigned, e.g., could be set upon approval
          //   bpomAddr: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd" // Address of the approving authority (BPOM)
          // };
          
          // console.log("Data loaded: ", dummyCpotbData);
        } catch (error) {
          console.error("Error loading data: ", error);
        }
      }
    };

    loadData();
  }, [contract, userData.instanceName]);

  function showDatas(data) {
    const jenisSediaanMap = {
      0n: "Tablet Non Betalaktam",
      1n: "Kapsul Keras Non Betalaktam",
      2n: "Serbuk Oral Non Betalaktam",
      3n: "Cairan Oral Non Betalaktam"
    };
  
    const statusMap = {
      0n: "Pending",
      1n: "Approved"
    };
  
    // Make sure 'data' is an array, if not convert it
    const dataList = Array.isArray(data) ? data : [data];
    
    // Convert and render data
    return (
      <div>
        {dataList.slice(0, 4).map((item, index) => {
          const jenisSediaan = jenisSediaanMap[item[0]]; // `item[0]` represents `jenisSediaan`
          const factoryName = item[1]; // `item[1]` represents `factoryName`
          const status = statusMap[item[2]]; // `item[2]` represents `status`
          const latestTimestamp = new Date(Number(item[3]) * 1000).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });
  
          return (
            <ul key={index}>
              <li>
                <button className='title' onClick={() => console.log(factoryName)}>
                  {jenisSediaan}
                </button>
                <p>Pembaruan Terakhir: {latestTimestamp}</p>
                <button className={`statusPengajuan ${status.toLowerCase()}`}>
                  {status}
                </button>
              </li>
            </ul>
          );
        })}
      </div>
    );
  }  

  function requestCpotb() {
    navigate('/request-cpotb')
  }

  return (
    <>
      <div id="CpotbPage" className='Layout-Menu layout-page'>
        <div className="title-menu">
          <h1>Data Sertifikat CPOTB</h1>
          <p>Di ajukan oleh {userData.instanceName}</p>
        </div>
        {/* <div className="tab-menu">
          <ul>
            <li><button className='active'>Pengajuan CPOTB</button></li>
            <li><button>Add new request</button></li>
          </ul>
        </div> */}
        <div className="container-data">
          <div className="menu-data">
            <div className="btn">
              <button className='btn-menu' onClick={requestCpotb}>
                <i className="fa-solid fa-plus"></i>
                Add new data
              </button>
            </div>
          </div>
          <div className="data-list">

          {dataCpotb && dataCpotb.length > 0 ? (
           dataCpotb
          ) : (
            <h2 className='small'>No Records Found</h2>
          )}

          </div>
        </div>
      </div>
    </>
  );
}

function errAlert(err, customMsg){
  
  const errorObject = {
    message: err.reason || err.message || customMsg || "Unknown error",
    data: err.data || {},
    transactionHash: err.transactionHash || null
  };
  
  MySwal.fire({
    title: errorObject.message,
    text: customMsg,
    icon: 'error',
    confirmButtonText: 'Try Again'
  });

  console.error(customMsg)
  console.error(errorObject);
}

export default CpotbPage;