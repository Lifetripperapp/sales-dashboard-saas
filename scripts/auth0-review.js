#!/usr/bin/env node

/**
 * Auth0 Integration Review Script
 * Systematically scans the codebase for authentication-related issues
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Auth0 Integration Review Starting...\n');

// Color codes for output
const colors = {
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m'
};

// Issue tracking
const issues = {
  critical: [],
  security: [],
  warnings: [],
  info: []
};

// Helper function to add colored output
function colorLog(message, color = 'white') {
  console.log(colors[color] + message + colors.reset);
}

// Helper function to scan files for patterns
function scanFiles(directory, extensions, pattern, excludePattern = null) {
  const results = [];
  
  function scanDirectory(dir) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const file of files) {
      const fullPath = path.join(dir, file.name);
      
      if (file.isDirectory() && !file.name.startsWith('.') && file.name !== 'node_modules') {
        scanDirectory(fullPath);
      } else if (file.isFile() && extensions.some(ext => file.name.endsWith(ext))) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          const lines = content.split('\n');
          
          lines.forEach((line, index) => {
            if (pattern.test(line)) {
              if (!excludePattern || !excludePattern.test(line)) {
                results.push({
                  file: fullPath,
                  line: index + 1,
                  content: line.trim(),
                  fullLine: line
                });
              }
            }
          });
        } catch (error) {
          console.error(`Error reading file ${fullPath}:`, error.message);
        }
      }
    }
  }
  
  scanDirectory(directory);
  return results;
}

/**
 * Check for domain restriction implementations
 */
function checkDomainRestrictions() {
  colorLog('\n🔍 Checking for domain restrictions...', 'cyan');
  
  // Check if there are any domain restriction patterns in the codebase
  const domainRestrictionPatterns = [
    'allowedDomains',
    'emailDomain',
    'split.*@.*1',
    'api\\.access\\.deny.*domain',
    'includes.*emailDomain'
  ];
  
  const domainRestrictions = [];
  
  // Check auth-related files and any JS files that might have domain restrictions
  const filesToCheck = [
    ...scanFiles('./src/auth', ['.js', '.jsx'], /./),
    ...scanFiles('./src/common', ['.js', '.jsx'], /allowedDomains|emailDomain/),
    ...scanFiles('./src/modules', ['.js', '.jsx'], /allowedDomains|emailDomain/)
  ];
  
  const uniqueFiles = [...new Set(filesToCheck.map(f => f.file))];
  
  for (const file of uniqueFiles) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      domainRestrictionPatterns.forEach(pattern => {
        const regex = new RegExp(pattern, 'i');
        if (regex.test(content)) {
          const line = content.split('\n').findIndex(line => regex.test(line)) + 1;
          domainRestrictions.push({
            file,
            pattern,
            line
          });
        }
      });
    } catch (error) {
      // Skip files that can't be read
    }
  }
  
  if (domainRestrictions.length > 0) {
    colorLog('✅ Domain restrictions found:', 'green');
    domainRestrictions.forEach(({ file, pattern, line }) => {
      colorLog(`   ${file}:${line} - Pattern: ${pattern}`, 'green');
    });
  } else {
    colorLog('⚠️ No domain restrictions found - consider implementing for enhanced security', 'yellow');
  }
  
  return domainRestrictions;
}

/**
 * Check for email verification requirements
 */
function checkEmailVerification() {
  colorLog('\n🔍 Checking for email verification requirements...', 'cyan');
  
  // Check if there are any email verification patterns in the codebase
  const emailVerificationPatterns = [
    'email_verified',
    'event\\.user\\.email_verified',
    'emailVerified',
    'verify.*email',
    'verification.*required'
  ];
  
  const emailVerificationChecks = [];
  
  // Check auth-related files and any JS files that might have email verification
  const filesToCheck = [
    ...scanFiles('./src/auth', ['.js', '.jsx'], /./),
    ...scanFiles('./src/common', ['.js', '.jsx'], /email_verified|verification/),
    ...scanFiles('./src/modules', ['.js', '.jsx'], /email_verified|verification/)
  ];
  
  const uniqueFiles = [...new Set(filesToCheck.map(f => f.file))];
  
  for (const file of uniqueFiles) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      emailVerificationPatterns.forEach(pattern => {
        const regex = new RegExp(pattern, 'i');
        if (regex.test(content)) {
          const line = content.split('\n').findIndex(line => regex.test(line)) + 1;
          emailVerificationChecks.push({
            file,
            pattern,
            line
          });
        }
      });
    } catch (error) {
      // Skip files that can't be read
    }
  }
  
  if (emailVerificationChecks.length > 0) {
    colorLog('✅ Email verification checks found:', 'green');
    emailVerificationChecks.forEach(({ file, pattern, line }) => {
      colorLog(`   ${file}:${line} - Pattern: ${pattern}`, 'green');
    });
  } else {
    colorLog('⚠️ No email verification requirements found - users can login without verifying email', 'yellow');
  }
  
  return emailVerificationChecks;
}

// 1. Check for unauthenticated API calls
colorLog('🚨 Checking for unauthenticated API calls...', 'red');
const unauthenticatedCalls = scanFiles(
  './src',
  ['.js', '.jsx'],
  /fetch\s*\(\s*['"\/].*\/api\//,
  /authFetch/
);

if (unauthenticatedCalls.length > 0) {
  colorLog('❌ Found unauthenticated API calls:', 'red');
  unauthenticatedCalls.forEach(result => {
    issues.critical.push({
      type: 'Unauthenticated API Call',
      file: result.file,
      line: result.line,
      content: result.content,
      severity: 'CRITICAL'
    });
    colorLog(`   ${result.file}:${result.line} - ${result.content}`, 'red');
  });
} else {
  colorLog('✅ No unauthenticated API calls found', 'green');
}

// 2. Check for double JSON parsing
colorLog('\n🔍 Checking for double JSON parsing...', 'yellow');
const doubleJsonParsing = scanFiles(
  './src',
  ['.js', '.jsx'],
  /authFetch.*\.json\(\)/
);

if (doubleJsonParsing.length > 0) {
  colorLog('❌ Found double JSON parsing:', 'red');
  doubleJsonParsing.forEach(result => {
    issues.critical.push({
      type: 'Double JSON Parsing',
      file: result.file,
      line: result.line,
      content: result.content,
      severity: 'CRITICAL'
    });
    colorLog(`   ${result.file}:${result.line} - ${result.content}`, 'red');
  });
} else {
  colorLog('✅ No double JSON parsing found', 'green');
}

// 3. Check for response.ok checks on authFetch
colorLog('\n🔍 Checking for unnecessary response.ok checks...', 'yellow');
const responseOkChecks = scanFiles(
  './src',
  ['.js', '.jsx'],
  /response\.ok/
);

if (responseOkChecks.length > 0) {
  colorLog('⚠️ Found response.ok checks (may be unnecessary with authFetch):', 'yellow');
  responseOkChecks.forEach(result => {
    issues.warnings.push({
      type: 'Response.ok Check',
      file: result.file,
      line: result.line,
      content: result.content,
      severity: 'WARNING'
    });
    colorLog(`   ${result.file}:${result.line} - ${result.content}`, 'yellow');
  });
} else {
  colorLog('✅ No response.ok checks found', 'green');
}

// 4. Check for correct authFetch imports
colorLog('\n🔍 Checking authFetch imports...', 'blue');
const authFetchImports = scanFiles(
  './src',
  ['.js', '.jsx'],
  /import.*authFetch/
);

const incorrectImports = authFetchImports.filter(result => 
  !result.content.includes('fetch-wrapper')
);

if (incorrectImports.length > 0) {
  colorLog('❌ Found incorrect authFetch imports:', 'red');
  incorrectImports.forEach(result => {
    issues.critical.push({
      type: 'Incorrect Import Path',
      file: result.file,
      line: result.line,
      content: result.content,
      severity: 'CRITICAL'
    });
    colorLog(`   ${result.file}:${result.line} - ${result.content}`, 'red');
  });
} else {
  colorLog('✅ All authFetch imports are correct', 'green');
}

// 5. Check for missing error handling
colorLog('\n🔍 Checking for missing error handling...', 'blue');
const apiCallsWithoutTryCatch = scanFiles(
  './src',
  ['.js', '.jsx'],
  /authFetch\(/
);

// This is a simplified check - in practice, you'd want more sophisticated parsing
const filesWithApiCalls = [...new Set(apiCallsWithoutTryCatch.map(r => r.file))];
const filesWithoutErrorHandling = [];

filesWithApiCalls.forEach(filePath => {
  const content = fs.readFileSync(filePath, 'utf8');
  const hasApiCalls = /authFetch\(/.test(content);
  const hasTryCatch = /try\s*{[\s\S]*authFetch[\s\S]*catch/.test(content);
  const hasErrorHandling = /onError|catch\s*\(/.test(content);
  
  if (hasApiCalls && !hasTryCatch && !hasErrorHandling) {
    filesWithoutErrorHandling.push(filePath);
    issues.warnings.push({
      type: 'Missing Error Handling',
      file: filePath,
      line: 'N/A',
      content: 'File has authFetch calls but no visible error handling',
      severity: 'WARNING'
    });
  }
});

if (filesWithoutErrorHandling.length > 0) {
  colorLog('⚠️ Files with potential missing error handling:', 'yellow');
  filesWithoutErrorHandling.forEach(file => {
    colorLog(`   ${file}`, 'yellow');
  });
} else {
  colorLog('✅ Error handling appears to be implemented', 'green');
}

// 6. Check for sensitive data in console.log
colorLog('\n🔍 Checking for sensitive data in console.log...', 'magenta');
const sensitiveLogs = scanFiles(
  './src',
  ['.js', '.jsx'],
  /console\.log.*(?:token|auth|password|secret|key)/i
);

if (sensitiveLogs.length > 0) {
  colorLog('⚠️ Found potentially sensitive console.log statements:', 'yellow');
  sensitiveLogs.forEach(result => {
    issues.security.push({
      type: 'Sensitive Data Logging',
      file: result.file,
      line: result.line,
      content: result.content,
      severity: 'SECURITY'
    });
    colorLog(`   ${result.file}:${result.line} - ${result.content}`, 'yellow');
  });
} else {
  colorLog('✅ No sensitive data in console.log found', 'green');
}

// 7. Check for Auth0 provider setup
colorLog('\n🔍 Checking Auth0 provider setup...', 'cyan');
const auth0Provider = scanFiles(
  './src',
  ['.js', '.jsx'],
  /Auth0Provider/
);

if (auth0Provider.length > 0) {
  colorLog('✅ Auth0Provider found in:', 'green');
  auth0Provider.forEach(result => {
    colorLog(`   ${result.file}:${result.line}`, 'green');
  });
} else {
  colorLog('❌ Auth0Provider not found - authentication may not be properly set up', 'red');
  issues.critical.push({
    type: 'Missing Auth0Provider',
    file: 'N/A',
    line: 'N/A',
    content: 'Auth0Provider not found in codebase',
    severity: 'CRITICAL'
  });
}

// 8. Check for useAuth0 hook usage
colorLog('\n🔍 Checking useAuth0 hook usage...', 'cyan');
const useAuth0Usage = scanFiles(
  './src',
  ['.js', '.jsx'],
  /useAuth0/
);

if (useAuth0Usage.length > 0) {
  colorLog('✅ useAuth0 hook found in:', 'green');
  useAuth0Usage.forEach(result => {
    colorLog(`   ${result.file}:${result.line}`, 'green');
  });
} else {
  colorLog('⚠️ useAuth0 hook not found - components may not be handling auth state', 'yellow');
  issues.warnings.push({
    type: 'Missing useAuth0 Usage',
    file: 'N/A',
    line: 'N/A',
    content: 'useAuth0 hook not found in components',
    severity: 'WARNING'
  });
}

// 9. Check for domain restrictions
const domainRestrictions = checkDomainRestrictions();
if (domainRestrictions.length === 0) {
  issues.info.push({
    type: 'Domain Restrictions',
    file: 'Auth0 Dashboard',
    line: 'N/A',
    content: 'Consider implementing domain restrictions for enhanced security',
    severity: 'INFO'
  });
}

// 10. Check for email verification requirements
const emailVerificationChecks = checkEmailVerification();
if (emailVerificationChecks.length === 0) {
  issues.warnings.push({
    type: 'Email Verification',
    file: 'Auth0 Dashboard',
    line: 'N/A',
    content: 'Users can login without verifying their email - consider requiring email verification',
    severity: 'WARNING'
  });
}

// 11. Summary Report
colorLog('\n📊 SUMMARY REPORT', 'white');
colorLog('==================', 'white');

const totalIssues = issues.critical.length + issues.security.length + issues.warnings.length;

if (totalIssues === 0) {
  colorLog('🎉 No issues found! Your Auth0 integration looks good.', 'green');
} else {
  colorLog(`Found ${totalIssues} total issues:`, 'white');
  colorLog(`🚨 Critical: ${issues.critical.length}`, 'red');
  colorLog(`🔒 Security: ${issues.security.length}`, 'yellow');
  colorLog(`⚠️ Warnings: ${issues.warnings.length}`, 'yellow');
  colorLog(`ℹ️ Info: ${issues.info.length}`, 'blue');
}

// 12. Generate detailed report file
const reportContent = `# Auth0 Integration Review Report
Generated: ${new Date().toISOString()}

## Summary
- Total Issues: ${totalIssues}
- Critical Issues: ${issues.critical.length}
- Security Issues: ${issues.security.length}
- Warnings: ${issues.warnings.length}
- Info: ${issues.info.length}

## Critical Issues
${issues.critical.map(issue => `
### ${issue.type}
- **File:** ${issue.file}
- **Line:** ${issue.line}
- **Content:** \`${issue.content}\`
- **Severity:** ${issue.severity}
`).join('\n')}

## Security Issues
${issues.security.map(issue => `
### ${issue.type}
- **File:** ${issue.file}
- **Line:** ${issue.line}
- **Content:** \`${issue.content}\`
- **Severity:** ${issue.severity}
`).join('\n')}

## Warnings
${issues.warnings.map(issue => `
### ${issue.type}
- **File:** ${issue.file}
- **Line:** ${issue.line}
- **Content:** \`${issue.content}\`
- **Severity:** ${issue.severity}
`).join('\n')}

## Recommendations

### Immediate Actions (Critical)
1. Fix all unauthenticated API calls by replacing \`fetch()\` with \`authFetch()\`
2. Remove any double JSON parsing on \`authFetch()\` responses
3. Correct all import paths for \`authFetch\`
4. Ensure Auth0Provider is properly configured

### Security Improvements
1. Remove or secure any console.log statements with sensitive data
2. Implement proper error handling for all API calls
3. Add authentication guards to protected routes

### Code Quality
1. Review and remove unnecessary \`response.ok\` checks
2. Ensure consistent error handling patterns
3. Add proper loading states for API calls

## Next Steps
1. Address all critical issues immediately
2. Review security issues and implement fixes
3. Consider warnings for code quality improvements
4. Test authentication flow thoroughly after fixes
`;

fs.writeFileSync('./auth0-review-report.md', reportContent);
colorLog('\n📄 Detailed report saved to: auth0-review-report.md', 'cyan');

// 13. Exit with appropriate code
if (issues.critical.length > 0) {
  colorLog('\n❌ Critical issues found - please fix before deploying', 'red');
  process.exit(1);
} else if (issues.security.length > 0) {
  colorLog('\n⚠️ Security issues found - please review', 'yellow');
  process.exit(1);
} else {
  colorLog('\n✅ Review complete - no critical issues found', 'green');
  process.exit(0);
} 