import React from 'react';
import { Link } from 'react-router-dom';
import { Edit, Eye, Trash2, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import VendorStatusBadge from './VendorStatusBadge';

const VendorTable = ({
  vendors = [],
  onDelete,
  userRole,
  currentSort,
  currentOrder,
  onSort
}) => {
  const isWritable = ['admin', 'officer'].includes(userRole);
  const isAdmin = userRole === 'admin';

  const renderSortHeader = (label, field) => {
    const isSorted = currentSort === field;
    
    return (
      <th
        onClick={() => onSort && onSort(field)}
        className="py-4 px-6 cursor-pointer hover:bg-slate-100/50 transition-colors select-none group"
      >
        <div className="flex items-center gap-1">
          <span>{label}</span>
          <span className="text-slate-400 group-hover:text-slate-600 transition-colors">
            {isSorted ? (
              currentOrder === 'asc' ? <ArrowUp size={12} className="text-primary font-black" /> : <ArrowDown size={12} className="text-primary font-black" />
            ) : (
              <ArrowUpDown size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </span>
        </div>
      </th>
    );
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-premium">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-black uppercase tracking-wider text-slate-500 sticky top-0 z-10">
              {renderSortHeader('Vendor', 'vendor_name')}
              {renderSortHeader('Company', 'company_name')}
              <th className="py-4 px-6">GST</th>
              <th className="py-4 px-6">Category</th>
              {renderSortHeader('City', 'city')}
              {renderSortHeader('Status', 'status')}
              <th className="py-4 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-150/70 font-semibold text-sm text-slate-650">
            {vendors.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                  No vendors found matching the criteria.
                </td>
              </tr>
            ) : (
              vendors.map((vendor) => (
                <tr key={vendor.id} className="hover:bg-slate-50/30 transition duration-150">
                  <td className="py-4 px-6">
                    <p className="font-bold text-slate-900">{vendor.vendor_name || vendor.name}</p>
                    <p className="mt-0.5 text-xs font-bold text-slate-500 font-mono">{vendor.vendor_code}</p>
                  </td>
                  <td className="py-4 px-6 text-slate-900">{vendor.company_name}</td>
                  <td className="py-4 px-6 text-slate-950 font-mono">{vendor.gst_number || 'N/A'}</td>
                  <td className="py-4 px-6 text-slate-900">
                    <span className="bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 rounded font-black uppercase tracking-wide">
                      {vendor.category_name || 'Uncategorized'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-slate-900">{vendor.city || '-'}</td>
                  <td className="py-4 px-6">
                    <VendorStatusBadge status={vendor.status} />
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex justify-end gap-2">
                      <Link 
                        to={`/vendors/${vendor.id}`} 
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:border-primary/20 hover:text-primary transition shadow-sm"
                        title="View Details"
                      >
                        <Eye size={14} />
                      </Link>
                      
                      {isWritable && (
                        <Link 
                          to={`/vendors/${vendor.id}/edit`} 
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:border-primary/20 hover:text-primary transition shadow-sm"
                          title="Edit Profile"
                        >
                          <Edit size={14} />
                        </Link>
                      )}

                      {isAdmin && (
                        <button 
                          onClick={() => onDelete(vendor.id)} 
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-550 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 transition shadow-sm cursor-pointer"
                          title="Archive Vendor"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VendorTable;
