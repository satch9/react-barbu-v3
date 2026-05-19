import { Player, ChosenContract } from '../backend/gameInterface';

export function getLiveHandScore(
  player: Player,
  contract: ChosenContract | null,
  numPlayers: number,
): number | null {
  if (!contract) return null;
  const cards = player.myFoldsDuringTurn;
  const name = contract.contract.name;

  if (name === 'Pas de coeurs') {
    return cards.filter(c => c.suit === '♥').length * -5;
  }
  if (name === 'Pas de dames') {
    return cards.filter(c => c.value === 'Q').length * -15;
  }
  if (name === 'Pas de plis') {
    return Math.floor(cards.length / numPlayers) * -5;
  }
  if (name === 'Le barbu') {
    return cards.some(c => c.suit === '♥' && c.value === 'K') ? -70 : 0;
  }
  if (name === 'Salade') {
    const hearts = cards.filter(c => c.suit === '♥').length * -5;
    const queens = cards.filter(c => c.value === 'Q').length * -15;
    const tricks = Math.floor(cards.length / numPlayers) * -5;
    const barbu = cards.some(c => c.suit === '♥' && c.value === 'K') ? -70 : 0;
    return hearts + queens + tricks + barbu;
  }
  return null;
}

export function formatLiveScore(score: number | null): string | null {
  if (score === null || score === 0) return null;
  if (score > 0) return `+${score}`;
  return `${score}`;
}

export function liveScoreColor(score: number | null): string {
  if (score === null || score === 0) return 'text-card/50';
  return score > 0 ? 'text-green-400' : 'text-red-400';
}
