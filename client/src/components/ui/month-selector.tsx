import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

interface MonthOption {
  value: number;
  label: string;
}

interface YearOption {
  value: number;
  label: string;
}

interface AvailableMonth {
  month: number;
  year: number;
  name: string;
}

interface MonthSelectorProps {
  onMonthYearSelect: (month: number, year: number) => void;
  onIndexBuild: () => void;
}

export function MonthSelector({ onMonthYearSelect, onIndexBuild }: MonthSelectorProps) {
  const { toast } = useToast();
  const [months, setMonths] = useState<MonthOption[]>([]);
  const [years, setYears] = useState<YearOption[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [availableMonths, setAvailableMonths] = useState<AvailableMonth[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBuilding, setIsBuilding] = useState(false);

  // Fetch available months from the server
  useEffect(() => {
    fetchAvailableMonths();
  }, []);

  // Update months and years dropdowns when available months change
  useEffect(() => {
    if (availableMonths.length > 0) {
      // Extract unique months and years
      const uniqueMonths = Array.from(
        new Set(availableMonths.map(m => m.month))
      ).sort((a, b) => a - b);
      
      const uniqueYears = Array.from(
        new Set(availableMonths.map(m => m.year))
      ).sort((a, b) => b - a); // Sort years in descending order
      
      // Create options for dropdowns
      const monthOptions = uniqueMonths.map(month => ({
        value: month,
        label: getMonthName(month)
      }));
      
      const yearOptions = uniqueYears.map(year => ({
        value: year,
        label: year.toString()
      }));
      
      setMonths(monthOptions);
      setYears(yearOptions);
      
      // Set initial values if not already set
      if (selectedMonth === null && monthOptions.length > 0) {
        setSelectedMonth(monthOptions[0].value);
      }
      
      if (selectedYear === null && yearOptions.length > 0) {
        setSelectedYear(yearOptions[0].value);
      }
    }
  }, [availableMonths, selectedMonth, selectedYear]);

  const fetchAvailableMonths = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get<{ availableMonths: AvailableMonth[] }>('/api/starred-articles/months');
      setAvailableMonths(response.data.availableMonths);
    } catch (error) {
      toast({
        title: 'Error fetching available months',
        description: 'Failed to load month index. Try building the index first.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const buildMonthIndex = async () => {
    try {
      setIsBuilding(true);
      const response = await axios.post<{ 
        message: string;
        monthsScanned: number;
        pagesScanned: number;
        availableMonths: AvailableMonth[];
      }>('/api/starred-articles/build-index');
      
      toast({
        title: 'Index built successfully',
        description: `Found ${response.data.monthsScanned} months across ${Math.ceil(response.data.pagesScanned)} pages.`
      });
      
      // Update available months
      setAvailableMonths(response.data.availableMonths);
      
      // Notify parent
      onIndexBuild();
    } catch (error) {
      toast({
        title: 'Error building index',
        description: 'Failed to build month index. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsBuilding(false);
    }
  };

  const handleGoClick = () => {
    if (selectedMonth !== null && selectedYear !== null) {
      onMonthYearSelect(selectedMonth, selectedYear);
    } else {
      toast({
        title: 'Selection required',
        description: 'Please select both a month and year.'
      });
    }
  };

  const getMonthName = (month: number): string => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return monthNames[month - 1]; // Convert 1-indexed to 0-indexed
  };

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-lg bg-card">
      <h3 className="text-lg font-medium">Browse by Month</h3>
      <div className="flex flex-wrap gap-2 items-end">
        <div className="flex flex-col gap-1.5 min-w-[120px]">
          <label htmlFor="month-select" className="text-sm">Month</label>
          <Select
            value={selectedMonth?.toString()}
            onValueChange={(value) => setSelectedMonth(parseInt(value))}
            disabled={isLoading || months.length === 0}
          >
            <SelectTrigger id="month-select" className="w-full">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value.toString()}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5 min-w-[100px]">
          <label htmlFor="year-select" className="text-sm">Year</label>
          <Select
            value={selectedYear?.toString()}
            onValueChange={(value) => setSelectedYear(parseInt(value))}
            disabled={isLoading || years.length === 0}
          >
            <SelectTrigger id="year-select" className="w-full">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year.value} value={year.value.toString()}>
                  {year.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={handleGoClick} 
          disabled={isLoading || selectedMonth === null || selectedYear === null}
          className="h-10"
        >
          Go
        </Button>

        <div className="ml-auto">
          <Button
            variant="outline"
            onClick={buildMonthIndex}
            disabled={isBuilding}
            className="h-10"
          >
            {isBuilding ? 'Building...' : 'Build Month Index'}
          </Button>
        </div>
      </div>
      {availableMonths.length === 0 && !isLoading && (
        <p className="text-sm text-muted-foreground">
          No months available. Please build the index first.
        </p>
      )}
    </div>
  );
}