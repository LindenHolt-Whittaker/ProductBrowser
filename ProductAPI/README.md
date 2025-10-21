# Product API

A .NET 8 Web API that serves as a proxy to the DummyJSON products API, providing product listing, searching, and detailed product information with caching capabilities.

## Tech

- **.NET 8** - Framework for building the API
- **ASP.NET Core** - Web framework for HTTP services
- **Swagger/OpenAPI** - API documentation
- **xUnit** - Testing framework
- **Moq** - Mocking framework for unit tests

## Prerequisites

- .NET 8 SDK
- Visual Studio 2022 or VS Code with C# extension
- Port 5182 available for the API

## Getting Started

### Running the API

Navigate to the project directory and run:

```bash
cd ProductAPI
dotnet restore
dotnet run
```

The API will start on port `:5000` by default:
- HTTP: http://localhost:5000
- Swagger UI: http://localhost:5000/swagger

### Running Tests

```bash
cd ProductAPI.Tests
dotnet test
```

## API Endpoints

### Get Products
```
GET /api/products?search={query}&page={pageNumber}
```

Retrieves a paginated list of products with optional search filtering.

**Query Parameters:**
- `search` (optional): Search term to filter products
- `page` (optional, default: 1): Page number for pagination

**Response:**
```json
{
  "products": [
    {
      "id": 1,
      "title": "Product Name",
      "description": "Product description",
      "price": 99.99,
      "thumbnail": "https://...",
      "rating": 4.5,
      "brand": "Brand Name",
      "category": "Category"
    }
  ],
  "total": 100,
  "page": 1,
  "totalPages": 9
}
```

### Get Product Details
```
GET /api/products/{id}
```

Retrieves detailed information about a specific product.

**Parameters:**
- `id`: Product identifier

**Response:**
```json
{
  "id": 1,
  "title": "Product Name",
  "description": "Detailed description",
  "price": 99.99,
  "thumbnail": "https://...",
  "rating": 4.5,
  "brand": "Brand Name",
  "category": "Category",
  "images": ["https://..."],
  "stock": 50,
  "discountPercentage": 10.5
}
```

## Architecture

### Controller Layer
- `ProductsController` - Handles HTTP requests and responses
- Input validation and error handling

### Service Integration
- External API integration with DummyJSON
- HTTP client for external communication

### Caching Strategy
- In-memory caching for individual products (1 minute TTL)

### Error Handling
- Structured error responses
- HTTP status code mapping
- Detailed logging for debugging

## Configuration

### Application Settings

The API configuration is managed through `appsettings.json`:

### CORS Configuration

CORS is configured to allow the React development server:


## Testing

The project includes unit tests covering:

### Test Coverage
- Product listing with and without search
- Pagination logic
- Cache functionality
- Error handling scenarios
- 404 responses for non-existent products

## External Dependencies

The API depends on the DummyJSON service:
- Base URL: https://dummyjson.com
- Products endpoint: /products
- Search endpoint: /products/search

## Known Limitations

1. **Limited caching**: Only individual products are cached, not search results
2. **Missing validation**: Page parameter accepts invalid values
3. **No rate limiting**: Could be overwhelmed by too many requests
4. **Hardcoded pagination**: Items per page is fixed at 12
5. **No API versioning**: Makes future changes potentially breaking
6. **Limited error details**: Generic error messages for security
