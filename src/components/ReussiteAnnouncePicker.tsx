import { Button } from '@/components/ui/button';

const VALUES_52 = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const VALUES_32 = ['7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

interface ReussiteAnnouncePickerProps {
  deckSize: 32 | 52;
  onAnnounce: (value: string) => void;
}

const ReussiteAnnouncePicker = ({ deckSize, onAnnounce }: ReussiteAnnouncePickerProps) => {
  const values = deckSize === 32 ? VALUES_32 : VALUES_52;
  const cols = deckSize === 32 ? 'grid-cols-4' : 'grid-cols-7';

  return (
    <div className="bg-felt-dark/70 rounded-xl p-3 mx-2 my-2 flex flex-col gap-2 shrink-0">
      <p className="text-card text-sm font-semibold text-center">
        Annonce la valeur de départ
      </p>
      <div className={`grid ${cols} gap-2`}>
        {values.map(v => (
          <Button
            key={v}
            variant="outline"
            className="bg-felt-dark/60 text-card text-base font-bold rounded-md border-card/30 hover:bg-yellow-600/80 hover:text-white hover:border-transparent transition-colors h-10 px-0"
            onClick={() => onAnnounce(v)}
          >
            {v}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default ReussiteAnnouncePicker;
