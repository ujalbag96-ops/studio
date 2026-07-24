'use client';

/**
 * Global Library API Service
 * Intercepts real-world book signals from OpenLibrary.org
 */
export async function fetchCollegeBooks(query = "university textbooks") {
  try {
    // Increase limit to 20 for broader node discovery
    const response = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=20`);
    const data = await response.json();
    
    // Industrial Presence Check: Prevent 'slice' of undefined errors
    if (!data || !data.docs || !Array.isArray(data.docs)) {
      console.warn("OpenLibrary Signal: No document array detected. Returning fallback cluster.");
      return [];
    }

    return data.docs.map((book: any) => {
      // Stream Mapping Logic
      let category = 'University Core';
      const title = book.title.toLowerCase();
      
      if (title.includes('engine') || title.includes('computer') || title.includes('algo')) category = 'Engineering';
      else if (title.includes('med') || title.includes('anatom') || title.includes('physio')) category = 'Medical';
      else if (title.includes('business') || title.includes('account') || title.includes('finan')) category = 'Commerce';
      else if (title.includes('art') || title.includes('hist') || title.includes('paint')) category = 'Arts';
      else if (title.includes('physic') || title.includes('chem') || title.includes('bio')) category = 'Science';

      return {
        id: book.key.replace('/works/', ''),
        title: book.title,
        author: book.author_name ? book.author_name[0] : "Academic Intelligence",
        coverUrl: book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg` : null,
        publishYear: book.first_publish_year || "Standard",
        source: 'OpenLibrary',
        subject: category,
        class: 'Global University Node',
        lang: 'en'
      };
    });
  } catch (error) {
    console.error("Library Signal Lost: OpenLibrary API unreachable", error);
    return [];
  }
}