import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Mail, Phone, MapPin, ExternalLink, Calendar, TrendingUp } from 'lucide-react';
import { customersService } from '../services/customers';
import { toast } from 'react-toastify';
import DataTable from '../components/DataTable';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();

  const fetchCustomers = async (showLoading = true) => {
    try {
      const data = await customersService.getCustomers();
      setCustomers(data || []);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      toast.error('Erro ao carregar clientes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(false);
  }, []);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Novo': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'Recorrente': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'VIP': return 'bg-[#FF4D00]/10 text-[#FF4D00] border-[#FF4D00]/20 shadow-[0_0_10px_rgba(255,77,0,0.2)] font-bold';
      case 'Inativo': return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const columns = [
    {
      header: 'Cliente',
      accessor: 'name',
      render: (row) => (
        <div 
          className="flex items-center gap-4 cursor-pointer group"
          onClick={() => navigate(`/admin/customers/${row.id}`)}
        >
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-heading text-lg text-white group-hover:bg-white/10 transition-colors">
            {row.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-white text-sm group-hover:text-[#FF4D00] transition-colors">
              {row.name}
            </p>
            <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5 flex items-center gap-2">
              <span>{row.email !== '-' ? row.email : row.phone}</span>
            </p>
          </div>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <span className={`px-2.5 py-1 rounded-lg text-[11px] uppercase tracking-wider border ${getStatusBadgeClass(row.status)}`}>
          {row.status}
        </span>
      )
    },
    {
      header: 'Pedidos',
      accessor: 'totalOrders',
      render: (row) => (
        <span className="text-white text-sm">{row.totalOrders}</span>
      )
    },
    {
      header: 'Total Gasto',
      accessor: 'totalSpent',
      render: (row) => (
        <span className="font-medium text-white text-sm">
          R$ {Number(row.totalSpent || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      header: 'Último Pedido',
      accessor: 'lastOrderDate',
      render: (row) => (
        <span className="text-sm text-[var(--color-text-muted)]">
          {new Date(row.lastOrderDate).toLocaleDateString('pt-BR')}
        </span>
      )
    },
    {
      header: '',
      accessor: 'actions',
      render: (row) => (
        <button 
          onClick={() => navigate(`/admin/customers/${row.id}`)}
          className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors"
          title="Ver Perfil"
        >
          <ExternalLink size={16} />
        </button>
      )
    }
  ];

  const filteredCustomers = useMemo(() => {
    let result = customers;
    if (statusFilter !== 'all') {
      result = result.filter(c => c.status.toLowerCase() === statusFilter.toLowerCase());
    }
    return result;
  }, [customers, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h1 className="font-heading text-3xl sm:text-4xl text-white tracking-widest uppercase mb-1">
            Clientes <span className="text-[#FF4D00]">.</span>
          </h1>
          <p className="font-sans text-[var(--color-text-muted)] text-sm">
            Gestão e inteligência de base
          </p>
        </div>
        
        <div className="flex flex-1 w-full xl:justify-end items-center gap-3">
          <div className="relative min-w-[140px]">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-[#0D0D0D] border border-white/5 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF4D00] transition-colors appearance-none"
            >
              <option value="all">Todos os Status</option>
              <option value="novo">Novo</option>
              <option value="recorrente">Recorrente</option>
              <option value="vip">VIP</option>
              <option value="inativo">Inativo</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-[#FF4D00] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="bg-[#0D0D0D] border border-[rgba(255,255,255,0.06)] rounded-[32px] p-6">
          <DataTable
            columns={columns}
            data={filteredCustomers}
            searchPlaceholder="Buscar por nome, email ou telefone..."
          />
        </div>
      )}
    </div>
  );
}
