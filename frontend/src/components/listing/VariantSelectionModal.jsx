/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from 'react';
import { Modal } from 'antd';
import { Minus, Plus } from 'lucide-react';
import { cn } from '../../utils/cn';
import OptimizedProductImage from './OptimizedProductImage';

const VariantSelectionModal = ({
  open,
  product,
  variants = [],
  loading = false,
  addLoading = false,
  onCancel,
  onAddToCart,
  formatPrice,
  common = {},
}) => {
  const [selectedSku, setSelectedSku] = useState(null);
  const [quantity, setQuantity] = useState(1);

  const filters = Array.isArray(product?.filters) ? product.filters : [];
  const selectedVariant = useMemo(
    () => variants.find((variant) => variant.sku === selectedSku),
    [selectedSku, variants]
  );
  const selectedStock = Number(selectedVariant?.quantity || 0);
  const canAdd = Boolean(selectedVariant) && selectedStock > 0 && quantity > 0;
  const productImage =
    selectedVariant?.image ||
    product?.thumbnail ||
    product?.image ||
    product?.images?.[0];

  useEffect(() => {
    if (!open) return;
    const firstAvailable = variants.find((variant) => Number(variant?.quantity || 0) > 0);
    setSelectedSku(firstAvailable?.sku || null);
    setQuantity(1);
  }, [open, variants]);

  const getVariantLabel = (variant) => {
    if (!filters.length) return variant?.sku;
    return filters
      .map((filter) => variant?.filters?.[filter])
      .filter(Boolean)
      .join(' / ');
  };

  const incrementQuantity = () => {
    setQuantity((current) => Math.min(current + 1, selectedStock || 1));
  };

  const decrementQuantity = () => {
    setQuantity((current) => Math.max(current - 1, 1));
  };

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      centered
      width={680}
      destroyOnClose
      title={common.chooseOption || 'Choose option'}
      className="product-variant-modal"
    >
      <div className="grid gap-5 text-black md:grid-cols-[180px_1fr]">
        <div className="overflow-hidden border border-gray-200 bg-gray-100">
          {productImage ? (
            <OptimizedProductImage
              src={productImage}
              alt={product?.translated?.productName || product?.productName?.en || product?.productName}
              className="h-56 md:h-full"
              loading="eager"
              fetchPriority="high"
            />
          ) : (
            <div className="flex h-56 items-center justify-center text-xs italic text-gray-500">
              {common.itemUnavailable}
            </div>
          )}
        </div>

        <div className="min-w-0">
          <h3 className="text-base font-semibold">
            {product?.translated?.productName || product?.productName?.en || product?.productName}
          </h3>
          <p className="mt-1 text-sm font-semibold">
            {formatPrice?.(product?.websitePrice || product?.price || 0)}
          </p>

          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold uppercase text-gray-600">
              {filters.length ? filters.join(' / ') : common.chooseOption || 'Options'}
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {variants.map((variant) => {
                const isOutOfStock = Number(variant?.quantity || 0) <= 0;
                const isSelected = selectedSku === variant.sku;
                return (
                  <button
                    key={variant._id || variant.sku}
                    type="button"
                    disabled={isOutOfStock || addLoading}
                    onClick={() => {
                      setSelectedSku(variant.sku);
                      setQuantity(1);
                    }}
                    className={cn(
                      'border px-3 py-2 text-left text-xs transition focus:outline-none focus:ring-2 focus:ring-black',
                      isSelected ? 'border-black bg-black text-white' : 'border-gray-300 bg-white text-black hover:border-black',
                      isOutOfStock ? 'cursor-not-allowed opacity-45' : ''
                    )}
                  >
                    <span className="block font-semibold">{getVariantLabel(variant)}</span>
                    <span className="mt-1 block text-[11px]">
                      {isOutOfStock
                        ? common.outOfStock || 'Out of stock'
                        : `${variant.quantity} ${common.available || 'available'}`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center border border-black">
              <button
                type="button"
                aria-label={common.decreaseQuantity || 'Decrease quantity'}
                onClick={decrementQuantity}
                disabled={quantity <= 1 || addLoading || !selectedVariant}
                className="flex h-10 w-10 items-center justify-center disabled:opacity-40"
              >
                <Minus size={16} aria-hidden="true" />
              </button>
              <span className="min-w-10 px-3 text-center font-semibold">{quantity}</span>
              <button
                type="button"
                aria-label={common.increaseQuantity || 'Increase quantity'}
                onClick={incrementQuantity}
                disabled={!selectedVariant || quantity >= selectedStock || addLoading}
                className="flex h-10 w-10 items-center justify-center disabled:opacity-40"
              >
                <Plus size={16} aria-hidden="true" />
              </button>
            </div>

            <p className="text-xs text-gray-600">
              {selectedVariant
                ? selectedStock > 0
                  ? `${selectedStock} ${common.available || 'available'}`
                  : common.outOfStock || 'Out of stock'
                : common.chooseOption || 'Choose option'}
            </p>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              disabled={addLoading}
              className="border border-black px-5 py-2 text-sm font-semibold text-black transition hover:bg-black hover:text-white disabled:opacity-50"
            >
              {common.cancel || 'Cancel'}
            </button>
            <button
              type="button"
              disabled={!canAdd || loading || addLoading}
              onClick={() => onAddToCart?.({ sku: selectedSku, quantity })}
              className="border border-black bg-black px-5 py-2 text-sm font-semibold text-white transition hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              {addLoading ? common.adding || 'Adding...' : common.addToCart || 'Add to Cart'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default VariantSelectionModal;
