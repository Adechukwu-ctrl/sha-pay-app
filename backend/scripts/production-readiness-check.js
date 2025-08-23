#!/usr/bin/env node

/**
 * Production Readiness Check
 * Validates that all required components are ready for production deployment
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ANSI color codes for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkmark() {
  return `${colors.green}✅${colors.reset}`;
}

function crossmark() {
  return `${colors.red}❌${colors.reset}`;
}

function warning() {
  return `${colors.yellow}⚠️${colors.reset}`;
}

class ProductionReadinessChecker {
  constructor() {
    this.checks = [];
    this.warnings = [];
    this.errors = [];
  }

  async runAllChecks() {
    log('\n🚀 Sha Pay Production Readiness Check', 'bold');
    log('=' .repeat(50), 'cyan');

    await this.checkEnvironmentFile();
    await this.checkRequiredFiles();
    await this.checkSecurityConfiguration();
    await this.checkDatabaseConfiguration();
    await this.checkCloudStorageConfiguration();
    await this.checkDependencies();
    await this.checkScripts();

    this.printSummary();
    return this.errors.length === 0;
  }

  async checkEnvironmentFile() {
    log('\n📋 Environment Configuration', 'blue');
    
    const envPath = path.join(__dirname, '..', '.env.production');
    if (!fs.existsSync(envPath)) {
      this.errors.push('Missing .env.production file');
      log(`${crossmark()} .env.production file not found`);
      return;
    }
    
    log(`${checkmark()} .env.production file exists`);
    
    // Load and check environment variables
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        envVars[key.trim()] = value.trim();
      }
    });

    // Check critical environment variables
    const criticalVars = [
      'NODE_ENV',
      'PORT',
      'JWT_SECRET',
      'JWT_REFRESH_SECRET',
      'SESSION_SECRET'
    ];

    criticalVars.forEach(varName => {
      if (envVars[varName] && envVars[varName] !== 'your_jwt_secret_here') {
        log(`${checkmark()} ${varName} is configured`);
      } else {
        this.warnings.push(`${varName} needs to be configured`);
        log(`${warning()} ${varName} needs production value`);
      }
    });

    // Check JWT secret strength
    if (envVars.JWT_SECRET && envVars.JWT_SECRET.length >= 32) {
      log(`${checkmark()} JWT_SECRET has adequate length (${envVars.JWT_SECRET.length} chars)`);
    } else {
      this.warnings.push('JWT_SECRET should be at least 32 characters');
      log(`${warning()} JWT_SECRET should be longer`);
    }
  }

  async checkRequiredFiles() {
    log('\n📁 Required Files', 'blue');
    
    const requiredFiles = [
      'server.js',
      'package.json',
      'Dockerfile',
      'docker-compose.yml',
      'scripts/test-database-connection.js',
      'scripts/backup-strategy.js',
      'DEPLOYMENT_GUIDE.md'
    ];

    requiredFiles.forEach(file => {
      const filePath = path.join(__dirname, '..', file);
      if (fs.existsSync(filePath)) {
        log(`${checkmark()} ${file}`);
      } else {
        this.errors.push(`Missing required file: ${file}`);
        log(`${crossmark()} ${file}`);
      }
    });
  }

  async checkSecurityConfiguration() {
    log('\n🛡️ Security Configuration', 'blue');
    
    // Check if security middleware is configured
    const serverPath = path.join(__dirname, '..', 'server.js');
    if (fs.existsSync(serverPath)) {
      const serverContent = fs.readFileSync(serverPath, 'utf8');
      
      const securityChecks = [
        { name: 'Helmet middleware', pattern: /helmet/i },
        { name: 'CORS configuration', pattern: /cors/i },
        { name: 'Rate limiting', pattern: /rate.*limit/i },
        { name: 'Compression', pattern: /compression/i }
      ];

      securityChecks.forEach(check => {
        if (check.pattern.test(serverContent)) {
          log(`${checkmark()} ${check.name} configured`);
        } else {
          this.warnings.push(`${check.name} not found in server.js`);
          log(`${warning()} ${check.name} not detected`);
        }
      });
    }
  }

  async checkDatabaseConfiguration() {
    log('\n🗄️ Database Configuration', 'blue');
    
    // Check if database models exist
    const modelsPath = path.join(__dirname, '..', 'models');
    if (fs.existsSync(modelsPath)) {
      const modelFiles = fs.readdirSync(modelsPath).filter(file => file.endsWith('.js'));
      log(`${checkmark()} Found ${modelFiles.length} database models`);
    } else {
      this.warnings.push('Models directory not found');
      log(`${warning()} Models directory not found`);
    }

    // Check migration scripts
    const migrationsPath = path.join(__dirname, '..', 'migrations');
    if (fs.existsSync(migrationsPath)) {
      const migrationFiles = fs.readdirSync(migrationsPath);
      log(`${checkmark()} Found ${migrationFiles.length} migration files`);
    } else {
      this.warnings.push('Migrations directory not found');
      log(`${warning()} Migrations directory not found`);
    }
  }

  async checkCloudStorageConfiguration() {
    log('\n☁️ Cloud Storage Configuration', 'blue');
    
    // Check cloud storage service files
    const cloudStoragePath = path.join(__dirname, '..', 'config', 'cloudStorage.js');
    if (fs.existsSync(cloudStoragePath)) {
      log(`${checkmark()} Cloud storage service configured`);
      
      const content = fs.readFileSync(cloudStoragePath, 'utf8');
      if (content.includes('cloudinary') || content.includes('aws-sdk')) {
        log(`${checkmark()} Cloud storage providers detected`);
      } else {
        this.warnings.push('Cloud storage providers not configured');
        log(`${warning()} Cloud storage providers not detected`);
      }
    } else {
      this.warnings.push('Cloud storage service not found');
      log(`${warning()} Cloud storage service not found`);
    }
  }

  async checkDependencies() {
    log('\n📦 Dependencies', 'blue');
    
    const packagePath = path.join(__dirname, '..', 'package.json');
    if (fs.existsSync(packagePath)) {
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      
      log(`${checkmark()} Package.json found`);
      log(`${checkmark()} ${Object.keys(packageJson.dependencies || {}).length} production dependencies`);
      log(`${checkmark()} ${Object.keys(packageJson.devDependencies || {}).length} development dependencies`);
      
      // Check for critical dependencies
      const criticalDeps = ['express', 'sequelize', 'jsonwebtoken', 'bcryptjs'];
      criticalDeps.forEach(dep => {
        if (packageJson.dependencies && packageJson.dependencies[dep]) {
          log(`${checkmark()} ${dep} dependency found`);
        } else {
          this.warnings.push(`Critical dependency ${dep} not found`);
          log(`${warning()} ${dep} dependency not found`);
        }
      });
    }
  }

  async checkScripts() {
    log('\n🔧 Scripts', 'blue');
    
    const packagePath = path.join(__dirname, '..', 'package.json');
    if (fs.existsSync(packagePath)) {
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      
      const requiredScripts = ['start', 'build', 'test', 'prod:start', 'prod:test'];
      requiredScripts.forEach(script => {
        if (packageJson.scripts && packageJson.scripts[script]) {
          log(`${checkmark()} ${script} script configured`);
        } else {
          this.warnings.push(`Script ${script} not found`);
          log(`${warning()} ${script} script not found`);
        }
      });
    }
  }

  printSummary() {
    log('\n📊 Summary', 'bold');
    log('=' .repeat(50), 'cyan');
    
    if (this.errors.length === 0 && this.warnings.length === 0) {
      log(`${checkmark()} All checks passed! Ready for production deployment.`, 'green');
    } else {
      if (this.errors.length > 0) {
        log(`\n${crossmark()} Critical Issues (${this.errors.length}):`, 'red');
        this.errors.forEach(error => log(`  • ${error}`, 'red'));
      }
      
      if (this.warnings.length > 0) {
        log(`\n${warning()} Warnings (${this.warnings.length}):`, 'yellow');
        this.warnings.forEach(warning => log(`  • ${warning}`, 'yellow'));
      }
      
      if (this.errors.length === 0) {
        log(`\n${checkmark()} No critical issues found. Address warnings before production.`, 'green');
      } else {
        log(`\n${crossmark()} Critical issues must be resolved before deployment.`, 'red');
      }
    }
    
    log('\n🚀 Next Steps:', 'blue');
    log('1. Address any critical issues and warnings');
    log('2. Set up production database (PostgreSQL)');
    log('3. Configure external services (email, SMS, payments)');
    log('4. Deploy to your chosen platform');
    log('5. Run post-deployment verification');
  }
}

// Run the checker
if (require.main === module) {
  const checker = new ProductionReadinessChecker();
  checker.runAllChecks().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Error running production readiness check:', error);
    process.exit(1);
  });
}

module.exports = ProductionReadinessChecker;