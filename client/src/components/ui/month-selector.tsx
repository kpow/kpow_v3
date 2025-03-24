import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Check, ArrowRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

interface MonthData {
  month: number;
  year: number;
  name: string;
}

interface MonthSelectorProps {
  onSelectMonth: (month: number, year: number) => void;
  selectedMonth?: number;
  selectedYear?: number;
}

// Get month name
const getMonthName = (month: number): string => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month - 1] || 'Unknown';
};

// Generate an array of years from 2020 to current year
const getYearsArray = (): number[] => {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let year = currentYear; year >= 2020; year--) {
    years.push(year);
  }
  return years;
};

export function MonthSelector({ 
  onSelectMonth, 
  selectedMonth, 
  selectedYear 
}: MonthSelectorProps) {
  const [tempMonth, setTempMonth] = useState<number | null>(selectedMonth || null);
  const [tempYear, setTempYear] = useState<number | null>(selectedYear || null);
  
  // Update temp values when props change
  useEffect(() => {
    setTempMonth(selectedMonth || null);
    setTempYear(selectedYear || null);
  }, [selectedMonth, selectedYear]);

  // Handle Go button click
  const handleGoClick = () => {
    if (tempMonth && tempYear) {
      onSelectMonth(tempMonth, tempYear);
    }
  };

  // Handle clear button click
  const handleClearClick = () => {
    setTempMonth(null);
    setTempYear(null);
    onSelectMonth(0, 0);
  };

  // Generate month options
  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);
  const yearOptions = getYearsArray();

  return (
    <div className="flex flex-col sm:flex-row gap-2 items-center">
      <span className="text-sm font-medium">Filter by date:</span>
      
      <div className="flex flex-wrap gap-2 items-center">
        <Select 
          value={tempMonth?.toString() || ""} 
          onValueChange={(value) => setTempMonth(parseInt(value))}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Select Month" />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map((month) => (
              <SelectItem key={month} value={month.toString()}>
                {getMonthName(month)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select 
          value={tempYear?.toString() || ""} 
          onValueChange={(value) => setTempYear(parseInt(value))}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Select Year" />
          </SelectTrigger>
          <SelectContent>
            {yearOptions.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Button 
          onClick={handleGoClick}
          disabled={!tempMonth || !tempYear}
          className="px-4"
        >
          Go
        </Button>
        
        {selectedMonth && selectedYear && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleClearClick}
            className="text-xs"
          >
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}