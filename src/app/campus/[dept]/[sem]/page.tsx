import ChapterListContent from '@/components/ChapterListContent';

export function generateStaticParams() {
  return [
    { dept: 'class-10', sem: 'maths' },
    { dept: 'class-10', sem: 'science' },
    { dept: 'class-12', sem: 'physics' }
  ];
}

export default function ChapterListScreen() {
  return <ChapterListContent />;
}
