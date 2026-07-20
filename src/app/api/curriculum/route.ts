
import { NextResponse } from 'next/server';

/**
 * Academic Global Vault API Node
 * Dynamically serves book metadata based on geo_region and language signals.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const region = searchParams.get('region') || 'Global';
  const lang = searchParams.get('lang') || 'en';
  const source = searchParams.get('source') || (region === 'India' ? 'NCERT' : 'OpenStax');

  // Industrial Mock Data (Real implementation would connect to official NCERT/OpenStax API wrappers)
  const India_NCERT = [
    { id: 'mat-10', title: 'Mathematics', class: 'Class 10', subject: 'Math', source: 'NCERT', lang: 'en', chapters: 15 },
    { id: 'sci-10', title: 'Science', class: 'Class 10', subject: 'Science', source: 'NCERT', lang: 'en', chapters: 12 },
    { id: 'odia-lit-10', title: 'ସାହିତ୍ୟ (Odia)', class: 'Class 10', subject: 'Language', source: 'OdiaMedium', lang: 'or', chapters: 10 }
  ];

  const Global_OpenStax = [
    { id: 'phy-1', title: 'College Physics', class: 'Higher Ed', subject: 'Physics', source: 'OpenStax', lang: 'en', chapters: 22 },
    { id: 'bio-1', title: 'Biology 2e', class: 'Higher Ed', subject: 'Biology', source: 'OpenStax', lang: 'en', chapters: 18 },
    { id: 'math-span', title: 'Álgebra y Trigonometría', class: 'Higher Ed', subject: 'Math', source: 'OpenStax', lang: 'es', chapters: 14 }
  ];

  const responseData = region === 'India' ? India_NCERT : Global_OpenStax;
  
  // Filtering by language engine
  const filteredData = responseData.filter(book => book.lang === lang || lang === 'all');

  return NextResponse.json({
    success: true,
    region,
    detectedLang: lang,
    source,
    books: filteredData,
    timestamp: new Date().toISOString()
  });
}
