import * as React from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
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
  onSearch?: (month: number | null, year: number | null) => void;
}

export function MonthYearPicker({
  month,
  year,
  onChange,
  className,
  onReset,
  minYear = 2015,
  maxYear = new Date().getFullYear(),
  onSearch
}: MonthYearPickerProps) {
  // Local state for selections before search
  const [selectedMonth, setSelectedMonth] = React.useState<number | null>(month);
  const [selectedYear, setSelectedYear] = React.useState<number | null>(year);

  // Update local state when props change
  React.useEffect(() => {
    setSelectedMonth(month);
    setSelectedYear(year);
  }, [month, year]);

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
    if (!selectedMonth || !selectedYear) return;
    
    let newMonth = selectedMonth;
    let newYear = selectedYear;
    
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
    
    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
  };

  // Handle search button click
  const handleSearch = () => {
    if (onSearch) {
      onSearch(selectedMonth, selectedYear);
    } else if (onChange) {
      onChange(selectedMonth, selectedYear);
    }
  };

  // Handle reset
  const handleReset = () => {
    setSelectedMonth(null);
    setSelectedYear(null);
    if (onReset) {
      onReset();
    } else if (onChange) {
      onChange(null, null);
    }
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={() => navigate("prev")}
        disabled={!selectedMonth || !selectedYear || (selectedYear === minYear && selectedMonth === 1)}
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">Previous month</span>
      </Button>
      
      <Select
        value={selectedMonth ? selectedMonth.toString() : "all-months"}
        onValueChange={(value) => setSelectedMonth(value !== "all-months" ? parseInt(value) : null)}
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
        value={selectedYear ? selectedYear.toString() : "all-years"}
        onValueChange={(value) => setSelectedYear(value !== "all-years" ? parseInt(value) : null)}
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
        disabled={!selectedMonth || !selectedYear || (selectedYear === maxYear && selectedMonth === 12)}
      >
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">Next month</span>
      </Button>

      <Button 
        variant="default" 
        size="sm" 
        onClick={handleSearch}
        className="h-8"
        disabled={selectedMonth === null && selectedYear === null}
      >
        <Search className="h-4 w-4 mr-1" />
        Search
      </Button>
      
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleReset}
        className="h-8"
      >
        Reset
      </Button>
    </div>
  );
}