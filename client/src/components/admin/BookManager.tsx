import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BookForm } from "./BookForm";
import { 
  BookWithRelations,
  PaginatedResponse 
} from "@/lib/types";
import { Check, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";

export function BookManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [booksPerPage, setBooksPerPage] = useState(10);
  const [editingBook, setEditingBook] = useState<BookWithRelations | null>(null);
  const [isAddingBook, setIsAddingBook] = useState(false);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Fetch books with pagination and search
  const {
    data: booksData,
    isLoading,
    error,
  } = useQuery<PaginatedResponse<BookWithRelations>>({
    queryKey: ["admin-books", search, currentPage, booksPerPage, sortBy, sortOrder],
    queryFn: async () => {
      console.log("[Books Admin] Fetching books with search:", search, "page:", currentPage, "limit:", booksPerPage);
      const response = await axios.get("/api/admin/books", {
        params: {
          search,
          page: currentPage,
          limit: booksPerPage,
          sortBy,
          sortOrder,
        },
      });
      console.log("[Books Admin] Found", response.data.books.length, "books (total:", response.data.pagination.total, ")");
      return response.data;
    },
  });

  // Delete book mutation
  const deleteBookMutation = useMutation({
    mutationFn: async (bookId: number) => {
      setIsDeleting(bookId);
      return axios.delete(`/api/admin/books/${bookId}`);
    },
    onSuccess: () => {
      toast({
        title: "Book deleted",
        description: "The book has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-books"] });
    },
    onError: (error) => {
      console.error("Error deleting book:", error);
      toast({
        title: "Error",
        description: "Failed to delete the book. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsDeleting(null);
    },
  });

  // Handle deleting a book
  const handleDeleteBook = (bookId: number) => {
    if (window.confirm("Are you sure you want to delete this book?")) {
      deleteBookMutation.mutate(bookId);
    }
  };

  // Handle editing a book
  const handleEditBook = (book: BookWithRelations) => {
    setEditingBook(book);
  };

  // Handle adding a new book
  const handleAddBook = () => {
    setIsAddingBook(true);
  };

  // Handle book form submission success
  const handleBookSaved = () => {
    setEditingBook(null);
    setIsAddingBook(false);
    queryClient.invalidateQueries({ queryKey: ["admin-books"] });
  };

  // Handle change in sort
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  // Calculate pagination values
  const totalPages = booksData?.pagination.totalPages || 1;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Book Management</h2>
        <Dialog open={isAddingBook} onOpenChange={setIsAddingBook}>
          <DialogTrigger asChild>
            <Button onClick={handleAddBook}>
              <Plus className="mr-2 h-4 w-4" />
              Add Book
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Book</DialogTitle>
              <DialogDescription>
                Fill out the form below to add a new book to your collection.
              </DialogDescription>
            </DialogHeader>
            <BookForm onSaved={handleBookSaved} onCancel={() => setIsAddingBook(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="relative w-full max-w-sm">
          <Input
            type="text"
            placeholder="Search books..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10"
          />
          {search && (
            <button
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
              onClick={() => setSearch("")}
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Select
            value={booksPerPage.toString()}
            onValueChange={(value) => {
              setBooksPerPage(Number(value));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="10 per page" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 per page</SelectItem>
              <SelectItem value="10">10 per page</SelectItem>
              <SelectItem value="20">20 per page</SelectItem>
              <SelectItem value="50">50 per page</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-red-600">Failed to load books. Please try again.</p>
        </div>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className={`cursor-pointer ${sortBy === "id" ? "bg-muted/50" : ""}`}
                  onClick={() => handleSort("id")}
                >
                  ID
                  {sortBy === "id" && (
                    <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
                  )}
                </TableHead>
                <TableHead
                  className={`cursor-pointer ${sortBy === "title" ? "bg-muted/50" : ""}`}
                  onClick={() => handleSort("title")}
                >
                  Title
                  {sortBy === "title" && (
                    <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
                  )}
                </TableHead>
                <TableHead>Authors</TableHead>
                <TableHead
                  className={`cursor-pointer ${sortBy === "userRating" ? "bg-muted/50" : ""}`}
                  onClick={() => handleSort("userRating")}
                >
                  Rating
                  {sortBy === "userRating" && (
                    <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
                  )}
                </TableHead>
                <TableHead
                  className={`cursor-pointer ${sortBy === "dateAdded" ? "bg-muted/50" : ""}`}
                  onClick={() => handleSort("dateAdded")}
                >
                  Date Added
                  {sortBy === "dateAdded" && (
                    <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
                  )}
                </TableHead>
                <TableHead>Shelves</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6">
                    <div className="flex justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                    <p className="mt-2 text-sm text-gray-500">Loading books...</p>
                  </TableCell>
                </TableRow>
              ) : booksData?.books.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6">
                    <p className="text-muted-foreground">
                      {search 
                        ? "No books found matching your search." 
                        : "No books in your collection yet. Add one to get started!"}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                booksData?.books.map((book) => (
                  <TableRow key={book.id}>
                    <TableCell>{book.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {book.imageUrl && (
                          <img
                            src={book.imageUrl}
                            alt={book.title}
                            className="h-12 w-9 object-cover mr-3 rounded-sm"
                          />
                        )}
                        <span className="font-medium truncate max-w-[250px]" title={book.title}>
                          {book.title}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="truncate max-w-[150px] inline-block" title={book.authors?.map(a => a.name).join(", ")}>
                        {book.authors?.map(a => a.name).join(", ")}
                      </span>
                    </TableCell>
                    <TableCell>
                      {book.userRating ? (
                        <div className="flex items-center">
                          <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-medium">
                            {book.userRating}/5
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">--</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {book.dateAdded
                        ? new Date(book.dateAdded).toLocaleDateString()
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {book.shelves?.map((shelf) => (
                          <span
                            key={shelf.id}
                            className="inline-flex items-center bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                          >
                            {shelf.name}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Dialog open={editingBook?.id === book.id} onOpenChange={(open) => !open && setEditingBook(null)}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditBook(book)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Edit Book</DialogTitle>
                              <DialogDescription>
                                Update the details of your book.
                              </DialogDescription>
                            </DialogHeader>
                            {editingBook && (
                              <BookForm 
                                book={editingBook} 
                                onSaved={handleBookSaved} 
                                onCancel={() => setEditingBook(null)} 
                              />
                            )}
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteBook(book.id)}
                          disabled={isDeleting === book.id}
                        >
                          {isDeleting === book.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {booksData && booksData.pagination.total > 0 && (
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-muted-foreground">
            Showing{" "}
            <span className="font-medium">
              {(currentPage - 1) * booksPerPage + 1}
            </span>{" "}
            to{" "}
            <span className="font-medium">
              {Math.min(
                currentPage * booksPerPage,
                booksData.pagination.total
              )}
            </span>{" "}
            of{" "}
            <span className="font-medium">{booksData.pagination.total}</span>{" "}
            books
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}