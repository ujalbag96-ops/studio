
'use client';

/**
 * Global Library API Service
 * Intercepts real-world book signals from OpenLibrary.org
 */
export async function fetchCollegeBooks(query = "college textbooks") {
  try {
    const response = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}`);
    const data = await response.json();
    
    // Map the results for the Global Vault UI grid
    return data.docs.slice(0, 20).map((book: any) => ({
      id: book.key.replace('/works/', ''),
      title: book.title,
      author: book.author_name ? book.author_name[0] : "Unknown Author",
      coverUrl: book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg` : "https://picsum.photos/seed/book/200/300",
      publishYear: book.first_publish_year || "N/A",
      source: 'OpenLibrary',
      subject: (book.subject && book.subject[0]) || 'Academic',
      class: 'Global Ed',
      lang: 'en'
    }));
  } catch (error) {
    console.error("Error fetching books from Open Library:", error);
    return [];
  }
}
