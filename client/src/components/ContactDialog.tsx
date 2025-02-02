import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { ContactForm } from "./ContactForm";

export function ContactDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-xs text-white font-bold py-2 px-4 rounded"
        >
          contact
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Get in Touch</DialogTitle>
          <DialogDescription>
            Fill out the form below and I'll get back to you as soon as
            possible.
          </DialogDescription>
        </DialogHeader>
        <ContactForm />
      </DialogContent>
    </Dialog>
  );
}
