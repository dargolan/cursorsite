const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const archiver = require('archiver');

// Configuration
const BACKUP_DIR = path.join(__dirname, '../backups');
const STRAPI_DIR = path.join(__dirname, '../strapi-backend');
const DB_FILE = path.join(STRAPI_DIR, '.tmp/data.db');
const UPLOADS_DIR = path.join(STRAPI_DIR, 'public/uploads');

// Create backup directory if it doesn't exist
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Generate timestamp for backup filename
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupName = `strapi-backup-${timestamp}`;
const backupPath = path.join(BACKUP_DIR, backupName);

// Create backup directory for this backup
fs.mkdirSync(backupPath, { recursive: true });

// Function to backup database
function backupDatabase() {
  return new Promise((resolve, reject) => {
    const dbBackupPath = path.join(backupPath, 'database.db');
    fs.copyFile(DB_FILE, dbBackupPath, (err) => {
      if (err) {
        console.error('Error backing up database:', err);
        reject(err);
      } else {
        console.log('Database backup completed');
        resolve();
      }
    });
  });
}

// Function to backup uploads
function backupUploads() {
  return new Promise((resolve, reject) => {
    const uploadsBackupPath = path.join(backupPath, 'uploads');
    if (!fs.existsSync(UPLOADS_DIR)) {
      console.log('No uploads directory found, skipping...');
      resolve();
      return;
    }

    // Create uploads backup directory
    fs.mkdirSync(uploadsBackupPath, { recursive: true });

    // Copy uploads directory
    exec(`cp -r "${UPLOADS_DIR}"/* "${uploadsBackupPath}"`, (error) => {
      if (error) {
        console.error('Error backing up uploads:', error);
        reject(error);
      } else {
        console.log('Uploads backup completed');
        resolve();
      }
    });
  });
}

// Function to create a zip archive of the backup
function createBackupArchive() {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(`${backupPath}.zip`);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });

    output.on('close', () => {
      console.log(`Backup archive created: ${archive.pointer()} total bytes`);
      // Clean up the unzipped backup directory
      fs.rmSync(backupPath, { recursive: true, force: true });
      resolve();
    });

    archive.on('error', (err) => {
      reject(err);
    });

    archive.pipe(output);
    archive.directory(backupPath, false);
    archive.finalize();
  });
}

// Main backup process
async function performBackup() {
  try {
    console.log('Starting Strapi backup...');
    
    // Backup database
    await backupDatabase();
    
    // Backup uploads
    await backupUploads();
    
    // Create zip archive
    await createBackupArchive();
    
    console.log('Backup completed successfully!');
  } catch (error) {
    console.error('Backup failed:', error);
    process.exit(1);
  }
}

performBackup(); 