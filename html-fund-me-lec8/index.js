import { ethers } from "./ethers-5.1.esm.min.js";
import { abi, contractAddress } from "./constants.js";

const connectButton = document.getElementById("connectButton");
const fundButton = document.getElementById("fundButton");
const getBalanceButton = document.getElementById("getBalance");
const withdrawButton = document.getElementById("withdrawButton");
connectButton.onclick = connect;
fundButton.onclick = fund;
getBalanceButton.onclick = getBalance;
withdrawButton.onclick = withdraw;

async function connect() {
    if (typeof window.ethereum !== "undefined") {
        try {
            await ethereum.request({ method: "eth_requestAccounts" });
        } catch (err) {
            console.log(err);
        }
        connectButton.innerHTML = "Connected!";
        const accounts = await ethereum.request({ method: "eth_accounts" });
        console.log(accounts);
    } else {
        console.log("No metamask detected!");
        connectButton.innerHTML = "Please download metamask!";
    }
}

async function getBalance() {
    if (typeof window.ethereum !== "undefined") {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const balance = await provider.getBalance(contractAddress);
        console.log(ethers.utils.formatEther(balance));
    }
}

async function fund() {
    const ethAmount = document.getElementById("ethAmount").value;

    console.log(`We are funding ${ethAmount}`);
    if (typeof window.ethereum !== "undefined") {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(contractAddress, abi, signer);
        try {
            const txnResponse = await contract.fund({
                value: ethers.utils.parseEther(ethAmount),
            });
            // listen for the txn to be mined
            await listenForTxnMine(txnResponse, provider); // ***
            console.log("Done!");
            // listen for an event (which haven't been covered yet)
        } catch (err) {
            console.log(err);
        }
    }
}

async function withdraw() {
    if (typeof window.ethereum !== "undefined") {
        console.log("Withdrawing");
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(contractAddress, abi, signer);
        try {
            const txnResponse = await contract.withdraw();
            await listenForTxnMine(txnResponse, provider);
        } catch (err) {
            console.log(err);
        }
    }
}

function listenForTxnMine(txnResponse, provider) {
    console.log(`Mining in p[rogress for ${txnResponse.hash}`);
    // listen for this txn to finish
    return new /* *** */ Promise((res, rej) => {
        provider.once(
            txnResponse.hash,
            /*anonymous listener func*/ (txnReceipt) => {
                console.log(
                    `Txn completed with ${txnReceipt.confirmations} confirmations.`
                );
                res();
            }
        );
    });
}
