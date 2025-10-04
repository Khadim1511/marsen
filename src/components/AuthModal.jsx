import React, { useState, useRef } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Loader2, Camera, User } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/lib/customSupabaseClient';

const AuthModal = ({ isOpen, onClose, onSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const fileInputRef = useRef(null);

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

  const uploadAvatar = async (userId) => {
    if (!avatarFile) return null;
    const fileExt = avatarFile.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `public/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, avatarFile);

    if (uploadError) {
      console.error('Error uploading avatar:', uploadError);
      return null;
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (isSignUp) {
      const { data: { user }, error } = await signUp(email, password, {
        data: { name, is_vendor: false }
      });

      if (error) {
        setLoading(false);
        return;
      }

      if (user) {
        const avatarUrl = await uploadAvatar(user.id);
        
        const updateData = { name };
        if (avatarUrl) {
          updateData.avatar_url = avatarUrl;
        }
        
        await supabase.auth.updateUser({ data: updateData });
        
        toast({
          title: "Inscription réussie !",
          description: "Veuillez vérifier votre email pour confirmer votre compte.",
        });
        onSuccess();
      }
    } else {
      const { error } = await signIn(email, password);
      if (!error) {
        onSuccess();
      }
    }
    setLoading(false);
  };

  const handleOpenChange = (open) => {
    if (!open) {
      onClose();
      // Reset state on close
      setIsSignUp(false);
      setEmail('');
      setPassword('');
      setName('');
      setAvatarFile(null);
      setAvatarPreview(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">{isSignUp ? 'Créer un compte client' : 'Se connecter'}</DialogTitle>
          <DialogDescription className="text-center">
            {isSignUp ? 'Rejoignez Marsen pour contacter les vendeurs.' : 'Accédez à votre compte pour continuer.'}
          </DialogDescription>
        </DialogHeader>
        <div className="p-6 pt-0">
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <>
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-12 h-12 text-gray-400" />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current.click()}
                      className="absolute bottom-0 right-0 bg-yellow-400 p-2 rounded-full text-black hover:bg-yellow-500 transition-colors"
                    >
                      <Camera className="w-4 h-4" />
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
                  <label htmlFor="name-client" className="block text-sm font-medium text-gray-700">
                    Nom complet
                  </label>
                  <input
                    id="name-client"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
                  />
                </div>
              </>
            )}
            <div>
              <label htmlFor="email-modal" className="block text-sm font-medium text-gray-700">
                Adresse e-mail
              </label>
              <input
                id="email-modal"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="password-modal" className="block text-sm font-medium text-gray-700">
                Mot de passe
              </label>
              <input
                id="password-modal"
                name="password"
                type="password"
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                required
                minLength="6"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-black bg-yellow-400 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" /> : (isSignUp ? "S'inscrire" : 'Se connecter')}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="font-medium text-yellow-600 hover:text-yellow-500"
            >
              {isSignUp ? 'Vous avez déjà un compte ? Connectez-vous' : "Pas encore de compte ? S'inscrire"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;