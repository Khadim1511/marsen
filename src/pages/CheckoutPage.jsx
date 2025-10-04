import React from 'react';
import { useStripe } from '@stripe/react-stripe-js';
import { toast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useNavigate } from 'react-router-dom';

const CheckoutPage = () => {
  const stripe = useStripe();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);

  const handleCheckout = async () => {
    setLoading(true);

    if (!stripe || !user) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez vous connecter pour vous abonner.",
      });
      setLoading(false);
      navigate('/subscribe');
      return;
    }

    try {
      const { data, error: functionError } = await supabase.functions.invoke('stripe-subscription', {
        body: JSON.stringify({
          email: user.email,
          userId: user.id,
        }),
      });

      if (functionError) {
        console.error('Supabase function invocation error:', functionError);
        throw new Error(`Erreur du serveur: ${functionError.message}`);
      }
      
      if (data.error) {
        console.error('Stripe function returned an error:', data.error);
        throw new Error(data.error);
      }
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('No URL received from function:', data);
        throw new Error("URL de paiement non reçue. Le serveur a peut-être rencontré un problème.");
      }

    } catch (e) {
      console.error("Checkout Error:", e);
      toast({
        variant: "destructive",
        title: "Une erreur est survenue",
        description: e.message || "Impossible de lancer le paiement. Veuillez réessayer.",
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full mx-auto p-8 bg-white rounded-2xl card-shadow text-center">
        <h1 className="text-3xl font-bold mb-4">Finaliser l'abonnement</h1>
        <p className="text-gray-600 mb-8">
          Vous êtes sur le point de devenir un vendeur Premium.
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
              <span>Bénéficiez d'une visibilité accrue</span>
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

        <button
          onClick={handleCheckout}
          disabled={!stripe || loading}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-lg font-semibold text-black bg-yellow-400 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" /> : 'Payer et S\'abonner'}
        </button>
        
        <p className="text-xs text-gray-500 mt-4">
          Vous allez être redirigé vers une page de paiement sécurisée par Stripe.
        </p>
      </div>
    </div>
  );
};

export default CheckoutPage;