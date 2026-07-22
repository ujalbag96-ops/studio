
import { NextResponse } from 'next/server';

/**
 * Academic Global Vault API Node v4.1
 * Industrial database ensuring hgh-availability of book signals.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const region = searchParams.get('region') || 'Global';
  const lang = searchParams.get('lang') || 'all';
  const source = searchParams.get('source');

  // --- INTERNAL REGIONAL DATABASE ---
  const INTERNAL_DATABASE = [
    // India Node - Odia
    { id: 'osepa-odia-10', title: 'ସାହିତ୍ୟ ସିନ୍ଧୁ (Odia Literature)', class: 'Class 10', subject: 'Language', source: 'OdiaMedium', lang: 'or', chapters: 14, coverUrl: 'https://picsum.photos/seed/or10/200/300' },
    { id: 'osepa-math-10', title: 'ମାଧ୍ୟମିକ ଜ୍ୟାମିତି (Geometry)', class: 'Class 10', subject: 'Math', source: 'OdiaMedium', lang: 'or', chapters: 10, coverUrl: 'https://picsum.photos/seed/orm10/200/300' },
    { id: 'osepa-sci-9', title: 'ବିଜ୍ଞାନ (Science)', class: 'Class 9', subject: 'Science', source: 'OdiaMedium', lang: 'or', chapters: 12, coverUrl: 'https://picsum.photos/seed/ors9/200/300' },
    
    // India Node - Hindi
    { id: 'ncert-hindi-9', title: 'क्षितिज (Kshitij Hindi)', class: 'Class 9', subject: 'Hindi', source: 'NCERT', lang: 'hi', chapters: 12, coverUrl: 'https://picsum.photos/seed/hi9/200/300' },
    { id: 'ncert-math-hi-10', title: 'गणित (Mathematics)', class: 'Class 10', subject: 'Math', source: 'NCERT', lang: 'hi', chapters: 15, coverUrl: 'https://picsum.photos/seed/him10/200/300' },

    // India Node - English
    { id: 'ncert-math-10', title: 'Mathematics', class: 'Class 10', subject: 'Math', source: 'NCERT', lang: 'en', chapters: 15, coverUrl: 'https://picsum.photos/seed/enm10/200/300' },
    { id: 'ncert-sci-10', title: 'Science', class: 'Class 10', subject: 'Science', source: 'NCERT', lang: 'en', chapters: 12, coverUrl: 'https://picsum.photos/seed/ens10/200/300' },
    { id: 'cbse-math-12', title: 'Advanced Calculus', class: 'Class 12', subject: 'Math', source: 'CBSE', lang: 'en', chapters: 18, coverUrl: 'https://picsum.photos/seed/enm12/200/300' },
    
    // Global Ed Node
    { id: 'openstax-phy-1', title: 'College Physics', class: 'Higher Ed', subject: 'Physics', source: 'OpenStax', lang: 'en', chapters: 22, coverUrl: 'https://picsum.photos/seed/phy1/200/300' },
    { id: 'openstax-bio-2', title: 'Biology 2e', class: 'Higher Ed', subject: 'Biology', source: 'OpenStax', lang: 'en', chapters: 18, coverUrl: 'https://picsum.photos/seed/bio2/200/300' },
  ];

  let filteredData = INTERNAL_DATABASE;

  if (source === 'OpenLibrary') {
    return NextResponse.json({
      success: true,
      useExternalService: true,
      books: []
    });
  }

  // Filter by source if specified
  if (source && source !== 'all' && source !== 'null' && source !== 'undefined') {
    filteredData = filteredData.filter(book => book.source === source);
  }

  // Filter by language if not 'all'
  if (lang !== 'all') {
    filteredData = filteredData.filter(book => book.lang === lang);
  }

  return NextResponse.json({
    success: true,
    region,
    source: source || 'Auto-Detected',
    lang: lang,
    books: filteredData,
    timestamp: new Date().toISOString()
  });
}
