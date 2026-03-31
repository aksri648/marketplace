import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          ABES Marketplace
        </Link>
        {isAuthenticated && (
          <div className="flex items-center gap-4">
            <Link to="/" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">Home</Link>
            <Link to="/wishlist" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">Wishlist</Link>
            <Link to="/post-ad" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">Post Ad</Link>
            <Link to="/dashboard" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">Dashboard</Link>
            <button
              onClick={handleLogout}
              className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
