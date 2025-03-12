import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const formSchema = z.object({
  year: z.string().min(1, "Year is required"),
  tour: z.enum(["summer", "fall", "winter", "spring"]),
});

type FormValues = z.infer<typeof formSchema>;

const SetlistGameInner = () => {
  const methods = useForm<FormValues>({
    defaultValues: {
      year: "",
      tour: "summer",
    },
    resolver: zodResolver(formSchema),
  });

  const onSubmit = methods.handleSubmit((values) => {
    console.log(values);
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">
          Year
        </label>
        <input
          {...methods.register("year")}
          className="w-full p-2 border rounded"
          placeholder="Enter year"
        />
        {methods.formState.errors.year && (
          <span className="text-red-500 text-sm">
            {methods.formState.errors.year.message}
          </span>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Tour
        </label>
        <select
          {...methods.register("tour")}
          className="w-full p-2 border rounded"
        >
          <option value="summer">Summer</option>
          <option value="fall">Fall</option>
          <option value="winter">Winter</option>
          <option value="spring">Spring</option>
        </select>
        {methods.formState.errors.tour && (
          <span className="text-red-500 text-sm">
            {methods.formState.errors.tour.message}
          </span>
        )}
      </div>

      <Button type="submit" className="w-full">
        Submit
      </Button>
    </form>
  );
};

export function SetlistGame() {
  const methods = useForm<FormValues>({
    defaultValues: {
      year: "",
      tour: "summer",
    },
    resolver: zodResolver(formSchema),
  });

  return (
    <Card className="w-full h-full min-h-[400px]">
      <CardContent className="p-6">
        <div className="text-2xl font-bold mb-4">Setlist Game</div>
        <FormProvider {...methods}>
          <SetlistGameInner />
        </FormProvider>
      </CardContent>
    </Card>
  );
}