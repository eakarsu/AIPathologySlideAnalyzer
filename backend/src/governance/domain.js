'use strict';

const present = (value) => typeof value === 'string' && value.trim().length > 0;
const versioned = (value) => value && present(value.version) && present(value.effectiveAt);
const source = (value) => value && present(value.sourceRef) && present(value.sha256) && /^[a-f0-9]{64}$/i.test(value.sha256);

function evaluate(input) {
  const errors = [];
  if (!present(input.caseId) || !present(input.patientId)) errors.push('caseId and patientId are required');
  if (!input.consent || input.consent.status !== 'active' || !present(input.consent.scope)) errors.push('active scoped patient consent is required');
  if (!Number.isInteger(input.retentionDays) || input.retentionDays < 1 || input.retentionDays > 3650) errors.push('bounded retentionDays is required');

  const slide = input.slide || {};
  if (!present(slide.dicomStudyUid) || !present(slide.wsiObjectRef) || !source(slide)) errors.push('DICOM/WSI identity and checksummed provenance are required');
  if (!versioned(slide.scanner) || !versioned(slide.stainProtocol) || !present(slide.calibrationStatus)) errors.push('versioned scanner, stain, and calibration metadata are required');
  if (slide.calibrationStatus !== 'valid') errors.push('slide scanner calibration must be valid');

  const model = input.model || {};
  if (!present(model.name) || !present(model.version) || !present(model.intendedUse) || !present(model.datasetRef)) errors.push('model identity, intended use, and dataset provenance are required');
  if (!Number.isFinite(model.confidence) || model.confidence < 0 || model.confidence > 1 || !Array.isArray(model.uncertaintyRegions)) errors.push('bounded confidence and uncertainty regions are required');
  if (model.autonomousDiagnosis === true) errors.push('autonomous diagnosis is prohibited');

  if (!Array.isArray(input.annotations) || input.annotations.some((a) => !present(a.regionRef) || !present(a.label) || !present(a.author) || !present(a.version))) errors.push('versioned, attributed annotations are required');
  const review = input.pathologistReview || {};
  if (!present(review.pathologistId) || !present(review.qualification) || !present(review.interpretation) || review.finalReportApproved !== true) errors.push('qualified pathologist interpretation and final report approval are required');
  if (review.pathologistId === input.createdBy) errors.push('independent pathologist approval is required');
  if (!present(review.discrepancyDisposition) || !present(review.followUpOwner)) errors.push('discrepancy disposition and follow-up owner are required');

  const validation = input.validation || {};
  if (!versioned(validation.protocol) || !Number.isFinite(validation.sensitivity) || !Number.isFinite(validation.specificity)) errors.push('versioned validation protocol with sensitivity and specificity is required');
  if (!Array.isArray(validation.cohorts) || validation.cohorts.length < 2 || !Array.isArray(validation.failureModes) || validation.failureModes.length < 1) errors.push('multi-cohort and failure-mode validation is required');
  if (!present(validation.falseNegativeEscalation) || !present(validation.outOfDistributionPolicy)) errors.push('false-negative and out-of-distribution escalation policies are required');

  return {
    errors,
    result: {
      caseId: input.caseId,
      disposition: errors.length ? 'blocked' : 'pathologist-approved',
      reportRef: review.reportRef || null,
      modelVersion: model.version || null
    },
    assumptions: ['AI output is decision support and never a final diagnosis'],
    uncertainty: { confidence: model.confidence ?? null, regions: model.uncertaintyRegions || [], externalValidationRequired: true }
  };
}

module.exports = { evaluate };
