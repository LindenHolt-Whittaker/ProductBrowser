# Product Browser

A React-based product browsing application with search, pagination, and detailed product views. Built with TypeScript and modern React patterns for optimal performance and maintainability.

## Tech

- **React 19** - UI framework
- **TypeScript** - Type safety and better developer experience
- **Vite** - Build tool and development server
- **React Query (TanStack Query)** - Server state management and caching
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **SCSS** - Styling with CSS preprocessor
- **Vitest** - Unit testing framework

## Prerequisites

- Node.js 21 or higher
- npm or yarn package manager
- Backend API running on http://localhost:5000 by default

## Getting Started

### Installation

```bash
cd product-browser
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

The application will be available at http://localhost:3000 by default

### Build

Create a production build:

```bash
npm run build
```

### Testing

Run tests:

```bash
npm test
```

## Features

### Product Browsing
- Grid layout displaying 12 products per page
- Responsive design adapts to different screen sizes
- Smooth loading states and error handling

### Search Functionality
- Real-time search with 500ms debounce
- Search results update without page refresh
- Automatic pagination reset on new searches

### Product Details
- Quick view drawer for product information
- Full detail page with product information
- Image lazy loading for performance

### Navigation
- Pagination controls for browsing large product sets
- Direct routing to individual product pages

### Performance Optimizations
- React Query caching reduces unnecessary API calls
- Debounced search prevents excessive requests
- Optimistic UI updates for better perceived performance
- Code splitting with React Router


## Component Documentation

### ProductPage
Main landing page component that orchestrates product listing, search, and detail viewing.

### ProductList
Displays products in a responsive grid with pagination controls. Handles loading and error states.

### ProductDetail
Drawer component for quick product preview with smooth animations and backdrop overlay.

### ProductDetailPage
Full-page product view with complete information, accessible via direct URL.

### SearchBar
Input component with built-in debouncing and clear functionality.

### Custom Hooks

- **useProducts**: Fetches paginated product list with caching
- **useProduct**: Fetches individual product details
- **useDebounce**: Delays value updates for performance
- **usePagination**: Manages pagination state with search reset
- **useDrawer**: Controls drawer animation state
- **useScrollLock**: Prevents background scrolling when drawer is open

## Known Limitations

1. Cart functionality is not implemented (placeholder buttons only)
2. Hardcoded api endpoint used
3. Limited test coverage (only hooks tested)
4. Accessibility features missing

