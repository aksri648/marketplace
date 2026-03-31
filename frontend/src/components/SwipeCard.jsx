import TinderCard from 'react-tinder-card';

export default function SwipeCard({ ad, onSwipe, onClick }) {
  const imageUrl = ad.image_urls?.[0] || 'https://placehold.co/400x300?text=No+Image';

  return (
    <TinderCard
      onSwipe={(dir) => onSwipe(dir, ad)}
      preventSwipe={['up', 'down']}
      className="absolute"
    >
      <div
        className="w-80 bg-white rounded-2xl shadow-xl overflow-hidden cursor-pointer select-none"
        onClick={() => onClick(ad)}
        style={{ touchAction: 'none' }}
      >
        <div className="relative h-64">
          <img
            src={imageUrl}
            alt={ad.title}
            className="w-full h-full object-cover"
            draggable={false}
          />
          <span className="absolute top-3 left-3 bg-indigo-600 text-white text-xs px-2 py-1 rounded-full">
            {ad.category}
          </span>
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-gray-800 text-lg truncate">{ad.title}</h3>
          <p className="text-indigo-600 font-bold text-xl mt-1">₹{ad.price?.toLocaleString()}</p>
          <p className="text-gray-500 text-sm mt-1 line-clamp-2">{ad.description}</p>
        </div>
      </div>
    </TinderCard>
  );
}
