import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read the CSV file
const csvPath = join(__dirname, '../../../attached_assets/US Cities States Counties.csv');
const outputPath = join(__dirname, 'cities.ts');

// State abbreviations mapping
const stateAbbreviations = {
  'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
  'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
  'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
  'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
  'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS', 'Missouri': 'MO',
  'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
  'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
  'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
  'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT',
  'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY'
};

try {
  const csvData = readFileSync(csvPath, 'utf8');
  const lines = csvData.split('\n');

  // Object to store cities by state
  const citiesByState = {};

  // First pass: Group cities by state and remove duplicates
  lines.forEach(line => {
    const [city, stateAbbr, stateFull] = line.split('|');

    // Skip empty lines or invalid entries
    if (!city || !stateFull) return;

    // Get the state abbreviation
    const stateAbb = stateAbbreviations[stateFull];
    if (!stateAbb) return; // Skip if not one of the 50 states

    // Initialize array for state if doesn't exist
    if (!citiesByState[stateAbb]) {
      citiesByState[stateAbb] = new Set();
    }

    // Add city to state's set (automatically handles duplicates)
    citiesByState[stateAbb].add(city.trim());
  });

  // Convert sets to arrays and sort
  Object.keys(citiesByState).forEach(state => {
    citiesByState[state] = Array.from(citiesByState[state]).sort();
  });

  // Calculate how many cities to take from each state
  const totalStates = Object.keys(citiesByState).length;
  const citiesPerState = Math.floor(1200 / totalStates); // Base number of cities per state
  let remainingCities = 1200 - (citiesPerState * totalStates); // Extra cities to distribute

  // Final array to hold selected cities
  const selectedCities = [];

  // Select cities from each state with even distribution across alphabet
  Object.entries(citiesByState).forEach(([state, cities]) => {
    const numCitiesForState = citiesPerState + (remainingCities > 0 ? 1 : 0);
    remainingCities--;

    // If we have fewer cities than needed, take all of them
    if (cities.length <= numCitiesForState) {
      cities.forEach(city => selectedCities.push({ city, state }));
    } else {
      // Calculate step size to get even distribution
      const step = cities.length / numCitiesForState;

      // Take evenly spaced cities
      for (let i = 0; i < numCitiesForState; i++) {
        const index = Math.floor(i * step);
        selectedCities.push({ city: cities[index], state });
      }
    }
  });

  // Sort final list by city name for consistency
  selectedCities.sort((a, b) => a.city.localeCompare(b.city));

  // Generate TypeScript file content
  const tsContent = `export interface CityState {
  city: string;
  state: string;
}

// This dataset contains approximately 1200 cities across the 50 US states
export const cities: CityState[] = ${JSON.stringify(selectedCities, null, 2)};
`;

  // Write to cities.ts
  writeFileSync(outputPath, tsContent);
  console.log(`Successfully generated ${selectedCities.length} cities in cities.ts`);

} catch (error) {
  console.error('Error generating cities:', error);
}