
import { NextResponse } from 'next/server';

/**
 * Academic Global Vault API Node v3.0
 * Fully expanded to support major international boards and OpenLibrary live signals.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const region = searchParams.get('region') || 'Global';
  const lang = searchParams.get('lang') || 'en';
  const source = searchParams.get('source');
  const query = searchParams.get('q');

  // --- INTERNAL REGIONAL DATABASE ---
  const INTERNAL_DATABASE = [
    // India Node
    { id: 'ncert-math-10', title: 'Mathematics', class: 'Class 10', subject: 'Math', source: 'NCERT', lang: 'en', chapters: 15 },
    { id: 'ncert-sci-10', title: 'Science', class: 'Class 10', subject: 'Science', source: 'NCERT', lang: 'en', chapters: 12 },
    { id: 'cbse-math-12', title: 'Advanced Calculus', class: 'Class 12', subject: 'Math', source: 'CBSE', lang: 'en', chapters: 18 },
    { id: 'icse-hist-9', title: 'History & Civics', class: 'Class 9', subject: 'History', source: 'ICSE', lang: 'en', chapters: 10 },
    { id: 'osepa-odia-10', title: 'ସାହିତ୍ୟ ସିନ୍ଧୁ (Odia)', class: 'Class 10', subject: 'Language', source: 'OdiaMedium', lang: 'or', chapters: 14 },
    
    // Global Ed Node
    { id: 'openstax-phy-1', title: 'College Physics', class: 'Higher Ed', subject: 'Physics', source: 'OpenStax', lang: 'en', chapters: 22 },
    { id: 'openstax-bio-2', title: 'Biology 2e', class: 'Higher Ed', subject: 'Biology', source: 'OpenStax', lang: 'en', chapters: 18 },
    { id: 'cc-math-8', title: 'Algebra Foundations', class: 'Grade 8', subject: 'Math', source: 'CommonCore', lang: 'en', chapters: 12 },
    { id: 'uk-eng-ks3', title: 'English Literature', class: 'Key Stage 3', subject: 'English', source: 'UKNational', lang: 'en', chapters: 20 },
    
    // Elite International Nodes
    { id: 'ib-dp-math', title: 'IB Mathematics Analysis', class: 'DP 1/2', subject: 'Math', source: 'IB', lang: 'en', chapters: 25 },
    { id: 'cam-igcse-sci', title: 'IGCSE Combined Science', class: 'Grade 10', subject: 'Science', source: 'Cambridge', lang: 'en', chapters: 30 },
  ];

  // Logic: If source is 'OpenLibrary', we handle it on the client side usually,
  // but we can proxy it here or just return a signal.
  // For IDX simulation, we use the internal DB unless specifically requested.

  let filteredData = INTERNAL_DATABASE;

  if (source === 'OpenLibrary') {
    // In a real build, we'd call OpenLibrary API here.
    // For this route, we'll return an empty array signaling the client to use the service.
    return NextResponse.json({
      success: true,
      useExternalService: true,
      books: []
    });
  }

  if (source && source !== 'all' && source !== 'null' && source !== 'undefined') {
    filteredData = filteredData.filter(book => book.source === source);
  } else {
    if (region === 'India') {
      filteredData = filteredData.filter(book => ['NCERT', 'CBSE', 'ICSE', 'OdiaMedium'].includes(book.source as string));
    } else {
      filteredData = filteredData.filter(book => ['OpenStax', 'CommonCore', 'UKNational', 'IB', 'Cambridge'].includes(book.source as string));
    }
  }

  // Language filter
  if (lang !== 'all' && lang !== 'en') { // Default en usually matches most
    filteredData = filteredData.filter(book => book.lang === lang);
  }

  return NextResponse.json({
    success: true,
    region,
    source: source || 'Auto-Detected',
    books: filteredData,
    timestamp: new Date().toISOString()
  });
}
