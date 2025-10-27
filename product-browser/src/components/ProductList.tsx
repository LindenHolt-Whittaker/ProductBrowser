import { useProducts } from '../hooks/useProducts';
import { usePagination } from '../hooks/usePagination';
import { ProductCard } from './ProductCard';
import { Pagination } from './Pagination';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import type { Product } from '../types/product';
import './ProductList.scss';

interface ProductListProps {
  search: string;
  onProductClick: (product: Product) => void;
}

export const ProductList: React.FC<ProductListProps> = ({
  search,
  onProductClick
}) => {
  // Use the custom pagination hook with automatic reset on search change
  const { page, setPage } = usePagination(search, 1);
  
  const { data, isLoading, error, refetch } = useProducts({
    page,
    search
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  if (error) {
    return (
      <ErrorMessage 
        message={error instanceof Error ? error.message : 'Failed to load products'} 
        onRetry={() => refetch()}
      />
    );
  }

  if (!data?.products || data.products.length === 0) {
    return (
      <div className="empty-state">
        <h3>No products found</h3>
        <p>Try adjusting your search terms</p>
      </div>
    );
  }

  return (
    <>
      <div className="product-grid">
        {data.products.map(product => (
          <ProductCard 
            key={product.id} 
            product={product} 
            onClick={onProductClick}
          />
        ))}
      </div>
      
      <Pagination 
        currentPage={data.page}
        totalPages={data.totalPages}
        onPageChange={setPage}
      />
    </>
  );
};