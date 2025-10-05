import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Phone, MessageCircle, Heart, ArrowLeft, Loader2, Share2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const ProductPage = ({ openAuthModal }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteId, setFavoriteId] = useState(null);
  const [startingChat, setStartingChat] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setProduct(null);
      setSelectedImage(0);
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          vendors (
            id,
            user_id,
            name,
            location,
            phone,
            rating,
            review_count,
            image_url
          )
        `)
        .eq('id', id)
        .single();

      if (error || !data) {
        toast({ title: "Erreur", description: "Produit non trouvé.", variant: "destructive" });
        navigate('/');
      } else {
        setProduct(data);
      }
      setLoading(false);
    };
    
    fetchProduct();
  }, [id, navigate]);

  const checkFavorite = useCallback(async () => {
    if (!user || !product) return;
    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('product_id', product.id)
      .maybeSingle();

    if (!error && data) {
      setIsFavorite(true);
      setFavoriteId(data.id);
    } else {
      setIsFavorite(false);
      setFavoriteId(null);
    }
  }, [user, product]);

  useEffect(() => {
    if (product) {
      checkFavorite();
    }
  }, [product, checkFavorite]);

  const toggleFavorite = async () => {
    if (!user) {
      openAuthModal();
      return;
    }

    if (isFavorite) {
      const { error } = await supabase.from('favorites').delete().eq('id', favoriteId);
      if (!error) {
        setIsFavorite(false);
        setFavoriteId(null);
        toast({ title: "Retiré des favoris" });
      }
    } else {
      const { data, error } = await supabase.from('favorites').insert({ user_id: user.id, product_id: product.id }).select('id').single();
      if (!error && data) {
        setIsFavorite(true);
        setFavoriteId(data.id);
        toast({ title: "Ajouté aux favoris" });
      }
    }
  };

  const handleContact = (type) => {
    if (!product?.vendors) return;
    const vendorPhone = product.vendors.phone;
    const productUrl = `${window.location.origin}/product/${product.id}`;
    const message = `Bonjour, je suis intéressé par votre produit "${product.name}" sur Marsen. Vous pouvez le voir ici : ${productUrl}`;

    if (type === 'phone') {
      window.open(`tel:${vendorPhone}`, '_self');
    } else if (type === 'whatsapp') {
      window.open(`https://wa.me/${vendorPhone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
    }
  };

  const handleStartChat = async () => {
    if (!user) {
      openAuthModal(() => handleStartChat());
      return;
    }

    if (!product?.vendors?.user_id) return;
    
    setStartingChat(true);
    const vendorUserId = product.vendors.user_id;
    const participantIds = [user.id, vendorUserId].sort();

    let { data: existingConvo, error: existingConvoError } = await supabase
      .from('conversations')
      .select('id')
      .contains('participant_ids', participantIds)
      .limit(1)
      .maybeSingle();

    if (existingConvoError && existingConvoError.code !== 'PGRST116') {
      toast({ title: "Erreur", description: "Impossible de démarrer la conversation.", variant: "destructive" });
      setStartingChat(false);
      return;
    }

    if (existingConvo) {
      navigate('/chat', { state: { conversationId: existingConvo.id } });
    } else {
      const { data: newConvo, error: newConvoError } = await supabase
        .from('conversations')
        .insert({ participant_ids: participantIds })
        .select('id')
        .single();

      if (newConvoError) {
        toast({ title: "Erreur", description: "Impossible de créer la conversation.", variant: "destructive" });
      } else {
        navigate('/chat', { state: { conversationId: newConvo.id } });
      }
    }
    setStartingChat(false);
  };

  const handleShareProduct = async () => {
    if (!product) return;

    const productUrl = `${window.location.origin}/product/${product.id}`;
    const shareData = {
      title: product.name,
      text: `Découvrez "${product.name}" sur Marsen ! Prix: ${Number(product.price).toLocaleString('fr-FR')} FCFA.`,
      url: productUrl,
    };

    if (!navigator.share) {
      try {
        await navigator.clipboard.writeText(productUrl);
        toast({ title: "Lien copié !", description: "Le lien du produit a été copié dans le presse-papiers." });
      } catch (err) {
        toast({ title: "Erreur", description: "Impossible de copier le lien.", variant: "destructive" });
      }
      return;
    }

    try {
      const imageUrl = product.image_urls?.[0];
      let filesArray = [];

      if (imageUrl) {
        try {
          const response = await fetch(imageUrl);
          if (response.ok) {
            const blob = await response.blob();
            const file = new File([blob], 'product.jpg', { type: blob.type });
            filesArray = [file];
          }
        } catch (fetchError) {
          console.error("Could not fetch image for sharing:", fetchError);
        }
      }
      
      const canShareFiles = filesArray.length > 0 && navigator.canShare && navigator.canShare({ files: filesArray });

      if (canShareFiles) {
        await navigator.share({ ...shareData, files: filesArray });
      } else {
        await navigator.share(shareData);
      }
      
      toast({ title: "Produit partagé avec succès !" });

    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Share failed:', err);
        toast({ title: "Erreur de partage", description: "Le partage a échoué.", variant: "destructive" });
      }
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="w-12 h-12 animate-spin text-yellow-500" /></div>;
  }

  if (!product) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><p>Produit non trouvé.</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12">
        <button onClick={() => navigate(-1)} className="inline-flex items-center space-x-2 text-gray-600 hover:text-black transition-colors mb-6">
          <ArrowLeft className="w-5 h-5" />
          <span>Retour</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
          <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
            <div>
              <div className="aspect-square bg-white rounded-2xl sm:rounded-3xl card-shadow overflow-hidden mb-4">
                {product.image_urls && product.image_urls.length > 0 ? (
                  <img src={product.image_urls[selectedImage]} alt={`${product.name} - image ${selectedImage + 1}`} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">Pas d'image</div>
                )}
              </div>
              {product.image_urls && product.image_urls.length > 1 && (
                <div className="grid grid-cols-5 gap-2 sm:gap-4">
                  {product.image_urls.map((url, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${selectedImage === index ? 'border-yellow-400' : 'border-transparent hover:border-gray-300'}`}
                    >
                      <img src={url} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
            <div className="bg-white rounded-2xl sm:rounded-3xl card-shadow p-6 md:p-8 h-full flex flex-col">
              <div className="flex-1">
                <div className="flex justify-between items-start mb-4">
                  <span className="bg-yellow-100 text-yellow-800 text-sm font-medium px-3 py-1 rounded-full capitalize">{product.category}</span>
                  <div className="flex items-center space-x-2">
                    <button onClick={handleShareProduct} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                      <Share2 className="w-6 h-6 text-gray-500" />
                    </button>
                    <button onClick={toggleFavorite} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                      <Heart className={`w-6 h-6 transition-all ${isFavorite ? 'text-red-500 fill-current' : 'text-gray-500'}`} />
                    </button>
                  </div>
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-black mb-3">{product.name}</h1>
                <p className="text-3xl sm:text-4xl md:text-5xl font-bold marsen-yellow-text mb-6">{Number(product.price).toLocaleString('fr-FR')} FCFA</p>
                <p className="text-gray-700 text-base leading-relaxed mb-8">{product.description || "Aucune description pour ce produit."}</p>
              </div>

              {product.vendors && (
                <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                  <p className="text-sm text-gray-600 mb-2">Vendu par :</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden mr-3">
                        <img src={product.vendors.image_url || `https://i.pravatar.cc/150?u=${product.vendors.id}`} alt={product.vendors.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="font-bold text-lg">{product.vendors.name}</p>
                        <div className="flex items-center text-sm text-gray-500">
                          <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                          <span>{product.vendors.rating || 'N/A'} ({product.vendors.review_count || 0} avis)</span>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => navigate(`/vendor/${product.vendors.id}`)} className="btn-secondary !py-2 !px-4 text-sm">Voir</button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button onClick={() => handleContact('phone')} className="btn-secondary flex items-center justify-center space-x-2"><Phone className="w-5 h-5" /><span>Appeler</span></button>
                <button onClick={() => handleContact('whatsapp')} className="btn-secondary flex items-center justify-center space-x-2"><MessageCircle className="w-5 h-5" /><span>WhatsApp</span></button>
                <button onClick={handleStartChat} disabled={startingChat} className="btn-primary flex items-center justify-center space-x-2">
                  {startingChat ? <Loader2 className="w-5 h-5 animate-spin" /> : <><MessageCircle className="w-5 h-5" /><span>Message</span></>}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;
