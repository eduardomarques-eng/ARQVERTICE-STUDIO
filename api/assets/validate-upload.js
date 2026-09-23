const SecurityUploadSanitizer = require('../../js/security/upload-sanitizer');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-filename');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    const filename = req.headers['x-filename'] || 'model.glb';
    const result = SecurityUploadSanitizer.validate3DUpload(buffer, filename);
    return res.status(result.valid ? 200 : 400).json(result);
  } catch (err) {
    return res.status(500).json({ valid: false, error: err.message });
  }
};
