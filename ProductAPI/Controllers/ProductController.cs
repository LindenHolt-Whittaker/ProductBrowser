// These "using" statements import the necessary libraries and tools we need for this controller
using Microsoft.AspNetCore.Mvc;              // Provides tools for building web APIs
using Microsoft.Extensions.Caching.Memory;    // Provides memory caching functionality
using System.Text.Json;                       // Provides JSON serialization/deserialization

namespace ProductAPI.Controllers
{
    /// <summary>
    /// This is a CONTROLLER - think of it as a "waiter" in a restaurant.
    /// When someone (the front-end) asks for products, this controller handles the request,
    /// gets the data from another service (DummyJSON), and sends it back in a format they understand.
    ///
    /// API ENDPOINT STRUCTURE:
    /// The controller responds to web requests at: http://yourserver/api/products
    /// </summary>
    [ApiController]  // This tells ASP.NET Core that this class handles API requests
    [Route("api/[controller]")]  // This sets the URL path: "api/products" (takes the class name minus "Controller")
    public class ProductsController : ControllerBase
    {
        // PRIVATE FIELDS - These are like the controller's "tools" it uses to do its job:
        
        // HttpClient: A tool for making web requests to other services (like a phone to call other APIs)
        private readonly HttpClient _httpClient;
        
        // Logger: A tool for recording what happens (like a diary that tracks successes and errors)
        private readonly ILogger<ProductsController> _logger;
        
        // Cache: A temporary storage to remember recent data (like a notepad to avoid asking the same question repeatedly)
        private readonly IMemoryCache _cache;
        
        // The base URL of the external service we're getting product data from
        private const string DUMMY_JSON_BASE_URL = "https://dummyjson.com";

        /// <summary>
        /// CONSTRUCTOR - This runs when the controller is created.
        /// It's like giving the waiter their notepad, pen, and menu when they start their shift.
        /// ASP.NET Core automatically provides these tools (this is called "Dependency Injection").
        /// </summary>
        public ProductsController(HttpClient httpClient, ILogger<ProductsController> logger, IMemoryCache cache)
        {
            _httpClient = httpClient;
            _logger = logger;
            _cache = cache;
        }

        /// <summary>
        /// GET PRODUCTS LIST ENDPOINT
        ///
        /// What it does: Returns a paginated list of products, optionally filtered by search term
        ///
        /// URL Examples:
        /// - Get all products: GET api/products
        /// - Search for phones: GET api/products?search=phone
        /// - Get page 2 of results: GET api/products?page=2
        /// - Search phones on page 2: GET api/products?search=phone&page=2
        ///
        /// How it works:
        /// 1. Receives the request with optional search term and page number
        /// 2. Calls the external DummyJSON API to get product data
        /// 3. Formats the data into a structure our front-end expects
        /// 4. Returns the formatted data with HTTP status codes
        /// </summary>
        // This attribute tells ASP.NET this method handles HTTP GET requests
        [HttpGet]
        // "async Task" means this operation can run without blocking other requests (like multiple waiters serving tables simultaneously)
        // "IActionResult" is a flexible return type that can send different types of responses
        public async Task<IActionResult> GetProducts(
            [FromQuery] string? search,    // Optional search term from the URL query string (the part after ?)
            [FromQuery] int page = 1)      // Page number from query string (defaults to 1 if not provided)
        {
            // TRY-CATCH BLOCK: This is error handling - if anything goes wrong, we catch it and handle it gracefully
            try
            {
                // LOG the incoming request for debugging and monitoring purposes
                _logger.LogInformation($"Getting products - Search: {search}, Page: {page}");
                
                // PAGINATION SETUP: Breaking results into "pages" like a book
                var limit = 12; // How many products to show per page (like 12 items per catalog page)
                var skip = (page - 1) * limit; // Calculate how many items to skip to get to the requested page
                // Example: Page 2 would skip the first 12 items (page 2 - 1 = 1, 1 × 12 = 12)
                
                // BUILD THE REQUEST URL
                // We construct different URLs depending on whether the user is searching or just browsing
                string url;
                if (!string.IsNullOrEmpty(search))
                {
                    // If searching, use the search endpoint with the search query (q), limit, and skip parameters
                    url = $"{DUMMY_JSON_BASE_URL}/products/search?q={search}&limit={limit}&skip={skip}";
                }
                else
                {
                    // If not searching, get all products with pagination
                    url = $"{DUMMY_JSON_BASE_URL}/products?limit={limit}&skip={skip}";
                }

                // MAKE THE HTTP REQUEST to the external API
                // "await" means we wait for the response without blocking other operations
                var response = await _httpClient.GetAsync(url);
                
                // Check if the request was successful (status code 200-299)
                // If not, this will throw an exception
                response.EnsureSuccessStatusCode();
                
                // READ THE RESPONSE
                // Convert the response body from JSON text to a string
                var json = await response.Content.ReadAsStringAsync();
                
                // DESERIALIZE: Convert the JSON string into C# objects we can work with
                // Like translating a foreign language menu into English
                var dummyJsonResponse = JsonSerializer.Deserialize<DummyJsonResponse>(json, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true // Ignore case differences in property names (id vs Id)
                });

                // NORMALIZE/FORMAT THE RESPONSE
                // Transform the data into the exact format our front-end expects
                // This is like repackaging items from a wholesale box into retail packaging
                var normalizedResponse = new
                {
                    // Map each product to include only the fields we need
                    products = dummyJsonResponse?.Products?.Select(p => new
                    {
                        id = p.Id,
                        title = p.Title,
                        description = p.Description,
                        price = p.Price,
                        thumbnail = p.Thumbnail,
                        rating = p.Rating,
                        brand = p.Brand,
                        category = p.Category
                    }),
                    total = dummyJsonResponse?.Total ?? 0,  // Total number of products available (using 0 if null)
                    page = page,                            // Current page number
                    totalPages = (int)Math.Ceiling((dummyJsonResponse?.Total ?? 0) / (double)limit) // Calculate total pages
                    // Math.Ceiling rounds up, so 25 items ÷ 12 per page = 2.08, which rounds up to 3 pages
                };

                // LOG SUCCESS
                _logger.LogInformation($"Successfully retrieved {dummyJsonResponse?.Products?.Count} products");
                
                // RETURN SUCCESS RESPONSE
                // "Ok" returns HTTP status 200 (success) with the data
                return Ok(normalizedResponse);
            }
            catch (Exception ex)  // Catch any errors that occur
            {
                // LOG THE ERROR for debugging (this goes to log files, not to the user)
                _logger.LogError(ex, "Error fetching products");
                
                // RETURN ERROR RESPONSE
                // StatusCode 500 means "Internal Server Error" - something went wrong on our end
                return StatusCode(500, new { error = "Failed to fetch products" });
            }
        }

        /// <summary>
        /// GET SINGLE PRODUCT ENDPOINT
        ///
        /// What it does: Returns detailed information about a specific product
        ///
        /// URL Example: GET api/products/5 (gets product with ID 5)
        ///
        /// Special Feature: CACHING
        /// - First checks if we've recently fetched this product (within 1 minute)
        /// - If yes, returns the cached version (faster!)
        /// - If no, fetches from the external API and saves it in cache
        ///
        /// This is like a waiter remembering a frequent customer's usual order
        /// </summary>
        [HttpGet("{id}")]  // The {id} in the URL becomes the 'id' parameter below
        public async Task<IActionResult> GetProduct(int id)  // The ID from the URL is passed as a parameter
        {
            try
            {
                _logger.LogInformation($"Getting product with ID: {id}");

                // CACHING STRATEGY - Check if we already have this product in memory
                // This saves time and reduces load on the external API
                
                // Create a unique identifier for this product in the cache
                string cacheKey = $"product_{id}";  // Example: "product_5"
                
                // Try to get the product from cache
                // "out" means if found, it will be placed in the cachedProduct variable
                if (_cache.TryGetValue(cacheKey, out ProductDto cachedProduct))
                {
                    // CACHE HIT! We found it in memory
                    _logger.LogInformation($"Returning cached product {id}");
                    return Ok(cachedProduct);  // Return the cached version immediately
                }

                // CACHE MISS - Product not in cache, so fetch from external API
                var response = await _httpClient.GetAsync($"{DUMMY_JSON_BASE_URL}/products/{id}");
                response.EnsureSuccessStatusCode();
                
                // Convert response to string and then to C# object
                var json = await response.Content.ReadAsStringAsync();
                var product = JsonSerializer.Deserialize<ProductDto>(json, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                // SAVE TO CACHE for future requests
                // Set up cache options - how long to keep this in memory
                var cacheOptions = new MemoryCacheEntryOptions()
                    .SetAbsoluteExpiration(TimeSpan.FromMinutes(1));  // Expire after 1 minute
                
                // Store the product in cache with the key and options
                _cache.Set(cacheKey, product, cacheOptions);

                _logger.LogInformation($"Successfully retrieved and cached product {id}");
                return Ok(product);
            }
            // SPECIFIC ERROR HANDLING for "Product Not Found" (404 error)
            // The "when" clause only catches HttpRequestException if it's a 404
            catch (HttpRequestException ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                _logger.LogWarning($"Product {id} not found");
                return NotFound(new { error = "Product not found" });  // Return 404 status
            }
            // GENERAL ERROR HANDLING for any other errors
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error fetching product {id}");
                return StatusCode(500, new { error = "Failed to fetch product details" });  // Return 500 status
            }
        }
    }

    // ====================================================================================
    // DATA TRANSFER OBJECTS (DTOs)
    // These are "blueprints" that define the structure of data we receive from the external API
    // Think of them as forms with specific fields that need to be filled out
    // ====================================================================================

    /// <summary>
    /// Represents the response structure from DummyJSON when fetching multiple products
    /// This matches the JSON format that DummyJSON sends us
    /// </summary>
    public class DummyJsonResponse
    {
        public List<ProductDto> Products { get; set; } = new();  // List of products
        public int Total { get; set; }                            // Total number of products available
        public int Skip { get; set; }                             // Number of products skipped (for pagination)
        public int Limit { get; set; }                            // Maximum products returned per request
    }

    /// <summary>
    /// Represents a single product's data structure
    /// Each property corresponds to a field in the product data
    ///
    /// Properties explained:
    /// - get; set; = These are "properties" that can be read and written
    /// - string.Empty = Default value for strings (prevents null reference errors)
    /// - new() = Creates an empty list to start with
    /// </summary>
    public class ProductDto
    {
        public int Id { get; set; }                                      // Unique identifier for the product
        public string Title { get; set; } = string.Empty;                // Product name/title
        public string Description { get; set; } = string.Empty;          // Detailed product description
        public decimal Price { get; set; }                               // Product price (decimal for accuracy with money)
        public string Thumbnail { get; set; } = string.Empty;            // URL to a small product image
        public decimal Rating { get; set; }                              // Average customer rating (e.g., 4.5 stars)
        public string Brand { get; set; } = string.Empty;                // Manufacturer/brand name
        public string Category { get; set; } = string.Empty;             // Product category (e.g., "electronics")
        public List<string> Images { get; set; } = new();                // List of product image URLs
        public int Stock { get; set; }                                   // Number of items in stock
        public decimal DiscountPercentage { get; set; }                  // Current discount percentage (if any)
    }
}