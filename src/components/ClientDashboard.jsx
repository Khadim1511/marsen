import React from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const ClientDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleBecomeVendor = () => {
    navigate('/subscribe');
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl card-shadow">
        <h1 className="text-2xl font-bold mb-6 text-center">Mon Compte Client</h1>
        
        <div className="text-center mb-8">
          <p className="text-lg">Bonjour, <span className="font-semibold">{user?.user_metadata?.name || user?.email}</span> !</p>
          <p className="text-gray-600">Bienvenue sur votre espace personnel.</p>
        </div>

        <div className="space-y-4">
          <Button onClick={() => navigate('/favorites')} className="w-full" variant="outline">
            Mes Favoris
          </Button>
          <Button onClick={() => navigate('/chat')} className="w-full" variant="outline">
            Mes Messages
          </Button>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200 text-center">
          <h2 className="text-xl font-semibold mb-4">Passez au niveau supérieur</h2>
          <p className="text-gray-600 mb-4">
            Vous souhaitez vendre vos propres produits sur Marsen ? Devenez vendeur dès aujourd'hui !
          </p>
          <Button 
            onClick={handleBecomeVendor}
            className="w-full bg-yellow-400 text-black hover:bg-yellow-500"
          >
            Devenir Vendeur Premium
          </Button>
        </div>

        <div className="mt-8 text-center">
          <Button onClick={signOut} variant="destructive">
            Se déconnecter
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;