import { useState, useEffect } from 'react';
import AdModal from '../components/AdModal';
import api from '../utils/api';

export default function Wishlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAd, setSelectedAd] = useState(null);

  useEffect(() => { loadWishlist(); }, []);

  const loadWishlist = async () => {
    try {
      const res = await api.get('/wishlist');
      setItems(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (adId) => {
    try {
      const res = await api.post('/wishlist', { ad_id: adId });
      if (res.data.action === 'removed') {
        setItems(prev => prev.filter(item => item.ad_id !== adId));
        if (selectedAd?.id === adId) setSelectedAd(null);
      }
    } catch (err) {
      console.error(err);
    }
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
      <h2 className="text-2xl font-bold text-gray-800 mb-6">My Wishlist</h2>
      {items.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">💝</div>
          <h3 className="text-xl font-semibold text-gray-700">Nothing saved yet</h3>
          <p className="text-gray-500 mt-2">Swipe right on items you like!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              <img
                src={item.image_urls?.[0] || 'https://placehold.co/400x300?text=No+Image'}
                alt={item.title}
                className="w-full h-44 object-cover cursor-pointer"
                onClick={() => setSelectedAd({ ...item, id: item.ad_id })}
              />
              <div className="p-4">
                <h3 className="font-semibold text-gray-800 truncate">{item.title}</h3>
                <p className="text-indigo-600 font-bold mt-1">₹{item.price?.toLocaleString()}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full">{item.category}</span>
                  <button
                    onClick={() => handleToggle(item.ad_id)}
                    className="text-rose-500 hover:text-rose-700 text-sm font-medium transition-colors"
                  >
                    Remove ♥
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {selectedAd && (
        <AdModal
          ad={selectedAd}
          onClose={() => setSelectedAd(null)}
          onWishlistToggle={handleToggle}
          isInWishlist={true}
        />
      )}
    </div>
  );
}
