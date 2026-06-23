import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import RoleGate from '../components/RoleGate';
import ApiStatusBanner from '../components/ApiStatusBanner';

export default function AdminLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[var(--color-background)]">
      {/* Sidebar for Desktop & Mobile Drawer */}
      <Sidebar isOpen={isMobileMenuOpen} setIsOpen={setIsMobileMenuOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-[320px]">
        <Header onMenuClick={() => setIsMobileMenuOpen(true)} />
        
        <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
          <ApiStatusBanner />
          <RoleGate>
            <Outlet />
          </RoleGate>
        </main>
      </div>
    </div>
  );
}
