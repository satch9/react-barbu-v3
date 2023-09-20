import { useContext } from 'react'
import { GameContext } from '../context/GameContext';

const Ranking = () => {
    const { GameState } = useContext(GameContext);


    const ranking = GameState.gameState.ranking;

    console.log("ranking", ranking);
    return (
        <div className='ranking'>
            <table className='ranking-table'>
                <thead>
                    <tr>
                        <th>Position</th>
                        <th>Nom</th>
                        <th>Score</th>
                        <th>Contrats Choisis</th>
                    </tr>
                </thead>
                <tbody>
                    {ranking.map((player, index) => (
                        <tr key={player.uid}>
                            <td>{index + 1}</td>
                            <td>{player.name}</td>
                            <td>{player.score}</td>
                            <td>
                                <ul>
                                    {player.chosenContracts.map((contract, i) => (
                                        <li key={i}>{contract.contract.name}</li>
                                    ))}
                                </ul>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export default Ranking
