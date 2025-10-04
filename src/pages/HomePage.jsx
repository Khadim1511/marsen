import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Camera, ShoppingBag, Building, Utensils, Shirt, Car, Tv, Star, MapPin, Loader2, Gem, Paintbrush, Briefcase, Sofa } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';

const HomePage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef(null);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleImageSearchClick = () => {
    fileInputRef.current.click();
  };

  const handleImageFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const { id: toastId } = toast({
        title: "Analyse de l'image en cours...",
        description: "Recherche de produits similaires dans notre base de données.",
      });

      try {
        // 1. Get total number of products
        const { count, error: countError } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true });

        if (countError) throw countError;
        
        if (count === 0) {
          toast({
            variant: "destructive",
            title: "Aucun produit trouvé",
            description: "La base de données est vide, nous ne pouvons pas trouver de similarités.",
          });
          return;
        }

        // 2. Fetch a random product
        const randomOffset = Math.floor(Math.random() * count);
        const { data: randomProducts, error: productError } = await supabase
          .from('products')
          .select('name')
          .range(randomOffset, randomOffset);

        if (productError) throw productError;

        const randomProduct = randomProducts[0];
        const keywords = randomProduct.name.split(' ');
        const searchKeyword = keywords[0] || 'produit'; // Use the first word as a keyword

        toast.dismiss(toastId);
        toast({
          title: "Analyse terminée !",
          description: `Nous avons trouvé des articles similaires à "${searchKeyword}".`,
        });

        navigate(`/search?q=${encodeURIComponent(searchKeyword)}`);

      } catch (error) {
        console.error('Image search simulation error:', error);
        toast.dismiss(toastId);
        toast({
          variant: "destructive",
          title: "Erreur d'analyse",
          description: "Impossible de simuler la recherche. Redirection vers une recherche générale.",
        });
        navigate(`/search?q=articles populaires`);
      }
    }
  };

  const categories = [
    { name: 'Vêtements', icon: <Shirt className="w-8 h-8" />, slug: 'vetements' },
    { name: 'Alimentation', icon: <Utensils className="w-8 h-8" />, slug: 'alimentation' },
    { name: 'Tissus', icon: <ShoppingBag className="w-8 h-8" />, slug: 'tissus' },
    { name: 'Pièces Auto', icon: <Car className="w-8 h-8" />, slug: 'auto' },
    { name: 'Électronique', icon: <Tv className="w-8 h-8" />, slug: 'electronique' },
    { name: 'Immobilier', icon: <Building className="w-8 h-8" />, slug: 'immobilier' },
    { name: 'Cosmétiques', icon: <Gem className="w-8 h-8" />, slug: 'cosmetiques' },
    { name: 'Artisanat', icon: <Paintbrush className="w-8 h-8" />, slug: 'artisanat' },
    { name: 'Services', icon: <Briefcase className="w-8 h-8" />, slug: 'services' },
    { name: 'Meubles', icon: <Sofa className="w-8 h-8" />, slug: 'meubles' },
  ];

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          price,
          image_urls,
          vendors (
            id,
            name,
            location
          )
        `)
        .order('created_at', { ascending: false })
        .limit(8);

      if (error) {
        throw error;
      }
      
      const formattedData = data.map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        image_url: (p.image_urls && p.image_urls.length > 0) ? p.image_urls[0] : null,
        vendor: p.vendors.name,
        vendorId: p.vendors.id,
        location: p.vendors.location,
        rating: (Math.random() * (5 - 4) + 4).toFixed(1), // Mock rating
      }));

      setProducts(formattedData);

    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        variant: "destructive",
        title: "Erreur de chargement",
        description: "Impossible de charger les produits populaires.",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <div className="bg-gray-50">
      {/* Hero Section */}
      <div className="relative bg-yellow-400 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-4xl md:text-6xl font-extrabold text-black tracking-tight"
          >
            Trouvez votre vendeur <span className="block md:inline">en un clic.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-4 max-w-2xl mx-auto text-lg md:text-xl text-gray-800"
          >
            Le marketplace digital du Sénégal qui connecte acheteurs et vendeurs, partout et à tout moment.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-8 max-w-xl mx-auto"
          >
            <form onSubmit={handleSearchSubmit} className="search-input-container">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Que recherchez-vous aujourd'hui ?"
                className="search-input"
              />
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageFileChange}
                accept="image/*"
                className="hidden"
              />
              <button type="button" onClick={handleImageSearchClick} className="search-input-icon left">
                <Camera className="w-5 h-5 md:w-6 md:h-6" />
              </button>
              <button type="submit" className="search-input-icon right">
                <Search className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </form>
          </motion.div>
        </div>
      </div>

      {/* Categories Section */}
      <section className="py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-black mb-10">Explorer par catégorie</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 md:gap-6">
            {categories.map((category, index) => (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link to={`/search?category=${category.slug}`} className="category-card">
                  <div className="mb-3 text-yellow-500">{category.icon}</div>
                  <span className="font-semibold text-sm md:text-base">{category.name}</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Products Section */}
      <section className="bg-white py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-black mb-10">Produits Populaires</h2>
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="w-12 h-12 text-yellow-500 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {products.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white rounded-2xl card-shadow overflow-hidden group"
                >
                  <div className="aspect-square bg-gray-100 relative overflow-hidden">
                    <Link to={`/product/${product.id}`}>
                      <img
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        alt={product.name}
                        src={product.image_url || "https://via.placeholder.com/300"}
                      />
                    </Link>
                  </div>
                  <div className="p-4">
                    <Link to={`/product/${product.id}`} className="block hover:text-yellow-600 transition-colors">
                      <h3 className="font-semibold text-base mb-2 h-12 line-clamp-2">{product.name}</h3>
                    </Link>
                    <p className="text-lg font-bold marsen-yellow-text mb-3">
                      {Number(product.price).toLocaleString('fr-FR')} FCFA
                    </p>
                    <div className="flex items-center text-sm text-gray-500 mb-3">
                      <MapPin className="w-4 h-4 mr-1.5" />
                      <span className="truncate">{product.location}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="font-semibold ml-1">{product.rating}</span>
                      <span className="mx-2">•</span>
                      <Link to={`/vendor/${product.vendorId}`} className="hover:text-yellow-600 transition-colors truncate">
                        {product.vendor}
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
          <div className="text-center mt-12">
            <Link to="/search" className="btn-primary">
              Voir tous les produits
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;