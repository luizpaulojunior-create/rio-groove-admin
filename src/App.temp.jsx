import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes';
import { AuthProvider } from './contexts/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <ToastContainer 
          position="bottom-right" 
          autoClose={3000} 
          theme="dark" 
          toastClassName="bg-[var(--color-surface)] border border-[var(--color-border)] text-white"
        />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
