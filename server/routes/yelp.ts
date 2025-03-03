import express from "express";
import axios from "axios";

const router = express.Router();

// Function to filter out chain stores
const filterChainStores = (businesses: any[]) => {
  const chainNames = ["Krispy Kreme", "Dunkin", "Dunkin' Donuts"];
  return businesses.filter(
    (business) =>
      !chainNames.some((chain) =>
        business.name.toLowerCase().includes(chain.toLowerCase()),
      ),
  );
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

    // Get coordinates for location if not provided
    let searchCoordinates;
    if (location) {
      try {
        const geocodeResponse = await axios.get(
          `https://api.yelp.com/v3/geocode/query`,
          {
            headers: {
              Authorization: `Bearer ${process.env.YELP_API_KEY}`,
            },
            params: {
              location: location,
            },
          }
        );
        if (geocodeResponse.data.coordinates) {
          searchCoordinates = geocodeResponse.data.coordinates;
        }
      } catch (error) {
        console.log("Geocoding error:", error);
      }
    }

    // Base parameters
    const baseParams = {
      categories: "donuts",
      sort_by: "distance",
      limit: 50,
      ...(radius ? { radius: Math.min(Number(radius), 40000) } : {}),
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

    const filteredBusinesses = filterChainStores(uniqueBusinesses);

    const filteredAndCloseBusinesses = filteredBusinesses.filter(
      (business) => business.distance <= 24140,
    );

    // Create metrics object
    const searchMetrics = {
      donutResults: donutResponse.data.businesses.length,
      doughnutResults: doughnutResponse.data.businesses.length,
      totalUniqueShops: uniqueBusinesses.length,
      filteredShops: filteredBusinesses.length,
      nearbyShops: filteredAndCloseBusinesses.length,
      chainStoresFiltered: uniqueBusinesses.length - filteredBusinesses.length,
    };

    const formattedResults = filteredBusinesses.map((business) => ({
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
    }));

    // Return the results along with the search coordinates
    res.json({
      shops: formattedResults,
      metrics: searchMetrics,
      center: searchCoordinates || {
        latitude: Number(latitude),
        longitude: Number(longitude),
      },
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