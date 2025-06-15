import { useState } from "react";
import { ethers } from "ethers";

const SEPOLIA_RPC_URL = "https://ethereum-sepolia.publicnode.com";
const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);

function FetchBlockchainData() {
    const [blockNumber, setBlockNumber] = useState("");
    const [txHash, setTxHash] = useState("");
    const [epochNumber, setEpochNumber] = useState("");
    const [slotNumber, setSlotNumber] = useState("");
    
    const [blockData, setBlockData] = useState(null);
    const [txData, setTxData] = useState(null);
    const [epochData, setEpochData] = useState(null);
    const [slotData, setSlotData] = useState(null);

    const getBlockData = async () => {
        try {
            const block = await provider.getBlock(Number(blockNumber));
            if (block) {
              console.log(block);
                setBlockData({
                    number: block.number,
                    timestamp: new Date(block.timestamp * 1000).toLocaleString(),
                    transactions: block.transactions.length,
                });
            } else {
                setBlockData(null);
            }
        } catch (error) {
            console.error("Error fetching block:", error);
        }
    };

    const getTransactionData = async () => {
        try {
            const receipt = await provider.getTransactionReceipt(txHash);
            if (receipt) {
              console.log(receipt);
                setTxData({
                    blockNumber: receipt.blockNumber,
                    gasUsed: receipt.gasUsed.toString(),
                    status: receipt.status === 1 ? "Success" : "Failed",
                });
            } else {
                setTxData(null);
            }
        } catch (error) {
            console.error("Error fetching transaction:", error);
        }
    };

    const getEpochData = () => {
        setEpochData(`Epoch estimate: ${Math.floor(Number(epochNumber) / 32)}`);
    };

    const getSlotData = () => {
        setSlotData(`Slot estimate: ${Number(slotNumber) % 32}`);
    };

    return (
        <div className="fetch-blockchain">
            <h2>Fetch Sepolia Blockchain Data</h2>
            
            <div>
                <input 
                    type="text" 
                    placeholder="Enter Block Number" 
                    value={blockNumber} 
                    onChange={(e) => setBlockNumber(e.target.value)}
                />
                <button onClick={getBlockData}>Fetch Block</button>
                {blockData && (
                    <div>
                        <p>Block Number: {blockData.number}</p>
                        <p>Timestamp: {blockData.timestamp}</p>
                        <p>Transactions: {blockData.transactions}</p>
                    </div>
                )}
            </div>
            
            <div>
                <input 
                    type="text" 
                    placeholder="Enter Transaction Hash" 
                    value={txHash} 
                    onChange={(e) => setTxHash(e.target.value)}
                />
                <button onClick={getTransactionData}>Fetch Transaction</button>
                {txData && (
                    <div>
                        <p>Block Number: {txData.blockNumber}</p>
                        <p>Gas Used: {txData.gasUsed}</p>
                        <p>Status: {txData.status}</p>
                    </div>
                )}
            </div>

            <div>
                <input 
                    type="text" 
                    placeholder="Enter Epoch Number" 
                    value={epochNumber} 
                    onChange={(e) => setEpochNumber(e.target.value)}
                />
                <button onClick={getEpochData}>Estimate Epoch</button>
                {epochData && <p>{epochData}</p>}
            </div>

            <div>
                <input 
                    type="text" 
                    placeholder="Enter Slot Number" 
                    value={slotNumber} 
                    onChange={(e) => setSlotNumber(e.target.value)}
                />
                <button onClick={getSlotData}>Estimate Slot</button>
                {slotData && <p>{slotData}</p>}
            </div>
        </div>
    );
}

export default FetchBlockchainData;
