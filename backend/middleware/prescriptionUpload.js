import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dedicated private storage directory
const UPLOAD_DIR = path.resolve(__dirname, "../uploads/prescriptions");

// Ensure upload directory exists automatically
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Allowed MIME types and extensions
const ALLOWED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const ALLOWED_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png"];

// Storage engine configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // Determine and sanitize extension
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ALLOWED_EXTENSIONS.includes(ext) ? ext : ".bin";
    const uniqueId = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}`;
    const filename = `prescription_${uniqueId}${safeExt}`;
    cb(null, filename);
  },
});

// File filter validation
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeType = file.mimetype.toLowerCase();

  const isMimeValid = ALLOWED_MIME_TYPES.includes(mimeType);
  const isExtValid = ALLOWED_EXTENSIONS.includes(ext);

  if (isMimeValid && isExtValid) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Unsupported file type. Only PDF, JPG, and PNG documents are allowed."
      ),
      false
    );
  }
};

// Multer upload instance with 5 MB limit
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
    files: 1,
  },
});

// Middleware wrapper handling multer errors cleanly
export const uploadPrescriptionFile = (req, res, next) => {
  upload.single("prescription")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "File size exceeds the 5 MB limit. Please upload a smaller document.",
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message || "File upload error",
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || "Invalid file uploaded",
      });
    }
    next();
  });
};
