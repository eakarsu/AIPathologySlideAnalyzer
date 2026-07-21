# Governed pathology review operations

## Intended use and limits

The governed API is decision support for DICOM/WSI slides, scanner and stain metadata, annotations, model provenance, uncertainty, pathologist review, and final report linkage. It cannot autonomously diagnose. A qualified independent pathologist must resolve discrepancies and approve the report. Validate sensitivity, specificity, cohorts, failure modes, false-negative escalation, and out-of-distribution behavior before use.

## Data and integrations

Signed tenant claims, active consent, bounded retention, checksummed slide provenance, calibration, intended use, and model version are mandatory. DICOM, WSI, scanner, LIS, annotation, case, model-registry, and report-delivery actions enter an approval-gated outbox. Payloads contain references, never credentials or unnecessary slide data. Retries are bounded; dead letters require pathologist and integration-owner review.

## Deploy, rollback, and recovery

Run `./start.sh check`, back up PostgreSQL and referenced object stores, then apply `ALLOW_SCHEMA_MIGRATION=1 ./start.sh migrate`. Roll back code without dropping additive tables. Restore only verified backups, reconcile object checksums and report delivery receipts, and never silently replay a diagnostic workflow. Rotate secrets centrally and invalidate old tokens.

Erasure requires delivered provider receipts and preserves non-sensitive audit evidence. Alert on scanner calibration expiry, model/version drift, missing consent, autonomous-diagnosis attempts, self-approval, report divergence, and dead letters.
