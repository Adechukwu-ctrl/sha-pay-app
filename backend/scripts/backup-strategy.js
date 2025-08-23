#!/usr/bin/env node

/**
 * Backup Strategy Implementation for Sha Pay
 * Handles database backups, file storage backups, and recovery procedures
 */

const { Sequelize } = require('sequelize');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
require('dotenv').config({ path: path.join(__dirname, '../.env.production') });

class BackupStrategy {
  constructor() {
    this.backupDir = path.join(__dirname, '../backups');
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.maxBackups = 30; // Keep 30 days of backups
  }

  async ensureBackupDirectory() {
    try {
      await fs.access(this.backupDir);
    } catch {
      await fs.mkdir(this.backupDir, { recursive: true });
      console.log(`📁 Created backup directory: ${this.backupDir}`);
    }
  }

  // Database Backup Methods
  async backupSQLiteDatabase() {
    console.log('📂 Starting SQLite database backup...');
    
    const dbPath = path.join(__dirname, '../database.sqlite');
    const backupPath = path.join(this.backupDir, `sqlite-backup-${this.timestamp}.sqlite`);
    
    try {
      await fs.access(dbPath);
      await fs.copyFile(dbPath, backupPath);
      
      // Compress the backup
      if (process.platform === 'win32') {
        // Use PowerShell compression on Windows
        await execAsync(`powershell "Compress-Archive -Path '${backupPath}' -DestinationPath '${backupPath}.zip' -Force"`);
        await fs.unlink(backupPath); // Remove uncompressed file
        console.log(`✅ SQLite backup created: ${backupPath}.zip`);
      } else {
        // Use gzip on Unix systems
        await execAsync(`gzip '${backupPath}'`);
        console.log(`✅ SQLite backup created: ${backupPath}.gz`);
      }
      
      return true;
    } catch (error) {
      console.error('❌ SQLite backup failed:', error.message);
      return false;
    }
  }

  async backupPostgreSQLDatabase() {
    console.log('☁️  Starting PostgreSQL database backup...');
    
    if (!process.env.DATABASE_URL && !process.env.DB_HOST) {
      console.log('ℹ️  No PostgreSQL configuration found. Skipping PostgreSQL backup.');
      return false;
    }

    const backupPath = path.join(this.backupDir, `postgres-backup-${this.timestamp}.sql`);
    
    try {
      let pgDumpCommand;
      
      if (process.env.DATABASE_URL) {
        pgDumpCommand = `pg_dump "${process.env.DATABASE_URL}" > "${backupPath}"`;
      } else {
        const { DB_HOST, DB_PORT = 5432, DB_NAME, DB_USER, DB_PASSWORD } = process.env;
        pgDumpCommand = `PGPASSWORD="${DB_PASSWORD}" pg_dump -h "${DB_HOST}" -p ${DB_PORT} -U "${DB_USER}" -d "${DB_NAME}" > "${backupPath}"`;
      }
      
      await execAsync(pgDumpCommand);
      
      // Compress the backup
      if (process.platform === 'win32') {
        await execAsync(`powershell "Compress-Archive -Path '${backupPath}' -DestinationPath '${backupPath}.zip' -Force"`);
        await fs.unlink(backupPath);
        console.log(`✅ PostgreSQL backup created: ${backupPath}.zip`);
      } else {
        await execAsync(`gzip '${backupPath}'`);
        console.log(`✅ PostgreSQL backup created: ${backupPath}.gz`);
      }
      
      return true;
    } catch (error) {
      console.error('❌ PostgreSQL backup failed:', error.message);
      console.log('💡 Make sure pg_dump is installed and accessible in PATH');
      return false;
    }
  }

  // File Storage Backup Methods
  async backupLocalFiles() {
    console.log('📁 Starting local files backup...');
    
    const uploadsDir = path.join(__dirname, '../uploads');
    const backupPath = path.join(this.backupDir, `files-backup-${this.timestamp}`);
    
    try {
      await fs.access(uploadsDir);
      
      if (process.platform === 'win32') {
        // Use PowerShell on Windows
        await execAsync(`powershell "Compress-Archive -Path '${uploadsDir}\*' -DestinationPath '${backupPath}.zip' -Force"`);
        console.log(`✅ Local files backup created: ${backupPath}.zip`);
      } else {
        // Use tar on Unix systems
        await execAsync(`tar -czf '${backupPath}.tar.gz' -C '${path.dirname(uploadsDir)}' '${path.basename(uploadsDir)}'`);
        console.log(`✅ Local files backup created: ${backupPath}.tar.gz`);
      }
      
      return true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log('ℹ️  No local uploads directory found. Skipping local files backup.');
      } else {
        console.error('❌ Local files backup failed:', error.message);
      }
      return false;
    }
  }

  async generateCloudStorageInventory() {
    console.log('☁️  Generating cloud storage inventory...');
    
    const inventoryPath = path.join(this.backupDir, `cloud-inventory-${this.timestamp}.json`);
    const inventory = {
      timestamp: new Date().toISOString(),
      cloudinary: {
        configured: !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY),
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'not_configured'
      },
      aws_s3: {
        configured: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
        bucket: process.env.AWS_S3_BUCKET || 'not_configured',
        region: process.env.AWS_REGION || 'not_configured'
      },
      backup_strategy: {
        database_backup: 'automated',
        file_backup: 'cloud_native',
        retention_days: this.maxBackups,
        backup_frequency: 'daily'
      }
    };
    
    try {
      await fs.writeFile(inventoryPath, JSON.stringify(inventory, null, 2));
      console.log(`✅ Cloud storage inventory created: ${inventoryPath}`);
      return true;
    } catch (error) {
      console.error('❌ Cloud inventory generation failed:', error.message);
      return false;
    }
  }

  // Cleanup old backups
  async cleanupOldBackups() {
    console.log('🧹 Cleaning up old backups...');
    
    try {
      const files = await fs.readdir(this.backupDir);
      const backupFiles = files
        .filter(file => file.includes('backup-'))
        .map(file => ({
          name: file,
          path: path.join(this.backupDir, file),
          stat: null
        }));
      
      // Get file stats
      for (const file of backupFiles) {
        try {
          file.stat = await fs.stat(file.path);
        } catch (error) {
          console.warn(`⚠️  Could not stat file ${file.name}:`, error.message);
        }
      }
      
      // Sort by creation time (oldest first)
      const validFiles = backupFiles
        .filter(file => file.stat)
        .sort((a, b) => a.stat.birthtime - b.stat.birthtime);
      
      // Remove old backups if we have more than maxBackups
      if (validFiles.length > this.maxBackups) {
        const filesToDelete = validFiles.slice(0, validFiles.length - this.maxBackups);
        
        for (const file of filesToDelete) {
          try {
            await fs.unlink(file.path);
            console.log(`🗑️  Deleted old backup: ${file.name}`);
          } catch (error) {
            console.warn(`⚠️  Could not delete ${file.name}:`, error.message);
          }
        }
        
        console.log(`✅ Cleaned up ${filesToDelete.length} old backup(s)`);
      } else {
        console.log(`ℹ️  No cleanup needed. Found ${validFiles.length} backup(s), limit is ${this.maxBackups}`);
      }
      
    } catch (error) {
      console.error('❌ Backup cleanup failed:', error.message);
    }
  }

  // Main backup execution
  async executeBackup() {
    console.log('🚀 Starting backup process...');
    console.log(`📅 Timestamp: ${this.timestamp}`);
    
    await this.ensureBackupDirectory();
    
    const results = {
      sqlite: await this.backupSQLiteDatabase(),
      postgres: await this.backupPostgreSQLDatabase(),
      files: await this.backupLocalFiles(),
      inventory: await this.generateCloudStorageInventory()
    };
    
    await this.cleanupOldBackups();
    
    const successCount = Object.values(results).filter(Boolean).length;
    const totalCount = Object.keys(results).length;
    
    console.log(`\n📊 Backup Summary:`);
    console.log(`   SQLite Database: ${results.sqlite ? '✅' : '❌'}`);
    console.log(`   PostgreSQL Database: ${results.postgres ? '✅' : '❌'}`);
    console.log(`   Local Files: ${results.files ? '✅' : '❌'}`);
    console.log(`   Cloud Inventory: ${results.inventory ? '✅' : '❌'}`);
    console.log(`\n🎯 Success Rate: ${successCount}/${totalCount} (${Math.round(successCount/totalCount*100)}%)`);
    
    if (successCount === totalCount) {
      console.log('🎉 Backup completed successfully!');
    } else {
      console.log('⚠️  Backup completed with some failures. Check logs above.');
    }
    
    return results;
  }

  // Recovery methods
  async listAvailableBackups() {
    console.log('📋 Available backups:');
    
    try {
      const files = await fs.readdir(this.backupDir);
      const backupFiles = files.filter(file => file.includes('backup-'));
      
      if (backupFiles.length === 0) {
        console.log('ℹ️  No backups found.');
        return [];
      }
      
      for (const file of backupFiles) {
        const filePath = path.join(this.backupDir, file);
        const stat = await fs.stat(filePath);
        const sizeKB = Math.round(stat.size / 1024);
        console.log(`   📄 ${file} (${sizeKB} KB, ${stat.birthtime.toLocaleString()})`);
      }
      
      return backupFiles;
    } catch (error) {
      console.error('❌ Failed to list backups:', error.message);
      return [];
    }
  }

  // Automated backup scheduler
  static createCronJob() {
    const cronExpression = '0 2 * * *'; // Daily at 2 AM
    const scriptPath = path.join(__dirname, 'backup-strategy.js');
    
    console.log('⏰ Backup cron job configuration:');
    console.log(`   Schedule: ${cronExpression} (Daily at 2:00 AM)`);
    console.log(`   Script: ${scriptPath}`);
    console.log('\n📝 To set up automated backups:');
    
    if (process.platform === 'win32') {
      console.log('   Windows Task Scheduler:');
      console.log('   1. Open Task Scheduler');
      console.log('   2. Create Basic Task');
      console.log('   3. Set trigger to Daily at 2:00 AM');
      console.log(`   4. Set action to start program: node`);
      console.log(`   5. Set arguments: "${scriptPath}"`);
      console.log(`   6. Set start in: "${path.dirname(scriptPath)}"`);
    } else {
      console.log('   Linux/macOS crontab:');
      console.log(`   crontab -e`);
      console.log(`   Add line: ${cronExpression} cd "${path.dirname(scriptPath)}" && node "${scriptPath}"`);
    }
    
    console.log('\n🔧 Alternative: Use PM2 for process management:');
    console.log('   npm install -g pm2');
    console.log(`   pm2 start "${scriptPath}" --cron "${cronExpression}" --name "sha-pay-backup"`);
  }
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2];
  const backup = new BackupStrategy();
  
  switch (command) {
    case 'backup':
    case undefined:
      backup.executeBackup();
      break;
      
    case 'list':
      backup.listAvailableBackups();
      break;
      
    case 'setup-cron':
      BackupStrategy.createCronJob();
      break;
      
    case 'cleanup':
      backup.ensureBackupDirectory().then(() => backup.cleanupOldBackups());
      break;
      
    default:
      console.log('📖 Sha Pay Backup Strategy');
      console.log('\nUsage:');
      console.log('  node backup-strategy.js [command]');
      console.log('\nCommands:');
      console.log('  backup      Run backup process (default)');
      console.log('  list        List available backups');
      console.log('  setup-cron  Show cron job setup instructions');
      console.log('  cleanup     Clean up old backups');
      console.log('\nExamples:');
      console.log('  node backup-strategy.js backup');
      console.log('  node backup-strategy.js list');
      console.log('  node backup-strategy.js setup-cron');
  }
}

module.exports = BackupStrategy;