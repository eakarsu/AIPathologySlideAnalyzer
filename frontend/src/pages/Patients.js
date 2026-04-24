import React from 'react';
import CrudPage from '../components/CrudPage';
import api from '../services/api';

export default function Patients() {
  return (
    <CrudPage
      title="Patients"
      icon={'\u{1F465}'}
      apiGet={api.getPatients}
      apiGetOne={api.getPatient}
      apiCreate={api.createPatient}
      apiUpdate={api.updatePatient}
      apiDelete={api.deletePatient}
      columns={[
        { key: 'patient_id', label: 'Patient ID' },
        { key: 'first_name', label: 'First Name' },
        { key: 'last_name', label: 'Last Name' },
        { key: 'gender', label: 'Gender' },
        { key: 'date_of_birth', label: 'DOB', type: 'date' },
        { key: 'insurance_provider', label: 'Insurance' },
        { key: 'status', label: 'Status', type: 'status' },
      ]}
      formFields={[
        { key: 'patient_id', label: 'Patient ID', required: true },
        { key: 'first_name', label: 'First Name', required: true },
        { key: 'last_name', label: 'Last Name', required: true },
        { key: 'date_of_birth', label: 'Date of Birth', type: 'date' },
        { key: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'] },
        { key: 'phone', label: 'Phone' },
        { key: 'email', label: 'Email', type: 'email' },
        { key: 'address', label: 'Address', type: 'textarea' },
        { key: 'medical_history', label: 'Medical History', type: 'textarea' },
        { key: 'insurance_provider', label: 'Insurance Provider' },
        { key: 'status', label: 'Status', type: 'select', options: ['active', 'inactive', 'deceased'] },
      ]}
      detailFields={[
        { key: 'patient_id', label: 'Patient ID' },
        { key: 'first_name', label: 'First Name' },
        { key: 'last_name', label: 'Last Name' },
        { key: 'date_of_birth', label: 'Date of Birth' },
        { key: 'gender', label: 'Gender' },
        { key: 'phone', label: 'Phone' },
        { key: 'email', label: 'Email' },
        { key: 'address', label: 'Address' },
        { key: 'medical_history', label: 'Medical History' },
        { key: 'insurance_provider', label: 'Insurance Provider' },
        { key: 'status', label: 'Status' },
        { key: 'created_at', label: 'Created' },
      ]}
      newItemDefaults={{ patient_id: `PAT-${Date.now().toString(36).toUpperCase()}`, status: 'active' }}
    />
  );
}
