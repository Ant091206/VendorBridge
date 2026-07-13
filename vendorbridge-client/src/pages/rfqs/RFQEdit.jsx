import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { getAllVendors } from '../../api/vendorApi';
import { getRFQById, updateRFQ, uploadRFQAttachment, deleteRFQAttachment } from '../../api/rfqApi';
import RFQWizard from '../../components/rfqs/RFQWizard';

const RFQEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rfq, setRfq] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      getRFQById(id),
      getAllVendors({ status: 'active', limit: 150 })
    ])
      .then(([rfqRes, vendorRes]) => {
        setRfq(rfqRes.data);
        setVendors(vendorRes.data || []);
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Unable to load RFQ details.');
      });
  }, [id]);

  const handleSubmit = async (formData) => {
    setSubmitting(true);
    setError('');
    try {
      // 1. Update core RFQ record, items, and vendors
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

      await updateRFQ(id, rfqPayload);

      // 2. Delete designated attachments if any
      if (formData.attachmentsToDelete && formData.attachmentsToDelete.length > 0) {
        for (const attId of formData.attachmentsToDelete) {
          await deleteRFQAttachment(attId);
        }
      }

      // 3. Upload new attachments if any
      if (formData.newFiles && formData.newFiles.length > 0) {
        for (const file of formData.newFiles) {
          const fileFormData = new FormData();
          fileFormData.append('file', file);
          await uploadRFQAttachment(id, fileFormData);
        }
      }

      // 4. Redirect back to details page
      navigate(`/rfqs/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Unable to update RFQ.');
    } finally {
      setSubmitting(false);
    }
  };

  if (error && !rfq) {
    return (
      <div className="space-y-4">
        <Link to="/rfqs" className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-650 hover:text-primary transition-colors">
          <ArrowLeft size={16} /> Back to RFQs
        </Link>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-bold text-rose-700 shadow-sm">{error}</div>
      </div>
    );
  }

  if (!rfq) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="h-10 w-48 animate-pulse rounded-[12px] bg-slate-200/80" />
        <div className="h-[450px] animate-pulse rounded-[24px] bg-slate-200/80" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.16em] text-primary">Procurement Portal</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950 font-sans tracking-wide">Edit Request For Quotation</h1>
        <p className="text-sm text-slate-500 font-semibold mt-1">Modify information, manage the items list, update assigned vendors, or upload and remove files.</p>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-bold text-rose-700 shadow-sm animate-fade-in flex items-center gap-3">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-100 text-rose-800 text-xs font-black">!</span>
          <div>{error}</div>
        </div>
      )}

      <RFQWizard
        initialData={rfq}
        vendors={vendors}
        onSubmit={handleSubmit}
        submitting={submitting}
        submitLabel="Save RFQ"
      />
    </div>
  );
};

export default RFQEdit;
