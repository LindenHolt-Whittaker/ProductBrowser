using Xunit;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Caching.Memory;
using Moq;
using Moq.Protected;
using System.Net;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using ProductAPI.Controllers;

namespace ProductAPI.Tests
{
    public class ProductsControllerTests
    {
        private readonly ProductsController _controller;
        private readonly Mock<HttpMessageHandler> _mockHttpHandler;
        private readonly HttpClient _httpClient;
        private readonly IMemoryCache _cache;
        private readonly Mock<ILogger<ProductsController>> _mockLogger;

        public ProductsControllerTests()
        {
            _mockHttpHandler = new Mock<HttpMessageHandler>();
            _httpClient = new HttpClient(_mockHttpHandler.Object)
            {
                BaseAddress = new Uri("https://dummyjson.com/")
            };
            _cache = new MemoryCache(new MemoryCacheOptions());
            _mockLogger = new Mock<ILogger<ProductsController>>();
            _controller = new ProductsController(_httpClient, _mockLogger.Object, _cache);
        }

        [Fact]
        public async Task GetProducts_ReturnsOkResult_WithProducts()
        {
            // Arrange
            var mockResponse = @"{
                ""products"": [
                    {
                        ""id"": 1,
                        ""title"": ""iPhone 9"",
                        ""description"": ""An apple mobile"",
                        ""price"": 549,
                        ""thumbnail"": ""https://example.com/thumb.jpg"",
                        ""rating"": 4.5,
                        ""brand"": ""Apple"",
                        ""category"": ""smartphones""
                    }
                ],
                ""total"": 100,
                ""skip"": 0,
                ""limit"": 10
            }";

            _mockHttpHandler
                .Protected()
                .Setup<Task<HttpResponseMessage>>(
                    "SendAsync",
                    ItExpr.IsAny<HttpRequestMessage>(),
                    ItExpr.IsAny<CancellationToken>())
                .ReturnsAsync(new HttpResponseMessage
                {
                    StatusCode = HttpStatusCode.OK,
                    Content = new StringContent(mockResponse)
                });

            // Act
            var result = await _controller.GetProducts(null, 1);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
            
            // Verify logging occurred
            _mockLogger.Verify(
                x => x.Log(
                    LogLevel.Information,
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((v, t) => v.ToString().Contains("Getting products")),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception, string>>()),
                Times.Once);
        }

        [Fact]
        public async Task GetProducts_WithSearch_CallsCorrectEndpoint()
        {
            // Arrange
            var searchTerm = "phone";
            HttpRequestMessage capturedRequest = null;

            _mockHttpHandler
                .Protected()
                .Setup<Task<HttpResponseMessage>>(
                    "SendAsync",
                    ItExpr.IsAny<HttpRequestMessage>(),
                    ItExpr.IsAny<CancellationToken>())
                .Callback<HttpRequestMessage, CancellationToken>((request, _) =>
                {
                    capturedRequest = request;
                })
                .ReturnsAsync(new HttpResponseMessage
                {
                    StatusCode = HttpStatusCode.OK,
                    Content = new StringContent(@"{""products"": [], ""total"": 0, ""skip"": 0, ""limit"": 10}")
                });

            // Act
            await _controller.GetProducts(searchTerm, 1);

            // Assert
            Assert.NotNull(capturedRequest);
            Assert.Contains($"search?q={searchTerm}", capturedRequest.RequestUri.ToString());
        }

        [Fact]
        public async Task GetProduct_UsesCacheOnSecondCall()
        {
            // Arrange
            var productId = 1;
            var mockResponse = @"{
                ""id"": 1,
                ""title"": ""Test Product"",
                ""description"": ""Test Description"",
                ""price"": 99.99,
                ""thumbnail"": ""https://example.com/thumb.jpg"",
                ""rating"": 4.5,
                ""brand"": ""TestBrand"",
                ""category"": ""TestCategory""
            }";

            var callCount = 0;
            _mockHttpHandler
                .Protected()
                .Setup<Task<HttpResponseMessage>>(
                    "SendAsync",
                    ItExpr.IsAny<HttpRequestMessage>(),
                    ItExpr.IsAny<CancellationToken>())
                .ReturnsAsync(() =>
                {
                    callCount++;
                    return new HttpResponseMessage
                    {
                        StatusCode = HttpStatusCode.OK,
                        Content = new StringContent(mockResponse)
                    };
                });

            // Act - First call should hit the API
            var result1 = await _controller.GetProduct(productId);
            // Second call should use cache
            var result2 = await _controller.GetProduct(productId);

            // Assert
            Assert.IsType<OkObjectResult>(result1);
            Assert.IsType<OkObjectResult>(result2);
            Assert.Equal(1, callCount); // API should only be called once
            
            // Verify cache was used (logged)
            _mockLogger.Verify(
                x => x.Log(
                    LogLevel.Information,
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((v, t) => v.ToString().Contains("Returning cached product")),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception, string>>()),
                Times.Once);
        }

        [Fact]
        public async Task GetProduct_ReturnsNotFound_WhenProductDoesNotExist()
        {
            // Arrange
            _mockHttpHandler
                .Protected()
                .Setup<Task<HttpResponseMessage>>(
                    "SendAsync",
                    ItExpr.IsAny<HttpRequestMessage>(),
                    ItExpr.IsAny<CancellationToken>())
                .ReturnsAsync(new HttpResponseMessage
                {
                    StatusCode = HttpStatusCode.NotFound
                });

            // Act
            var result = await _controller.GetProduct(999);

            // Assert
            var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
            Assert.NotNull(notFoundResult.Value);
        }

        [Fact]
        public async Task GetProducts_HandlesApiError_ReturnsServerError()
        {
            // Arrange
            _mockHttpHandler
                .Protected()
                .Setup<Task<HttpResponseMessage>>(
                    "SendAsync",
                    ItExpr.IsAny<HttpRequestMessage>(),
                    ItExpr.IsAny<CancellationToken>())
                .ThrowsAsync(new HttpRequestException("Network error"));

            // Act
            var result = await _controller.GetProducts(null, 1);

            // Assert
            var statusResult = Assert.IsType<ObjectResult>(result);
            Assert.Equal(500, statusResult.StatusCode);
            
            // Verify error was logged
            _mockLogger.Verify(
                x => x.Log(
                    LogLevel.Error,
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((v, t) => v.ToString().Contains("Error fetching products")),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception, string>>()),
                Times.Once);
        }
    }
}