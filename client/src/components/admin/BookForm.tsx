import { useState, useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import { BookWithRelations } from "@/lib/types";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, X, AlertCircle, Check, Image as ImageIcon } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

// Form validation schema
const bookFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  isbn: z.string().optional(),
  isbn13: z.string().optional(),
  numPages: z.coerce.number().int().positive().optional(),
  publicationYear: z.coerce.number().int().positive().optional(),
  userRating: z.coerce.number().min(0).max(5).step(0.01).optional(),
  averageRating: z.coerce.number().min(0).max(5).step(0.01).optional(),
  dateRead: z.string().optional().or(z.literal("")),
  dateAdded: z.string().optional().or(z.literal("")),
  link: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  goodreadsId: z.string().optional(),
  authors: z.array(
    z.object({
      id: z.number().optional(),
      name: z.string().min(1, "Author name is required"),
      isNew: z.boolean().optional(),
    })
  ).min(1, "At least one author is required"),
  shelves: z.array(
    z.object({
      id: z.number().optional(),
      name: z.string().min(1, "Shelf name is required"),
      isNew: z.boolean().optional(),
    })
  ).optional(),
});

type BookFormValues = z.infer<typeof bookFormSchema>;

interface BookFormProps {
  book?: BookWithRelations;
  onSaved: () => void;
  onCancel: () => void;
}

export function BookForm({ book, onSaved, onCancel }: BookFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefiningImage, setIsRefiningImage] = useState(false);
  
  // Load authors and shelves for dropdowns
  const { data: authorsData, isLoading: authorsLoading } = useQuery({
    queryKey: ["authors"],
    queryFn: async () => {
      const response = await axios.get("/api/admin/authors");
      return response.data.authors;
    },
  });
  
  const { data: shelvesData, isLoading: shelvesLoading } = useQuery({
    queryKey: ["shelves"],
    queryFn: async () => {
      const response = await axios.get("/api/admin/shelves");
      return response.data.shelves;
    },
  });

  // Set up the form with default values
  const form = useForm<BookFormValues>({
    resolver: zodResolver(bookFormSchema),
    defaultValues: {
      title: book?.title || "",
      description: book?.description || "",
      imageUrl: book?.imageUrl || "",
      isbn: book?.isbn || "",
      isbn13: book?.isbn13 || "",
      numPages: book?.numPages || undefined,
      publicationYear: book?.publicationYear || undefined,
      userRating: book?.userRating || undefined,
      averageRating: book?.averageRating || undefined,
      dateRead: book?.dateRead ? new Date(book.dateRead).toISOString().split("T")[0] : "",
      dateAdded: book?.dateAdded ? new Date(book.dateAdded).toISOString().split("T")[0] : "",
      link: book?.link || "",
      goodreadsId: book?.goodreadsId || "",
      authors: book?.authors?.map(author => ({
        id: author.id,
        name: author.name,
        isNew: false,
      })) || [{ name: "", isNew: true }],
      shelves: book?.shelves?.map(shelf => ({
        id: shelf.id,
        name: shelf.name,
        isNew: false,
      })) || [],
    },
  });

  // Set up field arrays for authors and shelves
  const { fields: authorFields, append: appendAuthor, remove: removeAuthor } = 
    useFieldArray({ control: form.control, name: "authors" });
  
  const { fields: shelfFields, append: appendShelf, remove: removeShelf } = 
    useFieldArray({ control: form.control, name: "shelves" });

  // Create or update book mutation
  const bookMutation = useMutation({
    mutationFn: async (values: BookFormValues) => {
      setIsSubmitting(true);
      // Check if this is an existing book with a valid ID
      if (book && book.id) {
        // Update existing book
        return axios.put(`/api/admin/books/${book.id}`, values);
      } else {
        // Create new book
        return axios.post("/api/admin/books", values);
      }
    },
    onSuccess: () => {
      toast({
        title: book && book.id ? "Book updated" : "Book created",
        description: book && book.id
          ? "The book has been successfully updated." 
          : "The book has been successfully added to your collection.",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-books"] });
      onSaved();
    },
    onError: (error) => {
      console.error("Error saving book:", error);
      toast({
        title: "Error",
        description: `Failed to ${book && book.id ? "update" : "create"} the book. Please try again.`,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  // Refine book cover image mutation
  const refineImageMutation = useMutation({
    mutationFn: async (bookUrl: string) => {
      setIsRefiningImage(true);
      return axios.post("/api/admin/books/refine-cover", { bookUrl });
    },
    onSuccess: (response) => {
      const refinedImageUrl = response.data.imageUrl;
      
      // Update the image URL field in the form
      form.setValue("imageUrl", refinedImageUrl);
      
      toast({
        title: "Image Refined",
        description: "Successfully retrieved a high-quality book cover image.",
      });
    },
    onError: (error: any) => {
      console.error("Error refining image:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to refine book cover. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsRefiningImage(false);
    },
  });

  const handleRefineImage = () => {
    const bookUrl = form.getValues("link");
    
    if (!bookUrl) {
      toast({
        title: "Missing Book Link",
        description: "Please enter a Goodreads book link first to refine the cover image.",
        variant: "destructive",
      });
      return;
    }
    
    refineImageMutation.mutate(bookUrl);
  };

  async function onSubmit(values: BookFormValues) {
    bookMutation.mutate(values);
  }

  // Formatting helper for datepicker
  const formatDateForInput = (date: string | Date | undefined): string => {
    if (!date) return "";
    const d = new Date(date);
    return d.toISOString().split("T")[0];
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Title */}
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Title*</FormLabel>
                <FormControl>
                  <Input placeholder="Book title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Authors */}
          <div className="md:col-span-2">
            <div className="flex justify-between items-center mb-2">
              <FormLabel>Authors*</FormLabel>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendAuthor({ name: "", isNew: true })}
              >
                <Plus className="h-4 w-4 mr-1" /> Add Author
              </Button>
            </div>
            {authorFields.map((field, index) => (
              <div key={field.id} className="flex items-end gap-2 mb-2">
                <FormField
                  control={form.control}
                  name={`authors.${index}.name`}
                  render={({ field: authorField }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input
                          placeholder="Author name"
                          {...authorField}
                          list={`author-suggestions-${index}`}
                        />
                      </FormControl>
                      <datalist id={`author-suggestions-${index}`}>
                        {Array.isArray(authorsData) 
                          ? authorsData.map((author: any) => (
                              <option key={author.id} value={author.name} />
                            ))
                          : authorsData?.authors?.map((author: any) => (
                              <option key={author.id} value={author.name} />
                            ))}
                      </datalist>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {authorFields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAuthor(index)}
                    className="mb-1"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            {form.formState.errors.authors?.message && (
              <p className="text-sm font-medium text-destructive">
                {form.formState.errors.authors.message}
              </p>
            )}
          </div>

          {/* Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Book description" 
                    {...field}
                    className="min-h-[100px]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Image URL */}
          <FormField
            control={form.control}
            name="imageUrl"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <div className="flex justify-between">
                  <FormLabel>Image URL</FormLabel>
                  {field.value && (
                    <a 
                      href={field.value} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-500 hover:underline"
                    >
                      Preview
                    </a>
                  )}
                </div>
                <div className="flex space-x-2">
                  <FormControl className="flex-1">
                    <Input placeholder="https://example.com/book-cover.jpg" {...field} />
                  </FormControl>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleRefineImage}
                          disabled={isRefiningImage || !form.getValues("link")}
                          className="whitespace-nowrap"
                        >
                          {isRefiningImage ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <ImageIcon className="h-4 w-4 mr-1" />
                          )}
                          Refine Image
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Get high-quality cover image from Goodreads</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                {isRefiningImage && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Fetching high-quality image from Goodreads...
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          {/* ISBN */}
          <FormField
            control={form.control}
            name="isbn"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ISBN</FormLabel>
                <FormControl>
                  <Input placeholder="ISBN" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* ISBN-13 */}
          <FormField
            control={form.control}
            name="isbn13"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ISBN-13</FormLabel>
                <FormControl>
                  <Input placeholder="ISBN-13" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Number of Pages */}
          <FormField
            control={form.control}
            name="numPages"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Number of Pages</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Number of pages" 
                    {...field}
                    value={field.value || ""}
                    onChange={e => field.onChange(e.target.value === "" ? undefined : parseInt(e.target.value, 10))} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Publication Year */}
          <FormField
            control={form.control}
            name="publicationYear"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Publication Year</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="YYYY" 
                    {...field}
                    value={field.value || ""}
                    onChange={e => field.onChange(e.target.value === "" ? undefined : parseInt(e.target.value, 10))} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* User Rating */}
          <FormField
            control={form.control}
            name="userRating"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your Rating</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01" 
                    min="0" 
                    max="5"
                    placeholder="0-5" 
                    {...field}
                    value={field.value || ""}
                    onChange={e => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Average Rating */}
          <FormField
            control={form.control}
            name="averageRating"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Average Rating</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01" 
                    min="0" 
                    max="5"
                    placeholder="0-5" 
                    {...field}
                    value={field.value || ""}
                    onChange={e => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Date Read */}
          <FormField
            control={form.control}
            name="dateRead"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date Read</FormLabel>
                <FormControl>
                  <Input 
                    type="date"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Date Added */}
          <FormField
            control={form.control}
            name="dateAdded"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date Added</FormLabel>
                <FormControl>
                  <Input 
                    type="date"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Link */}
          <FormField
            control={form.control}
            name="link"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Link</FormLabel>
                <FormControl>
                  <Input placeholder="https://example.com/book" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Goodreads ID */}
          <FormField
            control={form.control}
            name="goodreadsId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Goodreads ID</FormLabel>
                <FormControl>
                  <Input placeholder="Goodreads ID" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Shelves */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <FormLabel>Shelves</FormLabel>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendShelf({ name: "", isNew: true })}
            >
              <Plus className="h-4 w-4 mr-1" /> Add Shelf
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {shelfFields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2 p-2 border rounded-md">
                <FormField
                  control={form.control}
                  name={`shelves.${index}.name`}
                  render={({ field: shelfField }) => (
                    <FormItem className="flex-1 space-y-0">
                      <FormControl>
                        <Input
                          placeholder="Shelf name"
                          {...shelfField}
                          list={`shelf-suggestions-${index}`}
                          className="h-8"
                        />
                      </FormControl>
                      <datalist id={`shelf-suggestions-${index}`}>
                        {Array.isArray(shelvesData) 
                          ? shelvesData.map((shelf: any) => (
                              <option key={shelf.id} value={shelf.name} />
                            ))
                          : shelvesData?.shelves?.map((shelf: any) => (
                              <option key={shelf.id} value={shelf.name} />
                            ))}
                      </datalist>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeShelf(index)}
                  className="px-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {book ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                {book ? "Update Book" : "Create Book"}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}