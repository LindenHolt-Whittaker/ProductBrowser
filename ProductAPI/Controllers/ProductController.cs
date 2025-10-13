using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using System.Text.Json;

namespace ProductAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductsController : ControllerBase
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<ProductsController> _logger;
        private readonly IMemoryCache _cache;
        private const string DUMMY_JSON_BASE_URL = "https://dummyjson.com";

        public ProductsController(HttpClient httpClient, ILogger<ProductsController> logger, IMemoryCache cache)
        {
            _httpClient = httpClient;
            _logger = logger;
            _cache = cache;
        }

        // GET: api/products?search=phone&page=1
        [HttpGet]
        public async Task<IActionResult> GetProducts([FromQuery] string? search, [FromQuery] int page = 1)
        {
            try
            {
                _logger.LogInformation($"Getting products - Search: {search}, Page: {page}");
                
                var limit = 12; // Items per page
                var skip = (page - 1) * limit;
                
                // Build the URL based on whether we're searching or not
                string url;
                if (!string.IsNullOrEmpty(search))
                {
                    url = $"{DUMMY_JSON_BASE_URL}/products/search?q={search}&limit={limit}&skip={skip}";
                }
                else
                {
                    url = $"{DUMMY_JSON_BASE_URL}/products?limit={limit}&skip={skip}";
                }

                var response = await _httpClient.GetAsync(url);
                response.EnsureSuccessStatusCode();
                
                var json = await response.Content.ReadAsStringAsync();
                var dummyJsonResponse = JsonSerializer.Deserialize<DummyJsonResponse>(json, new JsonSerializerOptions 
                { 
                    PropertyNameCaseInsensitive = true 
                });

                // Normalize the response
                var normalizedResponse = new
                {
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
                    total = dummyJsonResponse?.Total ?? 0,
                    page = page,
                    totalPages = (int)Math.Ceiling((dummyJsonResponse?.Total ?? 0) / (double)limit)
                };

                _logger.LogInformation($"Successfully retrieved {dummyJsonResponse?.Products?.Count} products");
                return Ok(normalizedResponse);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching products");
                return StatusCode(500, new { error = "Failed to fetch products" });
            }
        }

        // GET: api/products/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetProduct(int id)
        {
            try
            {
                _logger.LogInformation($"Getting product with ID: {id}");

                // Check cache first
                string cacheKey = $"product_{id}";
                if (_cache.TryGetValue(cacheKey, out ProductDto cachedProduct))
                {
                    _logger.LogInformation($"Returning cached product {id}");
                    return Ok(cachedProduct);
                }

                // Fetch from API
                var response = await _httpClient.GetAsync($"{DUMMY_JSON_BASE_URL}/products/{id}");
                response.EnsureSuccessStatusCode();
                
                var json = await response.Content.ReadAsStringAsync();
                var product = JsonSerializer.Deserialize<ProductDto>(json, new JsonSerializerOptions 
                { 
                    PropertyNameCaseInsensitive = true 
                });

                // Cache for 1 minute
                var cacheOptions = new MemoryCacheEntryOptions()
                    .SetAbsoluteExpiration(TimeSpan.FromMinutes(1));
                _cache.Set(cacheKey, product, cacheOptions);

                _logger.LogInformation($"Successfully retrieved and cached product {id}");
                return Ok(product);
            }
            catch (HttpRequestException ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                _logger.LogWarning($"Product {id} not found");
                return NotFound(new { error = "Product not found" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error fetching product {id}");
                return StatusCode(500, new { error = "Failed to fetch product details" });
            }
        }
    }

    // DTOs for deserializing DummyJSON responses
    public class DummyJsonResponse
    {
        public List<ProductDto> Products { get; set; } = new();
        public int Total { get; set; }
        public int Skip { get; set; }
        public int Limit { get; set; }
    }

    public class ProductDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string Thumbnail { get; set; } = string.Empty;
        public decimal Rating { get; set; }
        public string Brand { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public List<string> Images { get; set; } = new();
        public int Stock { get; set; }
        public decimal DiscountPercentage { get; set; }
    }
}