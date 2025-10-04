import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Phone, MessageCircle, MapPin, Heart, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const VendorPage = ({ openAuthModal }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [vendor, setVendor] = useState(null);
  const [vendorProducts, setVendorProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);

  const fetchVendorData = useCallback(async () => {
    setLoading(true);
    // Fetch vendor details
    const { data: vendorData, error: vendorError } = await supabase
      .from('vendors')
      .select('*')
      .eq('id', id)
      .single();

    if (vendorError || !vendorData) {
      toast({ title: "Erreur", description: "Vendeur non trouvé.", variant: "destructive" });
      navigate('/');
      setLoading(false);
      return;
    }
    setVendor(vendorData);

    // Fetch vendor's products
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('vendor_id', id);

    if (productsError) {
      toast({ title: "Erreur", description: "Impossible de charger les produits du vendeur.", variant: "destructive" });
    } else {
      setVendorProducts(productsData || []);
    }
    setLoading(false);
  }, [id, navigate]);

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
    fetchVendorData();
    fetchUserFavorites();
  }, [fetchVendorData, fetchUserFavorites]);

  const handleContact = (type) => {
    if (!vendor?.phone) {
      toast({ title: "Information", description: "Numéro de téléphone non disponible pour ce vendeur.", variant: "info" });
      return;
    }
    if (type === 'phone') {
      window.open(`tel:${vendor.phone}`, '_self');
    } else if (type === 'whatsapp') {
      window.open(`https://wa.me/${vendor.phone.replace(/\D/g, '')}?text=Bonjour, je souhaite en savoir plus sur vos produits`, '_blank');
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

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="w-12 h-12 animate-spin text-yellow-500" /></div>;
  }

  if (!vendor) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><p>Vendeur non trouvé.</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center space-x-2 text-gray-600 hover:text-black transition-colors mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Retour</span>
        </button>

        {/* Vendor Profile */}
        <div className="bg-white rounded-3xl card-shadow p-6 md:p-10 mb-10">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8">
            <div className="flex-shrink-0 mx-auto md:mx-0">
              <div className="w-32 h-32 md:w-40 md:h-40 bg-gray-200 rounded-full overflow-hidden border-4 border-yellow-300">
                <img
                  className="w-full h-full object-cover"
                  alt={`Profile photo of ${vendor.name}`}
                  src={vendor.image_url || `https://i.pravatar.cc/150?u=${vendor.id}`}
                />
              </div>
            </div>

            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-extrabold text-black mb-3">{vendor.name}</h1>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-2 mb-4">
                <div className="flex items-center">
                  <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  <span className="ml-1.5 font-semibold text-base md:text-lg">{vendor.rating || 'N/A'}</span>
                  <span className="text-gray-500 ml-1">({vendor.review_count || 0} avis)</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <MapPin className="w-5 h-5 mr-1.5" />
                  <span className="text-base md:text-lg">{vendor.location || 'Non spécifié'}</span>
                </div>
              </div>

              <p className="text-gray-700 text-base md:text-lg leading-relaxed mb-6">{vendor.description || "Ce vendeur n'a pas encore ajouté de description."}</p>

              <div className="grid grid-cols-3 gap-2 md:gap-4 mb-6">
                <div className="text-center p-2 md:p-4 bg-gray-50 rounded-xl">
                  <div className="font-bold text-xl md:text-2xl">{vendorProducts.length}</div>
                  <div className="text-xs md:text-sm text-gray-600">Produits</div>
                </div>
                <div className="text-center p-2 md:p-4 bg-gray-50 rounded-xl">
                  <div className="font-bold text-xl md:text-2xl">{vendor.review_count || 0}</div>
                  <div className="text-xs md:text-sm text-gray-600">Avis</div>
                </div>
                <div className="text-center p-2 md:p-4 bg-gray-50 rounded-xl">
                  <div className="font-bold text-base md:text-xl">{new Date(vendor.created_at).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' })}</div>
                  <div className="text-xs md:text-sm text-gray-600">Membre depuis</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => handleContact('phone')}
                  className="flex-1 bg-green-100 text-green-800 py-3 px-4 rounded-xl font-bold hover:bg-green-200 transition-colors flex items-center justify-center"
                >
                  <Phone className="w-5 h-5 mr-2" />
                  Appeler
                </button>
                <button
                  onClick={() => handleContact('whatsapp')}
                  className="flex-1 bg-green-600 text-white py-3 px-4 rounded-xl font-bold hover:bg-green-700 transition-colors flex items-center justify-center"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-black mb-6 md:mb-8">Produits de {vendor.name}</h2>

          {vendorProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
              {vendorProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white rounded-2xl card-shadow overflow-hidden group"
                >
                  <Link to={`/product/${product.id}`}>
                    <div className="aspect-square bg-gray-100 relative overflow-hidden">
                      {product.image_urls && product.image_urls.length > 0 ? (
                        <img
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          alt={product.name}
                          src={product.image_urls[0]}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">Pas d'image</div>
                      )}
                      <button
                        onClick={(e) => { e.preventDefault(); toggleFavorite(product.id); }}
                        className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md hover:bg-white transition-colors"
                      >
                        <Heart
                          className={`w-5 h-5 transition-all ${favorites.includes(product.id) ? 'text-red-500 fill-current' : 'text-gray-500'}`}
                        />
                      </button>
                    </div>

                    <div className="p-3 md:p-5">
                      <h3 className="font-semibold mb-1 truncate text-base">{product.name}</h3>
                      <p className="text-sm text-gray-500 mb-2">{product.category}</p>
                      <p className="text-lg md:text-xl font-bold marsen-yellow-text">
                        {product.price} FCFA
                      </p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-center py-8">Ce vendeur n'a pas encore de produits en ligne.</p>
          )}
        </div>

        {/* Reviews Section - Placeholder for now */}
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-black mb-6 md:mb-8">Avis clients</h2>
          <div className="bg-white rounded-2xl card-shadow p-6 text-center text-gray-600">
            <p>Aucun avis pour le moment. Soyez le premier à laisser un commentaire !</p>
            <button
              onClick={() => toast({ title: "🚧 Cette fonctionnalité n'est pas encore implémentée", description: "Mais ne vous inquiétez pas ! Vous pouvez la demander dans votre prochaine requête ! 🚀" })}
              className="btn-secondary mt-4"
            >
              Laisser un avis
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorPage;