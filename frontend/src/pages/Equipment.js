import React from 'react';
import CrudPage from '../components/CrudPage';
import api from '../services/api';

export default function Equipment() {
  return (
    <CrudPage
      title="Lab Equipment"
      icon={'\u2699\uFE0F'}
      apiGet={api.getEquipment}
      apiGetOne={api.getEquipmentItem}
      apiCreate={api.createEquipment}
      apiUpdate={api.updateEquipment}
      apiDelete={api.deleteEquipment}
      columns={[
        { key: 'equipment_id', label: 'Equipment ID' },
        { key: 'name', label: 'Name' },
        { key: 'type', label: 'Type' },
        { key: 'manufacturer', label: 'Manufacturer' },
        { key: 'location', label: 'Location' },
        { key: 'status', label: 'Status', type: 'status' },
        { key: 'next_maintenance', label: 'Next Maint.', type: 'date' },
      ]}
      formFields={[
        { key: 'equipment_id', label: 'Equipment ID', required: true },
        { key: 'name', label: 'Name', required: true },
        { key: 'type', label: 'Type', type: 'select', options: ['Slide Scanner', 'Microscope', 'Microtome', 'Tissue Processor', 'Autostainer', 'IHC Stainer', 'IHC/ISH Stainer', 'Coverslipper', 'Embedding Station', 'Rapid Processor', 'Cryostat'] },
        { key: 'manufacturer', label: 'Manufacturer' },
        { key: 'model', label: 'Model' },
        { key: 'serial_number', label: 'Serial Number' },
        { key: 'location', label: 'Location' },
        { key: 'status', label: 'Status', type: 'select', options: ['operational', 'maintenance', 'repair', 'decommissioned'] },
        { key: 'last_maintenance', label: 'Last Maintenance', type: 'date' },
        { key: 'next_maintenance', label: 'Next Maintenance', type: 'date' },
        { key: 'calibration_date', label: 'Calibration Date', type: 'date' },
        { key: 'notes', label: 'Notes', type: 'textarea' },
      ]}
      detailFields={[
        { key: 'equipment_id', label: 'Equipment ID' },
        { key: 'name', label: 'Name' },
        { key: 'type', label: 'Type' },
        { key: 'manufacturer', label: 'Manufacturer' },
        { key: 'model', label: 'Model' },
        { key: 'serial_number', label: 'Serial Number' },
        { key: 'location', label: 'Location' },
        { key: 'status', label: 'Status' },
        { key: 'last_maintenance', label: 'Last Maintenance' },
        { key: 'next_maintenance', label: 'Next Maintenance' },
        { key: 'calibration_date', label: 'Calibration Date' },
        { key: 'notes', label: 'Notes' },
        { key: 'created_at', label: 'Created' },
      ]}
      newItemDefaults={{ equipment_id: `EQ-${Date.now().toString(36).toUpperCase()}`, status: 'operational' }}
    />
  );
}
