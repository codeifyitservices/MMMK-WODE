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
    if (!product.title) return 'MMMK Luxury Product';
    if (typeof product.title === 'string') return product.title;
    return product.title.en || product.title.ar || 'MMMK Luxury Product';
  };

  return (
    <div className="space-y-6 animate-fadeIn font-['Poppins',sans-serif]">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-2 border-b border-white/5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Product Catalog & Trackable Links</span>
            <span className="px-2 py-0.5 rounded-full bg-[#dfba73]/15 border border-[#dfba73]/30 text-[#dfba73] text-[11px] font-semibold">
              Instant Commission
            </span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Browse items, generate product-specific referral links, and earn 10% on every checkout.
          </p>
        </div>

        {/* Search bar */}
        <div className="w-full md:w-80 relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
            <Search size={15} />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by title or keyword..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#121217] border border-white/10 rounded-xl text-white text-xs placeholder-gray-500 focus:outline-none focus:border-[#dfba73] focus:ring-1 focus:ring-[#dfba73] transition-all"
          />
        </div>
      </div>

      {/* Benefits Notice */}
      <div className="bg-[#101016] border border-white/5 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#dfba73]/10 text-[#dfba73]">
            <Sparkles size={16} />
          </div>
          <div>
            <span className="text-white font-medium">Automatic Link Attribution</span>
            <p className="text-gray-400 text-[11px]">
              Every link copied below includes your referral tag (<span className="text-[#dfba73] font-mono">?ref={referralCode}</span>). Any follower clicking gets an instant 20% discount.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[11px] shrink-0">
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <Coins size={13} /> Your Cut: 10% Cash
          </span>
          <span className="text-[#dfba73] font-semibold flex items-center gap-1">
            <Percent size={13} /> Buyer Saves: 20%
          </span>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <div className="w-10 h-10 border-2 border-[#dfba73] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs uppercase tracking-wider text-[#dfba73]">
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
                className="bg-[#0f0f15] border border-white/5 hover:border-[#dfba73]/40 rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-300 group shadow-lg"
              >
                {/* Product Image Box */}
                <div className="relative aspect-square bg-[#15151c] overflow-hidden">
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
                  <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-md border border-[#dfba73]/40 text-[#dfba73] text-[10px] font-semibold">
                    20% OFF Code Applied
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="text-xs font-semibold text-white line-clamp-2 group-hover:text-[#dfba73] transition-colors">
                      {title}
                    </h3>

                    {/* Pricing Breakdown */}
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400 text-[11px]">Follower Price:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="line-through text-gray-500 text-[11px]">
                            AED {rawPrice}
                          </span>
                          <span className="text-white font-bold">
                            AED {discountedPrice}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
                        <span className="text-emerald-400 font-medium text-[11px]">
                          Your Commission:
                        </span>
                        <span className="text-emerald-400 font-bold">
                          +AED {estCommission}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 space-y-2">
                    <button
                      onClick={() => handleCopyProductLink(product)}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md ${
                        isCopied
                          ? 'bg-emerald-500 text-black'
                          : 'bg-[#dfba73] hover:bg-[#cda458] text-black shadow-[#dfba73]/15'
                      }`}
                    >
                      {isCopied ? <Check size={13} /> : <Copy size={13} />}
                      <span>{isCopied ? 'Link Copied!' : 'Copy Referral Link'}</span>
                    </button>

                    <a
                      href={`/product-details/${product._id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-1.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-[11px] flex items-center justify-center gap-1.5 transition-colors"
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
        <div className="bg-[#0f0f15] border border-white/5 rounded-2xl py-16 text-center text-gray-500">
          <Package size={36} className="mx-auto text-gray-600 mb-2" />
          <p className="text-sm font-medium text-gray-400">No products found matching your search.</p>
          <p className="text-xs text-gray-600 mt-1">Try searching for other perfume or oud collections.</p>
        </div>
      )}

      {/* Pagination Controls */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-white/5 text-xs text-gray-400">
          <div>
            Showing Page <span className="text-white font-medium">{pagination.page}</span> of{' '}
            <span className="text-white font-medium">{pagination.pages}</span> ({pagination.total} items)
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchProducts(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-1.5 rounded-lg bg-[#14141b] border border-white/10 hover:border-white/20 disabled:opacity-40 disabled:cursor-not-allowed text-white"
            >
              Previous
            </button>
            <button
              onClick={() => fetchProducts(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className="px-3 py-1.5 rounded-lg bg-[#14141b] border border-white/10 hover:border-white/20 disabled:opacity-40 disabled:cursor-not-allowed text-white"
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
