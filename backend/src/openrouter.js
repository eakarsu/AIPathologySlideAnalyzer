const https = require('https');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5';

async function callOpenRouter(systemPrompt, userPrompt) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 2000,
      temperature: 0.3,
    });

    const options = {
      hostname: 'openrouter.ai',
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'AI Pathology Slide Analyzer',
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (parsed.error) {
            reject(new Error(parsed.error.message || 'OpenRouter API error'));
          } else {
            resolve(parsed.choices?.[0]?.message?.content || 'No response generated');
          }
        } catch (e) {
          reject(new Error('Failed to parse OpenRouter response'));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function analyzeSlide(slideData) {
  const systemPrompt = `You are an expert AI pathology assistant specialized in digital pathology slide analysis. Provide detailed, professional pathology analysis results. Format your response with clear sections: Summary, Key Findings, Cellular Analysis, Tissue Architecture, and Clinical Recommendations. Use medical terminology appropriately.`;
  const userPrompt = `Analyze the following pathology slide:\n\nTissue Type: ${slideData.tissue_type}\nStain Type: ${slideData.stain_type}\nOrgan: ${slideData.organ}\nMagnification: ${slideData.magnification}\nPatient Notes: ${slideData.notes || 'None'}\n\nProvide a comprehensive pathological analysis including cellular morphology assessment, tissue architecture evaluation, any abnormalities detected, and clinical recommendations.`;
  return callOpenRouter(systemPrompt, userPrompt);
}

async function detectCancer(slideData) {
  const systemPrompt = `You are an expert AI oncology pathologist. Analyze the provided slide data and give a detailed cancer detection assessment. Include: Cancer Probability Assessment, Tumor Type Classification, Grade Assessment, Stage Estimation, Biomarker Analysis, and Treatment Recommendations. Be thorough and clinical.`;
  const userPrompt = `Perform cancer detection analysis on this pathology slide:\n\nTissue Type: ${slideData.tissue_type}\nStain Type: ${slideData.stain_type}\nOrgan: ${slideData.organ}\nExisting Markers: ${slideData.markers || 'None specified'}\nClinical History: ${slideData.notes || 'Not provided'}\n\nProvide detailed cancer detection results with probability scores, classification, and recommendations.`;
  return callOpenRouter(systemPrompt, userPrompt);
}

async function classifyCells(slideData) {
  const systemPrompt = `You are an expert cytopathologist AI. Classify cells found in the pathology slide. Provide detailed cell type identification, counts, morphological descriptions, and flag any abnormalities. Format results clearly with each cell type as a separate finding.`;
  const userPrompt = `Classify cells in this pathology slide:\n\nTissue Type: ${slideData.tissue_type}\nStain Type: ${slideData.stain_type}\nOrgan: ${slideData.organ}\nMagnification: ${slideData.magnification}\n\nProvide comprehensive cell classification including: cell types identified, approximate percentages, morphological features, and any abnormal cells detected.`;
  return callOpenRouter(systemPrompt, userPrompt);
}

async function segmentTissue(slideData) {
  const systemPrompt = `You are an expert AI tissue analysis specialist. Perform tissue segmentation analysis on the provided pathology slide. Identify distinct tissue regions, classify them, and assess their health status. Provide area percentages, tissue density scores, and boundary descriptions.`;
  const userPrompt = `Perform tissue segmentation on this pathology slide:\n\nTissue Type: ${slideData.tissue_type}\nStain Type: ${slideData.stain_type}\nOrgan: ${slideData.organ}\n\nProvide detailed tissue segmentation including: identified tissue regions, area percentages, tissue class, health status, and density scores for each segment.`;
  return callOpenRouter(systemPrompt, userPrompt);
}

async function generateReport(reportData) {
  const systemPrompt = `You are a senior pathologist AI assistant generating formal pathology reports. Create a comprehensive, professionally formatted pathology report suitable for clinical use. Include all standard pathology report sections.`;
  const userPrompt = `Generate a comprehensive pathology report:\n\nPatient ID: ${reportData.patient_id}\nSpecimen: ${reportData.tissue_type}\nOrgan: ${reportData.organ}\nClinical History: ${reportData.clinical_history || 'Not provided'}\nGross Description: ${reportData.gross_description || 'Standard specimen'}\n\nGenerate a complete pathology report with: Clinical Information, Gross Description, Microscopic Findings, Diagnosis, and Recommendations.`;
  return callOpenRouter(systemPrompt, userPrompt);
}

async function qualityAssessment(qcData) {
  const systemPrompt = `You are an AI quality control specialist for digital pathology labs. Assess the quality of pathology slides and lab processes. Provide detailed quality scores and recommendations for improvement.`;
  const userPrompt = `Assess quality for this pathology slide/process:\n\nStain Quality: ${qcData.stain_quality}\nTissue Integrity: ${qcData.tissue_integrity}\nScan Quality: ${qcData.scan_quality}\nIssues Noted: ${qcData.issues || 'None'}\n\nProvide a comprehensive quality assessment with scores, pass/fail determination, and corrective action recommendations.`;
  return callOpenRouter(systemPrompt, userPrompt);
}

module.exports = {
  callOpenRouter,
  analyzeSlide,
  detectCancer,
  classifyCells,
  segmentTissue,
  generateReport,
  qualityAssessment,
};
