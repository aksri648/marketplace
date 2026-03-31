import { useState, useEffect } from 'react';
import api from '../utils/api';

export default function Dashboard() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadMyAds(); }, []);

  const loadMyAds = async () => {
    try {
      const res = await api.get('/ads?limit=100');
      const token = localStorage.getItem('token');
      const payload = token ? JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))) : null;
      if (payload) {
        const myAds = res.data.ads.filter(ad => ad.seller_id === payload.sub);
        setAds(myAds);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkSold = async (id) => {
    try {
      await api.patch(`/ads/${id}`, { status: 'sold' });
      setAds(prev => prev.map(ad => ad.id === id ? { ...ad, status: 'sold' } : ad));
    } catch (err) {
      alert('Failed to update ad');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this ad?')) return;
    try {
      await api.delete(`/ads/${id}`);
      setAds(prev => prev.filter(ad => ad.id !== id));
    } catch (err) {
      alert('Failed to delete ad');
    }
  };

  const activeCount = ads.filter(ad => ad.status === 'active').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-200 border-t-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">My Ads</h2>
        <span className="text-sm bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full font-medium">
          {activeCount}/5 active
        </span>
      </div>

      {ads.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-xl font-semibold text-gray-700">No ads yet</h3>
          <p className="text-gray-500 mt-2">Post your first ad to get started!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {ads.map((ad) => (
            <div key={ad.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex gap-4 items-center">
              <img
                src={ad.image_urls?.[0] || 'https://placehold.co/80x80?text=No+Img'}
                alt={ad.title}
                className="w-20 h-20 object-cover rounded-xl flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-800 truncate">{ad.title}</h3>
                <p className="text-indigo-600 font-bold mt-0.5">₹{ad.price?.toLocaleString()}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">{ad.category}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    ad.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {ad.status}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2 flex-shrink-0">
                {ad.status === 'active' && (
                  <button onClick={() => handleMarkSold(ad.id)}
                    className="text-xs bg-amber-50 hover:bg-amber-100 text-amber-700 px-3 py-1.5 rounded-lg transition-colors">
                    Mark Sold
                  </button>
                )}
                <button onClick={() => handleDelete(ad.id)}
                  className="text-xs bg-rose-50 hover:bg-rose-100 text-rose-600 px-3 py-1.5 rounded-lg transition-colors">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
