export interface CityState {
  city: string;
  state: string;
}

// This simulates the async data fetching pattern from the provided example
async function getCities(limit = 1200): Promise<CityState[]> {
  // Base cities - major US cities from original data
  const baseCities: CityState[] = [
    { city: "New York", state: "NY" },
    { city: "Los Angeles", state: "CA" },
    { city: "Chicago", state: "IL" },
    { city: "Houston", state: "TX" },
    { city: "Phoenix", state: "AZ" },
    { city: "Philadelphia", state: "PA" },
    { city: "San Antonio", state: "TX" },
    { city: "San Diego", state: "CA" },
    { city: "Dallas", state: "TX" },
    { city: "San Jose", state: "CA" },
    { city: "Austin", state: "TX" },
    { city: "Jacksonville", state: "FL" },
    { city: "Fort Worth", state: "TX" },
    { city: "Columbus", state: "OH" },
    { city: "Charlotte", state: "NC" },
    { city: "San Francisco", state: "CA" },
    { city: "Indianapolis", state: "IN" },
    { city: "Seattle", state: "WA" },
    { city: "Denver", state: "CO" },
    { city: "Boston", state: "MA" },
    { city: "Nashville", state: "TN" },
    { city: "El Paso", state: "TX" },
    { city: "Detroit", state: "MI" },
    { city: "Memphis", state: "TN" },
    { city: "Portland", state: "OR" },
    { city: "Oklahoma City", state: "OK" },
    { city: "Las Vegas", state: "NV" },
    { city: "Louisville", state: "KY" },
    { city: "Baltimore", state: "MD" },
    { city: "Milwaukee", state: "WI" },
    { city: "Albuquerque", state: "NM" },
    { city: "Tucson", state: "AZ" },
    { city: "Fresno", state: "CA" },
    { city: "Sacramento", state: "CA" },
    { city: "Mesa", state: "AZ" },
    { city: "Kansas City", state: "MO" },
    { city: "Atlanta", state: "GA" },
    { city: "Omaha", state: "NE" },
    { city: "Colorado Springs", state: "CO" },
    { city: "Raleigh", state: "NC" },
    { city: "Miami", state: "FL" },
    { city: "Long Beach", state: "CA" },
    { city: "Virginia Beach", state: "VA" },
    { city: "Oakland", state: "CA" },
    { city: "Minneapolis", state: "MN" }
  ];

  // Generate remaining cities to reach the limit
  const remainingCount = limit - baseCities.length;
  const states = ["CA", "TX", "FL", "NY", "IL", "PA", "OH", "GA", "NC", "MI"];

  for (let i = 0; i < remainingCount; i++) {
    baseCities.push({
      city: `City ${i + 1}`,
      state: states[i % states.length]
    });
  }

  return Promise.resolve(baseCities);
}

// Export the cities data
export const cities1200: CityState[] = [];

// Initialize the data
getCities().then(cityList => {
  cities1200.push(...cityList);
  // Verify we have exactly 1200 cities
  console.assert(cities1200.length === 1200, `Expected 1200 cities but got ${cities1200.length}`);
});

// Utility function to get random cities
export function getRandomCities(count: number): CityState[] {
  if (count > cities1200.length) {
    throw new Error(`Cannot get more than ${cities1200.length} cities`);
  }
  return [...cities1200]
    .sort(() => Math.random() - 0.5)
    .slice(0, count);
}