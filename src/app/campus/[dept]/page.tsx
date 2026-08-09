import { Suspense } from 'react';
import SubjectSelectionContent from '@/components/SubjectSelectionContent';

export function generateStaticParams() {
  return [
    { dept: 'class-10' },
    { dept: 'class-11' },
    { dept: 'class-12' },
    { dept: 'btech' }
  ];
}

export default function SubjectSelectionScreen() {
  return (
    <Suspense fallback={<div className="p-20 text-center uppercase font-black italic">Loading subjects...</div>}>
      <SubjectSelectionContent />
    </Suspense>
  );
}
