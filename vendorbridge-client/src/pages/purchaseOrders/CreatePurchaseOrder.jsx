import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { createPO, getPOById, updatePO } from '../../api/poApi';
import { getApprovals, getApprovalById } from '../../api/approvalApi';
import { getQuotationById } from '../../api/quotationApi';
import { calculateQuotationAmounts } from '../../utils/priceCalculator';
import Spinner from '../../components/Spinner';
import Toast from '../../components/Toast';
import { 
  FileText, 
  Calendar, 
  MapPin, 
  Truck, 
  Plus, 
  Trash2, 
  Save, 
  ArrowLeft,
  Settings,
  ShoppingBag,
  Percent
} from 'lucide-react';

const CreatePurchaseOrder = () => {
  const { approvalId, poId } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!poId;

  // General state
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState({ message: '', type: '' });

  // List of approvals for selection dropdown (only if create mode and no approvalId in params)
  const [approvedRequests, setApprovedRequests] = useState([]);
  
  // Selected approval metadata
  const [selectedApproval, setSelectedApproval] = useState(null);

  // Form Fields
  const [formApprovalId, setFormApprovalId] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().substring(0, 10));
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('Road Transport');
  const [deliveryAddress, setDeliveryAddress] = useState(
    'VendorBridge Corporate BKC\n401, Tech Park-B, Bandra Kurla Complex,\nMumbai, Maharashtra - 400051, India'
  );
  const [notes, setNotes] = useState('');
  const [termsConditions, setTermsConditions] = useState('1. Delivery must be completed on or before the expected delivery date.\n2. Goods must meet all quality standards set in the RFQ specifications.\n3. Late delivery is subject to a 0.5% penalty per week.');

  // Items State
  const [items, setItems] = useState([]);

  // Live Totals
  const [totals, setTotals] = useState({ subtotal: 0, tax_amount: 0, discount_amount: 0, grand_total: 0 });

  // 1. Load initial data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        if (isEditMode) {
          // EDIT MODE: Fetch PO by ID
          const response = await getPOById(poId);
          if (response.status === 'success') {
            const po = response.data;
            if (po.status !== 'Draft') {
              setError('Only Draft Purchase Orders can be edited.');
              setLoading(false);
              return;
            }
            setFormApprovalId(po.approval_request_id);
            setIssueDate(new Date(po.issue_date).toISOString().substring(0, 10));
            setExpectedDeliveryDate(new Date(po.expected_delivery_date).toISOString().substring(0, 10));
            setDeliveryMethod(po.delivery_method || '');
            setDeliveryAddress(po.delivery_address || '');
            setNotes(po.notes || '');
            setTermsConditions(po.terms_conditions || '');
            
            // Map items
            const mappedItems = (po.line_items || []).map(item => ({
              ...item,
              tax_percentage: parseFloat(item.tax_percentage) || 0,
              discount_percentage: parseFloat(item.discount_percentage) || 0
            }));
            setItems(mappedItems);
            
            // Fetch approval info for header
            const appResponse = await getApprovalById(po.approval_request_id);
            if (appResponse.status === 'success') {
              setSelectedApproval(appResponse.data);
            }
          } else {
            setError('Failed to load Purchase Order details.');
          }
        } else {
          // CREATE MODE
          if (approvalId) {
            // Pre-selected Approval ID in URL
            await handleSelectApproval(approvalId);
          } else {
            // Load list of approved requests for dropdown selection
            const response = await getApprovals({ status: 'Approved' });
            if (response.status === 'success') {
              setApprovedRequests(response.data || []);
            } else {
              setError('Failed to fetch approved requests.');
            }
          }
        }
      } catch (err) {
        console.error(err);
        setError(err.message || 'An error occurred while loading form data.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [approvalId, poId, isEditMode]);

  // Recalculate totals whenever items state changes
  useEffect(() => {
    const calc = calculateQuotationAmounts(items);
    setTotals({
      subtotal: calc.subtotal,
      tax_amount: calc.tax_amount,
      discount_amount: calc.discount_amount,
      grand_total: calc.grand_total
    });
  }, [items]);

  // Handle Dropdown Selection of Approval Request
  const handleSelectApproval = async (appId) => {
    setLoading(true);
    setFormApprovalId(appId);
    try {
      const response = await getApprovalById(appId);
      if (response.status === 'success') {
        const app = response.data;
        setSelectedApproval(app);

        // Fetch Quotation Details to retrieve the line items
        const quoteResponse = await getQuotationById(app.quotation_id);
        if (quoteResponse.status === 'success') {
          const quotation = quoteResponse.data;
          
          // Map quotation items to PO items
          const mappedItems = (quotation.line_items || []).map(item => ({
            quotation_item_id: item.id,
            item_name: item.item_name,
            description: item.description || '',
            quantity: parseFloat(item.quantity) || 0,
            unit: item.unit || 'Units',
            unit_price: parseFloat(item.unit_price) || 0,
            tax_percentage: parseFloat(item.tax_percentage) || 18.00, // Default 18% GST if none
            discount_percentage: parseFloat(item.discount_percentage) || 0.00
          }));
          
          setItems(mappedItems);

          // Calculate Delivery Dates
          const issue = new Date();
          const deliveryDays = parseInt(quotation.delivery_days, 10) || 7;
          const deliveryDate = new Date(issue.getTime() + deliveryDays * 24 * 60 * 60 * 1000);
          
          setIssueDate(issue.toISOString().substring(0, 10));
          setExpectedDeliveryDate(deliveryDate.toISOString().substring(0, 10));
          
          if (quotation.notes) {
            setNotes(`Quotation Bid Notes: ${quotation.notes}`);
          }
        }
      }
    } catch (err) {
      console.error(err);
      setToast({ message: err.message || 'Failed to retrieve approval quotation details.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Item Table Mutators
  const updateItemField = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const addNewItem = () => {
    setItems([
      ...items,
      {
        quotation_item_id: null,
        item_name: '',
        description: '',
        quantity: 1,
        unit: 'Units',
        unit_price: 0,
        tax_percentage: 18.00,
        discount_percentage: 0.00
      }
    ]);
  };

  const removeItem = (index) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
  };

  // Form Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formApprovalId) {
      setToast({ message: 'Please select an Approved quotation request.', type: 'error' });
      return;
    }

    if (items.length === 0) {
      setToast({ message: 'Purchase Order must contain at least one item.', type: 'error' });
      return;
    }

    // Check dates
    const issue = new Date(issueDate);
    const delivery = new Date(expectedDeliveryDate);
    issue.setHours(0, 0, 0, 0);
    delivery.setHours(0, 0, 0, 0);
    if (delivery < issue) {
      setToast({ message: 'Expected Delivery Date cannot be earlier than Issue Date.', type: 'error' });
      return;
    }

    setSubmitting(true);
    setError(null);

    const payload = {
      approval_request_id: formApprovalId,
      issue_date: issueDate,
      expected_delivery_date: expectedDeliveryDate,
      delivery_method: deliveryMethod,
      delivery_address: deliveryAddress,
      notes: notes,
      terms_conditions: termsConditions,
      items: items
    };

    try {
      let response;
      if (isEditMode) {
        response = await updatePO(poId, payload);
      } else {
        response = await createPO(payload);
      }

      if (response.status === 'success') {
        setToast({ 
          message: isEditMode ? 'Purchase Order updated successfully!' : 'Purchase Order generated as Draft!', 
          type: 'success' 
        });
        setTimeout(() => {
          navigate(`/purchase-orders/${response.data.id}`);
        }, 1000);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to submit Purchase Order request.');
      setToast({ message: err.message || 'Error occurred during save.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && items.length === 0) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Toast Alert */}
      {toast.message && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: '', type: '' })}
        />
      )}

      {/* Nav breadcrumb */}
      <button
        onClick={() => navigate(isEditMode ? `/purchase-orders/${poId}` : '/purchase-orders')}
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition"
      >
        <ArrowLeft className="h-4 w-4" /> Back to {isEditMode ? 'Details' : 'List'}
      </button>

      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-sans">
          {isEditMode ? 'Edit Draft Purchase Order' : 'Create Purchase Order'}
        </h1>
        <p className="text-sm font-semibold text-slate-500">
          Set schedules, shipping coordinates, delivery terms, and line items.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-sm font-bold text-rose-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Core Metadata Card */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-premium grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Approval Select (Create Mode) / Read-only (Edit Mode) */}
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500">
              Approved Selection Request
            </label>
            {isEditMode || approvalId ? (
              <div className="premium-input bg-slate-50 border-slate-200 select-none flex items-center font-bold text-slate-700">
                {selectedApproval ? `${selectedApproval.approval_number} — ${selectedApproval.rfq_title}` : `Approval Request ID: ${formApprovalId}`}
              </div>
            ) : (
              <div className="relative">
                <select
                  value={formApprovalId}
                  onChange={(e) => handleSelectApproval(e.target.value)}
                  className="premium-input pr-10 cursor-pointer"
                  required
                >
                  <option value="">-- Select Approved Quotation --</option>
                  {approvedRequests.map(ar => (
                    <option key={ar.id} value={ar.id}>
                      {ar.approval_number} — {ar.rfq_title} ({ar.vendor_name})
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-slate-400">
                  <Settings className="h-4 w-4" />
                </div>
              </div>
            )}
          </div>

          {/* Supplier details card if loaded */}
          {selectedApproval && (
            <div className="bg-green-50/45 rounded-2xl border border-indigo-100 p-4 flex flex-col justify-center">
              <span className="text-[10px] font-black uppercase text-green-500 tracking-wider">Assigned Vendor</span>
              <h4 className="text-base font-black text-slate-900 mt-1">{selectedApproval.vendor_name}</h4>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">Quot. Reference: {selectedApproval.quotation_number}</p>
            </div>
          )}
        </div>

        {/* Schedules and Delivery Coordinates */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-premium space-y-6">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Calendar className="h-5 w-5 text-slate-400" /> Schedules & Deliveries
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Issue Date */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500">
                Issue Date
              </label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="premium-input"
                required
              />
            </div>

            {/* Expected Delivery Date */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500">
                Expected Delivery Date
              </label>
              <input
                type="date"
                value={expectedDeliveryDate}
                onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                className="premium-input"
                required
              />
            </div>

            {/* Delivery Method */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500">
                Delivery Method
              </label>
              <div className="relative">
                <select
                  value={deliveryMethod}
                  onChange={(e) => setDeliveryMethod(e.target.value)}
                  className="premium-input pr-10 cursor-pointer"
                >
                  <option value="Road Transport">Road Transport</option>
                  <option value="Air Freight">Air Freight</option>
                  <option value="Sea Cargo">Sea Cargo</option>
                  <option value="Courier Express">Courier Express</option>
                  <option value="Self Collection">Self Collection</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-slate-400">
                  <Truck className="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500">
              Delivery Address (Ship To)
            </label>
            <textarea
              rows="3"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              className="premium-input leading-relaxed"
              required
            />
          </div>
        </div>

        {/* PO Line Items (Draft Mode Editable Table) */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-premium space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-slate-400" /> Line Items
            </h2>
            <button
              type="button"
              onClick={addNewItem}
              className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-green-50/50 hover:bg-green-50 px-3.5 py-2 text-xs font-bold text-green-600 transition"
            >
              <Plus className="h-4 w-4" /> Add Item
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-semibold text-slate-650">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4 w-[28%]">Item Name</th>
                  <th className="py-3 px-4 w-[20%]">Description</th>
                  <th className="py-3 px-4 w-[12%] text-center">Quantity</th>
                  <th className="py-3 px-4 w-[10%] text-center">Unit</th>
                  <th className="py-3 px-4 w-[12%] text-right">Unit Price (₹)</th>
                  <th className="py-3 px-4 w-[8%] text-center">Tax (%)</th>
                  <th className="py-3 px-4 w-[8%] text-center">Disc (%)</th>
                  <th className="py-3 px-4 text-right w-[12%]">Total (₹)</th>
                  <th className="py-3 px-4 w-[6%] text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="py-6 text-center text-slate-400">
                      No line items added. Click "Add Item" to initialize.
                    </td>
                  </tr>
                ) : (
                  items.map((item, idx) => {
                    const base = (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0);
                    const disc = base * ((parseFloat(item.discount_percentage) || 0) / 100);
                    const tax = (base - disc) * ((parseFloat(item.tax_percentage) || 0) / 100);
                    const lineTotal = base - disc + tax;

                    return (
                      <tr key={idx} className="hover:bg-slate-50/30">
                        <td className="py-2.5 px-4">
                          <input
                            type="text"
                            value={item.item_name}
                            onChange={(e) => updateItemField(idx, 'item_name', e.target.value)}
                            placeholder="Item Name"
                            className="premium-input-grid font-bold text-slate-900"
                            required
                          />
                        </td>
                        <td className="py-2.5 px-4">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => updateItemField(idx, 'description', e.target.value)}
                            placeholder="Specifications"
                            className="premium-input-grid"
                          />
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <input
                            type="number"
                            step="0.01"
                            value={item.quantity}
                            onChange={(e) => updateItemField(idx, 'quantity', e.target.value)}
                            className="premium-input-grid text-center font-bold"
                            required
                          />
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <input
                            type="text"
                            value={item.unit}
                            onChange={(e) => updateItemField(idx, 'unit', e.target.value)}
                            className="premium-input-grid text-center"
                            required
                          />
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <input
                            type="number"
                            step="0.01"
                            value={item.unit_price}
                            onChange={(e) => updateItemField(idx, 'unit_price', e.target.value)}
                            className="premium-input-grid text-right font-bold text-slate-900"
                            required
                          />
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <input
                            type="number"
                            step="0.1"
                            value={item.tax_percentage}
                            onChange={(e) => updateItemField(idx, 'tax_percentage', e.target.value)}
                            className="premium-input-grid text-center"
                          />
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <input
                            type="number"
                            step="0.1"
                            value={item.discount_percentage}
                            onChange={(e) => updateItemField(idx, 'discount_percentage', e.target.value)}
                            className="premium-input-grid text-center"
                          />
                        </td>
                        <td className="py-2.5 px-4 text-right font-black text-slate-900">
                          {lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            className="text-slate-400 hover:text-rose-650 transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Comments & Financial summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Notes and Terms */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-premium space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">Notes & Terms</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500">
                  Procurement Notes (Internal)
                </label>
                <textarea
                  rows="2"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="premium-input leading-relaxed text-xs"
                  placeholder="Internal procurement specifications..."
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500">
                  Terms & Conditions (Official)
                </label>
                <textarea
                  rows="4"
                  value={termsConditions}
                  onChange={(e) => setTermsConditions(e.target.value)}
                  className="premium-input leading-relaxed text-xs"
                />
              </div>
            </div>
          </div>

          {/* Pricing calculations */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-premium space-y-4 flex flex-col justify-between">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">Price Summary</h3>
            
            <div className="space-y-3 font-semibold text-sm">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal:</span>
                <span className="text-slate-900 font-bold">
                  ₹{totals.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Discount Amount:</span>
                <span className="text-rose-600 font-bold">
                  - ₹{totals.discount_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Tax Amount (GST):</span>
                <span className="text-slate-900 font-bold">
                  ₹{totals.tax_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <hr className="border-slate-100" />
              <div className="flex justify-between text-base pt-2">
                <span className="font-bold text-slate-900">Grand Total:</span>
                <span className="font-black text-emerald-600 text-lg">
                  ₹{totals.grand_total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Save Buttons */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-650 hover:bg-indigo-700 disabled:bg-slate-300 py-3.5 text-sm font-bold text-white shadow-lg shadow-green-500/10 transition"
              >
                <Save className="h-5 w-5" />
                {submitting ? 'Saving...' : isEditMode ? 'Update Draft PO' : 'Generate Draft Purchase Order'}
              </button>
            </div>
          </div>
        </div>

      </form>
    </div>
  );
};

export default CreatePurchaseOrder;
