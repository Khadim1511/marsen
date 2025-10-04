import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Star, BarChart3, Users, Loader2, Upload, X, Crown, MessageCircle, Share2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import AuthForm from '@/components/AuthForm';
import { useNavigate, Link } from 'react-router-dom';

const VendorDashboard = () => {
  const { user, loading: authLoading, isVendor, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [vendorProfile, setVendorProfile] = useState(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const profileImageInputRef = useRef(null);

  const initialProductState = { name: '', price: '', category: '', description: '', image_urls: [] };
  const [newProduct, setNewProduct] = useState(initialProductState);
  const [productImageFiles, setProductImageFiles] = useState([]);

  const categories = ['vetements', 'alimentation', 'tissus', 'auto', 'electronique', 'immobilier', 'cosmetiques', 'artisanat', 'services', 'meubles'];
  const FREE_PLAN_LIMIT = 5;

  const fetchVendorData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    
    let { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (vendorError) {
      toast({ title: "Erreur de profil", description: vendorError.message, variant: "destructive" });
    }
    
    if (vendor) {
      setVendorProfile(vendor);
      let { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*', { count: 'exact' })
        .eq('vendor_id', vendor.id)
        .order('created_at', { ascending: false });

      if (productsError) {
        toast({ title: "Erreur produits", description: productsError.message, variant: "destructive" });
      } else {
        setProducts(productsData || []);
      }
    } else if (user.user_metadata.is_vendor) {
      const vendorName = user.user_metadata.name || '';
      const { data: newVendor, error: newVendorError } = await supabase
        .from('vendors')
        .insert({ user_id: user.id, name: vendorName, email: user.email, image_url: user.user_metadata.avatar_url })
        .select()
        .single();
      
      if (newVendorError) {
        toast({ title: "Erreur de création de profil", description: newVendorError.message, variant: "destructive" });
      } else {
        setVendorProfile(newVendor);
        setProducts([]);
        setActiveTab('profile');
      }
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    if (user && isVendor) {
      fetchVendorData();
    } else if (user && !isVendor) {
      navigate('/client-dashboard');
    } else {
      setLoading(false);
    }
  }, [user, authLoading, isVendor, fetchVendorData, navigate]);

  const handleImageUpload = async (files, bucket) => {
    if (!files || files.length === 0) return [];
    setUploading(true);
    
    const uploadPromises = files.map(file => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}-${Math.random()}.${fileExt}`;
      const filePath = `public/${fileName}`;
      return supabase.storage.from(bucket).upload(filePath, file);
    });

    try {
      const uploadResults = await Promise.all(uploadPromises);
      const urls = [];
      for (const result of uploadResults) {
        if (result.error) throw result.error;
        const { data } = supabase.storage.from(bucket).getPublicUrl(result.data.path);
        urls.push(data.publicUrl);
      }
      return urls;
    } catch (error) {
      console.error('Error uploading images:', error);
      toast({ title: "Erreur de téléversement", description: "Impossible de téléverser les images.", variant: "destructive" });
      return [];
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setNewProduct(initialProductState);
    setProductImageFiles([]);
    setEditingProduct(null);
    setShowAddProduct(false);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!vendorProfile?.id) {
      toast({ title: "Profil incomplet", description: "Veuillez d'abord compléter votre profil.", variant: "destructive" });
      setActiveTab('profile');
      return;
    }

    if (!editingProduct && !vendorProfile.is_premium && products.length >= FREE_PLAN_LIMIT) {
      toast({ title: "Limite atteinte", description: "Passez au premium pour ajouter plus de produits.", variant: "destructive" });
      setActiveTab('subscription');
      return;
    }

    let uploadedImageUrls = [];
    if (productImageFiles.length > 0) {
      uploadedImageUrls = await handleImageUpload(productImageFiles, 'product-images');
      if (uploadedImageUrls.length === 0 && productImageFiles.length > 0) return;
    }

    const finalImageUrls = [...(newProduct.image_urls || []), ...uploadedImageUrls];
    const productData = { ...newProduct, image_urls: finalImageUrls, vendor_id: vendorProfile.id };
    delete productData.id;
    delete productData.created_at;
    delete productData.updated_at;

    if (editingProduct) {
      const { data, error } = await supabase.from('products').update(productData).eq('id', editingProduct.id).select().single();
      if (error) {
        toast({ title: "Erreur", description: error.message, variant: "destructive" });
      } else {
        setProducts(products.map(p => (p.id === editingProduct.id ? data : p)));
        resetForm();
        toast({ title: "Produit modifié" });
      }
    } else {
      const { data, error } = await supabase.from('products').insert([productData]).select().single();
      if (error) {
        toast({ title: "Erreur", description: error.message, variant: "destructive" });
      } else {
        setProducts([data, ...products]);
        resetForm();
        toast({ title: "Produit ajouté" });
      }
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setNewProduct({ ...initialProductState, ...product });
    setProductImageFiles([]);
    setShowAddProduct(true);
  };

  const handleDeleteProduct = async (productId) => {
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      setProducts(products.filter(p => p.id !== productId));
      toast({ title: "Produit supprimé", variant: "destructive" });
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setUploading(true);
    const profileData = { ...vendorProfile, user_id: user.id, email: user.email, updated_at: new Date() };
    
    const { error: vendorUpdateError } = await supabase.from('vendors').upsert(profileData, { onConflict: 'user_id' });
    if (vendorUpdateError) {
      toast({ title: "Erreur", description: vendorUpdateError.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { error: userUpdateError } = await supabase.auth.updateUser({
      data: { name: profileData.name, avatar_url: profileData.image_url }
    });
    if (userUpdateError) {
      toast({ title: "Erreur", description: userUpdateError.message, variant: "destructive" });
    } else {
      await refreshUser();
      toast({ title: "Profil mis à jour" });
    }
    setUploading(false);
  };

  const handleProfileImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const urls = await handleImageUpload([file], 'avatars');
      if (urls.length > 0) {
        setVendorProfile(prev => ({ ...prev, image_url: urls[0] }));
      }
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if ((newProduct.image_urls?.length || 0) + productImageFiles.length + files.length > 5) {
      toast({ title: "Limite d'images", description: "Maximum 5 images.", variant: "destructive" });
      return;
    }
    setProductImageFiles(prev => [...prev, ...files]);
  };

  const removeNewImage = (index) => setProductImageFiles(prev => prev.filter((_, i) => i !== index));
  const removeExistingImage = (url) => setNewProduct(prev => ({ ...prev, image_urls: prev.image_urls.filter(u => u !== url) }));

  const handleSubscription = () => {
    navigate('/checkout');
  };

  const handleShareProduct = async (product) => {
    const productUrl = `${window.location.origin}/product/${product.id}`;
    const shareData = {
      title: product.name,
      text: `Découvrez "${product.name}" sur Marsen !`,
      url: productUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast({ title: "Produit partagé avec succès !" });
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Share failed:', err);
          toast({ title: "Erreur de partage", description: "Le partage a échoué.", variant: "destructive" });
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(productUrl);
        toast({ title: "Lien copié !", description: "Le lien du produit a été copié dans le presse-papiers." });
      } catch (err) {
        console.error('Copy failed:', err);
        toast({ title: "Erreur", description: "Impossible de copier le lien.", variant: "destructive" });
      }
    }
  };

  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="w-12 h-12 animate-spin text-yellow-500" /></div>;
  }
  if (!user) return <AuthForm onSuccess={() => fetchVendorData()} />;

  const stats = [
    { title: 'Produits en ligne', value: products.length, icon: BarChart3, color: 'purple' },
    { title: 'Note moyenne', value: vendorProfile?.rating || 'N/A', icon: Star, color: 'yellow' },
    { title: 'Nombre d\'avis', value: vendorProfile?.review_count || 0, icon: Users, color: 'green' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="bg-white rounded-2xl card-shadow p-6 mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-black mb-2">Espace Vendeur</h1>
          <p className="text-gray-600">Gérez vos produits et suivez vos performances, {vendorProfile?.name || user.email}.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
          {stats.map((item, index) => (
            <motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.1 }} className="bg-white rounded-xl card-shadow p-4 md:p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{item.title}</p>
                <p className={`text-2xl md:text-3xl font-bold ${item.color === 'yellow' ? 'text-yellow-500' : ''}`}>{item.value}</p>
              </div>
              <div className={`p-3 rounded-full bg-${item.color}-100`}><item.icon className={`w-5 h-5 md:w-6 md:h-6 text-${item.color}-500 ${item.icon === Star ? 'fill-current' : ''}`} /></div>
            </motion.div>
          ))}
        </div>

        <div className="bg-white rounded-2xl card-shadow overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-1 sm:space-x-2 p-2 overflow-x-auto">
              <button onClick={() => setActiveTab('products')} className={`px-3 py-2 sm:px-4 sm:py-2.5 font-semibold rounded-lg transition-colors text-sm sm:text-base whitespace-nowrap flex items-center ${activeTab === 'products' ? 'bg-yellow-400 text-black' : 'text-gray-600 hover:bg-gray-100'}`}><BarChart3 className="w-5 h-5 mr-2" />Mes Produits</button>
              <button onClick={() => setActiveTab('profile')} className={`px-3 py-2 sm:px-4 sm:py-2.5 font-semibold rounded-lg transition-colors text-sm sm:text-base whitespace-nowrap flex items-center ${activeTab === 'profile' ? 'bg-yellow-400 text-black' : 'text-gray-600 hover:bg-gray-100'}`}><Users className="w-5 h-5 mr-2" />Mon Profil</button>
              <Link to="/chat" className={`px-3 py-2 sm:px-4 sm:py-2.5 font-semibold rounded-lg transition-colors text-sm sm:text-base whitespace-nowrap flex items-center text-gray-600 hover:bg-gray-100`}><MessageCircle className="w-5 h-5 mr-2" />Messages</Link>
              <button onClick={() => setActiveTab('subscription')} className={`px-3 py-2 sm:px-4 sm:py-2.5 font-semibold rounded-lg transition-colors text-sm sm:text-base whitespace-nowrap flex items-center ${activeTab === 'subscription' ? 'bg-yellow-400 text-black' : 'text-gray-600 hover:bg-gray-100'}`}><Crown className="w-5 h-5 mr-2" />Abonnement</button>
            </nav>
          </div>

          <div className="p-4 md:p-6">
            {activeTab === 'products' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                  <h2 className="text-xl md:text-2xl font-bold">Mes Produits ({products.length})</h2>
                  <button onClick={() => { resetForm(); setShowAddProduct(true); }} className="btn-primary flex items-center space-x-2 w-full sm:w-auto justify-center"><Plus className="w-5 h-5" /><span>Ajouter un produit</span></button>
                </div>

                {showAddProduct && (
                  <motion.div initial={{ opacity: 0, y: -20, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, y: -20, height: 0 }} className="bg-gray-50 rounded-xl p-4 md:p-6 mb-6 border border-gray-200">
                    <h3 className="text-lg md:text-xl font-semibold mb-4">{editingProduct ? 'Modifier le produit' : 'Ajouter un nouveau produit'}</h3>
                    <form onSubmit={handleFormSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label><input type="text" value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} className="w-full border-gray-300 rounded-lg shadow-sm" required /></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Prix (FCFA) *</label><input type="number" value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: e.target.value})} className="w-full border-gray-300 rounded-lg shadow-sm" required /></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Catégorie *</label><select value={newProduct.category} onChange={(e) => setNewProduct({...newProduct, category: e.target.value})} className="w-full border-gray-300 rounded-lg shadow-sm" required><option value="">Sélectionner</option>{categories.map(cat => <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>)}</select></div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Images (jusqu'à 5)</label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                          <div className="space-y-1 text-center">
                            <Upload className="mx-auto h-12 w-12 text-gray-400" /><div className="flex text-sm text-gray-600"><label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-yellow-600 hover:text-yellow-500"><span>Choisir des fichiers</span><input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileSelect} accept="image/*" multiple /></label><p className="pl-1">ou glisser-déposer</p></div><p className="text-xs text-gray-500">PNG, JPG, GIF jusqu'à 10MB</p>
                          </div>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {newProduct.image_urls?.map((url, index) => (<div key={index} className="relative"><img src={url} alt={`Existing ${index + 1}`} className="h-20 w-20 object-cover rounded-md" /><button type="button" onClick={() => removeExistingImage(url)} className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-0.5"><X size={12} /></button></div>))}
                          {productImageFiles.map((file, index) => (<div key={index} className="relative"><img src={URL.createObjectURL(file)} alt={`New ${index + 1}`} className="h-20 w-20 object-cover rounded-md" /><button type="button" onClick={() => removeNewImage(index)} className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-0.5"><X size={12} /></button></div>))}
                        </div>
                      </div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea value={newProduct.description} onChange={(e) => setNewProduct({...newProduct, description: e.target.value})} rows={3} className="w-full border-gray-300 rounded-lg shadow-sm" /></div>
                      <div className="flex space-x-3"><button type="submit" className="btn-primary" disabled={uploading}>{uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : (editingProduct ? 'Modifier' : 'Ajouter')}</button><button type="button" onClick={resetForm} className="btn-secondary bg-gray-200 text-gray-800 hover:bg-gray-300">Annuler</button></div>
                    </form>
                  </motion.div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <div key={product.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <div className="aspect-square bg-gray-100">{(product.image_urls && product.image_urls.length > 0) ? <img src={product.image_urls[0]} alt={product.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400">Pas d'image</div>}</div>
                      <div className="p-4">
                        <h3 className="font-semibold mb-1 truncate">{product.name}</h3><p className="text-sm text-gray-500 mb-2 capitalize">{product.category}</p><p className="text-xl font-bold marsen-yellow-text mb-3">{product.price} FCFA</p>
                        <div className="space-y-2">
                          <div className="flex space-x-2">
                            <button onClick={() => handleEditProduct(product)} className="flex-1 bg-blue-100 text-blue-800 py-2 px-3 rounded-lg text-sm font-bold hover:bg-blue-200 flex items-center justify-center"><Edit className="w-4 h-4 mr-1" /> Modifier</button>
                            <button onClick={() => handleDeleteProduct(product.id)} className="flex-1 bg-red-100 text-red-800 py-2 px-3 rounded-lg text-sm font-bold hover:bg-red-200 flex items-center justify-center"><Trash2 className="w-4 h-4 mr-1" /> Supprimer</button>
                          </div>
                          <button onClick={() => handleShareProduct(product)} className="w-full bg-gray-100 text-gray-800 py-2 px-3 rounded-lg text-sm font-bold hover:bg-gray-200 flex items-center justify-center"><Share2 className="w-4 h-4 mr-1" /> Partager</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {products.length === 0 && !showAddProduct && (<div className="text-center py-16"><div className="text-6xl mb-4">📦</div><h3 className="text-xl font-semibold text-gray-800 mb-2">Aucun produit</h3><p className="text-gray-600 mb-6">Cliquez sur "Ajouter" pour commencer à vendre.</p></div>)}
              </motion.div>
            )}

            {activeTab === 'profile' && vendorProfile && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h2 className="text-xl md:text-2xl font-bold mb-6">Mon Profil de Boutique</h2>
                <form onSubmit={handleProfileUpdate} className="max-w-2xl space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <img src={vendorProfile.image_url || `https://i.pravatar.cc/150?u=${vendorProfile.id}`} alt="Avatar" className="w-24 h-24 rounded-full object-cover" />
                      <button type="button" onClick={() => profileImageInputRef.current.click()} className="absolute bottom-0 right-0 bg-yellow-400 p-2 rounded-full text-black hover:bg-yellow-500"><Edit size={16} /></button>
                      <input type="file" ref={profileImageInputRef} onChange={handleProfileImageChange} className="hidden" accept="image/*" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Nom de la boutique</label><input type="text" value={vendorProfile.name} onChange={(e) => setVendorProfile({...vendorProfile, name: e.target.value})} className="w-full border-gray-300 rounded-lg shadow-sm" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={vendorProfile.email} disabled className="w-full border-gray-300 rounded-lg shadow-sm bg-gray-100" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label><input type="tel" value={vendorProfile.phone || ''} onChange={(e) => setVendorProfile({...vendorProfile, phone: e.target.value})} className="w-full border-gray-300 rounded-lg shadow-sm" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Localisation</label><input type="text" value={vendorProfile.location || ''} onChange={(e) => setVendorProfile({...vendorProfile, location: e.target.value})} className="w-full border-gray-300 rounded-lg shadow-sm" placeholder="Ville, Quartier" /></div>
                  </div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea value={vendorProfile.description || ''} onChange={(e) => setVendorProfile({...vendorProfile, description: e.target.value})} rows={4} className="w-full border-gray-300 rounded-lg shadow-sm" placeholder="Décrivez votre boutique..." /></div>
                  <button type="submit" className="btn-primary" disabled={uploading}>{uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Mettre à jour'}</button>
                </form>
              </motion.div>
            )}

            {activeTab === 'subscription' && vendorProfile && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h2 className="text-xl md:text-2xl font-bold mb-6">Mon Abonnement</h2>
                <div className={`rounded-xl p-6 ${vendorProfile.is_premium ? 'bg-green-100 border-green-300' : 'bg-yellow-100 border-yellow-300'} border`}>
                  <div className="flex items-center mb-4">
                    <Crown className={`w-8 h-8 mr-3 ${vendorProfile.is_premium ? 'text-green-600' : 'text-yellow-600'}`} />
                    <div>
                      <h3 className="text-lg font-semibold">{vendorProfile.is_premium ? 'Abonnement Premium Actif' : 'Plan Gratuit'}</h3>
                      <p className="text-sm">{vendorProfile.is_premium ? 'Vous bénéficiez de tous les avantages.' : `Limite de ${FREE_PLAN_LIMIT} produits.`}</p>
                    </div>
                  </div>
                  {!vendorProfile.is_premium && (
                    <div>
                      <p className="mb-4">Passez au premium pour ajouter des produits en illimité, et bien plus encore !</p>
                      <button onClick={handleSubscription} className="btn-primary">Passer Premium - 5000 FCFA/mois</button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;