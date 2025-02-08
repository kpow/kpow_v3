### kpow.xyz State Management Pattern:

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

### Question do we need more advanced state management.
The application currently does not require a more advanced state management solution. Here are the reasons:

The state management strategy is effectively structured:
- React Query efficiently manages server state (API calls, caching)
- Local React state (useState) takes care of UI state
- Custom hooks encapsulate shared logic
- Props drilling is minimal and aligns well with the component hierarchy

The application's level of complexity:
- The state remains predictable and manageable
- Component roles are distinct
- Data flow is direct and understandable
- There are no intricate state interactions among remote components

Successful existing patterns:
- The donut shops page shows a clear separation of concerns
- The map and slider components receive well-defined props
- Toast notifications are managed via a custom hook
- React Query effectively handles API state

Introducing a tool like Redux or Zustand may add unnecessary complexity without offering substantial improvements. The present architecture aligns with React's best practices, maintaining clear separation of concerns.

Should the application significantly increase in complexity or require enhanced global state management, considering alternatives like Jotai or Zustand could be beneficial. For now, the existing implementation suffices.