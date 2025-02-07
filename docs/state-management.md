Based on the codebase, this application uses a combination of state management approaches:

**React Query (TanStack Query):**
- Used for server state management and caching
  - Handles data fetching, caching, and synchronization

**Examples in the code:**
- Books data: `useQuery(["books"])`
- Instagram feed: `useQuery(["instagram/feed"])`
- Yelp/Donut shop data: `useQuery(["donutShops", searchState])`

**Local React State:**
- Uses React's `useState` hook for UI state

**Examples from `donut-shops.tsx`:**
- Search state: `const [searchState, setSearchState] = useState<SearchState>()`
- Selected shop: `const [selectedShopId, setSelectedShopId] = useState<string | null>()`
- Rating filter: `const [minRating, setMinRating] = useState(0)`

**Props Drilling:**
- Components pass state down through props
  - Example: `ShopSlider` receives shops data and click handlers from parent

**Custom Hooks:**
- Encapsulates reusable state logic

**Examples:**
- `use-toast.ts` for toast notifications
- `use-mobile.tsx` for responsive state
- `use-starred-articles.ts` for article data

This architecture separates concerns between:

- **Server state (React Query)**
- **UI state (useState)**
- **Shared/global state (custom hooks)**

The approach prioritizes simplicity and maintainability over complex global state management solutions like Redux.