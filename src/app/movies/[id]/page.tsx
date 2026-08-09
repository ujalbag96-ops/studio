import MoviePlayerContent from '@/components/MoviePlayerContent';

export function generateStaticParams() {
  return [
    { id: 'movie-1' },
    { id: 'movie-2' }
  ];
}

export default function MoviePlayerPage() {
  return <MoviePlayerContent />;
}
