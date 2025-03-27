import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { BookWithRelations } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, BookUp, AlertCircle, Check } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BookForm } from "./BookForm";

interface BookImporterProps {
  onImported: () => void;
  onCancel: () => void;
}

export function BookImporter({ onImported, onCancel }: BookImporterProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [goodreadsUrl, setGoodreadsUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importedData, setImportedData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"url" | "review" | "edit">("url");

  // Handle the import process
  const handleImport = async () => {
    if (!goodreadsUrl) {
      setError("Please enter a Goodreads book URL");
      return;
    }

    setError(null);
    setIsImporting(true);

    try {
      const response = await axios.post("/api/admin/books/import-from-goodreads", {
        goodreadsUrl
      });

      if (response.data.success) {
        setImportedData(response.data);
        setStep("review");
        toast({
          title: "Book data imported",
          description: `Successfully imported "${response.data.book.title}"`,
        });
      } else {
        setError(response.data.message || "Failed to import book data");
      }
    } catch (err: any) {
      console.error("Import error:", err);
      setError(
        err.response?.data?.message || 
        err.response?.data?.error || 
        "Failed to import book data from Goodreads"
      );
    } finally {
      setIsImporting(false);
    }
  };

  // Move to edit step with form
  const handleProceedToEdit = () => {
    setStep("edit");
  };

  // Format the imported data for the form
  const getFormattedBookData = (): BookWithRelations => {
    if (!importedData) {
      return {} as BookWithRelations;
    }

    return {
      ...importedData.book,
      authors: importedData.authors || [],
      shelves: importedData.shelves || [],
    } as BookWithRelations;
  };

  // Reset the importer
  const handleReset = () => {
    setGoodreadsUrl("");
    setImportedData(null);
    setError(null);
    setStep("url");
  };

  return (
    <div className="space-y-6">
      {step === "url" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="goodreads-url">Goodreads Book URL</Label>
            <div className="flex space-x-2">
              <Input
                id="goodreads-url"
                value={goodreadsUrl}
                onChange={(e) => setGoodreadsUrl(e.target.value)}
                placeholder="https://www.goodreads.com/book/show/..."
                disabled={isImporting}
              />
              <Button onClick={handleImport} disabled={isImporting}>
                {isImporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <BookUp className="mr-2 h-4 w-4" />
                    Import
                  </>
                )}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Enter the URL of a Goodreads book page to import its data.
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </>
      )}

      {step === "review" && importedData && (
        <div className="space-y-6">
          <div className="flex items-start space-x-4">
            {importedData.book.imageUrl && (
              <img 
                src={importedData.book.imageUrl} 
                alt={importedData.book.title} 
                className="h-40 object-cover rounded-md"
              />
            )}
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">{importedData.book.title}</h3>
              
              {importedData.authors && importedData.authors.length > 0 && (
                <p className="text-muted-foreground">
                  by {importedData.authors.map((a: any) => a.name).join(", ")}
                </p>
              )}
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                {importedData.book.isbn && (
                  <div>
                    <span className="font-medium">ISBN:</span> {importedData.book.isbn}
                  </div>
                )}
                {importedData.book.isbn13 && (
                  <div>
                    <span className="font-medium">ISBN-13:</span> {importedData.book.isbn13}
                  </div>
                )}
                {importedData.book.pages && (
                  <div>
                    <span className="font-medium">Pages:</span> {importedData.book.pages}
                  </div>
                )}
                {importedData.book.publicationYear && (
                  <div>
                    <span className="font-medium">Published:</span> {importedData.book.publicationYear}
                  </div>
                )}
                {importedData.book.publisher && (
                  <div>
                    <span className="font-medium">Publisher:</span> {importedData.book.publisher}
                  </div>
                )}
              </div>

              {importedData.shelves && importedData.shelves.length > 0 && (
                <div>
                  <span className="font-medium">Genres:</span>{" "}
                  <span className="text-sm">
                    {importedData.shelves.map((s: any) => s.name).join(", ")}
                  </span>
                </div>
              )}

              <div className="flex space-x-2 mt-4">
                <Button onClick={handleProceedToEdit}>
                  <Check className="mr-2 h-4 w-4" />
                  Proceed to Edit
                </Button>
                <Button variant="outline" onClick={handleReset}>
                  Start Over
                </Button>
                <Button variant="ghost" onClick={onCancel}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>

          {importedData.book.description && (
            <div className="space-y-2">
              <h4 className="font-medium">Description</h4>
              <div 
                className="text-sm text-muted-foreground prose max-w-none"
                dangerouslySetInnerHTML={{ __html: importedData.book.description }}
              />
            </div>
          )}
        </div>
      )}

      {step === "edit" && importedData && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Edit Imported Book</h3>
            <Button variant="ghost" size="sm" onClick={() => setStep("review")}>
              Back to Review
            </Button>
          </div>
          <BookForm 
            book={getFormattedBookData()} 
            onSaved={onImported}
            onCancel={handleReset}
          />
        </div>
      )}
    </div>
  );
}