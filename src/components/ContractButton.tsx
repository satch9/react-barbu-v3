import { Contract } from "../backend/gameInterface";

type ContractButtonProps = {
    contract: Contract;
    onClick: () => void;
    contractIndex: number;
};

const ContractButton = ({ contract, onClick, contractIndex }: ContractButtonProps) => (
    <div className="contract" key={contractIndex}>
        <button className="contract-button" onClick={onClick}>
            {contract.name}
        </button>
    </div>
);

export default ContractButton;