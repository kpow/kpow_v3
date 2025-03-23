import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MonthYearPickerProps {
  month: number | null;
  year: number | null;
  onChange: (month: number | null, year: number | null) => void;
  className?: string;
  onReset?: () => void;
  minYear?: number;
  maxYear?: number;
}

export function MonthYearPicker({
  month,
  year,
  onChange,
  className,
  onReset,
  minYear = 2015,
  maxYear = new Date().getFullYear()
}: MonthYearPickerProps) {
  // Generate years list
  const years = React.useMemo(() => {
    const result = [];
    for (let y = maxYear; y >= minYear; y--) {
      result.push(y);
    }
    return result;
  }, [minYear, maxYear]);

  // Months list
  const months = React.useMemo(() => [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" }
  ], []);

  // Navigate to previous or next month
  const navigate = (direction: "prev" | "next") => {
    if (!month || !year) return;
    
    let newMonth = month;
    let newYear = year;
    
    if (direction === "prev") {
      newMonth--;
      if (newMonth < 1) {
        newMonth = 12;
        newYear--;
      }
    } else {
      newMonth++;
      if (newMonth > 12) {
        newMonth = 1;
        newYear++;
      }
    }
    
    // Check if we're still within the valid range
    if (newYear < minYear || newYear > maxYear) return;
    
    onChange(newMonth, newYear);
  };

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={() => navigate("prev")}
        disabled={!month || !year || (year === minYear && month === 1)}
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">Previous month</span>
      </Button>
      
      <Select
        value={month ? month.toString() : "all-months"}
        onValueChange={(value) => onChange(value !== "all-months" ? parseInt(value) : null, year)}
      >
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="Month" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all-months">All months</SelectItem>
          {months.map((m) => (
            <SelectItem key={m.value} value={m.value.toString()}>
              {m.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Select
        value={year ? year.toString() : "all-years"}
        onValueChange={(value) => onChange(month, value !== "all-years" ? parseInt(value) : null)}
      >
        <SelectTrigger className="w-[100px]">
          <SelectValue placeholder="Year" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all-years">All years</SelectItem>
          {years.map((y) => (
            <SelectItem key={y} value={y.toString()}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={() => navigate("next")}
        disabled={!month || !year || (year === maxYear && month === 12)}
      >
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">Next month</span>
      </Button>
      
      {onReset && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onReset}
          className="ml-2 h-8"
        >
          Reset
        </Button>
      )}
    </div>
  );
}