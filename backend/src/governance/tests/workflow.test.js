'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { evaluate } = require('../domain');

const valid = () => ({
  caseId: 'case-1', patientId: 'patient-1', createdBy: 'technician-1', retentionDays: 365,
  consent: { status: 'active', scope: 'diagnostic-support' },
  slide: { dicomStudyUid: '1.2.3', wsiObjectRef: 'wsi:1', sourceRef: 'scanner:object:1', sha256: 'a'.repeat(64), scanner: { version: 'scanner-v2', effectiveAt: '2026-07-01' }, stainProtocol: { version: 'h-e-v3', effectiveAt: '2026-07-01' }, calibrationStatus: 'valid' },
  model: { name: 'cell-support', version: 'm3', intendedUse: 'region prioritization', datasetRef: 'dataset:v4', confidence: 0.83, uncertaintyRegions: ['tile:22'], autonomousDiagnosis: false },
  annotations: [{ regionRef: 'tile:10', label: 'review', author: 'pathologist-2', version: 'v1' }],
  pathologistReview: { pathologistId: 'pathologist-2', qualification: 'board-certified', interpretation: 'manual review completed', finalReportApproved: true, discrepancyDisposition: 'resolved', followUpOwner: 'pathologist-2', reportRef: 'report:1' },
  validation: { protocol: { version: 'val-v2', effectiveAt: '2026-07-01' }, sensitivity: 0.96, specificity: 0.94, cohorts: ['site-a','site-b'], failureModes: ['stain-artifact'], falseNegativeEscalation: 'immediate pathologist review', outOfDistributionPolicy: 'block' }
});

test('accepts pathologist-approved traceable decision support', () => assert.deepEqual(evaluate(valid()).errors, []));
test('blocks autonomous diagnosis and invalid calibration', () => { const input = valid(); input.model.autonomousDiagnosis = true; input.slide.calibrationStatus = 'expired'; assert.ok(evaluate(input).errors.length >= 2); });
