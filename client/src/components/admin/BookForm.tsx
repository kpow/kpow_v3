import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Author {
  id?: number;
  name: string;
  imageUrl?: string;
}

interface Shelf {
  id?: number;
  name: string;
}

interface Book {
  id: number;
  goodreadsId?: string;
  title: string;
  titleWithoutSeries?: string;
  description?: string;
  imageUrl?: string;
  link?: string;
  averageRating?: string;
  isbn?: string;
  isbn13?: string;
  pages?: number;
  publicationYear?: number;
  publisher?: string;
  language?: string;
  dateAdded?: string;
  dateRead?: string;
  userRating?: string;
  authors: Author[];
  shelves: Shelf[];
}

interface BookFormProps {
  book: Book | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Define the form schema
const bookFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  titleWithoutSeries: z.string().optional(),
  link: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  averageRating: z.string().optional(),
  isbn: z.string().optional(),
  isbn13: z.string().optional(),
  goodreadsId: z.string().optional(),
  pages: z.number().positive().optional().or(z.literal("")),
  publicationYear: z.number().positive().optional().or(z.literal("")),
  publisher: z.string().optional(),
  language: z.string().optional(),
  dateAdded: z.string().optional(),
  dateRead: z.string().optional(),
  userRating: z.string().optional(),
});

type BookFormValues = z.infer<typeof bookFormSchema>;

export function BookForm({ book, isOpen, onClose, onSuccess }: BookFormProps) {
  const { toast } = useToast();
  const [authors, setAuthors] = useState<Author[]>(book?.authors || []);
  const [shelves, setShelves] = useState<Shelf[]>(book?.shelves || []);
  const [newAuthor, setNewAuthor] = useState("");
  const [newShelf, setNewShelf] = useState("");

  // Fetch existing shelves and authors for dropdowns
  const { data: existingAuthors } = useQuery<Author[]>({
    queryKey: ["/api/admin/authors"],
    queryFn: async () => {
      const response = await fetch("/api/admin/authors");
      if (!response.ok) {
        throw new Error(`${response.status}: ${await response.text()}`);
      }
      return response.json();
    },
  });

  const { data: existingShelves } = useQuery<Shelf[]>({
    queryKey: ["/api/admin/shelves"],
    queryFn: async () => {
      const response = await fetch("/api/admin/shelves");
      if (!response.ok) {
        throw new Error(`${response.status}: ${await response.text()}`);
      }
      return response.json();
    },
  });

  // Initialize the form
  const form = useForm<BookFormValues>({
    resolver: zodResolver(bookFormSchema),
    defaultValues: book
      ? {
          title: book.title || "",
          description: book.description || "",
          imageUrl: book.imageUrl || "",
          titleWithoutSeries: book.titleWithoutSeries || "",
          link: book.link || "",
          averageRating: book.averageRating || "",
          isbn: book.isbn || "",
          isbn13: book.isbn13 || "",
          goodreadsId: book.goodreadsId || "",
          pages: book.pages || "",
          publicationYear: book.publicationYear || "",
          publisher: book.publisher || "",
          language: book.language || "",
          dateAdded: book.dateAdded ? new Date(book.dateAdded).toISOString().split("T")[0] : "",
          dateRead: book.dateRead ? new Date(book.dateRead).toISOString().split("T")[0] : "",
          userRating: book.userRating || "",
        }
      : {
          title: "",
          description: "",
          imageUrl: "",
          titleWithoutSeries: "",
          link: "",
          averageRating: "",
          isbn: "",
          isbn13: "",
          goodreadsId: "",
          pages: "",
          publicationYear: "",
          publisher: "",
          language: "",
          dateAdded: "",
          dateRead: "",
          userRating: "",
        },
  });

  // Fill authors and shelves on initial load
  useEffect(() => {
    if (book) {
      setAuthors(book.authors || []);
      setShelves(book.shelves || []);
    }
  }, [book]);

  // Handle form submission
  const saveMutation = useMutation({
    mutationFn: async (data: BookFormValues) => {
      const bookData = {
        ...data,
        authors,
        shelves,
      };

      const url = book
        ? `/api/admin/books/${book.id}`
        : "/api/admin/books";
      
      const response = await fetch(url, {
        method: book ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookData),
      });

      if (!response.ok) {
        throw new Error(`${response.status}: ${await response.text()}`);
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: book ? "Book updated" : "Book created",
        description: `The book has been ${book ? "updated" : "created"} successfully.`,
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: `Failed to ${book ? "update" : "create"} book`,
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: BookFormValues) => {
    saveMutation.mutate(values);
  };

  const addAuthor = () => {
    if (newAuthor.trim()) {
      setAuthors((prev) => [...prev, { name: newAuthor.trim() }]);
      setNewAuthor("");
    }
  };

  const removeAuthor = (index: number) => {
    setAuthors((prev) => prev.filter((_, i) => i !== index));
  };

  const addShelf = () => {
    if (newShelf.trim()) {
      setShelves((prev) => [...prev, { name: newShelf.trim() }]);
      setNewShelf("");
    }
  };

  const removeShelf = (index: number) => {
    setShelves((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAuthorSelect = (authorId: string) => {
    const selectedAuthor = existingAuthors?.find(a => a.id === parseInt(authorId));
    if (selectedAuthor && !authors.some(a => a.id === selectedAuthor.id)) {
      setAuthors(prev => [...prev, selectedAuthor]);
    }
  };

  const handleShelfSelect = (shelfId: string) => {
    const selectedShelf = existingShelves?.find(s => s.id === parseInt(shelfId));
    if (selectedShelf && !shelves.some(s => s.id === selectedShelf.id)) {
      setShelves(prev => [...prev, selectedShelf]);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-card border rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-xl font-semibold">
              {book ? "Edit Book" : "Add New Book"}
            </h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="p-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left column for basic info */}
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Book title" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="titleWithoutSeries"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title (without series)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Title without series info"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Book description"
                              className="h-32"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="imageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Image URL</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="https://example.com/image.jpg"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="userRating"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Your Rating</FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select a rating" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">Not rated</SelectItem>
                                <SelectItem value="1">1 star</SelectItem>
                                <SelectItem value="2">2 stars</SelectItem>
                                <SelectItem value="3">3 stars</SelectItem>
                                <SelectItem value="4">4 stars</SelectItem>
                                <SelectItem value="5">5 stars</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-2">
                      <FormLabel>Authors</FormLabel>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {authors.map((author, index) => (
                          <div
                            key={index}
                            className="bg-primary/10 rounded-md px-2 py-1 flex items-center gap-1"
                          >
                            <span>{author.name}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4"
                              onClick={() => removeAuthor(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Select onValueChange={handleAuthorSelect}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select from existing" />
                          </SelectTrigger>
                          <SelectContent>
                            {existingAuthors?.map((author) => (
                              <SelectItem
                                key={author.id}
                                value={author.id!.toString()}
                              >
                                {author.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="flex gap-2">
                          <Input
                            value={newAuthor}
                            onChange={(e) => setNewAuthor(e.target.value)}
                            placeholder="New author name"
                          />
                          <Button
                            type="button"
                            onClick={addAuthor}
                            disabled={!newAuthor.trim()}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <FormLabel>Shelves</FormLabel>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {shelves.map((shelf, index) => (
                          <div
                            key={index}
                            className="bg-primary/10 rounded-md px-2 py-1 flex items-center gap-1"
                          >
                            <span>{shelf.name}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4"
                              onClick={() => removeShelf(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Select onValueChange={handleShelfSelect}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select from existing" />
                          </SelectTrigger>
                          <SelectContent>
                            {existingShelves?.map((shelf) => (
                              <SelectItem
                                key={shelf.id}
                                value={shelf.id!.toString()}
                              >
                                {shelf.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="flex gap-2">
                          <Input
                            value={newShelf}
                            onChange={(e) => setNewShelf(e.target.value)}
                            placeholder="New shelf name"
                          />
                          <Button
                            type="button"
                            onClick={addShelf}
                            disabled={!newShelf.trim()}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right column for additional details */}
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="link"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Link</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Link to the book"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="publisher"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Publisher</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Publisher name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="pages"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Pages</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                placeholder="Number of pages"
                                onChange={(e) => {
                                  const value = e.target.value;
                                  field.onChange(value === "" ? "" : parseInt(value));
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="publicationYear"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Publication Year</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                placeholder="Year published"
                                onChange={(e) => {
                                  const value = e.target.value;
                                  field.onChange(value === "" ? "" : parseInt(value));
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="isbn"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ISBN</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="ISBN"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="isbn13"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ISBN13</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="ISBN13"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="language"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Language</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Book language"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="goodreadsId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Goodreads ID</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Goodreads ID"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="dateAdded"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date Added</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="date"
                                placeholder="Date added"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="dateRead"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date Read</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="date"
                                placeholder="Date read"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="averageRating"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Average Rating</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Average rating from Goodreads"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={saveMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={saveMutation.isPending}
                  >
                    {saveMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Book"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </Dialog>
  );
}