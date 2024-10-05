import { Box } from "@radix-ui/themes";
import CreateProposalModal from "./components/CreateProposalModal";
import Proposals from "./components/Proposals";
import useContract from "./hooks/useContract";
import { useCallback, useEffect, useState } from "react";
import { Contract } from "ethers";
import useRunners from "./hooks/useRunners";
import { Interface } from "ethers";
import ABI from "./ABI/proposal.json";
import Layout from "./components/Layout"

const multicallAbi = [
    "function tryAggregate(bool requireSuccess, (address target, bytes callData)[] calls) returns ((bool success, bytes returnData)[] returnData)",
];

function App() {
    const readOnlyProposalContract = useContract(true);
    const { readOnlyProvider } = useRunners();
    const [proposals, setProposals] = useState([]);

    const fetchProposals = useCallback(async () => {
        if (!readOnlyProposalContract) return;

        const multicallContract = new Contract(
            import.meta.env.VITE_MULTICALL_ADDRESS,
            multicallAbi,
            readOnlyProvider
        );

        const itf = new Interface(ABI);

        try {
            const proposalCount = Number(
                await readOnlyProposalContract.proposalCount()
            );

            const proposalsIds = Array.from(
                { length: proposalCount },
                (_, i) => i + 1
            );

            const calls = proposalsIds.map((id) => ({
                target: import.meta.env.VITE_CONTRACT_ADDRESS,
                callData: itf.encodeFunctionData("proposals", [id]),
            }));

            const responses = await multicallContract.tryAggregate.staticCall(
                true,
                calls
            );

            const decodedResults = responses.map((res) =>
                itf.decodeFunctionResult("proposals", res.returnData)
            );

            const data = decodedResults.map((proposalStruct, i) => ({
                proposalId: i + 1,
                description: proposalStruct.description,
                amount: proposalStruct.amount,
                minRequiredVote: proposalStruct.minVotesToPass,
                votecount: proposalStruct.voteCount,
                deadline: proposalStruct.votingDeadline,
                executed: proposalStruct.executed,
            }));

            setProposals(data);
        } catch (error) {
            console.log("error fetching proposals: ", error);
        }
    }, [readOnlyProposalContract, readOnlyProvider]);

    const onProposalCreated = (proposalId, description, recipient, amount, votingDeadline, minVotesToPass) => {

        setProposals((prevProposals) => [
            ...prevProposals,
            {
                proposalId,
                description: description,
                amount: amount,
                minRequiredVote: minVotesToPass,
                votecount: 0,
                deadline: votingDeadline,
                executed: false,
            }
        ])
       
       
    };
    const onVoted = (proposalId, voter) => {
    setProposals((prevProposals) => prevProposals.map((proposal) => {
        if (Number(proposal.proposalId) === Number(proposalId) ) {
            return {
                ...proposal,
                votecount: Number(proposal.votecount + 1),
            };
        }
        return proposal;
    }))       
    };

    useEffect(() => {
        if(!readOnlyProposalContract) return;
        readOnlyProposalContract.on("ProposalCreated", onProposalCreated);
        readOnlyProposalContract.on("Voted", onVoted);
        fetchProposals();

        return () => {
           readOnlyProposalContract.removeListener("ProposalCreated", onProposalCreated)
           readOnlyProposalContract.removeListener("Voted", onVoted)
        }
    }, [fetchProposals]);

    return (
        <Layout>
            <Box className="flex justify-end p-4">
                <CreateProposalModal />
            </Box>
            <Proposals proposals={proposals} />
        </Layout>
    );
}

export default App;