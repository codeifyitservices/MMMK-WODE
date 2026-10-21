import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Package,
  Percent,
  Coins,
} from 'lucide-react';
import { Input, Button, Tag, message } from 'antd';
import { getInfluencerProductsApi } from '../../apis/influencer/client';
import { useInfluencerAuth } from '../../context/InfluencerAuthProvider';

const InfluencerProductsPage = () => {
  const { influencer } = useInfluencerAuth();
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 12 });
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  const referralCode = influencer?.referralCode || 'PARTNER';

  // Handle debounce on search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchProducts = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        const res = await getInfluencerProductsApi({
          page,
          limit: 12,
          search: debouncedSearch,
        });

        if (res.success && res.data) {
          setProducts(res.data.products || []);
          if (res.data.pagination) {
            setPagination(res.data.pagination);
          }
        }
      } catch (err) {
        console.error('Failed to load influencer products:', err);
      } finally {
        setLoading(false);
      }
    },
    [debouncedSearch]
  );

  useEffect(() => {
    fetchProducts(1);
  }, [fetchProducts]);

  const handleCopyProductLink = (product) => {
    const link =
      product.referralLink ||
      `${window.location.origin}/product-details/${product._id}?ref=${referralCode}`;

    navigator.clipboard.writeText(link);
    setCopiedId(product._id);
    message.success('Product trackable referral link copied!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const resolveImage = (product) => {
    const raw =
      product.images?.[0]?.url ||
      product.images?.[0] ||
      product.image?.url ||
      product.image;

    if (!raw) return 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80';
    if (typeof raw === 'string') {
      if (raw.startsWith('http')) return raw;
      const cleanPath = raw.replace(/^\/+/, '');
      return `https://mmmk-wode.com/${cleanPath}`;
    }
    return 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80';
  };

  const getTitle = (product) => {
    if (!product.title) return 'MMMK Luxury Jewelry';
    if (typeof product.title === 'string') return product.title;
    return product.title.en || product.title.ar || 'MMMK Luxury Jewelry';
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Products & Trackable Links
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[#8d6f30] text-xs font-semibold">
              10% Commission
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Browse the product catalog, generate product-specific referral links, and earn on every checkout.
          </p>
        </div>

        {/* Search bar */}
        <div className="w-full md:w-80">
          <Input
            prefix={<Search size={15} className="text-gray-400 mr-1" />}
            placeholder="Search jewelry by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
            size="large"
            className="rounded-lg shadow-sm"
          />
        </div>
      </div>

      {/* Benefits Notice */}
      <div className="bg-gradient-to-r from-amber-50/70 via-white to-amber-50/40 border border-amber-200/80 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#dfba73]/20 text-[#8d6f30]">
            <Sparkles size={16} />
          </div>
          <div>
            <span className="text-gray-900 font-semibold">Automatic Referral Tagging</span>
            <p className="text-gray-500 text-[11px] mt-0.5">
              Every link copied includes your referral code (<span className="text-[#8d6f30] font-mono font-bold">?ref={referralCode}</span>). Your shoppers automatically unlock an instant 20% discount.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs shrink-0 font-medium">
          <span className="px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center gap-1">
            <Coins size={13} /> You Earn: 10% Cash
          </span>
          <span className="px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-[#8d6f30] flex items-center gap-1 font-semibold">
            <Percent size={13} /> Follower Saves: 20%
          </span>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <div className="w-9 h-9 border-2 border-[#8d6f30] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">
            Loading Products & Link Generators...
          </p>
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
          {products.map((product) => {
            const rawPrice = product.price || 0;
            const discountedPrice = Number((rawPrice * 0.8).toFixed(2));
            const estCommission = Number((discountedPrice * 0.1).toFixed(2));
            const isCopied = copiedId === product._id;
            const title = getTitle(product);
            const imageUrl = resolveImage(product);

            return (
              <div
                key={product._id}
                className="bg-white border border-gray-200/80 hover:border-[#dfba73]/70 rounded-xl overflow-hidden flex flex-col justify-between transition-all duration-300 group shadow-sm hover:shadow-md hover:-translate-y-1"
              >
                {/* Product Image Box */}
                <div className="relative aspect-square bg-gray-50 overflow-hidden">
                  <img
                    src={imageUrl}
                    alt={title}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    onError={(e) => {
                      e.target.src =
                        'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80';
                    }}
                  />
                  <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-white/95 backdrop-blur-md border border-amber-200 shadow-sm text-[#8d6f30] text-[10px] font-bold">
                    20% OFF Code Ready
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="text-xs font-semibold text-gray-900 line-clamp-2 group-hover:text-[#8d6f30] transition-colors leading-relaxed">
                      {title}
                    </h3>

                    {/* Pricing Breakdown */}
                    <div className="mt-2.5 space-y-1 bg-gray-50/80 p-2.5 rounded-lg border border-gray-100">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 text-[11px]">Follower Price:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="line-through text-gray-400 text-[11px]">
                            AED {rawPrice}
                          </span>
                          <span className="text-gray-900 font-bold">
                            AED {discountedPrice}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-200/60">
                        <span className="text-emerald-700 font-medium text-[11px]">
                          Your Commission:
                        </span>
                        <span className="text-emerald-700 font-bold">
                          +AED {estCommission}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-1 space-y-2">
                    <button
                      onClick={() => handleCopyProductLink(product)}
                      className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 ${
                        isCopied
                          ? 'bg-emerald-600 text-white'
                          : 'bg-[#dfba73] hover:bg-[#cfa557] text-black shadow-amber-200/50'
                      }`}
                    >
                      {isCopied ? <Check size={13} /> : <Copy size={13} />}
                      <span>{isCopied ? 'Link Copied!' : 'Copy Referral Link'}</span>
                    </button>

                    <a
                      href={`/product-details/${product._id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-1.5 px-3 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-900 text-[11px] flex items-center justify-center gap-1.5 transition-colors border border-gray-200"
                    >
                      <span>Preview Product</span>
                      <ExternalLink size={11} />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-gray-200/80 rounded-xl py-16 text-center text-gray-500 shadow-sm">
          <Package size={36} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm font-semibold text-gray-700">No products found matching your search.</p>
          <p className="text-xs text-gray-400 mt-0.5">Try searching for other jewelry or collection keywords.</p>
        </div>
      )}

      {/* Pagination Controls */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 text-xs text-gray-500">
          <div>
            Showing Page <span className="text-gray-900 font-semibold">{pagination.page}</span> of{' '}
            <span className="text-gray-900 font-semibold">{pagination.pages}</span> ({pagination.total} items)
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchProducts(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3.5 py-1.5 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700 font-medium shadow-sm transition-all"
            >
              Previous
            </button>
            <button
              onClick={() => fetchProducts(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className="px-3.5 py-1.5 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700 font-medium shadow-sm transition-all"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InfluencerProductsPage;
