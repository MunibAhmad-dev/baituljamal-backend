const fs   = require('fs')
const path = require('path')

const UPLOAD_DIR = path.join(__dirname, '../uploads')

function deleteLocalFile(urlPath) {
  if (!urlPath || !urlPath.startsWith('/uploads/')) return
  const fullPath = path.join(UPLOAD_DIR, path.basename(urlPath))
  try { if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath) } catch {}
}

module.exports = { deleteLocalFile, UPLOAD_DIR }
