import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllVendors } from '../../api/vendorApi';
import { createRFQ, uploadRFQAttachment } from '../../api/rfqApi';
import RFQWizard from '../../components/rfqs/RFQWizard';

const RFQCreate = () => {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getAllVendors({ status: 'active', limit: 150 })
      .then((res) => {
        setVendors(res.data || []);
      })
      .catch(() => setVendors([]));
  }, []);

  const handleSubmit = async (formData) => {
    setSubmitting(true);
    setError('');
    try {
      // 1. Create RFQ record with items and vendor assignments
      const rfqPayload = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        priority: formData.priority,
        submission_deadline: formData.submission_deadline,
        notes: formData.notes,
        status: formData.status,
        items: formData.items,
        vendor_ids: formData.vendor_ids
      };

      const res = await createRFQ(rfqPayload);
      const rfqId = res.data?.id;

      if (!rfqId) {
        throw new Error('Failed to retrieve the created RFQ ID.');
      }

      // 2. Upload attachments if any exist
      if (formData.newFiles && formData.newFiles.length > 0) {
        for (const file of formData.newFiles) {
          const fileFormData = new FormData();
          fileFormData.append('file', file);
          await uploadRFQAttachment(rfqId, fileFormData);
        }
      }

      // 3. Redirect to details page
      navigate(`/rfqs/${rfqId}`);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Unable to create RFQ.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.16em] text-primary">Procurement Portal</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950 font-sans tracking-wide">Create Request For Quotation</h1>
        <p className="text-sm text-slate-500 font-semibold mt-1">Configure your RFQ specifications, procurement items, assign vendors, and upload technical drawings or specs.</p>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-bold text-rose-700 shadow-sm animate-fade-in flex items-center gap-3">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-100 text-rose-800 text-xs font-black">!</span>
          <div>{error}</div>
        </div>
      )}

      <RFQWizard
        vendors={vendors}
        onSubmit={handleSubmit}
        submitting={submitting}
        submitLabel="Create RFQ"
      />
    </div>
  );
};

export default RFQCreate;
