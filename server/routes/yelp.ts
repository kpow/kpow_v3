import express from "express";
import axios from "axios";

const router = express.Router();

// Function to filter out chain stores
const filterChainStores = (businesses: any[]) => {
  const chainNames = ["Krispy Kreme", "Dunkin", "Dunkin' Donuts"];
  const chainStores = businesses.filter((business) =>
    chainNames.some((chain) =>
      business.name.toLowerCase().includes(chain.toLowerCase()),
    ),
  );
  const nonChainStores = businesses.filter(
    (business) =>
      !chainNames.some((chain) =>
        business.name.toLowerCase().includes(chain.toLowerCase()),
      ),
  );
  return { chainStores, nonChainStores };
};

const getCityCoordinates = async (location: string) => {
  try {
    const query = encodeURIComponent(location);
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
      {
        headers: {
          "User-Agent": "DonutTourApp/1.0",
        },
      },
    );

    if (response.data && response.data.length > 0) {
      return {
        latitude: parseFloat(response.data[0].lat),
        longitude: parseFloat(response.data[0].lon),
        display_name: response.data[0].display_name,
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching city coordinates:", error);
    return null;
  }
};

// Search donut/doughnut shops
router.get("/search", async (req, res) => {
  try {
    const { location, latitude, longitude, radius } = req.query;

    // Validate that either location OR coordinates are provided
    if (!location && (!latitude || !longitude)) {
      return res.status(400).json({
        error:
          "Either location or coordinates (latitude & longitude) are required",
      });
    }

    // Get city coordinates if location is provided
    let cityCenter = null;
    if (location) {
      cityCenter = await getCityCoordinates(location as string);
    }

    // Base parameters
    const baseParams = {
      categories: "donuts",
      sort_by: "distance",
      limit: 50,
      ...(radius ? { radius: Math.min(Number(radius), 40000) } : {}), // Max 40000 meters (25 miles)
      ...(location
        ? { location }
        : {
            latitude: Number(latitude),
            longitude: Number(longitude),
          }),
    };

    // Make parallel requests for both "donut" and "doughnut"
    const [donutResponse, doughnutResponse] = await Promise.all([
      axios.get("https://api.yelp.com/v3/businesses/search", {
        headers: {
          Authorization: `Bearer ${process.env.YELP_API_KEY}`,
        },
        params: {
          ...baseParams,
          term: "donut shop",
        },
      }),
      axios.get("https://api.yelp.com/v3/businesses/search", {
        headers: {
          Authorization: `Bearer ${process.env.YELP_API_KEY}`,
        },
        params: {
          ...baseParams,
          term: "doughnut shop",
        },
      }),
    ]);

    // Combine and deduplicate results
    const allBusinesses = [
      ...donutResponse.data.businesses,
      ...doughnutResponse.data.businesses,
    ];
    const uniqueBusinesses = allBusinesses.filter(
      (business, index, self) =>
        index === self.findIndex((b) => b.id === business.id),
    );

    const { chainStores, nonChainStores } = filterChainStores(uniqueBusinesses);

    const formattedResults = (businesses: any[]) =>
      businesses.map((business) => ({
        id: business.id,
        name: business.name,
        rating: business.rating,
        review_count: business.review_count,
        address: business.location.display_address.join(", "),
        coordinates: {
          latitude: business.coordinates.latitude,
          longitude: business.coordinates.longitude,
        },
        price: business.price,
        image_url: business.image_url,
        url: business.url,
        phone: business.display_phone,
        distance: business.distance,
        categories: business.categories,
        is_closed: business.is_closed,
        photos: business.photos || [business.image_url],
        // Calculate if shop is nearby (within 15 miles / 24140 meters)
        isNearby: business.distance <= 24140,
      }));

    // Create metrics object
    const searchMetrics = {
      donutResults: donutResponse.data.businesses.length,
      doughnutResults: doughnutResponse.data.businesses.length,
      totalUniqueShops: uniqueBusinesses.length,
      filteredShops: nonChainStores.length,
      nearbyShops: nonChainStores.filter((shop) => shop.distance <= 24140).length,
      chainStoresFiltered: chainStores.length,
    };

    // Return all marker data including city center
    res.json({
      shops: formattedResults(nonChainStores),
      chainStores: formattedResults(chainStores),
      cityCenter: cityCenter ? {
        coordinates: {
          latitude: cityCenter.latitude,
          longitude: cityCenter.longitude,
        },
        display_name: cityCenter.display_name,
      } : null,
      metrics: searchMetrics,
    });
  } catch (error: any) {
    console.error("Yelp API Error:", error.response?.data || error.message);
    res.status(500).json({
      error: "Failed to fetch donut shops",
      details: error.response?.data || error.message,
    });
  }
});

export default router;