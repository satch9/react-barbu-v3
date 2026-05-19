import { Button } from '@/components/ui/button';
import { useGameContext } from '../utils/gameUtils';
import { Contract } from '../backend/gameInterface';

interface ContractListProps {
  contracts: Contract[];
  onContractClick: (contract: Contract) => void;
}

const ContractList = ({ contracts, onContractClick }: ContractListProps) => {
  const { GameState } = useGameContext();

  if (contracts.length === 0) {
    return (
      <p className="text-card/70 text-sm text-center py-4">
        Vous avez joué tous vos contrats.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 w-full px-2 py-2">
      {contracts.map((contract, index) => (
        <Button
          key={index}
          variant="outline"
          className={`bg-felt-dark/60 text-card text-sm rounded-lg border-card/30
            hover:bg-yellow-600/80 hover:text-white hover:border-transparent transition-colors h-auto py-3
            ${contract === GameState.gameState.currentContract?.contract
              ? 'ring-2 ring-yellow-400'
              : ''}`}
          onClick={() => onContractClick(contract)}
        >
          {contract.name}
        </Button>
      ))}
    </div>
  );
};

export default ContractList;