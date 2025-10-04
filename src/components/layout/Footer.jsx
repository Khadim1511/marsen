import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';

const Footer = ({ className }) => {
  return (
    <footer className={cn("bg-black text-white", className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8">
          {/* Logo & Description */}
          <div className="lg:col-span-4">
            <div className="flex items-center space-x-3 mb-4">
              <img src="https://horizons-cdn.hostinger.com/a528ae19-b5b0-4f31-aad1-9df6ba79c534/f0b435001225453c748cfa35cfd7c7da.png" alt="Marsen Logo" className="h-12 w-auto" />
            </div>
            <p className="text-gray-400 mb-6 max-w-md">
              Le marketplace digital du Sénégal qui connecte acheteurs et vendeurs. 
              Trouvez votre vendeur en un clic !
            </p>
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-3 text-gray-300">
                <Phone className="w-5 h-5 text-yellow-400" />
                <span>+221 78 614 78 70</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-300">
                <Mail className="w-5 h-5 text-yellow-400" />
                <span>marsen.senegal@gmail.com</span>
              </div>
            </div>
          </div>

          {/* Links Grid */}
          <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold text-lg mb-4 text-yellow-400">Navigation</h3>
              <ul className="space-y-3">
                <li><Link to="/" className="text-gray-300 hover:text-white transition-colors">Accueil</Link></li>
                <li><Link to="/search" className="text-gray-300 hover:text-white transition-colors">Rechercher</Link></li>
                <li><Link to="/dashboard" className="text-gray-300 hover:text-white transition-colors">Devenir Vendeur</Link></li>
                <li><Link to="/favorites" className="text-gray-300 hover:text-white transition-colors">Mes Favoris</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-4 text-yellow-400">Catégories</h3>
              <ul className="space-y-3">
                <li><Link to="/search?category=vetements" className="text-gray-300 hover:text-white transition-colors">Vêtements</Link></li>
                <li><Link to="/search?category=alimentation" className="text-gray-300 hover:text-white transition-colors">Alimentation</Link></li>
                <li><Link to="/search?category=tissus" className="text-gray-300 hover:text-white transition-colors">Tissus</Link></li>
                <li><Link to="/search?category=auto" className="text-gray-300 hover:text-white transition-colors">Pièces Auto</Link></li>
                <li><Link to="/search?category=electronique" className="text-gray-300 hover:text-white transition-colors">Électronique</Link></li>
                <li><Link to="/search?category=immobilier" className="text-gray-300 hover:text-white transition-colors">Immobilier</Link></li>
                <li><Link to="/search?category=cosmetiques" className="text-gray-300 hover:text-white transition-colors">Cosmétiques</Link></li>
                <li><Link to="/search?category=artisanat" className="text-gray-300 hover:text-white transition-colors">Artisanat</Link></li>
                <li><Link to="/search?category=services" className="text-gray-300 hover:text-white transition-colors">Services</Link></li>
                <li><Link to="/search?category=meubles" className="text-gray-300 hover:text-white transition-colors">Meubles</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-4 text-yellow-400">Légal</h3>
              <ul className="space-y-3">
                <li><Link to="#" className="text-gray-300 hover:text-white transition-colors">Conditions d'utilisation</Link></li>
                <li><Link to="#" className="text-gray-300 hover:text-white transition-colors">Politique de confidentialité</Link></li>
                <li><Link to="#" className="text-gray-300 hover:text-white transition-colors">FAQ</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 text-center">
          <p className="text-gray-500">
            © {new Date().getFullYear()} Marsen. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;