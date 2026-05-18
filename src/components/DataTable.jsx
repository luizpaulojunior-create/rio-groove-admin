import { useState } from 'react';
import { motion } from 'framer-motion';
import { Edit, Trash2, Search, Plus, MoreHorizontal, ArrowRightLeft } from 'lucide-react';

export default function DataTable({ 
  columns, 
  data, 
  onEdit, 
  onDelete,
  onAdjust,
  searchPlaceholder = "Buscar...",
  onAdd,
  addButtonText = "Adicionar"
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = data.filter(item => 
    Object.values(item).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="space-y-4">
      {/* Table Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={20} />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-primary)] transition-colors"
          />
        </div>
        
        {onAdd && (
          <button
            onClick={onAdd}
            className="bg-[var(--color-primary)] text-white px-6 py-2.5 rounded-xl font-medium hover:bg-[var(--color-primary-hover)] transition-colors glow-red flex items-center gap-2 justify-center"
          >
            <Plus size={20} />
            {addButtonText}
          </button>
        )}
      </div>

      {/* Table Container */}
      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[rgba(255,255,255,0.02)]">
                {columns.map((col, index) => (
                  <th 
                    key={index} 
                    className="py-4 px-6 text-sm font-medium text-[var(--color-text-muted)] uppercase tracking-wider"
                  >
                    {col.header}
                  </th>
                ))}
                {(onEdit || onDelete || onAdjust) && (
                  <th className="py-4 px-6 text-right text-sm font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                    Ações
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {filteredData.length > 0 ? (
                filteredData.map((row, rowIndex) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: rowIndex * 0.05 }}
                    key={row.id || rowIndex} 
                    className="hover:bg-[rgba(255,255,255,0.02)] transition-colors group"
                  >
                    {columns.map((col, colIndex) => (
                      <td key={colIndex} className="py-4 px-6 text-sm whitespace-nowrap">
                        {col.render ? col.render(row) : row[col.accessor]}
                      </td>
                    ))}
                    {(onEdit || onDelete || onAdjust) && (
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {onAdjust && (
                            <button
                              onClick={() => onAdjust(row)}
                              className="p-2 text-[var(--color-text-muted)] hover:text-blue-500 transition-colors rounded-lg hover:bg-blue-500/10"
                              title="Ajustar Estoque"
                            >
                              <ArrowRightLeft size={18} />
                            </button>
                          )}
                          {onEdit && (
                            <button
                              onClick={() => onEdit(row)}
                              className="p-2 text-[var(--color-text-muted)] hover:text-white transition-colors rounded-lg hover:bg-[rgba(255,255,255,0.1)]"
                              title="Editar"
                            >
                              <Edit size={18} />
                            </button>
                          )}
                          {onDelete && (
                            <button
                              onClick={() => onDelete(row)}
                              className="p-2 text-[var(--color-text-muted)] hover:text-red-500 transition-colors rounded-lg hover:bg-red-500/10"
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
                    className="py-12 text-center text-[var(--color-text-muted)]"
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
