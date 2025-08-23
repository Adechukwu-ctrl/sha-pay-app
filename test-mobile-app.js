const fs = require('fs');
const path = require('path');

// Mobile app testing and verification script
class MobileAppTester {
  constructor() {
    this.apkBuildPath = path.join(__dirname, 'apk-build');
    this.distPath = path.join(__dirname, 'dist');
    this.testResults = {
      buildVerification: false,
      assetIntegrity: false,
      manifestValidation: false,
      bundleIntegrity: false,
      performanceCheck: false
    };
  }

  // Verify APK build structure
  verifyBuildStructure() {
    console.log('🔍 Verifying APK build structure...');
    
    const requiredFiles = [
      'manifest.json',
      'assets'
    ];
    
    let allFilesPresent = true;
    
    requiredFiles.forEach(file => {
      const filePath = path.join(this.apkBuildPath, file);
      if (fs.existsSync(filePath)) {
        console.log(`  ✅ ${file} - Found`);
      } else {
        console.log(`  ❌ ${file} - Missing`);
        allFilesPresent = false;
      }
    });
    
    this.testResults.buildVerification = allFilesPresent;
    return allFilesPresent;
  }

  // Verify asset integrity
  verifyAssetIntegrity() {
    console.log('\n🎨 Verifying asset integrity...');
    
    const assetsPath = path.join(this.apkBuildPath, 'assets');
    if (!fs.existsSync(assetsPath)) {
      console.log('  ❌ Assets directory not found');
      this.testResults.assetIntegrity = false;
      return false;
    }
    
    const assets = fs.readdirSync(assetsPath);
    console.log(`  📦 Found ${assets.length} assets`);
    
    let validAssets = 0;
    let totalAssetSize = 0;
    
    assets.forEach(asset => {
      const assetPath = path.join(assetsPath, asset);
      const stats = fs.statSync(assetPath);
      
      if (stats.isDirectory()) {
        // Handle subdirectories
        const subAssets = fs.readdirSync(assetPath);
        subAssets.forEach(subAsset => {
          const subAssetPath = path.join(assetPath, subAsset);
          const subStats = fs.statSync(subAssetPath);
          if (subStats.isFile() && subStats.size > 0) {
            validAssets++;
            totalAssetSize += subStats.size;
            console.log(`  ✅ ${asset}/${subAsset} (${this.formatBytes(subStats.size)})`);
          }
        });
      } else if (stats.isFile()) {
        if (stats.size > 0) {
          validAssets++;
          totalAssetSize += stats.size;
          console.log(`  ✅ ${asset} (${this.formatBytes(stats.size)})`);
        } else {
          console.log(`  ⚠️  ${asset} - Empty file`);
        }
      }
    });
    
    console.log(`  📊 Total asset size: ${this.formatBytes(totalAssetSize)}`);
    this.testResults.assetIntegrity = validAssets > 0;
    return this.testResults.assetIntegrity;
  }

  // Validate manifest.json
  validateManifest() {
    console.log('\n📋 Validating manifest.json...');
    
    const manifestPath = path.join(this.apkBuildPath, 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
      console.log('  ❌ Manifest file not found');
      this.testResults.manifestValidation = false;
      return false;
    }
    
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      
      const requiredFields = ['name', 'version', 'bundleUrl', 'assets'];
      let validFields = 0;
      
      requiredFields.forEach(field => {
        if (manifest[field]) {
          console.log(`  ✅ ${field}: ${typeof manifest[field] === 'object' ? 'Object' : manifest[field]}`);
          validFields++;
        } else {
          console.log(`  ❌ ${field}: Missing`);
        }
      });
      
      this.testResults.manifestValidation = validFields === requiredFields.length;
      return this.testResults.manifestValidation;
    } catch (error) {
      console.log(`  ❌ Invalid JSON: ${error.message}`);
      this.testResults.manifestValidation = false;
      return false;
    }
  }

  // Check bundle integrity
  checkBundleIntegrity() {
    console.log('\n📦 Checking bundle integrity...');
    
    const bundlePath = path.join(this.distPath, '_expo', 'static', 'js', 'android');
    if (!fs.existsSync(bundlePath)) {
      console.log('  ❌ Bundle directory not found');
      this.testResults.bundleIntegrity = false;
      return false;
    }
    
    const bundleFiles = fs.readdirSync(bundlePath).filter(file => file.endsWith('.hbc'));
    
    if (bundleFiles.length === 0) {
      console.log('  ❌ No .hbc bundle files found');
      this.testResults.bundleIntegrity = false;
      return false;
    }
    
    bundleFiles.forEach(file => {
      const filePath = path.join(bundlePath, file);
      const stats = fs.statSync(filePath);
      console.log(`  ✅ ${file} (${this.formatBytes(stats.size)})`);
    });
    
    this.testResults.bundleIntegrity = true;
    return true;
  }

  // Performance check
  performanceCheck() {
    console.log('\n⚡ Performance check...');
    
    const totalSize = this.getTotalBuildSize();
    console.log(`  📊 Total build size: ${this.formatBytes(totalSize)}`);
    
    // Performance thresholds
    const thresholds = {
      excellent: 5 * 1024 * 1024,  // 5MB
      good: 10 * 1024 * 1024,      // 10MB
      acceptable: 20 * 1024 * 1024  // 20MB
    };
    
    let performance = 'poor';
    if (totalSize <= thresholds.excellent) {
      performance = 'excellent';
      console.log('  🚀 Performance: Excellent');
    } else if (totalSize <= thresholds.good) {
      performance = 'good';
      console.log('  ✅ Performance: Good');
    } else if (totalSize <= thresholds.acceptable) {
      performance = 'acceptable';
      console.log('  ⚠️  Performance: Acceptable');
    } else {
      console.log('  ❌ Performance: Needs optimization');
    }
    
    this.testResults.performanceCheck = performance !== 'poor';
    return this.testResults.performanceCheck;
  }

  // Get total build size
  getTotalBuildSize() {
    let totalSize = 0;
    
    const calculateSize = (dirPath) => {
      if (!fs.existsSync(dirPath)) return 0;
      
      let dirSize = 0;
      const items = fs.readdirSync(dirPath);
      items.forEach(item => {
        const itemPath = path.join(dirPath, item);
        const stats = fs.statSync(itemPath);
        
        if (stats.isDirectory()) {
          dirSize += calculateSize(itemPath);
        } else {
          dirSize += stats.size;
        }
      });
      return dirSize;
    };
    
    // Calculate size from both dist and apk-build directories
    if (fs.existsSync(this.distPath)) {
      totalSize += calculateSize(this.distPath);
    }
    if (fs.existsSync(this.apkBuildPath)) {
      totalSize += calculateSize(this.apkBuildPath);
    }
    
    return totalSize;
  }

  // Format bytes to human readable
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Generate test report
  generateTestReport() {
    console.log('\n📊 Test Report Summary:');
    console.log('========================');
    
    const tests = [
      { name: 'Build Structure', result: this.testResults.buildVerification },
      { name: 'Asset Integrity', result: this.testResults.assetIntegrity },
      { name: 'Manifest Validation', result: this.testResults.manifestValidation },
      { name: 'Bundle Integrity', result: this.testResults.bundleIntegrity },
      { name: 'Performance Check', result: this.testResults.performanceCheck }
    ];
    
    let passedTests = 0;
    tests.forEach(test => {
      const status = test.result ? '✅ PASS' : '❌ FAIL';
      console.log(`  ${test.name}: ${status}`);
      if (test.result) passedTests++;
    });
    
    const overallScore = (passedTests / tests.length) * 100;
    console.log(`\n🎯 Overall Score: ${overallScore.toFixed(1)}% (${passedTests}/${tests.length} tests passed)`);
    
    if (overallScore >= 80) {
      console.log('🎉 Your Sha_Pay mobile app is ready for deployment!');
    } else {
      console.log('⚠️  Some issues need to be addressed before deployment.');
    }
    
    return overallScore;
  }

  // Run all tests
  runAllTests() {
    console.log('🧪 Starting Sha_Pay Mobile App Testing\n');
    
    this.verifyBuildStructure();
    this.verifyAssetIntegrity();
    this.validateManifest();
    this.checkBundleIntegrity();
    this.performanceCheck();
    
    const score = this.generateTestReport();
    
    console.log('\n✅ Testing complete!');
    return score;
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new MobileAppTester();
  tester.runAllTests();
}

module.exports = MobileAppTester;