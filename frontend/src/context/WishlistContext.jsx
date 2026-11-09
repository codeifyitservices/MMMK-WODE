import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { notification } from 'antd';
import {
  addItemToWishList,
  getWishLists,
  removeItemFromWishList,
} from '../apis/user/wishList';
import { getStoredUserId } from '../utils/authStorage';
import { useTranslationContext } from './TranslationContext';

const WishlistContext = createContext(null);
const GUEST_WISHLIST_KEY = 'guestWishlist';

export const WishlistProvider = ({ children }) => {
  const queryClient = useQueryClient();
  const { content: { common } = {} } = useTranslationContext?.() || {};

  const [guestWishlist, setGuestWishlist] = useState(() => {
    try {
      const stored = localStorage.getItem(GUEST_WISHLIST_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const userId = getStoredUserId();

  const { data: userWishlistData, refetch } = useQuery({
    queryKey: ['wish-list', userId],
    queryFn: () => getWishLists(userId),
    enabled: Boolean(userId),
    staleTime: 60 * 1000,
  });

  // Local optimistic overrides: { [productId]: boolean }
  const [localOverrides, setLocalOverrides] = useState({});

  // Sync guest wishlist items to account once user logs in
  useEffect(() => {
    if (userId && guestWishlist.length > 0) {
      const syncItems = async () => {
        try {
          for (const pid of guestWishlist) {
            await addItemToWishList({ productId: pid, userId });
          }
          localStorage.removeItem(GUEST_WISHLIST_KEY);
          setGuestWishlist([]);
          queryClient.invalidateQueries({ queryKey: ['wish-list'] });
        } catch {
          // Ignore background sync errors
        }
      };
      syncItems();
    }
  }, [userId, guestWishlist, queryClient]);

  const serverWishlistIds = useMemo(() => {
    if (!userId) {
      return new Set(guestWishlist.map(String));
    }
    const items = Array.isArray(userWishlistData) ? userWishlistData : [];
    const ids = items
      .map((item) => {
        if (!item) return null;
        if (typeof item === 'string') return item;
        return item._id || item.productId || item.id || null;
      })
      .filter(Boolean)
      .map(String);
    return new Set(ids);
  }, [userId, userWishlistData, guestWishlist]);

  const isWishlisted = useCallback(
    (productId) => {
      if (!productId) return false;
      const pid = String(productId);
      if (typeof localOverrides[pid] === 'boolean') {
        return localOverrides[pid];
      }
      return serverWishlistIds.has(pid);
    },
    [localOverrides, serverWishlistIds]
  );

  const toggleWishlist = useCallback(
    async (productId, productName = '') => {
      if (!productId) return;
      const pid = String(productId);
      const currentlySaved = isWishlisted(pid);
      const nextSaved = !currentlySaved;

      // Immediate optimistic update for 0ms lag
      setLocalOverrides((prev) => ({ ...prev, [pid]: nextSaved }));

      if (!userId) {
        // Guest mode persistence
        try {
          const currentList = JSON.parse(
            localStorage.getItem(GUEST_WISHLIST_KEY) || '[]'
          );
          let updatedList;
          if (nextSaved) {
            updatedList = [...new Set([...currentList, pid])];
            notification.success({
              message: common?.wishlistAdded || 'Added to saved items',
              description: 'Sign in to access your saved items across devices.',
              placement: 'topRight',
            });
          } else {
            updatedList = currentList.filter((id) => String(id) !== pid);
            notification.info({
              message: common?.wishlistRemoved || 'Removed from saved items',
              placement: 'topRight',
            });
          }
          localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(updatedList));
          setGuestWishlist(updatedList);
        } catch {
          // Local storage unavailable
        }
        return;
      }

      // Logged in user persistence
      try {
        if (nextSaved) {
          await addItemToWishList({ productId: pid, userId });
          notification.success({
            message: common?.wishlistAdded || 'Added to wishlist successfully',
            placement: 'topRight',
          });
        } else {
          await removeItemFromWishList({ productId: pid, userId });
          notification.info({
            message: common?.wishlistRemoved || 'Removed from wishlist successfully',
            placement: 'topRight',
          });
        }
        queryClient.invalidateQueries({ queryKey: ['wish-list'] });
      } catch (error) {
        // Revert optimistic state on network failure
        setLocalOverrides((prev) => ({ ...prev, [pid]: currentlySaved }));
        notification.error({
          message: common?.wishlistAddFailed || 'Failed to update wishlist',
          placement: 'topRight',
        });
      }
    },
    [userId, isWishlisted, common, queryClient]
  );

  const value = useMemo(
    () => ({
      isWishlisted,
      toggleWishlist,
      refetchWishlist: refetch,
    }),
    [isWishlisted, toggleWishlist, refetch]
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    return {
      isWishlisted: () => false,
      toggleWishlist: () => {},
      refetchWishlist: () => {},
    };
  }
  return context;
};

export default WishlistContext;

