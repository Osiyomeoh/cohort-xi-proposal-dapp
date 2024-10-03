import { useAppKitAccount, useAppKitNetwork } from "@reown/appkit/react";
import { useCallback } from "react";
import { toast } from "react-toastify";
import { liskSepoliaNetwork } from "../connection";
import useContract from "./useContract";

const useVote = () => {
    const contract = useContract(true);
    const { address } = useAppKitAccount();
    const { chainId } = useAppKitNetwork();
    return useCallback(
        async (proposalId) => {
            if (
                !proposalId
              
            ) {
                toast.error("Proposal Id is required");
                return;
            }
            if (!address) {
                toast.error("Connect your wallet!");
                return;
            }
            if (Number(chainId) !== liskSepoliaNetwork.chainId) {
                toast.error("You are not connected to the right network");
                return;
            }

            if (!contract) {
                toast.error("Cannot get contract!");
                return;
            }

            try {
                const estimatedGas = await contract.vote.estimateGas(
                    proposalId
                );
                const tx = await contract.vote(
                   proposalId,
                   
                    {
                        gasLimit: (estimatedGas * BigInt(120)) / BigInt(100),
                    }
                );
                const reciept = await tx.wait();

                if (reciept.status === 1) {
                    toast.success("Vote successful");
                    return;
                }
                toast.error("Vote failed");
                return;
            } catch (error) {
                console.error("error while submitting your vote: ", error);
                toast.error("Vote errored");
            }
        },
        [address, chainId, contract]
    );
};

export default useVote;