import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useProduct } from '../hooks/useProduct';
import { useDrawer } from '../hooks/useDrawer';
import { formatRating } from '../utils/formatters';
import './ProductDetail.scss';

interface ProductDetailProps {
  productId: number;
  onClose: () => void;
}

export const ProductDetail: React.FC<ProductDetailProps> = ({ productId, onClose }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const { data: product, isLoading, error } = useProduct(productId);
  
  // Use the custom drawer hook for animation management
  const { isDrawerOpen, handleClose: handleDrawerClose, transitionDuration } = useDrawer(true);

  const handleClose = () => {
    handleDrawerClose();
    // Wait for CSS animation to complete before calling onClose
    setTimeout(() => {
      onClose();
    }, transitionDuration);
  };

  const handleAddToCart = () => {
    if (product) {
      // TODO: Implement actual cart functionality when cart system is ready
      console.log('Add to cart:', product);
    }
  };

  // Reset image loaded state when product changes
  useEffect(() => {
    setImageLoaded(false);
  }, [productId]);

  return (
    <>
      <div
        className={`product-drawer-overlay ${isDrawerOpen ? 'product-drawer-overlay--open' : ''}`}
        onClick={handleClose}
      />
      <div className={`product-drawer ${isDrawerOpen ? 'product-drawer--open' : ''}`}>
        <button className="product-detail__close" onClick={handleClose} aria-label="Close">
          &times;
        </button>
        <div className="product-detail">
          {isLoading ? (
            <div className="product-detail__loading">
              <div className="product-detail__loading-spinner">Loading...</div>
            </div>
          ) : error ? (
            <div className="product-detail__error">
              <h3>Error loading product</h3>
              <p>{error instanceof Error ? error.message : 'An unexpected error occurred'}</p>
              <button onClick={handleClose} className="product-detail__error-button">
                Close
              </button>
            </div>
          ) : product ? (
            <>
              <div className="product-detail__image-wrapper">
                {!imageLoaded && (
                  <div className="product-detail__image-placeholder" />
                )}
                <Link to={`/product/${product.id}`} className="product-detail__image-link">
                  <img
                    src={product.thumbnail}
                    alt={product.title}
                    className={`product-detail__image ${imageLoaded ? 'product-detail__image--loaded' : ''}`}
                    onLoad={() => setImageLoaded(true)}
                  />
                </Link>
              </div>
              <div className="product-detail__info">
                <Link to={`/product/${product.id}`} className="product-detail__title-link">
                  <h2 className="product-detail__title">{product.title}</h2>
                </Link>
                <p className="product-detail__brand">{product.brand}</p>
                <div className="product-detail__price">{product.price}</div>
                <p className="product-detail__description">{product.description}</p>
                <div className="product-detail__rating">
                  {formatRating(product.rating).stars}
                  <span>{formatRating(product.rating).value}</span>
                </div>
                {product.stock !== undefined && (
                  <div className={`product-detail__stock ${
                    product.stock > 0 ? 'product-detail__stock--in-stock' : 'product-detail__stock--out-of-stock'
                  }`}>
                    {product.stock > 0 ? `${product.stock} in stock` : 'Currently out of stock'}
                  </div>
                )}
                <div className="product-detail__actions">
                  <button
                    className="product-detail__add-to-cart"
                    onClick={handleAddToCart}
                    disabled={product.stock === 0}
                  >
                    Add to Cart
                  </button>
                  <Link to={`/product/${product.id}`} className="product-detail__view-full">
                    View Full Details →
                  </Link>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </>
  );
};