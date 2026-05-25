import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom';
import { Home, Layout, Type, Image as ImageIcon, Smartphone, Globe, Settings } from 'lucide-react';
import StorefrontHome from './StorefrontHome';
import StorefrontHeader from './StorefrontHeader';
import StorefrontNavigation from './StorefrontNavigation';
import StorefrontBranding from './StorefrontBranding';
import StorefrontMobile from './StorefrontMobile';
import StorefrontLandingPages from './StorefrontLandingPages';

export default function Storefront() {
  const location = useLocation();

  const tabs = [
    { path: '/admin/storefront/home', name: 'Home', icon: Home },
    { path: '/admin/storefront/header', name: 'Header', icon: Layout },
    { path: '/admin/storefront/footer', name: 'Footer', icon: Layout },
    { path: '/admin/storefront/navigation', name: 'Navegação', icon: Globe },
    { path: '/admin/storefront/landing-pages', name: 'Landing Pages', icon: Type },
    { path: '/admin/storefront/branding', name: 'Branding', icon: ImageIcon },
    { path: '/admin/storefront/mobile', name: 'Mobile Experience', icon: Smartphone },
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-heading tracking-widest text-white uppercase">
          Storefront
        </h1>
        <p className="text-[var(--color-text-muted)] font-sans mt-2">
          Gerencie a estrutura visual e de conteúdo da sua loja.
        </p>
      </div>

      <div className="flex gap-8">
        {/* Sidebar Menu for Storefront */}
        <div className="w-64 shrink-0">
          <nav className="flex flex-col space-y-2">
            {tabs.map((tab) => {
              const isActive = location.pathname.includes(tab.path);
              return (
                <NavLink
                  key={tab.path}
                  to={tab.path}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-3xl transition-all duration-300
                    ${isActive 
                      ? 'bg-[#FF4D00]/10 text-[#FF4D00] font-medium border border-[#FF4D00]/20' 
                      : 'text-[var(--color-text-muted)] hover:bg-white/5 hover:text-white'
                    }
                  `}
                >
                  <tab.icon size={18} />
                  <span>{tab.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <Routes>
            <Route path="/" element={<Navigate to="home" replace />} />
            <Route path="home" element={<StorefrontHome />} />
            <Route path="header" element={<StorefrontHeader />} />
            <Route path="navigation" element={<StorefrontNavigation />} />
            <Route path="landing-pages" element={<StorefrontLandingPages />} />
            <Route path="branding" element={<StorefrontBranding />} />
            <Route path="mobile" element={<StorefrontMobile />} />
            <Route path="*" element={
              <div className="bg-[#0D0D0D] border border-white/5 rounded-2xl p-12 text-center">
                <Settings className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <h3 className="text-xl font-heading text-white mb-2">Área em Desenvolvimento</h3>
                <p className="text-[var(--color-text-muted)]">Esta seção será disponibilizada em futuras atualizações.</p>
              </div>
            } />
          </Routes>
        </div>
      </div>
    </div>
  );
}
