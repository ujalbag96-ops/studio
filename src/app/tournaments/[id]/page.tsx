import TournamentContent from '@/components/TournamentContent';

export function generateStaticParams() {
  return [
    { id: 't1' },
    { id: 't2' }
  ];
}

export default function TournamentDetails() {
  return <TournamentContent />;
}
