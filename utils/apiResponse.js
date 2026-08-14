const ok = (res, data, message = 'Success', status = 200) =>
  res.status(status).json({ success: true, message, data })

const created = (res, data, message = 'Created') =>
  res.status(201).json({ success: true, message, data })

const fail = (res, message = 'Something went wrong', status = 400, errors = null) =>
  res.status(status).json({ success: false, message, ...(errors && { errors }) })

const notFound = (res, message = 'Not found') =>
  res.status(404).json({ success: false, message })

const forbidden = (res, message = 'Forbidden') =>
  res.status(403).json({ success: false, message })

const unauthorized = (res, message = 'Unauthorized') =>
  res.status(401).json({ success: false, message })

module.exports = { ok, created, fail, notFound, forbidden, unauthorized }
