import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, MessageCircle, Heart, Loader2, User, Camera } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';

const ClientDashboard = () => {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('messages');
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [favorites, setFavorites] = useState([]);

  // Profile editing state
  const [profileName, setProfileName] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      setProfileName(user.user_metadata.name || '');
      setAvatarPreview(user.user_metadata.avatar_url || '');
    }
  }, [user]);

  const fetchClientData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // Fetch conversations
    const { data: convosData, error: convosError } = await supabase
      .from('conversations')
      .select('id, participant_ids, messages(content, created_at)')
      .contains('participant_ids', [user.id])
      .order('created_at', { foreignTable: 'messages', ascending: false })
      .limit(1, { foreignTable: 'messages' });

    if (convosError) {
      toast({ title: "Erreur", description: "Impossible de charger les messages.", variant: "destructive" });
    } else {
      const participantIds = [...new Set(convosData.flatMap(c => c.participant_ids))];
      const otherParticipantIds = participantIds.filter(id => id !== user.id);

      if (otherParticipantIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .rpc('get_user_profiles_by_ids', { user_ids: otherParticipantIds });

        if (!profilesError) {
          const usersMap = new Map(profilesData.map(p => [p.id, p]));
          const formattedConversations = convosData.map(convo => {
            const otherParticipantId = convo.participant_ids.find(pId => pId !== user.id);
            const otherUser = usersMap.get(otherParticipantId);
            return {
              id: convo.id,
              vendor: otherUser?.name || 'Utilisateur',
              avatar: otherUser?.avatar_url || `https://i.pravatar.cc/150?u=${otherParticipantId}`,
              lastMessage: convo.messages[0]?.content || 'Aucun message',
              timestamp: convo.messages[0] ? new Date(convo.messages[0].created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '',
            };
          }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
          setConversations(formattedConversations);
        }
      }
    }

    // Fetch favorites
    const { data: favData, error: favError } = await supabase
      .from('favorites')
      .select('id, products(*, vendors(name))')
      .eq('user_id', user.id);

    if (favError) {
      toast({ title: "Erreur", description: "Impossible de charger les favoris.", variant: "destructive" });
    } else {
      setFavorites(favData);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchClientData();
    } else if (!authLoading) {
      navigate('/');
    }
  }, [user, authLoading, navigate, fetchClientData]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileLoading(true);

    let avatarUrl = user.user_metadata.avatar_url;

    if (avatarFile) {
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `public/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile, { upsert: true });

      if (uploadError) {
        toast({ title: "Erreur d'upload", description: uploadError.message, variant: "destructive" });
        setProfileLoading(false);
        return;
      }
      
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      avatarUrl = data.publicUrl;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      data: { name: profileName, avatar_url: avatarUrl }
    });

    if (updateError) {
      toast({ title: "Erreur de mise à jour", description: updateError.message, variant: "destructive" });
    } else {
      toast({ title: "Profil mis à jour avec succès !" });
      await refreshUser();
    }
    setProfileLoading(false);
  };

  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="w-12 h-12 animate-spin text-yellow-500" /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="bg-white rounded-2xl card-shadow p-6 mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full overflow-hidden">
              <img src={user.user_metadata.avatar_url || `https://i.pravatar.cc/150?u=${user.id}`} alt="User avatar" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-black mb-1">Mon Espace Client</h1>
              <p className="text-gray-600">Bienvenue, {user.user_metadata.name || user.email} !</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl card-shadow overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-1 sm:space-x-2 p-2 overflow-x-auto">
              <button onClick={() => setActiveTab('messages')} className={`px-3 py-2 sm:px-4 sm:py-2.5 font-semibold rounded-lg transition-colors text-sm sm:text-base whitespace-nowrap flex items-center ${activeTab === 'messages' ? 'bg-yellow-400 text-black' : 'text-gray-600 hover:bg-gray-100'}`}><MessageCircle className="w-5 h-5 mr-2" />Messages</button>
              <button onClick={() => setActiveTab('favorites')} className={`px-3 py-2 sm:px-4 sm:py-2.5 font-semibold rounded-lg transition-colors text-sm sm:text-base whitespace-nowrap flex items-center ${activeTab === 'favorites' ? 'bg-yellow-400 text-black' : 'text-gray-600 hover:bg-gray-100'}`}><Heart className="w-5 h-5 mr-2" />Favoris</button>
              <button onClick={() => setActiveTab('orders')} className={`px-3 py-2 sm:px-4 sm:py-2.5 font-semibold rounded-lg transition-colors text-sm sm:text-base whitespace-nowrap flex items-center ${activeTab === 'orders' ? 'bg-yellow-400 text-black' : 'text-gray-600 hover:bg-gray-100'}`}><ShoppingBag className="w-5 h-5 mr-2" />Commandes</button>
              <button onClick={() => setActiveTab('profile')} className={`px-3 py-2 sm:px-4 sm:py-2.5 font-semibold rounded-lg transition-colors text-sm sm:text-base whitespace-nowrap flex items-center ${activeTab === 'profile' ? 'bg-yellow-400 text-black' : 'text-gray-600 hover:bg-gray-100'}`}><User className="w-5 h-5 mr-2" />Mon Profil</button>
            </nav>
          </div>

          <div className="p-4 md:p-6">
            {activeTab === 'messages' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h2 className="text-xl md:text-2xl font-bold mb-6">Mes Messages</h2>
                {conversations.length > 0 ? (
                  <div className="space-y-4">
                    {conversations.map(chat => (
                      <Link to="/chat" state={{ conversationId: chat.id }} key={chat.id} className="block p-4 rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden"><img src={chat.avatar} alt={chat.vendor} className="w-full h-full object-cover" /></div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between"><h3 className="font-semibold text-black truncate">{chat.vendor}</h3><span className="text-xs text-gray-500">{chat.timestamp}</span></div>
                            <p className="text-sm text-gray-600 truncate">{chat.lastMessage}</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : <p>Aucune conversation pour le moment.</p>}
              </motion.div>
            )}

            {activeTab === 'favorites' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h2 className="text-xl md:text-2xl font-bold mb-6">Mes Favoris</h2>
                {favorites.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {favorites.map(fav => (
                      <Link to={`/product/${fav.products.id}`} key={fav.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                        <div className="aspect-square bg-gray-100"><img src={fav.products.image_urls?.[0]} alt={fav.products.name} className="w-full h-full object-cover" /></div>
                        <div className="p-4">
                          <h3 className="font-semibold mb-1 truncate">{fav.products.name}</h3>
                          <p className="text-sm text-gray-500 mb-2">{fav.products.vendors.name}</p>
                          <p className="text-xl font-bold marsen-yellow-text">{fav.products.price} FCFA</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : <p>Vous n'avez aucun produit en favori.</p>}
              </motion.div>
            )}

            {activeTab === 'orders' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h2 className="text-xl md:text-2xl font-bold mb-6">Mes Commandes</h2>
                <div className="text-center py-16">
                  <ShoppingBag className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Aucune commande</h3>
                  <p className="text-gray-600">La gestion des commandes n'est pas encore disponible.</p>
                </div>
              </motion.div>
            )}

            {activeTab === 'profile' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h2 className="text-xl md:text-2xl font-bold mb-6">Mon Profil</h2>
                <form onSubmit={handleProfileUpdate} className="max-w-lg space-y-6">
                  <div className="flex justify-center">
                    <div className="relative">
                      <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                        {avatarPreview ? (
                          <img src={avatarPreview} alt="Aperçu de l'avatar" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-16 h-16 text-gray-400" />
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current.click()}
                        className="absolute bottom-0 right-0 bg-yellow-400 p-2 rounded-full text-black hover:bg-yellow-500 transition-colors"
                      >
                        <Camera className="w-5 h-5" />
                      </button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleAvatarChange}
                        className="hidden"
                        accept="image/png, image/jpeg"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="client-name" className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
                    <input
                      id="client-name"
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full border-gray-300 rounded-lg shadow-sm"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="client-email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      id="client-email"
                      type="email"
                      value={user.email}
                      disabled
                      className="w-full border-gray-300 rounded-lg shadow-sm bg-gray-100"
                    />
                  </div>
                  <button type="submit" className="btn-primary" disabled={profileLoading}>
                    {profileLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Mettre à jour le profil'}
                  </button>
                </form>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;