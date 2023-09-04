import { useGameContext } from '../utils/gameUtils';
import { Contract } from '../backend/gameInterface';

interface ContractListProps {
    contracts: Contract[];
    onContractClick: (contract: Contract) => void;
}

const ContractList = ({ contracts, onContractClick }: ContractListProps) => {
    const { GameState } = useGameContext();

    return (
        <div className="contract-list">
            {contracts.map((contract, index) => (
                <div
                    key={index}
                    className={`contract ${contract === GameState.gameState.currentContract?.contract ? 'active' : ''}`}
                    onClick={() => onContractClick(contract)}
                >
                    {contract.name}
                </div>
            ))}
        </div>
    );
};

export default ContractList;