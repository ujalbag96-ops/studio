import { NextResponse } from 'next/server';

/**
 * Academic Global Vault API Node v4.1
 * Provides standard curriculum metadata for Indian and Global boards.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const region = searchParams.get('region') || 'Global';
  const lang = searchParams.get('lang') || 'all';
  const source = searchParams.get('source');

  const INTERNAL_DATABASE = [
    { id: 'ncert-math-10', title: 'Mathematics (NCERT)', class: 'Class 10', subject: 'Math', source: 'NCERT', lang: 'en', chapters: 15, coverUrl: 'https://picsum.photos/seed/math10/200/300' },
    { id: 'ncert-sci-10', title: 'Science (NCERT)', class: 'Class 10', subject: 'Science', source: 'NCERT', lang: 'en', chapters: 12, coverUrl: 'https://picsum.photos/seed/sci10/200/300' },
    { id: 'osepa-odia-10', title: 'ସାହିତ୍ୟ ସିନ୍ଧୁ (Odia)', class: 'Class 10', subject: 'Language', source: 'OdiaMedium', lang: 'or', chapters: 14, coverUrl: 'https://picsum.photos/seed/odia10/200/300' },
    { id: 'osepa-math-10', title: 'ମାଧ୍ୟମିକ ଜ୍ୟାମିତି (Math)', class: 'Class 10', subject: 'Math', source: 'OdiaMedium', lang: 'or', chapters: 10, coverUrl: 'https://picsum.photos/seed/oram10/200/300' },
    { id: 'ncert-math-hi-10', title: 'गणित Class 10', class: 'Class 10', subject: 'Math', source: 'NCERT', lang: 'hi', chapters: 15, coverUrl: 'https://picsum.photos/seed/mathhi10/200/300' },
    { id: 'ncert-sci-hi-10', title: 'विज्ञान Class 10', class: 'Class 10', subject: 'Science', source: 'NCERT', lang: 'hi', chapters: 12, coverUrl: 'https://picsum.photos/seed/scihi10/200/300' },
  ];

  let filteredData = INTERNAL_DATABASE;

  if (source && source !== 'all') {
    filteredData = filteredData.filter(book => book.source === source);
  }

  if (lang && lang !== 'all') {
    filteredData = filteredData.filter(book => book.lang === lang);
  }

  return NextResponse.json({
    success: true,
    region,
    source: source || 'Auto',
    lang: lang,
    books: filteredData,
    timestamp: new Date().toISOString()
  });
}
