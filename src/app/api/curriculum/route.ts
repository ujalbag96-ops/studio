
import { NextResponse } from 'next/server';

/**
 * Academic Global Vault API Node v4.0
 * Fully expanded to support major international boards and universal language signals.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const region = searchParams.get('region') || 'Global';
  const lang = searchParams.get('lang') || 'all';
  const source = searchParams.get('source');

  // --- INTERNAL REGIONAL DATABASE ---
  const INTERNAL_DATABASE = [
    // India Node - Odia
    { id: 'osepa-odia-10', title: 'ସାହିତ୍ୟ ସିନ୍ଧୁ (Odia Literature)', class: 'Class 10', subject: 'Language', source: 'OdiaMedium', lang: 'or', chapters: 14 },
    { id: 'osepa-math-10', title: 'ମାଧ୍ୟମିକ ଜ୍ୟାମିତି (Geometry)', class: 'Class 10', subject: 'Math', source: 'OdiaMedium', lang: 'or', chapters: 10 },
    
    // India Node - Hindi
    { id: 'ncert-hindi-9', title: 'क्षितिज (Kshitij Hindi)', class: 'Class 9', subject: 'Hindi', source: 'NCERT', lang: 'hi', chapters: 12 },
    { id: 'ncert-math-hi-10', title: 'गणित (Mathematics)', class: 'Class 10', subject: 'Math', source: 'NCERT', lang: 'hi', chapters: 15 },

    // India Node - English
    { id: 'ncert-math-10', title: 'Mathematics', class: 'Class 10', subject: 'Math', source: 'NCERT', lang: 'en', chapters: 15 },
    { id: 'ncert-sci-10', title: 'Science', class: 'Class 10', subject: 'Science', source: 'NCERT', lang: 'en', chapters: 12 },
    { id: 'cbse-math-12', title: 'Advanced Calculus', class: 'Class 12', subject: 'Math', source: 'CBSE', lang: 'en', chapters: 18 },
    { id: 'icse-hist-9', title: 'History & Civics', class: 'Class 9', subject: 'History', source: 'ICSE', lang: 'en', chapters: 10 },
    
    // Global Ed Node
    { id: 'openstax-phy-1', title: 'College Physics', class: 'Higher Ed', subject: 'Physics', source: 'OpenStax', lang: 'en', chapters: 22 },
    { id: 'openstax-bio-2', title: 'Biology 2e', class: 'Higher Ed', subject: 'Biology', source: 'OpenStax', lang: 'en', chapters: 18 },
    { id: 'cc-math-8', title: 'Algebra Foundations', class: 'Grade 8', subject: 'Math', source: 'CommonCore', lang: 'en', chapters: 12 },
    { id: 'uk-eng-ks3', title: 'English Literature', class: 'Key Stage 3', subject: 'English', source: 'UKNational', lang: 'en', chapters: 20 },
    
    // International Multi-Lang
    { id: 'es-math-1', title: 'Matemáticas Avanzadas', class: 'Univ', subject: 'Math', source: 'OpenStax', lang: 'es', chapters: 20 },
    { id: 'fr-hist-1', title: 'Histoire du Monde', class: 'Univ', subject: 'History', source: 'Cambridge', lang: 'fr', chapters: 15 },
    { id: 'de-eng-1', title: 'Engineering Grundlagen', class: 'Higher Ed', subject: 'Engineering', source: 'IB', lang: 'de', chapters: 25 },
    { id: 'bn-sahitya-1', title: 'সাহিত্য (Bengali Literature)', class: 'Class 12', subject: 'Language', source: 'CBSE', lang: 'bn', chapters: 10 },
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
