import React from 'react';
import CrudPage from '../components/CrudPage';
import api from '../services/api';

export default function Billing() {
  return (
    <CrudPage
      title="Billing Records"
      icon={'\u{1F4B0}'}
      apiGet={api.getBilling}
      apiGetOne={api.getBillingRecord}
      apiCreate={api.createBilling}
      apiUpdate={api.updateBilling}
      apiDelete={api.deleteBilling}
      columns={[
        { key: 'invoice_id', label: 'Invoice ID' },
        { key: 'patient_id', label: 'Patient' },
        { key: 'service_type', label: 'Service' },
        { key: 'amount', label: 'Amount', type: 'currency' },
        { key: 'billing_date', label: 'Date', type: 'date' },
        { key: 'insurance_claim', label: 'Claim #' },
        { key: 'status', label: 'Status', type: 'status' },
      ]}
      formFields={[
        { key: 'invoice_id', label: 'Invoice ID', required: true },
        { key: 'patient_id', label: 'Patient ID (number)', type: 'number', required: true },
        { key: 'slide_id', label: 'Slide ID (number)', type: 'number' },
        { key: 'service_type', label: 'Service Type', required: true, type: 'select', options: ['Surgical Pathology - Standard', 'Surgical Pathology - Complex', 'Surgical Pathology + IHC Panel', 'Cytopathology - FNA', 'Cytopathology - Pap', 'Dermatopathology', 'Hepatopathology - Complex', 'GI Pathology - Standard', 'Renal Pathology - Complex', 'Gynecologic Pathology', 'AI Analysis Add-on'] },
        { key: 'amount', label: 'Amount ($)', type: 'number', required: true },
        { key: 'currency', label: 'Currency', type: 'select', options: ['USD', 'EUR', 'GBP'] },
        { key: 'status', label: 'Status', type: 'select', options: ['pending', 'processing', 'paid', 'overdue', 'cancelled'] },
        { key: 'insurance_claim', label: 'Insurance Claim #' },
        { key: 'billing_date', label: 'Billing Date', type: 'date' },
        { key: 'due_date', label: 'Due Date', type: 'date' },
        { key: 'notes', label: 'Notes', type: 'textarea' },
      ]}
      detailFields={[
        { key: 'invoice_id', label: 'Invoice ID' },
        { key: 'patient_id', label: 'Patient ID' },
        { key: 'slide_id', label: 'Slide ID' },
        { key: 'service_type', label: 'Service Type' },
        { key: 'amount', label: 'Amount' },
        { key: 'currency', label: 'Currency' },
        { key: 'status', label: 'Status' },
        { key: 'insurance_claim', label: 'Insurance Claim' },
        { key: 'billing_date', label: 'Billing Date' },
        { key: 'due_date', label: 'Due Date' },
        { key: 'notes', label: 'Notes' },
        { key: 'created_at', label: 'Created' },
      ]}
      newItemDefaults={{ invoice_id: `INV-${Date.now().toString(36).toUpperCase()}`, currency: 'USD', status: 'pending', billing_date: new Date().toISOString().split('T')[0] }}
    />
  );
}
