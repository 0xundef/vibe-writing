#!/usr/bin/env node

// One-shot command to check translation differences
// This script builds the TypeScript files and runs the diff checker

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Function to extract translation object from TypeScript file
function extractTranslationsFromFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Find the export const declaration
    const match = content.match(/export const \w+: Translations = \{([\s\S]*?)\};\s*$/m);
    if (!match) {
      throw new Error('Could not find translation object in file');
    }
    
    // Extract the object content
    const objectContent = match[1];
    
    // Parse key-value pairs using regex
    const translations = {};
    const keyValueRegex = /['"]([^'"]+)['"]\s*:\s*['"]([^'"]*)['"],?/g;
    let keyMatch;
    
    while ((keyMatch = keyValueRegex.exec(objectContent)) !== null) {
      const key = keyMatch[1];
      const value = keyMatch[2];
      translations[key] = value;
    }
    
    return translations;
  } catch (error) {
    console.log(`⚠️  Could not parse ${filePath}: ${error.message}`);
    return {};
  }
}

// Import the actual translation files by reading and parsing them
const enPath = path.join(__dirname, 'en.ts');
const zhPath = path.join(__dirname, 'zh.ts');

const en = extractTranslationsFromFile(enPath);
const zh = extractTranslationsFromFile(zhPath);

if (Object.keys(en).length === 0 || Object.keys(zh).length === 0) {
  console.log('❌ Failed to load translation files');
  process.exit(1);
}

function checkTranslationDiff() {
  const referenceLanguage = 'en';
  const referenceKeys = Object.keys(en);
  const referenceKeySet = new Set(referenceKeys);
  
  const zhKeys = Object.keys(zh);
  const zhKeySet = new Set(zhKeys);
  
  // Find missing keys (in reference but not in Chinese)
  const missingKeys = referenceKeys.filter(key => !zhKeySet.has(key));
  
  // Find extra keys (in Chinese but not in reference)
  const extraKeys = zhKeys.filter(key => !referenceKeySet.has(key));
  
  const completeness = ((zhKeys.length - extraKeys.length) / referenceKeys.length) * 100;
  
  return {
    referenceLanguage,
    totalReferenceKeys: referenceKeys.length,
    language: 'zh',
    missingKeys,
    extraKeys,
    totalKeys: zhKeys.length,
    completeness: Math.round(completeness * 100) / 100
  };
}

function printTranslationDiff() {
  console.log('🔍 Building TypeScript files...');
  
  try {
    // Build the project first
    execSync('npm run build', { stdio: 'pipe' });
    console.log('✅ Build completed successfully\n');
  } catch (error) {
    console.log('⚠️  Build failed, proceeding with embedded translations\n');
  }
  
  const report = checkTranslationDiff();
  
  console.log('=== Translation Diff Report ===');
  console.log(`Reference Language: ${report.referenceLanguage}`);
  console.log(`Total Reference Keys: ${report.totalReferenceKeys}`);
  console.log('');
  
  console.log(`--- ${report.language.toUpperCase()} ---`);
  console.log(`Completeness: ${report.completeness}% (${report.totalKeys}/${report.totalReferenceKeys} keys)`);
  
  if (report.missingKeys.length > 0) {
    console.log(`\n❌ Missing Keys (${report.missingKeys.length}):`);
    report.missingKeys.forEach(key => console.log(`  - ${key}`));
  }
  
  if (report.extraKeys.length > 0) {
    console.log(`\n⚠️  Extra Keys (${report.extraKeys.length}):`);
    report.extraKeys.forEach(key => console.log(`  + ${key}`));
  }
  
  if (report.missingKeys.length === 0 && report.extraKeys.length === 0) {
    console.log('✅ Perfect match with reference language!');
  }
  
  console.log('\n=== Summary ===');
  if (report.missingKeys.length === 0) {
    console.log('✅ All required keys are present');
  } else {
    console.log(`❌ Missing ${report.missingKeys.length} required keys`);
  }
  
  if (report.extraKeys.length > 0) {
    console.log(`⚠️  Has ${report.extraKeys.length} extra keys`);
  }
  
  console.log('\n💡 To add missing translations, update src/i18n/zh.ts');
}

// Run the check
printTranslationDiff();