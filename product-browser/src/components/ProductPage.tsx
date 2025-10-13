import React, { useState } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import { useScrollLock } from '../hooks/useScrollLock';
import { SearchBar } from './SearchBar';
import { ProductDetail } from './ProductDetail';
import { ProductList } from './ProductList';
import { Page } from './Page';
import type { Product } from '../types/product';
import './ProductPage.scss';

export const ProductPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  
  const debouncedSearch = useDebounce(search, 500);
  
  useScrollLock(!!selectedProductId);

  const handleSearchChange = (value: string) => {
    setSearch(value);
  };

  const handleProductClick = (product: Product) => {
    setSelectedProductId(product.id);
  };

  const handleCloseDetail = () => {
    setSelectedProductId(null);
  };

  const content = (
    <>
      <SearchBar 
        value={search} 
        onChange={handleSearchChange}
      />
      
      <ProductList
        search={debouncedSearch}
        onProductClick={handleProductClick}
      />
      
      {selectedProductId && (
        <ProductDetail
          productId={selectedProductId}
          onClose={handleCloseDetail}
        />
      )}
    </>
  );

  return <Page className="product-page" header="Product Browser" content={content} />;
};