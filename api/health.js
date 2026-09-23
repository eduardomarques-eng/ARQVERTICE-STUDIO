module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-cache');
  res.status(200).json({
    status: 'healthy',
    version: '1.0.0',
    uptimeSec: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
};
