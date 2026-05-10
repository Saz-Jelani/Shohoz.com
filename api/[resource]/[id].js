const { getCollection } = require('../_db');

module.exports = (req, res) => {
  const { resource, id } = req.query;
  if (!resource || Array.isArray(resource) || !id || Array.isArray(id)) {
    res.status(400).json({ message: 'Invalid resource or id' });
    return;
  }

  const rows = getCollection(resource);
  const numericId = Number(id);
  const index = rows.findIndex((item) => Number(item?.id) === numericId);

  if (index < 0) {
    res.status(404).json({ message: 'Not Found' });
    return;
  }

  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=600');
    res.status(200).json(rows[index]);
    return;
  }

  if (req.method === 'PATCH') {
    const patch = req.body && typeof req.body === 'object' ? req.body : {};
    rows[index] = { ...rows[index], ...patch, id: rows[index].id };
    res.status(200).json(rows[index]);
    return;
  }

  if (req.method === 'PUT') {
    const replacement = req.body && typeof req.body === 'object' ? req.body : {};
    rows[index] = { ...replacement, id: rows[index].id };
    res.status(200).json(rows[index]);
    return;
  }

  if (req.method === 'DELETE') {
    rows.splice(index, 1);
    res.status(204).end();
    return;
  }

  res.setHeader('Allow', 'GET,PATCH,PUT,DELETE');
  res.status(405).json({ message: 'Method Not Allowed' });
};
