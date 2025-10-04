import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Phone, MessageCircle, Star, MapPin, Trash2, Loader2, User } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';

const FavoritesPage = () => {
  const [favoriteProducts, setFavoriteProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchFavorites = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data: favoritesData, error: favoritesError } = await supabase
        .from('favorites')
        .select('product_id')
        .eq('user_id', user.id);

      if (favoritesError) throw favoritesError;

      if (favoritesData.length === 0) {
        setFavoriteProducts([]);
        setLoading(false);
        return;
      }

      const productIds = favoritesData.map(f => f.product_id);

      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          id,
          name,
          price,
          image_urls,
          vendors (
            id,
            name,
            location,
            phone
          )
        `)
        .in('id', productIds);

      if (productsError) throw productsError;

      const formattedProducts = productsData.map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        image_url: (p.image_urls && p.image_urls.length > 0) ? p.image_urls[0] : null,
        vendor: p.vendors.name,
        vendorId: p.vendors.id,
        location: p.vendors.location,
        phone: p.vendors.phone,
        rating: (Math.random() * (5 - 4) + 4).toFixed(1), // Mock rating
      }));

      setFavoriteProducts(formattedProducts);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      toast({
        variant: "destructive",
        title: "Erreur de chargement",
        description: "Impossible de charger vos favoris.",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (!authLoading) {
      fetchFavorites();
    }
  }, [user, authLoading, fetchFavorites]);

  const handleContact = (type, product) => {
    if (type === 'phone') {
      window.open(`tel:${product.phone}`, '_self');
    } else if (type === 'whatsapp') {
      window.open(`https://wa.me/${product.phone.replace(/\D/g, '')}?text=Bonjour, je suis intéressé par ${product.name}`, '_blank');
    } else if (type === 'chat') {
      navigate('/chat');
    }
  };

  const removeFavorite = async (productId) => {
    if (!user) return;

    const previousFavorites = [...favoriteProducts];
    setFavoriteProducts(prev => prev.filter(p => p.id !== productId));

    const { error } = await supabase
      .from('favorites')
      .delete()
      .match({ user_id: user.id, product_id: productId });

    if (error) {
      setFavoriteProducts(previousFavorites);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de retirer le produit des favoris.",
      });
    } else {
      toast({
        title: "Retiré des favoris",
        description: "Le produit a été retiré de vos favoris.",
      });
    }
  };

  const clearAllFavorites = async () => {
    if (!user) return;

    const previousFavorites = [...favoriteProducts];
    setFavoriteProducts([]);

    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      setFavoriteProducts(previousFavorites);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de vider les favoris.",
      });
    } else {
      toast({
        title: "Favoris vidés",
        description: "Tous vos favoris ont été supprimés.",
      });
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-16 h-16 text-yellow-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="text-center py-16 bg-white rounded-2xl card-shadow">
          <div className="text-6xl mb-4">
            <User className="w-16 h-16 mx-auto text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Connectez-vous pour voir vos favoris
          </h2>
          <p className="text-gray-600 mb-6">
            Créez un compte ou connectez-vous pour sauvegarder vos produits préférés.
          </p>
          <Link to="/" className="btn-primary">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="bg-white rounded-2xl card-shadow p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-black mb-2 flex items-center">
                <Heart className="w-7 h-7 md:w-8 md:h-8 text-red-500 mr-3" />
                Mes Favoris
              </h1>
              <p className="text-gray-600">
                {favoriteProducts.length} produit(s) dans vos favoris
              </p>
            </div>
            
            {favoriteProducts.length > 0 && (
              <button
                onClick={clearAllFavorites}
                className="btn-secondary flex items-center space-x-2 !bg-red-100 !text-red-700 hover:!bg-red-200"
              >
                <Trash2 className="w-5 h-5" />
                <span>Vider les favoris</span>
              </button>
            )}
          </div>
        </div>

        {favoriteProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {favoriteProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-2xl card-shadow overflow-hidden flex flex-col"
              >
                <div className="aspect-square bg-gray-100 relative">
                  <Link to={`/product/${product.id}`}>
                    <img 
                      className="w-full h-full object-cover"
                      alt={product.name}
                      src={product.image_url || "https://via.placeholder.com/300"}
                    />
                  </Link>
                  <button
                    onClick={() => removeFavorite(product.id)}
                    className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md hover:bg-white transition-colors"
                  >
                    <Heart className="w-5 h-5 text-red-500 fill-current" />
                  </button>
                </div>
                
                <div className="p-4 flex flex-col flex-grow">
                  <Link 
                    to={`/product/${product.id}`}
                    className="block hover:text-yellow-600 transition-colors"
                  >
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2 h-14">{product.name}</h3>
                  </Link>
                  
                  <p className="text-2xl font-bold marsen-yellow-text mb-2">
                    {Number(product.price).toLocaleString('fr-FR')} FCFA
                  </p>
                  
                  <div className="flex items-center mb-2">
                    <MapPin className="w-4 h-4 text-gray-500 mr-1" />
                    <span className="text-sm text-gray-600 truncate">{product.location}</span>
                  </div>
                  
                  <div className="flex items-center mb-4">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-600 ml-1">{product.rating}</span>
                    <span className="text-sm text-gray-500 mx-2">•</span>
                    <Link 
                      to={`/vendor/${product.vendorId}`}
                      className="text-sm text-gray-600 hover:text-yellow-600 transition-colors truncate"
                    >
                      {product.vendor}
                    </Link>
                  </div>
                  
                  <div className="mt-auto flex space-x-2">
                    <button
                      onClick={() => handleContact('phone', product)}
                      className="flex-1 bg-green-500 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors flex items-center justify-center"
                    >
                      <Phone className="w-4 h-4 mr-1" />
                      Appeler
                    </button>
                    <button
                      onClick={() => handleContact('chat', product)}
                      className="flex-1 bg-blue-500 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors flex items-center justify-center"
                    >
                      <MessageCircle className="w-4 h-4 mr-1" />
                      Chat
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl card-shadow">
            <div className="text-6xl mb-4">💔</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Aucun favori pour le moment
            </h2>
            <p className="text-gray-600 mb-6">
              Explorez nos produits et ajoutez vos préférés en cliquant sur le cœur.
            </p>
            <Link to="/search" className="btn-primary">
              Découvrir les produits
            </Link>
          </div>
        )}

        {favoriteProducts.length > 0 && (
          <div className="mt-12 bg-white rounded-2xl card-shadow p-6">
            <h2 className="text-xl font-bold text-black mb-4">Actions rapides</h2>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                to="/search"
                className="btn-primary flex-1 text-center"
              >
                Continuer mes achats
              </Link>
              <button
                onClick={() => {
                  const message = favoriteProducts.map(p => `${p.name} - ${Number(p.price).toLocaleString('fr-FR')} FCFA`).join('\n');
                  const whatsappUrl = `https://wa.me/?text=Voici ma liste de favoris Marsen:\n\n${encodeURIComponent(message)}`;
                  window.open(whatsappUrl, '_blank');
                }}
                className="btn-secondary flex-1 text-center"
              >
                Partager ma liste
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoritesPage;