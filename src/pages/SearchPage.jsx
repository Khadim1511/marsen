import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Filter, Star, Phone, MessageCircle, Heart, MapPin, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const SearchPage = ({ openAuthModal }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const { user } = useAuth();

  const categories = [
    { name: 'Tous', slug: '' },
    { name: 'Vêtements', slug: 'vetements' },
    { name: 'Alimentation', slug: 'alimentation' },
    { name: 'Tissus', slug: 'tissus' },
    { name: 'Pièces Auto', slug: 'auto' },
    { name: 'Électronique', slug: 'electronique' },
    { name: 'Immobilier', slug: 'immobilier' },
    { name: 'Cosmétiques', slug: 'cosmetiques' },
    { name: 'Artisanat', slug: 'artisanat' },
    { name: 'Services', slug: 'services' },
    { name: 'Meubles', slug: 'meubles' },
  ];

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('products')
        .select(`
          id,
          name,
          price,
          category,
          image_urls,
          vendors (
            id,
            name,
            location,
            phone
          )
        `);

      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      if (selectedCategory) {
        query = query.eq('category', selectedCategory);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        throw error;
      }
      
      const formattedData = data.map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        category: p.category,
        image_url: (p.image_urls && p.image_urls.length > 0) ? p.image_urls[0] : null,
        vendor: p.vendors.name,
        vendorId: p.vendors.id,
        location: p.vendors.location,
        phone: p.vendors.phone,
        rating: (Math.random() * (5 - 4) + 4).toFixed(1), // Mock rating
      }));

      setProducts(formattedData);

    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        variant: "destructive",
        title: "Erreur de chargement",
        description: "Impossible de charger les produits. Veuillez réessayer.",
      });
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory]);

  const fetchUserFavorites = useCallback(async () => {
    if (!user) {
      setFavorites([]);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('product_id')
        .eq('user_id', user.id);
      
      if (error) throw error;

      const favoriteProductIds = data.map(fav => fav.product_id);
      setFavorites(favoriteProductIds);
    } catch (error) {
      console.error('Error fetching user favorites:', error);
    }
  }, [user]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchUserFavorites();
  }, [fetchUserFavorites]);

  const handleContact = (type, product) => {
    if (type === 'phone') {
      window.open(`tel:${product.phone}`, '_self');
    } else if (type === 'whatsapp') {
      window.open(`https://wa.me/${product.phone.replace(/\D/g, '')}?text=Bonjour, je suis intéressé par ${product.name}`, '_blank');
    } else if (type === 'chat') {
      toast({
        title: "🚧 Cette fonctionnalité n'est pas encore implémentée",
        description: "Mais ne vous inquiétez pas ! Vous pouvez la demander dans votre prochaine requête ! 🚀"
      });
    }
  };

  const toggleFavorite = async (productId) => {
    if (!user) {
      openAuthModal();
      return;
    }

    const isCurrentlyFavorite = favorites.includes(productId);
    
    if (isCurrentlyFavorite) {
      setFavorites(prev => prev.filter(id => id !== productId));
      const { error } = await supabase
        .from('favorites')
        .delete()
        .match({ user_id: user.id, product_id: productId });

      if (error) {
        setFavorites(prev => [...prev, productId]);
        toast({ title: "Erreur", description: "Impossible de retirer des favoris.", variant: "destructive" });
      } else {
        toast({ title: "Retiré des favoris" });
      }
    } else {
      setFavorites(prev => [...prev, productId]);
      const { error } = await supabase
        .from('favorites')
        .insert({ user_id: user.id, product_id: productId });

      if (error) {
        setFavorites(prev => prev.filter(id => id !== productId));
        toast({ title: "Erreur", description: "Impossible d'ajouter aux favoris.", variant: "destructive" });
      } else {
        toast({ title: "Ajouté aux favoris" });
      }
    }
  };

  useEffect(() => {
    const params = {};
    if (searchQuery) params.q = searchQuery;
    if (selectedCategory) params.category = selectedCategory;
    setSearchParams(params, { replace: true });
  }, [searchQuery, selectedCategory, setSearchParams]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Search Header */}
        <div className="bg-white rounded-2xl p-4 md:p-6 card-shadow mb-8">
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 w-full">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un produit..."
                  className="search-input pr-12 !rounded-xl"
                />
                <button type="submit" className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <Search className="w-5 h-5 text-gray-400 hover:text-black" />
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-2 w-full md:w-auto">
              <Filter className="w-5 h-5 text-gray-500" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full md:w-auto border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              >
                {categories.map(category => (
                  <option key={category.slug} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </form>
        </div>

        {/* Results Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-black mb-2">
            Résultats de recherche
          </h1>
          {!loading && (
            <p className="text-gray-600 text-base md:text-lg">
              <span className="font-semibold text-black">{products.length}</span> produit(s) trouvé(s)
            </p>
          )}
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-24">
            <Loader2 className="w-12 h-12 text-yellow-500 animate-spin" />
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className="bg-white rounded-2xl card-shadow overflow-hidden group"
              >
                <div className="aspect-square bg-gray-100 relative overflow-hidden">
                  <img
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    alt={product.name}
                    src={product.image_url || "https://images.unsplash.com/photo-1635865165118-917ed9e20936"} />
                  <button
                    onClick={() => toggleFavorite(product.id)}
                    className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md hover:bg-white transition-colors"
                  >
                    <Heart 
                      className={`w-5 h-5 transition-all ${favorites.includes(product.id) ? 'text-red-500 fill-current' : 'text-gray-500'}`} 
                    />
                  </button>
                </div>
                
                <div className="p-4 md:p-5">
                  <Link 
                    to={`/product/${product.id}`}
                    className="block hover:text-yellow-600 transition-colors"
                  >
                    <h3 className="font-semibold text-lg mb-2 h-14 line-clamp-2">{product.name}</h3>
                  </Link>
                  
                  <p className="text-xl md:text-2xl font-bold marsen-yellow-text mb-3">
                    {Number(product.price).toLocaleString('fr-FR')} FCFA
                  </p>
                  
                  <div className="flex items-center text-sm text-gray-500 mb-3">
                    <MapPin className="w-4 h-4 mr-1.5" />
                    <span className="truncate">{product.location}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600 mb-4">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="font-semibold ml-1">{product.rating}</span>
                    <span className="mx-2">•</span>
                    <Link 
                      to={`/vendor/${product.vendorId}`}
                      className="hover:text-yellow-600 transition-colors truncate"
                    >
                      {product.vendor}
                    </Link>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleContact('phone', product)}
                      className="flex-1 bg-green-100 text-green-800 py-2.5 px-3 rounded-lg text-sm font-bold hover:bg-green-200 transition-colors flex items-center justify-center"
                    >
                      <Phone className="w-4 h-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Appeler</span>
                    </button>
                    <button
                      onClick={() => handleContact('whatsapp', product)}
                      className="flex-1 bg-green-600 text-white py-2.5 px-3 rounded-lg text-sm font-bold hover:bg-green-700 transition-colors flex items-center justify-center"
                    >
                      <MessageCircle className="w-4 h-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">WhatsApp</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 md:py-24">
            <div className="text-6xl md:text-7xl mb-6">🔍</div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">
              Aucun produit trouvé
            </h2>
            <p className="text-gray-600 text-base md:text-lg mb-8 max-w-md mx-auto">
              Essayez de modifier vos critères de recherche ou d'explorer nos catégories.
            </p>
            <Link to="/" className="btn-primary">
              Retour à l'accueil
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;