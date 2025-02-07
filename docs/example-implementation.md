```typescript
// App.tsx route changes
<Route path="/books/page/:page" component={Books} />
<Route path="/books" component={Books} /> // Default route

// Books.tsx changes
import { useRoute, Link } from "wouter";
import { useState, useEffect } from "react";

export const Books = () => {
  const [, params] = useRoute("/books/page/:page");
  const pageNumber = params?.page ? parseInt(params.page) : 1;
  
  // Fetch data based on pageNumber
  const { data, isLoading } = useQuery(
    ['books', pageNumber],
    () => fetchBooks(pageNumber)
  );

  // Pagination controls using Link
  return (
    <div>
      {/* Book list rendering */}
      <div className="pagination">
        {pageNumber > 1 && (
          <Link href={`/books/page/${pageNumber - 1}`}>Previous</Link>
        )}
        <Link href={`/books/page/${pageNumber + 1}`}>Next</Link>
      </div>
    </div>
  );
};
```

This implementation would:
1. Support URL patterns like `/books/page/2`
2. Extract page numbers from URL parameters
3. Use those parameters for data fetching
4. Update URL when navigating between pages
5. Allow bookmarking and sharing specific pages

Benefits:
- SEO friendly URLs
- Shareable links to specific pages
- Browser history integration
- Bookmarkable pages

Would you like me to proceed with the actual implementation?
