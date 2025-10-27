import { Link } from 'react-router-dom';
import { formatRating } from '../utils/formatters';
import type { Product } from '../types/product';
import './ProductCard.scss';

interface ProductCardProps {
  product: Product;
  onClick: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onClick }) => {
  const rating = formatRating(product.rating);
  
  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent opening drawer if clicking on the link
    if ((e.target as HTMLElement).closest('.product-card__link-button')) {
      return;
    }
    onClick(product);
  };

  return (
    <div className="product-card" onClick={handleCardClick} role="button" tabIndex={0}>
      <img src={product.thumbnail} alt={product.title} className="product-card__image" />
      <div className="product-card__info">
        <h3 className="product-card__title">{product.title}</h3>
        <div className="product-card__container">
          <p className="product-card__brand">{product.brand}</p>
          <div className="product-card__rating">
            {rating.stars}
            <span>{rating.value}</span>
          </div>
        </div>
        <div className="product-card__container">
          <div className="product-card__price">{product.price}</div>
          <div className="product-card__actions">
            <Link
              to={`/product/${product.id}`}
              className="product-card__link-button"
              onClick={(e) => e.stopPropagation()}
            >
              View Details →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};