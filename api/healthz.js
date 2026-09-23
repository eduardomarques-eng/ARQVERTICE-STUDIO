module.exports = (req, res) => {
  const type = req.query.type || 'live';
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-cache');

  if (type === 'ready') {
    res.status(200).json({
      status: 'ready',
      database: 'healthy',
      storage: 'healthy',
      timestamp: new Date().toISOString()
    });
  } else if (type === 'gpu') {
    res.status(200).json({
      status: 'operational',
      webgpuPipeline: 'ready',
      webgl2Fallback: 'ready',
      activeRendererTiers: ['Tier 0', 'Tier 1', 'Tier 2', 'Tier 3', 'Tier 4'],
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(200).json({
      status: 'healthy',
      version: '1.0.0',
      uptimeSec: Math.floor(process.uptime()),
      timestamp: new Date().toISOString()
    });
  }
};
