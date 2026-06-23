import { useState } from 'react';
import { motion } from 'framer-motion';
import { Edit, Trash2, Search, Plus, ArrowRightLeft } from 'lucide-react';

export default function DataTable({
  columns,
  data = [],
  onEdit,
  onDelete,
  onAdjust,
  onRowClick,
  hideToolbar = false,
  searchPlaceholder = 'Buscar...',
  searchValue,
  onSearchChange,
  onAdd,
  addButtonText = 'Adicionar',
}) {
  const [internalSearchTerm, setInternalSearchTerm] = useState('');
  const searchTerm = searchValue !== undefined ? searchValue : internalSearchTerm;

  const setSearchTerm = (value) => {
    if (onSearchChange) {
      onSearchChange(value);
    } else {
      setInternalSearchTerm(value);
    }
  };

  const rowMatchesSearch = (item, term) => {
    if (!term) return true;
    const needle = term.toLowerCase();

    if (item?.searchText && String(item.searchText).includes(needle)) {
      return true;
    }

    return Object.values(item !== null && typeof item === 'object' ? item : {}).some((val) => {
      if (val === null || val === undefined) return false;
      if (typeof val === 'object') {
        return Object.values(val).some((nested) => {
          if (nested === null || nested === undefined || typeof nested === 'object') return false;
          return String(nested).toLowerCase().includes(needle);
        });
      }
      return String(val).toLowerCase().includes(needle);
    });
  };

  const filteredData = Array.isArray(data)
    ? data.filter((item) => rowMatchesSearch(item, searchTerm))
    : [];

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      {!hideToolbar && (
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
        <div className="relative flex-1 w-full max-w-md">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
            size={20}
          />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl pl-12 pr-4 h-12 text-white focus:outline-none focus:border-[var(--color-primary)] transition-all duration-300 placeholder-[var(--color-text-muted)]"
          />
        </div>

        {onAdd && (
          <button
            onClick={onAdd}
            className="btn-primary w-full sm:w-auto"
          >
            <Plus size={20} className="mr-2" />
            {addButtonText}
          </button>
        )}
      </div>
      )}

      {/* Table */}
      <div className="card-premium overflow-hidden !p-0">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="table-premium">
            <thead>
              <tr className="bg-white/[0.02]">
                {(Array.isArray(columns) ? columns : []).map((col, index) => (
                  <th key={index}>
                    {col.header}
                  </th>
                ))}
                {(onEdit || onDelete || onAdjust) && (
                  <th className="text-right">
                    Ações
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? (
                (Array.isArray(filteredData) ? filteredData : []).map((row, rowIndex) => (
                  <motion.tr
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: rowIndex * 0.03 }}
                    key={row?.id || rowIndex}
                    className={`group ${onRowClick ? 'cursor-pointer hover:bg-white/[0.03]' : ''}`}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                  >
                    {(Array.isArray(columns) ? columns : []).map((col, colIndex) => (
                      <td key={colIndex}>
                        {col.render ? col.render(row) : row?.[col.accessor] ?? '-'}
                      </td>
                    ))}

                    {(onEdit || onDelete || onAdjust) && (
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          {onAdjust && (
                            <button
                              onClick={() => onAdjust(row)}
                              className="p-2 text-[var(--color-text-muted)] hover:text-[#EAB308] transition-colors rounded-xl hover:bg-[#EAB308]/10"
                              title="Ajustar Estoque"
                            >
                              <ArrowRightLeft size={18} />
                            </button>
                          )}
                          {onEdit && (
                            <button
                              onClick={() => onEdit(row)}
                              className="p-2 text-[var(--color-text-muted)] hover:text-white transition-colors rounded-xl hover:bg-white/10"
                              title="Editar"
                            >
                              <Edit size={18} />
                            </button>
                          )}
                          {onDelete && (
                            <button
                              onClick={() => onDelete(row)}
                              className="p-2 text-[var(--color-text-muted)] hover:text-red-500 transition-colors rounded-xl hover:bg-red-500/10"
                              title="Excluir"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columns.length + (onEdit || onDelete || onAdjust ? 1 : 0)}
                    className="py-12 text-center text-[var(--color-text-muted)] font-sans"
                  >
                    Nenhum registro encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
