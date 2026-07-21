
import { NextResponse } from 'next/server';

/**
 * Academic Global Vault API Node v2.0
 * Fully expanded to support major international boards.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const region = searchParams.get('region') || 'Global';
  const lang = searchParams.get('lang') || 'en';
  const source = searchParams.get('source');

  const GLOBAL_DATABASE = [
    // --- India Node ---
    { id: 'ncert-math-10', title: 'Mathematics', class: 'Class 10', subject: 'Math', source: 'NCERT', lang: 'en', chapters: 15 },
    { id: 'ncert-sci-10', title: 'Science', class: 'Class 10', subject: 'Science', source: 'NCERT', lang: 'en', chapters: 12 },
    { id: 'cbse-math-12', title: 'Advanced Calculus', class: 'Class 12', subject: 'Math', source: 'CBSE', lang: 'en', chapters: 18 },
    { id: 'icse-hist-9', title: 'History & Civics', class: 'Class 9', subject: 'History', source: 'ICSE', lang: 'en', chapters: 10 },
    { id: 'osepa-odia-10', title: 'ସାହିତ୍ୟ ସିନ୍ଧୁ (Odia)', class: 'Class 10', subject: 'Language', source: 'OdiaMedium', lang: 'or', chapters: 14 },
    
    // --- Global Node ---
    { id: 'openstax-phy-1', title: 'College Physics', class: 'Higher Ed', subject: 'Physics', source: 'OpenStax', lang: 'en', chapters: 22 },
    { id: 'openstax-bio-2', title: 'Biology 2e', class: 'Higher Ed', subject: 'Biology', source: 'OpenStax', lang: 'en', chapters: 18 },
    { id: 'cc-math-8', title: 'Algebra Foundations', class: 'Grade 8', subject: 'Math', source: 'CommonCore', lang: 'en', chapters: 12 },
    { id: 'uk-eng-ks3', title: 'English Literature', class: 'Key Stage 3', subject: 'English', source: 'UKNational', lang: 'en', chapters: 20 },
    
    // --- Elite International Nodes ---
    { id: 'ib-dp-math', title: 'IB Mathematics Analysis', class: 'DP 1/2', subject: 'Math', source: 'IB', lang: 'en', chapters: 25 },
    { id: 'cam-igcse-sci', title: 'IGCSE Combined Science', class: 'Grade 10', subject: 'Science', source: 'Cambridge', lang: 'en', chapters: 30 },
    { id: 'es-math-1', title: 'Álgebra y Trigonometría', class: 'Secundaria', subject: 'Math', source: 'OpenStax', lang: 'es', chapters: 14 }
  ];

  // Logic: If source is selected, filter by source. Else filter by region-appropriate defaults.
  let filteredData = GLOBAL_DATABASE;

  if (source && source !== 'null' && source !== 'undefined') {
    filteredData = filteredData.filter(book => book.source === source);
  } else {
    // Automatic redirection logic based on region if no source explicitly requested
    if (region === 'India') {
      filteredData = filteredData.filter(book => ['NCERT', 'CBSE', 'ICSE', 'OdiaMedium'].includes(book.source));
    } else {
      filteredData = filteredData.filter(book => ['OpenStax', 'CommonCore', 'UKNational', 'IB', 'Cambridge'].includes(book.source));
    }
  }

  // Final language filter
  if (lang !== 'all') {
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
