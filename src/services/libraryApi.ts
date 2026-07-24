'use client';

/**
 * Global Library API Service
 * Intercepts real-world book signals from OpenLibrary.org
 */
export async function fetchCollegeBooks(query = "science textbooks") {
  try {
    const response = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=20`);
    const data = await response.json();
    
    // Industrial Presence Check: Prevent 'slice' of undefined errors
    if (!data || !data.docs || !Array.isArray(data.docs)) {
      console.warn("OpenLibrary Signal: No document array detected. Returning fallback cluster.");
      return [];
    }

    return data.docs.map((book: any) => ({
      id: book.key.replace('/works/', ''),
      title: book.title,
      author: book.author_name ? book.author_name[0] : "Academic Intelligence",
      coverUrl: book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg` : null,
      publishYear: book.first_publish_year || "Standard",
      source: 'OpenLibrary',
      subject: (book.subject && book.subject[0]) || 'Curriculum',
      class: 'Global Node',
      lang: 'en'
    }));
  } catch (error) {
    console.error("Library Signal Lost: OpenLibrary API unreachable", error);
    return [];
  }
}
