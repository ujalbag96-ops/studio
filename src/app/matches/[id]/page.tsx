import MatchContent from '@/components/MatchContent';

export function generateStaticParams() {
  return [
    { id: 'm1' },
    { id: 'm2' }
  ];
}

export default function MatchPage() {
  return <MatchContent />;
}
