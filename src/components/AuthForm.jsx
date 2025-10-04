import React, { useState } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const AuthForm = ({ onSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp, signIn } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (isSignUp) {
      const { error } = await signUp(email, password, { 
        data: { 
          name, 
          is_vendor: true
        } 
      });
      if (!error) {
        toast({
          title: "Compte vendeur créé !",
          description: "Veuillez vérifier votre email pour confirmer votre compte.",
        });
        if (onSuccess) onSuccess();
      }
    } else {
      const { error } = await signIn(email, password);
      if (!error) {
        if (onSuccess) onSuccess();
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl card-shadow">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-black">
            {isSignUp ? 'Créer un compte vendeur' : 'Connexion Vendeur'}
          </h1>
          <p className="text-gray-600 mt-2">
            {isSignUp ? 'Rejoignez Marsen et commencez à vendre !' : 'Accédez à votre tableau de bord.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {isSignUp && (
            <div>
              <label htmlFor="name-vendor" className="block text-sm font-medium text-gray-700">
                Nom de la boutique
              </label>
              <input
                id="name-vendor"
                name="name"
                type="text"
                autoComplete="organization"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
              />
            </div>
          )}
          <div>
            <label htmlFor="email-vendor" className="block text-sm font-medium text-gray-700">
              Adresse e-mail
            </label>
            <input
              id="email-vendor"
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
            <label htmlFor="password-vendor" className="block text-sm font-medium text-gray-700">
              Mot de passe
            </label>
            <input
              id="password-vendor"
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
            {isSignUp ? 'Vous avez déjà un compte vendeur ? Connectez-vous' : "Pas encore de compte vendeur ? S'inscrire"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;