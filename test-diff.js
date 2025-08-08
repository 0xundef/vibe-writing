// Simple test script to demonstrate translation diff checker
const fs = require('fs');
const path = require('path');

// Mock the translations for testing
const en = {
  'command.written-improvement': 'Written improvement',
  'command.compress-images': 'Compress Image in Current Note',
  'notice.no-selection': 'No previous selection found. Please select some text first.',
  'notice.name-prompt-empty': 'Name and prompt cannot be empty!',
  'ui.name': 'Name:',
  'ui.description': 'Description:',
  'ui.delete': 'Delete',
  'ui.save': 'Save'
};

const zh = {
  'command.written-improvement': '写作改进',
  'command.compress-images': '压缩当前笔记中的图片',
  'notice.no-selection': '未找到之前的选择。请先选择一些文本。',
  // Missing: 'notice.name-prompt-empty'
  'ui.name': '名称：',
  'ui.description': '描述：',
  'ui.delete': '删除',
  'ui.save': '保存',
  'extra.key': '额外的键' // Extra key not in English
};

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
  const report = checkTranslationDiff();
  
  console.log('\n=== Translation Diff Report ===');
  console.log(`Reference Language: ${report.referenceLanguage}`);
  console.log(`Total Reference Keys: ${report.totalReferenceKeys}`);
  console.log('');
  
  console.log(`\n--- ${report.language.toUpperCase()} ---`);
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
}

// Run the test
printTranslationDiff();