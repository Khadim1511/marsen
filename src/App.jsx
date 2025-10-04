import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import HomePage from '@/pages/HomePage';
import SearchPage from '@/pages/SearchPage';
import VendorPage from '@/pages/VendorPage';
import VendorDashboard from '@/pages/VendorDashboard';
import ProductPage from '@/pages/ProductPage';
import FavoritesPage from '@/pages/FavoritesPage';
import ChatPage from '@/pages/ChatPage';
import AuthModal from '@/components/AuthModal';
import ClientDashboard from '@/components/ClientDashboard';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import CheckoutPage from '@/pages/CheckoutPage';
import SubscribePage from '@/pages/SubscribePage';
import ScrollToTop from '@/components/ScrollToTop';

const stripePromise = loadStripe("pk_test_51S9VIj1pIKoGWqa4XdwMLjkAanBR5YCumNFdzcYp0caj1NAfdEuc1e8rGlxV0PTSmrtBVN9YQyFeVhNv4zuHgelM00XuA0cHsj");

const AppContent = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalCallback, setAuthModalCallback] = useState(null);
  const location = useLocation();

  const openAuthModal = (callback) => {
    setAuthModalCallback(() => callback);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setAuthModalCallback(null);
  };

  const isChatPage = location.pathname === '/chat';

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>Marsen</title>
        <meta name="description" content="Marsen - Trouvez votre vendeur en un clic. Le marketplace digital du Sénégal pour connecter acheteurs et vendeurs." />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#FFD100" />
      </Helmet>
      
      <Header openAuthModal={openAuthModal} />
      
      <main className="flex-1">
        <Elements stripe={stripePromise}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={<SearchPage openAuthModal={openAuthModal} />} />
            <Route path="/vendor/:id" element={<VendorPage openAuthModal={openAuthModal} />} />
            <Route path="/product/:id" element={<ProductPage openAuthModal={openAuthModal} />} />
            <Route path="/dashboard" element={<VendorDashboard />} />
            <Route path="/client-dashboard" element={<ClientDashboard />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/subscribe" element={<SubscribePage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
          </Routes>
        </Elements>
      </main>
      
      <Footer className={isChatPage ? 'hidden md:block' : ''} />
      <Toaster />
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={closeAuthModal}
        onSuccess={() => {
          if (authModalCallback) {
            authModalCallback();
          }
          closeAuthModal();
        }}
      />
    </div>
  );
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <AppContent />
    </Router>
  );
}

export default App;