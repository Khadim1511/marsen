import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Menu, X, Heart, MessageCircle, User, LogOut, LayoutDashboard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const Header = ({ openAuthModal }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { user, signOut, isVendor } = useAuth();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setIsMenuOpen(false);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleSignOut = async () => {
    await signOut();
    setIsMenuOpen(false);
    navigate('/');
  };

  const dashboardLink = isVendor ? "/dashboard" : "/client-dashboard";

  return (
    <header className="bg-white/80 backdrop-blur-lg shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2" onClick={() => setIsMenuOpen(false)}>
            <img src="https://horizons-cdn.hostinger.com/a528ae19-b5b0-4f31-aad1-9df6ba79c534/f0b435001225453c748cfa35cfd7c7da.png" alt="Marsen Logo" className="h-12 w-auto" />
          </Link>

          {/* Desktop Search */}
          <div className="hidden md:flex flex-1 max-w-xl mx-8">
            <form onSubmit={handleSearch} className="w-full relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un produit, un vendeur..."
                className="search-input pr-14 !py-3"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 marsen-yellow rounded-lg hover:bg-yellow-400 transition-colors"
              >
                <Search className="w-5 h-5 text-black" />
              </button>
            </form>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-2 lg:space-x-4">
            <Link to="/favorites" className="p-3 rounded-full hover:bg-gray-100 transition-colors">
              <Heart className="w-6 h-6 text-gray-600" />
            </Link>
            <Link to="/chat" className="p-3 rounded-full hover:bg-gray-100 transition-colors">
              <MessageCircle className="w-6 h-6 text-gray-600" />
            </Link>
            {user ? (
              <>
                <Link to={dashboardLink} className="btn-secondary !py-3 !px-5">
                  Dashboard
                </Link>
                <button onClick={handleSignOut} className="p-3 rounded-full hover:bg-red-100 transition-colors">
                  <LogOut className="w-6 h-6 text-red-500" />
                </button>
              </>
            ) : (
              <>
                <button onClick={() => openAuthModal()} className="btn-secondary !py-3 !px-5">
                  Connexion
                </button>
                <Link to="/dashboard" className="btn-primary !py-3 !px-5">
                  Espace Vendeur
                </Link>
              </>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden absolute top-full left-0 w-full bg-white shadow-lg border-t border-gray-100"
          >
            <div className="p-4">
              <form onSubmit={handleSearch} className="relative mb-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un produit..."
                  className="search-input pr-12"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 marsen-yellow rounded-lg hover:bg-yellow-400 transition-colors"
                >
                  <Search className="w-5 h-5 text-black" />
                </button>
              </form>
              <nav className="space-y-2">
                {user ? (
                  <>
                    <Link
                      to={dashboardLink}
                      className="flex items-center space-x-4 p-4 rounded-xl hover:bg-gray-50 transition-colors text-lg font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <LayoutDashboard className="w-6 h-6 text-gray-600" />
                      <span>Dashboard</span>
                    </Link>
                    <Link
                      to="/favorites"
                      className="flex items-center space-x-4 p-4 rounded-xl hover:bg-gray-50 transition-colors text-lg font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Heart className="w-6 h-6 text-gray-600" />
                      <span>Mes Favoris</span>
                    </Link>
                    <Link
                      to="/chat"
                      className="flex items-center space-x-4 p-4 rounded-xl hover:bg-gray-50 transition-colors text-lg font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <MessageCircle className="w-6 h-6 text-gray-600" />
                      <span>Messages</span>
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center space-x-4 p-4 rounded-xl hover:bg-red-50 transition-colors text-lg font-medium text-red-600"
                    >
                      <LogOut className="w-6 h-6" />
                      <span>Déconnexion</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => { openAuthModal(); setIsMenuOpen(false); }}
                      className="w-full flex items-center space-x-4 p-4 rounded-xl hover:bg-gray-50 transition-colors text-lg font-medium"
                    >
                      <User className="w-6 h-6 text-gray-600" />
                      <span>Connexion / Inscription</span>
                    </button>
                    <Link
                      to="/dashboard"
                      className="flex items-center space-x-4 p-4 rounded-xl hover:bg-gray-50 transition-colors text-lg font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <LayoutDashboard className="w-6 h-6 text-gray-600" />
                      <span>Espace Vendeur</span>
                    </Link>
                  </>
                )}
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;