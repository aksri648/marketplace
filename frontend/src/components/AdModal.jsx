import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function AdModal({ ad, onClose, onWishlistToggle, isInWishlist }) {
  const { isAuthenticated } = useAuth();
  const [activeImg, setActiveImg] = useState(0);
  const [showContactForm, setShowContactForm] = useState(false);
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const images = ad.image_urls?.length > 0 ? ad.image_urls : ['https://placehold.co/400x300?text=No+Image'];

  const handleContact = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const res = await api.post('/contact', { ad_id: ad.id, buyer_name: buyerName, buyer_phone: buyerPhone });
      window.open(res.data.whatsapp_link, '_blank');
      setShowContactForm(false);
    } catch (err) {
      alert('Failed to get contact details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="relative">
          <img src={images[activeImg]} alt={ad.title} className="w-full h-64 object-cover rounded-t-2xl" />
          <button onClick={onClose} className="absolute top-3 right-3 bg-white/80 hover:bg-white rounded-full p-1.5 text-gray-700">
            ✕
          </button>
        </div>
        {images.length > 1 && (
          <div className="flex gap-2 p-3 overflow-x-auto">
            {images.map((url, i) => (
              <img key={i} src={url} alt="" onClick={() => setActiveImg(i)}
                className={`w-16 h-16 object-cover rounded-lg cursor-pointer border-2 ${i === activeImg ? 'border-indigo-500' : 'border-transparent'}`} />
            ))}
          </div>
        )}
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xl font-bold text-gray-800">{ad.title}</h2>
            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full whitespace-nowrap">{ad.category}</span>
          </div>
          <p className="text-2xl font-bold text-indigo-600 mt-2">₹{ad.price?.toLocaleString()}</p>
          <p className="text-gray-600 mt-3 text-sm leading-relaxed">{ad.description}</p>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">Seller: <span className="text-gray-700 font-medium">{ad.seller_name || 'Anonymous'}</span></p>
          </div>
          {showContactForm && (
            <div className="mt-4 p-4 bg-gray-50 rounded-xl space-y-3">
              <input value={buyerName} onChange={e => setBuyerName(e.target.value)} placeholder="Your name"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400" />
              <input value={buyerPhone} onChange={e => setBuyerPhone(e.target.value)} placeholder="Your phone (optional)"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400" />
              <button onClick={handleContact} disabled={loading || !buyerName}
                className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium transition-colors">
                {loading ? 'Opening...' : 'Open WhatsApp'}
              </button>
            </div>
          )}
          <div className="flex gap-3 mt-4">
            {isAuthenticated && (
              <>
                <button onClick={() => onWishlistToggle(ad.id)}
                  className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition-colors ${isInWishlist ? 'bg-rose-100 text-rose-600 hover:bg-rose-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  {isInWishlist ? '♥ Saved' : '♡ Save'}
                </button>
                <button onClick={() => setShowContactForm(!showContactForm)}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-xl font-medium text-sm transition-colors">
                  Chat on WhatsApp
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
