const multer = require('multer')
const path   = require('path')
const fs     = require('fs')
const { UPLOAD_DIR } = require('../utils/fileHelper')

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true })
    cb(null, UPLOAD_DIR)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp']
    cb(null, allowed.includes(path.extname(file.originalname).toLowerCase()))
  }
})

module.exports = upload
