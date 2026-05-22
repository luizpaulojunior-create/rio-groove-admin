import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import ProtectedRoute from '../components/ProtectedRoute';
import Orders from '../pages/Orders';

const Login = lazy(() => import('../pages/Login'));
const Dashboard = lazy(() => import('../pages/Dashboard'));
const Products = lazy(() => import('../pages/Products'));
const ProductDetail = lazy(() => import('../pages/ProductDetail'));
const Stock = lazy(() => import('../pages/Stock'));
const Collections = lazy(() => import('../pages/Collections'));
const Stats = lazy(() => import('../pages/Stats'));
const Settings = lazy(() => import('../pages/Settings'));
const Customers = lazy(() => import('../pages/Customers'));
const CustomerDetail = lazy(() => import('../pages/CustomerDetail'));

// Novos Módulos de Growth
const Storefront = lazy(() => import('../pages/Storefront'));
const Campaigns = lazy(() => import('../pages/Campaigns'));
const Editorial = lazy(() => import('../pages/Editorial'));
const Community = lazy(() => import('../pages/Community'));
const Creators = lazy(() => import('../pages/Creators'));
const CRM = lazy(() => import('../pages/CRM'));
const Loyalty = lazy(() => import('../pages/Loyalty'));

const LoadingFallback = () => (
  <div className="flex h-screen w-full items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
  </div>
);

export default function AppRoutes() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
      <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="/admin/login" element={<Login />} />
      
      <Route path="/admin" element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
        <Route path="orders" element={<Orders />} />
        <Route path="products" element={<Products />} />
        <Route path="products/:id" element={<ProductDetail />} />
        <Route path="stock" element={<Stock />} />
        <Route path="collections" element={<Collections />} />
        <Route path="stats" element={<Stats />} />
        <Route path="settings" element={<Settings />} />
        <Route path="customers" element={<Customers />} />
        <Route path="customers/:id" element={<CustomerDetail />} />
        
        {/* Novas Rotas Growth */}
        <Route path="storefront/*" element={<Storefront />} />
        <Route path="campaigns" element={<Campaigns />} />
        <Route path="editorial" element={<Editorial />} />
        <Route path="community" element={<Community />} />
        <Route path="creators" element={<Creators />} />
        <Route path="crm" element={<CRM />} />
        <Route path="loyalty" element={<Loyalty />} />
        </Route>
      </Route>
    </Routes>
    </Suspense>
  );
}
