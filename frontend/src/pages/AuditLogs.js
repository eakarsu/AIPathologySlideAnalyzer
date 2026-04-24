import React from 'react';
import CrudPage from '../components/CrudPage';
import api from '../services/api';

export default function AuditLogs() {
  return (
    <CrudPage
      title="Audit Logs"
      icon={'\u{1F4DD}'}
      apiGet={api.getAuditLogs}
      apiGetOne={api.getAuditLog}
      columns={[
        { key: 'id', label: 'ID' },
        { key: 'user_email', label: 'User' },
        { key: 'action', label: 'Action', type: 'status' },
        { key: 'entity_type', label: 'Entity' },
        { key: 'entity_id', label: 'Entity ID' },
        { key: 'details', label: 'Details' },
        { key: 'created_at', label: 'Timestamp', type: 'date' },
      ]}
      formFields={[]}
      detailFields={[
        { key: 'id', label: 'Log ID' },
        { key: 'user_email', label: 'User Email' },
        { key: 'action', label: 'Action' },
        { key: 'entity_type', label: 'Entity Type' },
        { key: 'entity_id', label: 'Entity ID' },
        { key: 'details', label: 'Details' },
        { key: 'ip_address', label: 'IP Address' },
        { key: 'created_at', label: 'Timestamp' },
      ]}
    />
  );
}
