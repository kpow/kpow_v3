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
    const { location } = req.query;

    if (!location) {
      return res.status(400).json({ error: 'Location is required' });
    }

    // Make parallel requests for both "donut" and "doughnut"
    const [donutResponse, doughnutResponse] = await Promise.all([
      axios.get('https://api.yelp.com/v3/businesses/search', {
        headers: {
          'Authorization': `Bearer ${process.env.YELP_API_KEY}`,
        },
        params: {
          term: 'donut shop',
          location: location,
          categories: 'donuts',
          sort_by: 'rating',
          limit: 25
        }
      }),
      axios.get('https://api.yelp.com/v3/businesses/search', {
        headers: {
          'Authorization': `Bearer ${process.env.YELP_API_KEY}`,
        },
        params: {
          term: 'doughnut shop',
          location: location,
          categories: 'donuts',
          sort_by: 'rating',
          limit: 25
        }
      })
    ]);

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
      phone: business.display_phone
    }));

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