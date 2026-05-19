# Audit Apply Note — AIPathologySlideAnalyzer

Source: `_AUDIT/reports/batch_06.md` section 11.

## Discrepancy with Audit
The audit reported "0 route files and 0 AI endpoints" but the actual `backend/src/server.js` contains an inlined Express app with substantial routes including AI features:
- `POST /api/slides/:id/analyze-image` (vision AI)
- `POST /api/analyses/run/:slideId`
- `POST /api/cancer-detections/run/:slideId`
- `POST /api/cell-classifications/run/:slideId`
- `POST /api/tissue-segmentations/run/:slideId`
- `POST /api/reports/generate/:slideId`
- `POST /api/quality-controls/ai-assess/:slideId`

So the project is closer to a `partial-build` and most audit-suggested AI endpoints (`/analyze-slide`, `/segment-tissue`, `/detect-cancer`, `/quality-assess`) already exist by different names.

## Original Recommendations
### Missing AI counterparts
All claimed-missing endpoints are effectively present (see above).

### Missing non-AI
- DICOM server integration
- LIS (Lab Information System) integration
- Whole-slide-image (WSI) viewer
- Multi-disciplinary case conferencing
- Compliance / audit trail for pathology reporting

### Custom suggestions
- AI pathology assistant; second-opinion consensus; educational mode (overlay annotations); registry integration; QA loop

## Implemented
None (existing AI coverage already addresses recs).

## Backlog
| Item | Tag |
|---|---|
| DICOM server integration | NEEDS-CREDS |
| LIS integration | NEEDS-CREDS |
| WSI viewer | NEEDS-PRODUCT-DECISION (frontend / OpenSeadragon) |
| Multi-disciplinary case conferencing | NEEDS-PRODUCT-DECISION |
| Compliance audit trail | MECHANICAL but project-wide |
| Second-opinion model ensemble | NEEDS-PRODUCT-DECISION (multi-model orchestration) |
| Cancer registry submission | NEEDS-CREDS |

## Apply pass 4 (mechanical backlog)

- **Action:** SKIP — backlog items are NEEDS-CREDS (DICOM server, LIS,
  cancer registry submission) or NEEDS-PRODUCT-DECISION (WSI viewer,
  multi-disciplinary case conferencing, second-opinion model
  ensemble). The "compliance audit trail" item is MECHANICAL but
  project-wide and out of scope for a 5-feature mechanical pass. AI
  surface already covers all originally-claimed-missing endpoints.

## Apply pass 3 (frontend)

- **Stack:** Express monolith (`backend/src/server.js`) + Create-React-App
  (`frontend/`).
- **Backend AI endpoints:** `POST /api/slides/:id/analyze-image`,
  `POST /api/cancer-detections/run/:slideId`,
  `POST /api/cell-classifications/run/:slideId`,
  `POST /api/tissue-segmentations/run/:slideId`,
  `POST /api/quality-controls/ai-assess/:slideId`,
  `POST /api/analyses/run/:slideId`, `POST /api/reports/generate/:slideId`.
- **Action:** LEFT-AS-IS — FE already wired.
- **Notes:** `frontend/src/services/api.js` exports `analyzeSlideImage`,
  `runCancerDetection`, `runCellClassification`, `runTissueSegmentation`,
  `aiQCAssess`, etc.; per-feature pages (Slides, CancerDetections, etc.)
  invoke them. No changes required.

