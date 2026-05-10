const { getCollection, nextId } = require('./_db');

module.exports = (req, res) => {
  const { resource } = req.query;
  if (!resource || Array.isArray(resource)) {
    res.status(400).json({ message: 'Invalid resource' });
    return;
  }

  const rows = getCollection(resource);

  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=600');
    const filters = { ...req.query };
    delete filters.resource;
    const filtered = rows.filter((item) =>
      Object.entries(filters).every(([key, value]) => String(item?.[key]) === String(value))
    );
    res.status(200).json(filtered);
    return;
  }

  if (req.method === 'POST') {
    const payload = req.body && typeof req.body === 'object' ? req.body : {};
    const created = {
      id: payload.id ?? nextId(rows),
      ...payload
    };
    rows.push(created);
    res.status(201).json(created);
    return;
  }

  res.setHeader('Allow', 'GET,POST');
  res.status(405).json({ message: 'Method Not Allowed' });
};
