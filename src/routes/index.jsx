import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import ProtectedRoute from '../components/ProtectedRoute';

const Login = lazy(() => import('../pages/Login'));
const Dashboard = lazy(() => import('../pages/Dashboard'));
const Orders = lazy(() => import('../pages/Orders'));
const Products = lazy(() => import('../pages/Products'));
const Stock = lazy(() => import('../pages/Stock'));
const Collections = lazy(() => import('../pages/Collections'));
const Shipping = lazy(() => import('../pages/Shipping'));
const ShippingCallback = lazy(() => import('../pages/ShippingCallback'));
const Stats = lazy(() => import('../pages/Stats'));
const Settings = lazy(() => import('../pages/Settings'));

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
        <Route path="stock" element={<Stock />} />
        <Route path="collections" element={<Collections />} />
        <Route path="shipping" element={<Shipping />} />
        <Route path="shipping/callback" element={<ShippingCallback />} />
        <Route path="stats" element={<Stats />} />
        <Route path="settings" element={<Settings />} />
        </Route>
      </Route>
    </Routes>
    </Suspense>
  );
}
