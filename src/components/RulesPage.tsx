import { Button } from '@/components/ui/button';

interface RulesPageProps {
  onBack: () => void;
}

const CONTRACTS = [
  { name: 'Le barbu', goal: 'Ne pas prendre le Roi ♥', points: '−70 pts' },
  { name: 'Pas de cœurs', goal: 'Ne pas prendre de cœurs', points: '−5 pts / cœur' },
  { name: 'Pas de plis', goal: 'Ne pas prendre de plis', points: '−5 pts / pli' },
  { name: 'Pas de dames', goal: 'Ne pas prendre de dames', points: '−15 pts / dame' },
  { name: 'Salade', goal: 'Cumuler les 4 contrats précédents', points: 'cumulatif' },
  { name: 'Réussite', goal: 'Vider sa main en premier', points: '+100 (1er) / +50 (2e)' },
];

const CARDS_32 = [
  { players: 2, removed: 'aucune', perPlayer: 16 },
  { players: 3, removed: '7, 8', perPlayer: 8 },
  { players: 4, removed: 'aucune', perPlayer: 8 },
];

const CARDS_52 = [
  { players: 2, removed: 'aucune', perPlayer: 26 },
  { players: 3, removed: 'les 2', perPlayer: 16 },
  { players: 4, removed: 'aucune', perPlayer: 13 },
  { players: 5, removed: 'les 2, 3, 4', perPlayer: 8 },
  { players: 6, removed: 'les 2', perPlayer: 8 },
  { players: 7, removed: 'les 2 à 7', perPlayer: 4 },
  { players: 8, removed: 'les 2', perPlayer: 6 },
];

const RulesPage = ({ onBack }: RulesPageProps) => (
  <div className="min-h-[100dvh] bg-felt-dark text-card p-6 max-w-2xl mx-auto">
    <Button
      variant="outline"
      className="mb-6 text-card border-card/30 hover:bg-card/10"
      onClick={onBack}
    >
      ← Retour
    </Button>

    <h1 className="text-3xl font-serif mb-6">Règles du Barbu</h1>

    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-3 text-yellow-400">Les 6 contrats</h2>
      <p className="text-card/70 text-sm mb-4">
        Chaque joueur annonce un contrat à tour de rôle. Le jeu se termine quand
        chaque joueur a annoncé chacun des 6 contrats une fois.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-card/20">
              <th className="text-left py-2 pr-4 text-card/60 font-medium">Contrat</th>
              <th className="text-left py-2 pr-4 text-card/60 font-medium">Objectif</th>
              <th className="text-left py-2 text-card/60 font-medium">Points</th>
            </tr>
          </thead>
          <tbody>
            {CONTRACTS.map(c => (
              <tr key={c.name} className="border-b border-card/10 hover:bg-card/5">
                <td className="py-2 pr-4 font-medium">{c.name}</td>
                <td className="py-2 pr-4 text-card/80">{c.goal}</td>
                <td className="py-2 text-yellow-400 whitespace-nowrap">{c.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>

    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-3 text-yellow-400">
        Distribution — 32 cartes (7 à As)
      </h2>
      <p className="text-card/70 text-sm mb-4">
        Retirer les séries indiquées (4 cartes, une par couleur) avant de distribuer.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-card/20">
              <th className="text-left py-2 pr-4 text-card/60 font-medium">Joueurs</th>
              <th className="text-left py-2 pr-4 text-card/60 font-medium">Séries à retirer</th>
              <th className="text-left py-2 text-card/60 font-medium">Cartes / joueur</th>
            </tr>
          </thead>
          <tbody>
            {CARDS_32.map(r => (
              <tr key={r.players} className="border-b border-card/10 hover:bg-card/5">
                <td className="py-2 pr-4 font-medium">{r.players}</td>
                <td className="py-2 pr-4 text-card/80">{r.removed}</td>
                <td className="py-2 text-yellow-400">{r.perPlayer}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>

    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-3 text-yellow-400">
        Distribution — 52 cartes (2 à As)
      </h2>
      <p className="text-card/70 text-sm mb-4">
        Retirer les séries indiquées (4 cartes, une par couleur) avant de distribuer.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-card/20">
              <th className="text-left py-2 pr-4 text-card/60 font-medium">Joueurs</th>
              <th className="text-left py-2 pr-4 text-card/60 font-medium">Séries à retirer</th>
              <th className="text-left py-2 text-card/60 font-medium">Cartes / joueur</th>
            </tr>
          </thead>
          <tbody>
            {CARDS_52.map(r => (
              <tr key={r.players} className="border-b border-card/10 hover:bg-card/5">
                <td className="py-2 pr-4 font-medium">{r.players}</td>
                <td className="py-2 pr-4 text-card/80">{r.removed}</td>
                <td className="py-2 text-yellow-400">{r.perPlayer}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  </div>
);

export default RulesPage;
