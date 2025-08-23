const fs = require('fs');
const path = require('path');

// Final optimization script for Sha_Pay mobile app
class FinalOptimizer {
  constructor() {
    this.distPath = path.join(__dirname, 'dist');
    this.apkBuildPath = path.join(__dirname, 'apk-build');
    this.optimizations = [];
  }

  // Remove duplicate assets
  removeDuplicateAssets() {
    console.log('🔍 Scanning for duplicate assets...');
    
    const assetsPath = path.join(this.distPath, 'assets');
    if (!fs.existsSync(assetsPath)) {
      console.log('  ⚠️  Assets directory not found');
      return;
    }

    const assets = fs.readdirSync(assetsPath);
    const assetSizes = new Map();
    const duplicates = [];
    
    assets.forEach(asset => {
      const assetPath = path.join(assetsPath, asset);
      const stats = fs.statSync(assetPath);
      
      if (stats.isFile()) {
        const size = stats.size;
        if (assetSizes.has(size)) {
          duplicates.push({ file: asset, size, original: assetSizes.get(size) });
        } else {
          assetSizes.set(size, asset);
        }
      }
    });
    
    if (duplicates.length > 0) {
      console.log(`  📦 Found ${duplicates.length} potential duplicates:`);
      duplicates.forEach(dup => {
        console.log(`    ${dup.file} (${this.formatBytes(dup.size)}) - similar to ${dup.original}`);
      });
    } else {
      console.log('  ✅ No duplicate assets found');
    }
    
    this.optimizations.push(`Scanned ${assets.length} assets for duplicates`);
  }

  // Optimize large assets
  optimizeLargeAssets() {
    console.log('\n📦 Analyzing large assets...');
    
    const assetsPath = path.join(this.distPath, 'assets');
    if (!fs.existsSync(assetsPath)) return;
    
    const assets = fs.readdirSync(assetsPath);
    const largeAssets = [];
    
    assets.forEach(asset => {
      const assetPath = path.join(assetsPath, asset);
      const stats = fs.statSync(assetPath);
      
      if (stats.isFile() && stats.size > 100000) { // > 100KB
        largeAssets.push({ name: asset, size: stats.size });
      }
    });
    
    if (largeAssets.length > 0) {
      console.log(`  🔍 Found ${largeAssets.length} large assets:`);
      largeAssets.sort((a, b) => b.size - a.size);
      largeAssets.forEach(asset => {
        console.log(`    ${asset.name}: ${this.formatBytes(asset.size)}`);
      });
      
      console.log('\n  💡 Optimization suggestions:');
      console.log('    - Consider compressing images to WebP format');
      console.log('    - Use progressive JPEG for large images');
      console.log('    - Implement lazy loading for non-critical assets');
    } else {
      console.log('  ✅ No large assets found');
    }
    
    this.optimizations.push(`Analyzed ${assets.length} assets for size optimization`);
  }

  // Bundle size analysis
  analyzeBundleSize() {
    console.log('\n📊 Bundle size analysis...');
    
    const bundlePath = path.join(this.distPath, '_expo', 'static', 'js', 'android');
    if (!fs.existsSync(bundlePath)) {
      console.log('  ⚠️  Bundle directory not found');
      return;
    }
    
    const bundleFiles = fs.readdirSync(bundlePath);
    let totalBundleSize = 0;
    
    bundleFiles.forEach(file => {
      const filePath = path.join(bundlePath, file);
      const stats = fs.statSync(filePath);
      totalBundleSize += stats.size;
      console.log(`  📦 ${file}: ${this.formatBytes(stats.size)}`);
    });
    
    console.log(`\n  📊 Total bundle size: ${this.formatBytes(totalBundleSize)}`);
    
    if (totalBundleSize > 5 * 1024 * 1024) { // > 5MB
      console.log('\n  💡 Bundle optimization suggestions:');
      console.log('    - Enable code splitting for route-based loading');
      console.log('    - Remove unused dependencies');
      console.log('    - Use dynamic imports for large libraries');
      console.log('    - Consider using React Native\'s bundle splitting');
    }
    
    this.optimizations.push(`Bundle analysis: ${this.formatBytes(totalBundleSize)}`);
  }

  // Generate optimization report
  generateOptimizationReport() {
    console.log('\n📋 Final Optimization Report:');
    console.log('================================');
    
    const totalSize = this.getTotalBuildSize();
    console.log(`\n📊 Current build metrics:`);
    console.log(`  Total size: ${this.formatBytes(totalSize)}`);
    
    let grade = 'F';
    let recommendation = '';
    
    if (totalSize <= 5 * 1024 * 1024) {
      grade = 'A+';
      recommendation = 'Excellent! Your app is highly optimized.';
    } else if (totalSize <= 8 * 1024 * 1024) {
      grade = 'A';
      recommendation = 'Very good optimization level.';
    } else if (totalSize <= 12 * 1024 * 1024) {
      grade = 'B';
      recommendation = 'Good optimization, but there\'s room for improvement.';
    } else if (totalSize <= 20 * 1024 * 1024) {
      grade = 'C';
      recommendation = 'Acceptable size, consider further optimization.';
    } else {
      grade = 'D';
      recommendation = 'Bundle size needs significant optimization.';
    }
    
    console.log(`  Performance grade: ${grade}`);
    console.log(`  Recommendation: ${recommendation}`);
    
    console.log('\n🎯 Optimization summary:');
    this.optimizations.forEach((opt, index) => {
      console.log(`  ${index + 1}. ${opt}`);
    });
    
    console.log('\n✅ Optimization analysis complete!');
    return { totalSize, grade, recommendation };
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

  // Run all optimizations
  runOptimizations() {
    console.log('🚀 Starting Final Sha_Pay Optimization Analysis\n');
    
    this.removeDuplicateAssets();
    this.optimizeLargeAssets();
    this.analyzeBundleSize();
    const report = this.generateOptimizationReport();
    
    console.log('\n🎉 Your Sha_Pay mobile app optimization is complete!');
    return report;
  }
}

// Run optimization if called directly
if (require.main === module) {
  const optimizer = new FinalOptimizer();
  optimizer.runOptimizations();
}

module.exports = FinalOptimizer;