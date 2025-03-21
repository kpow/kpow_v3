import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Loader2, Search, Plus, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BookForm } from "./BookForm";

// Book object interface matching our database schema
interface Author {
  id: number;
  name: string;
  imageUrl?: string;
}

interface Shelf {
  id: number;
  name: string;
}

interface Book {
  id: number;
  title: string;
  description?: string;
  imageUrl?: string;
  authors: Author[];
  shelves: Shelf[];
  userRating?: string;
  dateAdded?: string;
  dateRead?: string;
  goodreadsId?: string;
}

interface BookListResponse {
  books: Book[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export function BookManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<string>("id");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Fetch books with pagination, search, and sorting
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<BookListResponse>({
    queryKey: [
      "/api/admin/books",
      page,
      limit,
      search,
      sortField,
      sortDirection,
    ],
    queryFn: async () => {
      console.log(`Fetching books page ${page} with search: "${search}"`);
      let url = `/api/admin/books?page=${page}&limit=${limit}&sortField=${sortField}&sortDirection=${sortDirection}`;
      
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`${response.status}: ${await response.text()}`);
      }
      return response.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (bookId: number) => {
      const response = await fetch(`/api/admin/books/${bookId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error(`${response.status}: ${await response.text()}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/books"],
      });
      toast({
        title: "Book deleted",
        description: "The book has been deleted successfully.",
      });
      setIsDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to delete book",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset page when searching
    refetch();
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Default to descending for new field
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const handleEdit = (book: Book) => {
    setSelectedBook(book);
    setIsFormOpen(true);
  };

  const handleDelete = (book: Book) => {
    setSelectedBook(book);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedBook) {
      deleteMutation.mutate(selectedBook.id);
    }
  };

  const handleAddNew = () => {
    setSelectedBook(null);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedBook(null);
  };

  const handleFormSuccess = () => {
    queryClient.invalidateQueries({
      queryKey: ["/api/admin/books"],
    });
    setIsFormOpen(false);
    setSelectedBook(null);
  };

  const renderSortArrow = (field: string) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? " ↑" : " ↓";
  };

  const renderPagination = () => {
    if (!data) return null;

    const { page, totalPages } = data.pagination;
    const pageRange = [];

    // Always show first page, last page, current page, and one page before and after current
    const pagesToShow = new Set([1, page - 1, page, page + 1, totalPages]);
    // Remove invalid pages (less than 1 or greater than total)
    const validPages = Array.from(pagesToShow).filter(
      (p) => p >= 1 && p <= totalPages
    );
    // Sort the pages
    validPages.sort((a, b) => a - b);

    // Create pagination items with ellipses
    let prevPage = 0;
    for (const p of validPages) {
      if (p - prevPage > 1) {
        pageRange.push(
          <PaginationItem key={`ellipsis-${p}`}>
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
      pageRange.push(
        <PaginationItem key={p}>
          <Button 
            variant={p === page ? "default" : "outline"} 
            onClick={() => setPage(p)}
          >
            {p}
          </Button>
        </PaginationItem>
      );
      prevPage = p;
    }

    return (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setPage(page > 1 ? page - 1 : 1)}
              disabled={page <= 1}
            >
              <PaginationPrevious />
            </Button>
          </PaginationItem>
          {pageRange}
          <PaginationItem>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setPage(page < totalPages ? page + 1 : totalPages)}
              disabled={page >= totalPages}
            >
              <PaginationNext />
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4 text-destructive">
        <p className="font-bold">Error loading books</p>
        <p>{error instanceof Error ? error.message : "Unknown error"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Book Management</h2>
        <Button onClick={handleAddNew}>
          <Plus className="mr-2 h-4 w-4" />
          Add New Book
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <form
            className="flex space-x-2 mb-4"
            onSubmit={handleSearchSubmit}
          >
            <Input
              placeholder="Search books..."
              value={search}
              onChange={handleSearchChange}
              className="flex-1"
            />
            <Button type="submit">
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
          </form>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort("id")}
                  >
                    ID{renderSortArrow("id")}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort("title")}
                  >
                    Title{renderSortArrow("title")}
                  </TableHead>
                  <TableHead>Authors</TableHead>
                  <TableHead>Shelves</TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort("userRating")}
                  >
                    Rating{renderSortArrow("userRating")}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort("dateRead")}
                  >
                    Date Read{renderSortArrow("dateRead")}
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.books.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      No books found
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.books.map((book) => (
                    <TableRow key={book.id}>
                      <TableCell>{book.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {book.imageUrl && (
                            <img
                              src={book.imageUrl}
                              alt={book.title}
                              className="w-8 h-10 object-cover rounded"
                            />
                          )}
                          <span>{book.title}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {book.authors?.map(a => a.name).join(", ") || "N/A"}
                      </TableCell>
                      <TableCell>
                        {book.shelves?.map(s => s.name).join(", ") || "N/A"}
                      </TableCell>
                      <TableCell>{book.userRating || "N/A"}</TableCell>
                      <TableCell>
                        {book.dateRead
                          ? new Date(book.dateRead).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(book)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(book)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between items-center">
          <div>
            Showing {data?.books.length} of {data?.pagination.total} books
          </div>
          {renderPagination()}
        </CardFooter>
      </Card>

      {isFormOpen && (
        <BookForm
          book={selectedBook}
          isOpen={isFormOpen}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}

      <Dialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border rounded-lg shadow-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">Confirm Deletion</h2>
            <p>
              Are you sure you want to delete "
              <span className="font-medium">{selectedBook?.title}</span>"?
              This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={deleteMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </Button>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
}