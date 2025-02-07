import express from 'express';
import axios from 'axios';

const router = express.Router();

// Function to filter out chain stores
const filterChainStores = (businesses: any[]) => {
  const chainNames = ['Krispy Kreme', 'Dunkin', "Dunkin' Donuts"];
  return businesses.filter(business => 
    !chainNames.some(chain => 
      business.name.toLowerCase().includes(chain.toLowerCase())
    )
  );
};

// Search donut/doughnut shops
router.get('/search', async (req, res) => {
  try {
    const { location, latitude, longitude, radius } = req.query;

    // Validate that either location OR coordinates are provided
    if (!location && (!latitude || !longitude)) {
      return res.status(400).json({ error: 'Either location or coordinates (latitude & longitude) are required' });
    }

    // Base parameters
    const baseParams = {
      categories: 'donuts',
      sort_by: 'rating',
      limit: 25,
      ...(radius ? { radius: Math.min(Number(radius), 40000) } : {}), // Max 40000 meters (25 miles)
      ...(location ? { location } : { 
        latitude: Number(latitude),
        longitude: Number(longitude)
      })
    };

    // Make parallel requests for both "donut" and "doughnut"
    const [donutResponse, doughnutResponse] = await Promise.all([
      axios.get('https://api.yelp.com/v3/businesses/search', {
        headers: {
          'Authorization': `Bearer ${process.env.YELP_API_KEY}`,
        },
        params: {
          ...baseParams,
          term: 'donut shop'
        }
      }),
      axios.get('https://api.yelp.com/v3/businesses/search', {
        headers: {
          'Authorization': `Bearer ${process.env.YELP_API_KEY}`,
        },
        params: {
          ...baseParams,
          term: 'doughnut shop'
        }
      })
    ]);

    // Log full responses for debugging
    console.log('Donut Search Raw Response:', JSON.stringify(donutResponse.data, null, 2));
    console.log('Doughnut Search Raw Response:', JSON.stringify(doughnutResponse.data, null, 2));

    // Combine and deduplicate results
    const allBusinesses = [...donutResponse.data.businesses, ...doughnutResponse.data.businesses];
    const uniqueBusinesses = allBusinesses.filter((business, index, self) =>
      index === self.findIndex((b) => b.id === business.id)
    );

    const filteredBusinesses = filterChainStores(uniqueBusinesses);

    const formattedResults = filteredBusinesses.map(business => ({
      id: business.id,
      name: business.name,
      rating: business.rating,
      review_count: business.review_count,
      address: business.location.display_address.join(', '),
      coordinates: {
        latitude: business.coordinates.latitude,
        longitude: business.coordinates.longitude
      },
      price: business.price,
      image_url: business.image_url,
      url: business.url,
      phone: business.display_phone,
      distance: business.distance, // Added distance field
      categories: business.categories, // Added categories
      is_closed: business.is_closed, // Added operating status
      photos: business.photos || [business.image_url], // Added photos array
    }));

    // Log the final formatted results
    console.log('Formatted Results:', JSON.stringify(formattedResults, null, 2));

    res.json(formattedResults);
  } catch (error: any) {
    console.error('Yelp API Error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to fetch donut shops',
      details: error.response?.data || error.message 
    });
  }
});

export default router;