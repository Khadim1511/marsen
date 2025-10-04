import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const SubscribePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSubscribeClick = () => {
    if (user) {
      navigate('/checkout');
    } else {
      // Gérer le cas où l'utilisateur n'est pas connecté
      // Peut-être ouvrir une modale de connexion ?
      // Pour l'instant, on redirige vers le checkout, qui gère déjà ce cas.
      navigate('/checkout');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full mx-auto p-8 bg-white rounded-2xl card-shadow text-center">
        <h1 className="text-3xl font-bold mb-4">Devenez Vendeur Premium</h1>
        <p className="text-gray-600 mb-8">
          Débloquez des fonctionnalités exclusives et boostez votre visibilité sur Marsen.
        </p>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
          <p className="font-semibold text-xl">Plan Premium</p>
          <p className="text-4xl font-bold my-2 marsen-yellow-text">5000 FCFA<span className="text-lg font-normal text-gray-600">/mois</span></p>
          <ul className="text-left mt-6 space-y-3 text-gray-700">
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              <span>Publiez un nombre illimité de produits</span>
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              <span>Bénéficiez d'une visibilité accrue dans les recherches</span>
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              <span>Accédez à un support client prioritaire</span>
            </li>
             <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              <span>Badge vendeur premium sur votre profil</span>
            </li>
          </ul>
        </div>

        <Button 
          onClick={handleSubscribeClick}
          className="w-full py-3 text-lg font-semibold text-black bg-yellow-400 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
          size="lg"
        >
          Je m'abonne
        </Button>
        
        <p className="text-xs text-gray-500 mt-4">
          Vous serez redirigé vers une page de paiement sécurisée.
        </p>
      </div>
    </div>
  );
};

export default SubscribePage;