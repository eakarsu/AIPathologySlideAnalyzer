'use strict';

const express = require('express');

const FEATURES = Object.freeze({
  "gap-auto-report-generate/run": "Auto Report Generate",
  "gap-limited-rbac-basic-auth-only/run": "Limited Rbac Basic Auth Only",
  "gap-multi/run": "Multi",
  "gap-no-dedicated-routes-directory-all-routes-inline-in/run": "No Dedicated Routes Directory All Routes Inline In",
  "gap-no-dicom-server-integration-medical-image-standard/run": "No Dicom Server Integration Medical Image Standard",
  "gap-no-lis-lab-information-system-integration/run": "No Lis Lab Information System Integration",
  "gap-no-multi/run": "No Multi",
  "gap-no-notifications-layer-grep-returned-0-notificatio/run": "No Notifications Layer Grep Returned 0 Notificatio",
  "gap-no-webhooks-for-lab-result-delivery/run": "No Webhooks For Lab Result Delivery",
  "gap-no-whole-slide-image-wsi-viewer-only-stored-images/run": "No Whole Slide Image Wsi Viewer Only Stored Images",
  "gap-quality-assess/run": "Quality Assess",
});

module.exports = function createGeneratedFeatures({ authMiddleware, aiRateLimiter, callOpenRouter }) {
  const router = express.Router();
  const systemPrompt = `You are a pathology operations decision-support assistant. Return only valid JSON with summary, confidence, key_findings, risks, prioritized_actions, assumptions, missing_information, and follow_up_questions. Never present analysis as a diagnosis, invent patient evidence, or claim that a laboratory integration, report delivery, sign-off, or clinical action occurred. Qualified pathology professionals retain responsibility for all clinical decisions.`;

  for (const [endpoint, title] of Object.entries(FEATURES)) {
    router.post(`/${endpoint}`, authMiddleware, aiRateLimiter, async (req, res) => {
      const input = typeof req.body?.input === 'string' ? req.body.input.trim() : '';
      if (input.length < 10) return res.status(400).json({ error: 'ValidationError', message: 'Input must contain at least 10 characters.' });
      if (!process.env.OPENROUTER_API_KEY) return res.status(503).json({ error: 'AIServiceNotConfigured', message: 'OPENROUTER_API_KEY is required for AI analysis.' });
      try {
        const result = await callOpenRouter(`${systemPrompt}\n\nFeature: ${title}`, input.slice(0, 12000));
        return res.json({
          feature: endpoint.replace(/\/run$/, ''),
          title,
          result,
          model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022',
          disclaimer: 'Clinical decision support only. Verify source evidence and obtain qualified pathology review before clinical action.',
        });
      } catch (error) {
        console.error(`[generated-ai:${endpoint}]`, error.message);
        return res.status(502).json({ error: 'AIServiceError', message: 'The AI provider could not complete this analysis. Please retry or escalate for manual review.' });
      }
    });
  }

  return router;
};

module.exports.FEATURES = FEATURES;
