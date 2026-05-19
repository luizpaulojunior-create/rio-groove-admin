import { Outlet } from 'react-router-dom';

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-black text-white p-10">
      <h1>ADMIN LAYOUT TEST</h1>

      <Outlet />
    </div>
  );
}