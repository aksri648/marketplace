import { useState, useEffect } from 'react';
import SwipeCard from '../components/SwipeCard';
import AdModal from '../components/AdModal';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAd, setSelectedAd] = useState(null);
  const [wishlist, setWishlist] = useState(new Set());
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { isAuthenticated } = useAuth();

  const loadWishlist = async () => {
    try {
      const res = await api.get('/wishlist');
      setWishlist(new Set(res.data.map(item => item.ad_id)));
    } catch (err) {
      console.error(err);
    }
  };

  const loadAds = async () => {
    try {
      const res = await api.get(`/ads?page=${page}&limit=20`);
      setAds(res.data.ads);
      setHasMore(res.data.pagination.page < res.data.pagination.pages);
      setPage(p => p + 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAds();
    if (isAuthenticated) loadWishlist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSwipe = async (direction, ad) => {
    setAds(prev => prev.filter(a => a.id !== ad.id));
    if (direction === 'right' && isAuthenticated) {
      try {
        await api.post('/wishlist', { ad_id: ad.id });
        setWishlist(prev => new Set([...prev, ad.id]));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleWishlistToggle = async (adId) => {
    if (!isAuthenticated) return;
    try {
      const res = await api.post('/wishlist', { ad_id: adId });
      if (res.data.action === 'added') {
        setWishlist(prev => new Set([...prev, adId]));
      } else {
        setWishlist(prev => { const s = new Set(prev); s.delete(adId); return s; });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleActionButton = (action) => {
    if (ads.length === 0) return;
    const topAd = ads[ads.length - 1];
    if (action === 'skip') handleSwipe('left', topAd);
    else if (action === 'like') handleSwipe('right', topAd);
    else if (action === 'view') setSelectedAd(topAd);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-200 border-t-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Discover Items</h2>
        <p className="text-gray-500 text-sm mt-1">Swipe right to save, left to skip</p>
      </div>

      {ads.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="text-xl font-semibold text-gray-700">All caught up!</h3>
          <p className="text-gray-500 mt-2">No more ads to show right now.</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-8">
          <div className="relative h-96 w-80">
            {ads.slice(-3).map((ad) => (
              <SwipeCard
                key={ad.id}
                ad={ad}
                onSwipe={handleSwipe}
                onClick={setSelectedAd}
              />
            ))}
          </div>
          <div className="flex items-center gap-6">
            <button onClick={() => handleActionButton('skip')}
              className="w-14 h-14 bg-white shadow-lg rounded-full flex items-center justify-center text-2xl hover:scale-110 transition-transform text-gray-500 border border-gray-100">
              ✕
            </button>
            <button onClick={() => handleActionButton('view')}
              className="w-12 h-12 bg-indigo-50 shadow rounded-full flex items-center justify-center text-lg hover:scale-110 transition-transform text-indigo-600 border border-indigo-100">
              👁
            </button>
            <button onClick={() => handleActionButton('like')}
              className="w-14 h-14 bg-white shadow-lg rounded-full flex items-center justify-center text-2xl hover:scale-110 transition-transform text-rose-500 border border-gray-100">
              ♥
            </button>
          </div>
          <p className="text-sm text-gray-400">{ads.length} item{ads.length !== 1 ? 's' : ''} remaining</p>
        </div>
      )}

      {selectedAd && (
        <AdModal
          ad={selectedAd}
          onClose={() => setSelectedAd(null)}
          onWishlistToggle={handleWishlistToggle}
          isInWishlist={wishlist.has(selectedAd.id)}
        />
      )}
    </div>
  );
}
