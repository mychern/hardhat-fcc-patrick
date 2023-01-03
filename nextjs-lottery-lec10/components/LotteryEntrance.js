import { abi, contractAddresses } from "../constants";
import { useMoralis, useWeb3Contract, isLoading, isFetching } from "react-moralis";
import { useNotification } from "web3uikit";
import { useEffect, useState } from "react";
import { ethers } from "ethers";

export default function LotteryEntrance() {
    // The chainId is propogated all the way up to the moralis, which is why we can
    // get it by using useMoralis(). The chainId returned here would be hex-encrypted, though,
    // so we need to decode it.
    const { isWeb3Enabled, chainId: chainIdHex } = useMoralis();
    const chainId = parseInt(chainIdHex);
    const raffleAddress = chainId in contractAddresses ? contractAddresses[chainId][0] : null;
    // setEntranceFee is the variable used to set the value of entranceFee
    // entranceFee is our variable to be used just like before.
    const [entranceFee, setEntranceFee] = useState(/*startingVal=*/ "0");
    const [numPlayers, setNumPlayers] = useState("0");
    const [recentWinner, setRecentWinner] = useState("0");

    const dispatch = useNotification();

    const { runContractFunction: enterRaffle } = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress,
        functionName: "enterRaffle",
        msgValue: entranceFee,
        params: {},
    });
    const { runContractFunction: getEntranceFee } = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress, // specify the networkId
        functionName: "getEntranceFee",
        params: {},
    });
    const { runContractFunction: getNumberofPlayers } = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress, // specify the networkId
        functionName: "getNumberOfPlayers",
        params: {},
    });
    const { runContractFunction: getRecentWinner } = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress, // specify the networkId
        functionName: "getRecentWinner",
        params: {},
    });

    async function updateUI() {
        const entranceFeeFromCall = (await getEntranceFee()).toString();
        const numPlayersFromCall = (await getNumberofPlayers()).toString();
        const recentWinnerFromCall = await getRecentWinner();
        setEntranceFee(entranceFeeFromCall);
        setNumPlayers(numPlayersFromCall);
        setRecentWinner(recentWinnerFromCall);
    }

    useEffect(() => {
        if (isWeb3Enabled) {
            updateUI();
        }
    }, [isWeb3Enabled]);

    const handleSuccess = async (txn) => {
        await txn.wait(1);
        handleNewNotifictaion(txn);
        updateUI();
    };
    const handleNewNotifictaion = () => {
        dispatch({
            type: "info",
            message: "Transaction Complete!",
            title: "txn notification",
            position: "topR",
            icon: "bell",
        });
    };

    return (
        <div>
            Hi from lottery entrance!
            {raffleAddress ? (
                <div>
                    <button
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ml-auto"
                        onClick={async () => {
                            await enterRaffle({
                                onSuccess: handleSuccess,
                                onError: (err) => console.log(err),
                            });
                        }}
                        disabled={isLoading || isFetching}
                    >
                        {isLoading || isFetching ? (
                            <div className="animate-spin spinner-border h-8"></div>
                        ) : (
                            <div>Enter Raffle</div>
                        )}
                    </button>
                    <div>
                        Entrance Fee is: {ethers.utils.formatUnits(entranceFee, "ether")} ETH
                    </div>
                    <div>The current number of players is: {numPlayers}</div>
                    <div>The recent winner is: {recentWinner}</div>
                </div>
            ) : (
                <div>No Raffle Address Detected</div>
            )}
        </div>
    );
}
