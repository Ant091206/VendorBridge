import React, { useState, useMemo, useEffect } from 'react';
import { FileText, List, Users, Paperclip, CheckCircle, Plus, Trash2, ArrowRight, ArrowLeft, Upload, File, Info, AlertCircle, X } from 'lucide-react';

const steps = [
  { id: 1, name: 'Information', icon: FileText },
  { id: 2, name: 'Items', icon: List },
  { id: 3, name: 'Vendors', icon: Users },
  { id: 4, name: 'Attachments', icon: Paperclip },
  { id: 5, name: 'Review', icon: CheckCircle }
];

const rfqTypes = ['Raw Materials', 'Equipment', 'Services', 'Software', 'Logistics', 'Other'];
const priorityLevels = ['Low', 'Medium', 'High', 'Urgent'];
const itemUnits = ['Piece', 'Kg', 'Ton', 'Meter', 'Liter', 'Box'];

const RFQWizard = ({
  initialData = {},
  vendors = [],
  onSubmit,
  submitting,
  submitLabel = 'Submit RFQ'
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [vendorSearch, setVendorSearch] = useState('');

  // Form states
  const [info, setInfo] = useState({
    title: initialData.title || '',
    description: initialData.description || '',
    type: initialData.type || 'Raw Materials',
    priority: initialData.priority || 'Medium',
    submission_deadline: initialData.submission_deadline
      ? new Date(initialData.submission_deadline).toISOString().substring(0, 16)
      : '',
    notes: initialData.notes || ''
  });

  const [items, setItems] = useState(
    initialData.items && initialData.items.length > 0
      ? initialData.items
      : [{ item_name: '', description: '', quantity: 1, unit: 'Piece', expected_price: '' }]
  );

  const [selectedVendors, setSelectedVendors] = useState(
    initialData.assigned_vendors
      ? initialData.assigned_vendors.map((v) => v.id)
      : []
  );

  // Files state (new files selected)
  const [newFiles, setNewFiles] = useState([]);
  
  // Existing files (loaded in edit mode)
  const [existingAttachments, setExistingAttachments] = useState(
    initialData.attachments || []
  );
  const [attachmentsToDelete, setAttachmentsToDelete] = useState([]);

  // Load initialData changes
  useEffect(() => {
    if (initialData.id) {
      setInfo({
        title: initialData.title || '',
        description: initialData.description || '',
        type: initialData.type || 'Raw Materials',
        priority: initialData.priority || 'Medium',
        submission_deadline: initialData.submission_deadline
          ? new Date(initialData.submission_deadline).toISOString().substring(0, 16)
          : '',
        notes: initialData.notes || ''
      });
      if (initialData.items) {
        setItems(initialData.items);
      }
      if (initialData.assigned_vendors) {
        setSelectedVendors(initialData.assigned_vendors.map((v) => v.id));
      }
      if (initialData.attachments) {
        setExistingAttachments(initialData.attachments);
      }
    }
  }, [initialData]);

  // Step validation errors
  const [errors, setErrors] = useState({});

  // ── Step Navigation ────────────────────────────────────────────────────────
  const validateStep = (step) => {
    const stepErrors = {};
    if (step === 1) {
      if (!info.title?.trim()) stepErrors.title = 'Title is required';
      else if (info.title.trim().length < 5) stepErrors.title = 'Title must be at least 5 characters';
      if (!info.description?.trim()) stepErrors.description = 'Description is required';
      if (!info.submission_deadline) stepErrors.deadline = 'Submission deadline is required';
      else if (new Date(info.submission_deadline) <= new Date()) {
        stepErrors.deadline = 'Submission deadline must be a future date';
      }
    }

    if (step === 2) {
      if (items.length === 0) stepErrors.items = 'At least one item is required';
      items.forEach((item, index) => {
        if (!item.item_name?.trim()) {
          stepErrors[`item_${index}_name`] = 'Item name is required';
        }
        const qty = Number(item.quantity);
        if (isNaN(qty) || qty <= 0) {
          stepErrors[`item_${index}_qty`] = 'Qty must be > 0';
        }
      });
    }

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // ── Items Handlers ─────────────────────────────────────────────────────────
  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { item_name: '', description: '', quantity: 1, unit: 'Piece', expected_price: '' }
    ]);
  };

  const removeItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index, field, val) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: val } : item))
    );
  };

  // ── Vendors Filter & Handlers ──────────────────────────────────────────────
  const filteredVendors = useMemo(() => {
    const term = vendorSearch.toLowerCase().trim();
    return vendors.filter(
      (v) =>
        `${v.vendor_name || v.name} ${v.company_name} ${v.vendor_code}`
          .toLowerCase()
          .includes(term) && v.status === 'active'
    );
  }, [vendors, vendorSearch]);

  const toggleVendor = (vendorId) => {
    setSelectedVendors((prev) =>
      prev.includes(vendorId) ? prev.filter((id) => id !== vendorId) : [...prev, vendorId]
    );
  };

  // ── Attachments Handlers ───────────────────────────────────────────────────
  const handleFileChange = (e) => {
    if (e.target.files) {
      const filesArr = Array.from(e.target.files);
      setNewFiles((prev) => [...prev, ...filesArr]);
    }
  };

  const removeNewFile = (index) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingAttachment = (attId) => {
    setExistingAttachments((prev) => prev.filter((att) => att.id !== attId));
    setAttachmentsToDelete((prev) => [...prev, attId]);
  };

  // ── Form Submission ────────────────────────────────────────────────────────
  const handleFormSubmit = (status) => {
    // Final check
    if (!validateStep(1) || !validateStep(2)) {
      setCurrentStep(1);
      return;
    }

    if (status === 'published' && selectedVendors.length === 0) {
      setErrors({ publish: 'At least one vendor must be assigned to publish this RFQ.' });
      setCurrentStep(5);
      return;
    }

    // Call submit handler with accumulated data
    onSubmit({
      ...info,
      status,
      items,
      vendor_ids: selectedVendors,
      newFiles,
      attachmentsToDelete
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Wizard Steps indicator bar */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-premium">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {steps.map((step) => {
            const Icon = step.icon;
            const isActive = step.id === currentStep;
            const isCompleted = step.id < currentStep;
            return (
              <div
                key={step.id}
                className="flex items-center gap-3 shrink-0"
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-2xl border text-sm font-black transition duration-200 ${
                    isActive
                      ? 'border-primary bg-primary text-white shadow-md'
                      : isCompleted
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-600'
                      : 'border-slate-200 bg-slate-50 text-slate-400'
                  }`}
                >
                  {isCompleted ? '✓' : <Icon size={18} />}
                </div>
                <div className="hidden sm:block">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Step 0{step.id}</p>
                  <p className={`text-xs font-black ${isActive ? 'text-primary' : isCompleted ? 'text-emerald-600' : 'text-slate-500'}`}>{step.name}</p>
                </div>
                {step.id < steps.length && (
                  <div className="hidden lg:block h-[1px] w-12 bg-slate-200 ml-4" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Contents */}
      <div className="min-h-[350px]">
        {/* STEP 1: RFQ Information */}
        {currentStep === 1 && (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-premium space-y-6 animate-fade-in">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-green-50 text-primary rounded-xl">
                <FileText size={20} />
              </div>
              <h2 className="text-lg font-black text-slate-900 font-sans tracking-wide">RFQ Basic Information</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">RFQ Title *</label>
                <input
                  type="text"
                  value={info.title}
                  onChange={(e) => setInfo({ ...info, title: e.target.value })}
                  className={`premium-input ${errors.title ? 'border-rose-400 focus:ring-rose-200' : ''}`}
                  placeholder="e.g. Steel Pipe Supply for Q3 Infrastructure"
                />
                {errors.title && <p className="mt-1.5 text-xs font-bold text-rose-600">{errors.title}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">Description / Statement of Request *</label>
                <textarea
                  value={info.description}
                  onChange={(e) => setInfo({ ...info, description: e.target.value })}
                  className={`premium-input min-h-[100px] ${errors.description ? 'border-rose-400' : ''}`}
                  placeholder="Describe the scope of supplies and service requirements..."
                />
                {errors.description && <p className="mt-1.5 text-xs font-bold text-rose-600">{errors.description}</p>}
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">RFQ Type *</label>
                <select
                  value={info.type}
                  onChange={(e) => setInfo({ ...info, type: e.target.value })}
                  className="premium-input text-slate-700"
                >
                  {rfqTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">Priority Level</label>
                <select
                  value={info.priority}
                  onChange={(e) => setInfo({ ...info, priority: e.target.value })}
                  className="premium-input text-slate-700"
                >
                  {priorityLevels.map((p) => (
                    <option key={p} value={p}>{p} Priority</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">Submission Deadline *</label>
                <input
                  type="datetime-local"
                  value={info.submission_deadline}
                  onChange={(e) => setInfo({ ...info, submission_deadline: e.target.value })}
                  className={`premium-input ${errors.deadline ? 'border-rose-400' : ''}`}
                />
                {errors.deadline && <p className="mt-1.5 text-xs font-bold text-rose-600">{errors.deadline}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">Internal Notes / Notes to Vendors</label>
                <textarea
                  value={info.notes}
                  onChange={(e) => setInfo({ ...info, notes: e.target.value })}
                  className="premium-input min-h-[80px]"
                  placeholder="Provide supplementary terms, delivery details, or other notes..."
                />
              </div>
            </div>
          </section>
        )}

        {/* STEP 2: RFQ Items */}
        {currentStep === 2 && (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-premium space-y-6 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-50 text-primary rounded-xl">
                  <List size={20} />
                </div>
                <h2 className="text-lg font-black text-slate-900 font-sans tracking-wide">Procurement Items List</h2>
              </div>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-1.5 rounded-xl border border-primary/20 bg-green-50 px-3.5 py-2 text-xs font-black text-primary hover:bg-primary hover:text-white transition duration-200 cursor-pointer shadow-sm"
              >
                <Plus size={14} /> Add Item
              </button>
            </div>

            {errors.items && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
                {errors.items}
              </div>
            )}

            <div className="space-y-4">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-slate-150 p-4 bg-slate-50/50 space-y-3 relative group"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                      Item #{index + 1}
                    </span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-slate-400 hover:text-rose-600 transition cursor-pointer"
                        title="Remove Item"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  <div className="grid gap-4 md:grid-cols-[1.5fr_1fr_1fr_120px_1fr]">
                    <div className="md:col-span-1">
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Item Name *</label>
                      <input
                        type="text"
                        value={item.item_name}
                        onChange={(e) => updateItem(index, 'item_name', e.target.value)}
                        className={`premium-input py-2 text-xs ${
                          errors[`item_${index}_name`] ? 'border-rose-400' : ''
                        }`}
                        placeholder="e.g. Mild Steel Sheet"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Specifications</label>
                      <input
                        type="text"
                        value={item.description || ''}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        className="premium-input py-2 text-xs"
                        placeholder="e.g. 10mm thickness, Grade A"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Quantity *</label>
                      <input
                        type="number"
                        min="0.01"
                        step="any"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                        className={`premium-input py-2 text-xs ${
                          errors[`item_${index}_qty`] ? 'border-rose-400' : ''
                        }`}
                        placeholder="1"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Unit *</label>
                      <select
                        value={item.unit}
                        onChange={(e) => updateItem(index, 'unit', e.target.value)}
                        className="premium-input py-2 text-xs text-slate-700 cursor-pointer"
                      >
                        {itemUnits.map((u) => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Expected Price (INR)</label>
                      <input
                        type="number"
                        min="0"
                        value={item.expected_price || ''}
                        onChange={(e) => updateItem(index, 'expected_price', e.target.value)}
                        className="premium-input py-2 text-xs"
                        placeholder="Optional target price"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* STEP 3: Vendor Assignment */}
        {currentStep === 3 && (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-premium space-y-6 animate-fade-in">
            <div className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-3 md:flex-row md:items-center">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-50 text-primary rounded-xl">
                  <Users size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 font-sans tracking-wide">Assign Vendors</h2>
                  <p className="text-xs text-slate-400 font-bold mt-0.5">Selected: {selectedVendors.length} vendor(s)</p>
                </div>
              </div>
              <div className="relative md:w-80">
                <input
                  type="text"
                  value={vendorSearch}
                  onChange={(e) => setVendorSearch(e.target.value)}
                  className="premium-input pl-10 text-xs py-2.5"
                  placeholder="Search by code, company, category..."
                />
                <div className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-400">
                  <Users size={14} />
                </div>
              </div>
            </div>

            <div className="grid gap-3 max-h-[350px] overflow-y-auto pr-1 sm:grid-cols-2">
              {filteredVendors.length === 0 ? (
                <div className="col-span-full py-10 text-center text-slate-400 text-sm font-semibold">
                  No active vendors matching the criteria found.
                </div>
              ) : (
                filteredVendors.map((vendor) => {
                  const isChecked = selectedVendors.includes(vendor.id);
                  return (
                    <div
                      key={vendor.id}
                      onClick={() => toggleVendor(vendor.id)}
                      className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer select-none transition-all duration-150 ${
                        isChecked
                          ? 'border-primary bg-green-50/20'
                          : 'border-slate-250 bg-slate-50 hover:bg-slate-100/50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        readOnly
                        className="rounded border-slate-300 text-primary focus:ring-primary/20 h-4 w-4 mt-0.5 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-black text-slate-900 leading-none truncate">
                          {vendor.vendor_name || vendor.name}
                        </p>
                        <p className="text-xs text-slate-500 font-bold mt-1 truncate">
                          {vendor.company_name}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[9px] font-black uppercase bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono">
                            {vendor.vendor_code}
                          </span>
                          {vendor.category_name && (
                            <span className="text-[9px] font-black uppercase bg-green-50 text-primary px-1.5 py-0.5 rounded">
                              {vendor.category_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        )}

        {/* STEP 4: Attachments */}
        {currentStep === 4 && (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-premium space-y-6 animate-fade-in">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-green-50 text-primary rounded-xl">
                <Paperclip size={20} />
              </div>
              <h2 className="text-lg font-black text-slate-900 font-sans tracking-wide">RFQ Attachments</h2>
            </div>

            {/* Drag & Drop Upload Zone */}
            <div className="border-2 border-dashed border-slate-200 hover:border-primary/40 rounded-3xl p-8 text-center bg-slate-50/50 hover:bg-slate-50 transition relative group">
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                <Upload size={32} className="text-slate-400 group-hover:text-primary transition-colors" />
                <p className="text-sm font-bold text-slate-700">Click or drag files here to upload</p>
                <p className="text-xs font-semibold">Supports PDFs, Word, Excel, Images, Zip files up to 10MB each.</p>
              </div>
            </div>

            {/* Existing Files List (loaded from DB) */}
            {existingAttachments.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Existing Attachments</h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {existingAttachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center justify-between p-3 rounded-2xl border border-slate-150 bg-white text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <File size={16} className="text-slate-400 shrink-0" />
                        <span className="font-bold text-slate-700 truncate" title={att.file_name}>
                          {att.file_name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeExistingAttachment(att.id)}
                        className="text-slate-400 hover:text-rose-600 transition cursor-pointer shrink-0"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Files Selected List */}
            {newFiles.length > 0 && (
              <div className="space-y-2 pt-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">New Files to Upload ({newFiles.length})</h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {newFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-2xl border border-primary/20 bg-green-50/10 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <File size={16} className="text-primary shrink-0" />
                        <span className="font-bold text-slate-750 truncate" title={file.name}>
                          {file.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold shrink-0">
                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeNewFile(idx)}
                        className="text-slate-400 hover:text-rose-600 transition cursor-pointer shrink-0"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* STEP 5: Review & Publish */}
        {currentStep === 5 && (
          <section className="space-y-6 animate-fade-in">
            {errors.publish && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 flex items-center gap-2">
                <AlertCircle size={18} className="shrink-0" />
                <span>{errors.publish}</span>
              </div>
            )}

            {/* Review Cards */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* RFQ Info Summary */}
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-premium space-y-4">
                <h3 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-2">RFQ Details</h3>
                <div className="space-y-2.5 text-xs">
                  <p><strong className="text-slate-400 font-black uppercase tracking-wider block mb-0.5">Title</strong> <span className="font-semibold text-slate-800 text-sm">{info.title}</span></p>
                  <p><strong className="text-slate-400 font-black uppercase tracking-wider block mb-0.5">Type</strong> <span className="font-semibold text-slate-800">{info.type}</span></p>
                  <p><strong className="text-slate-400 font-black uppercase tracking-wider block mb-0.5">Priority</strong> <span className="font-semibold text-slate-800">{info.priority} Priority</span></p>
                  <p><strong className="text-slate-400 font-black uppercase tracking-wider block mb-0.5">Deadline</strong> <span className="font-semibold text-slate-800">{new Date(info.submission_deadline).toLocaleString()}</span></p>
                </div>
              </div>

              {/* Vendors List Summary */}
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-premium space-y-4">
                <h3 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-2">Assigned Vendors ({selectedVendors.length})</h3>
                <div className="max-h-[160px] overflow-y-auto space-y-1">
                  {selectedVendors.length === 0 ? (
                    <p className="text-xs text-rose-600 font-bold italic flex items-center gap-1">
                      <AlertCircle size={12} /> No vendors assigned. RFQ must be saved as Draft.
                    </p>
                  ) : (
                    selectedVendors.map((vId) => {
                      const v = vendors.find((vend) => vend.id === vId);
                      return (
                        <div key={vId} className="flex justify-between items-center bg-slate-50 p-2 rounded-xl text-xs font-semibold">
                          <span className="text-slate-800 truncate font-bold">{v?.vendor_name || v?.name}</span>
                          <span className="font-mono text-[10px] text-slate-450 uppercase shrink-0">{v?.vendor_code}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Items List Summary */}
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-premium space-y-4 md:col-span-2">
                <h3 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-2">Line Items ({items.length})</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-semibold text-slate-650 border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400">
                        <th className="py-2">Item Name</th>
                        <th className="py-2">Specs</th>
                        <th className="py-2 text-right">Qty</th>
                        <th className="py-2">Unit</th>
                        <th className="py-2 text-right">Expected Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-2.5 font-bold text-slate-800">{item.item_name}</td>
                          <td className="py-2.5 text-slate-500">{item.description || '-'}</td>
                          <td className="py-2.5 text-right font-bold text-slate-800">{item.quantity}</td>
                          <td className="py-2.5">{item.unit}</td>
                          <td className="py-2.5 text-right font-bold text-slate-800">
                            {item.expected_price ? `₹${Number(item.expected_price).toLocaleString()}` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* File Attachments Summary */}
              {(existingAttachments.length > 0 || newFiles.length > 0) && (
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-premium space-y-4 md:col-span-2">
                  <h3 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-2">Documents List</h3>
                  <div className="grid gap-2 sm:grid-cols-2 text-xs font-bold text-slate-650">
                    {existingAttachments.map((att) => (
                      <div key={att.id} className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl">
                        <File size={14} className="text-slate-400 shrink-0" />
                        <span className="truncate text-slate-700">{att.file_name}</span>
                      </div>
                    ))}
                    {newFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-green-50/20 p-2.5 rounded-xl border border-primary/10">
                        <File size={14} className="text-primary shrink-0" />
                        <span className="truncate text-slate-750">{file.name}</span>
                        <span className="text-[10px] text-slate-400 shrink-0">(New)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Submission Selection Pane */}
            <div className="rounded-3xl border border-slate-200 bg-green-50/15 p-6 shadow-premium flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex gap-2.5 items-start">
                <Info size={18} className="text-primary mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-sm font-black text-slate-900">RFQ Finalization</h4>
                  <p className="text-xs text-slate-550 font-semibold mt-1">
                    Select Draft to save configuration without notifying vendors. Select Publish to immediately assign lines to selected suppliers.
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleFormSubmit('draft')}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-black text-slate-600 hover:bg-slate-50 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleFormSubmit('published')}
                  className="rounded-xl bg-primary px-5 py-2.5 text-xs font-black text-white hover:opacity-95 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  Publish RFQ
                </button>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Navigation Footer */}
      {currentStep < 5 && (
        <div className="flex justify-between items-center pt-4 border-t border-slate-100">
          <button
            type="button"
            disabled={currentStep === 1}
            onClick={handleBack}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-black text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
          >
            <ArrowLeft size={14} /> Back
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="inline-flex items-center gap-1 rounded-xl bg-primary px-5 py-2.5 text-xs font-black text-white hover:opacity-95 shadow-premium transition cursor-pointer"
          >
            Next <ArrowRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default RFQWizard;
