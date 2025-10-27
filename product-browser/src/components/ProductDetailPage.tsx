import { useParams, useNavigate, Link } from 'react-router-dom';
import { useProduct } from '../hooks/useProduct';
import { formatRating } from '../utils/formatters';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import { Page } from './Page';
import './ProductDetailPage.scss';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const productId = id ? parseInt(id, 10) : 0;
  
  const { data: product, isLoading, error } = useProduct(productId);

  const handleAddToCart = () => {
    if (product) {
      // TODO: Implement actual cart functionality when cart system is ready
      console.log('Add to cart:', product);
    }
  };

  const handleGoBack = () => {
    navigate('/');
  };

  let content: React.ReactNode;

  if (isLoading) {
    content = <LoadingSpinner />;
  } else if (error) {
    content = (
      <ErrorMessage 
        message={error instanceof Error ? error.message : 'Failed to load product'} 
        onRetry={() => window.location.reload()}
      />
    );
  } else if (product) {
    content = (
      <div className="product-detail-page">
        <div className="product-detail-page__back">
          <Link to="/" className="product-detail-page__back-link">
            ← Back to products
          </Link>
        </div>
        
        <div className="product-detail-page__content">
          <div className="product-detail-page__image-section">
            <img
              src={product.thumbnail}
              alt={product.title}
              className="product-detail-page__image"
            />
          </div>
          
          <div className="product-detail-page__info-section">
            <h1 className="product-detail-page__title">{product.title}</h1>
            <p className="product-detail-page__brand">by {product.brand}</p>
            
            <div className="product-detail-page__rating">
              {formatRating(product.rating).stars}
              <span className="product-detail-page__rating-value">
                {formatRating(product.rating).value}
              </span>
            </div>
            
            <div className="product-detail-page__price">${product.price}</div>
            
            <p className="product-detail-page__description">{product.description}</p>
            
            {product.stock !== undefined && (
              <div className={`product-detail-page__stock ${
                product.stock > 0 ? 'product-detail-page__stock--in-stock' : 'product-detail-page__stock--out-of-stock'
              }`}>
                {product.stock > 0 ? `${product.stock} in stock` : 'Currently out of stock'}
              </div>
            )}
            
            <div className="product-detail-page__actions">
              <button
                className="product-detail-page__add-to-cart"
                onClick={handleAddToCart}
                disabled={product.stock === 0}
              >
                Add to Cart
              </button>
              
              <button
                className="product-detail-page__back-button"
                onClick={handleGoBack}
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  } else {
    content = (
      <div className="product-detail-page__not-found">
        <h2>Product not found</h2>
        <Link to="/" className="product-detail-page__back-link">
          Back to products
        </Link>
      </div>
    );
  }

  return <Page className="product-detail-page-container" header="Product Details" content={content} />;
};