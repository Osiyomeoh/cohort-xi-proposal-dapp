
import { useAppKitAccount, useAppKitNetwork } from "@reown/appkit/react";
import { useCallback } from "react";
import { toast } from "react-toastify";
import { liskSepoliaNetwork } from "../connection";
import useContract from "./useContract";

const useExecuteProposal = () => {
    const contract = useContract(true);
    const { address } = useAppKitAccount();
    const { chainId } = useAppKitNetwork();
    return useCallback(
        async (proposalId) => {
            if (!proposalId) {
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
                const tx = await contract.executeProposal(proposalId);
                const receipt = await tx.wait();

                if (receipt.status === 1) {
                    toast.success("Proposal executed successfully");
                    return;
                }
                toast.error("Proposal execution failed");
                return;
            } catch (error) {
                console.error("error while executing the proposal: ", error);
                toast.error("Proposal execution errored");
            }
        },
        [address, chainId, contract]
    );
};

export default useExecuteProposal;