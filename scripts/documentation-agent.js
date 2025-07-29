#!/usr/bin/env node

/**
 * 🤖 UYTECH Documentation Agent
 * 
 * This agent automatically reviews each module and updates documentation
 * based on the current codebase state.
 */

const fs = require('fs');
const path = require('path');

class DocumentationAgent {
  constructor() {
    this.srcPath = path.join(__dirname, '../src');
    this.docsPath = path.join(__dirname, '../docs');
    this.modules = ['salespersons', 'client-matrix', 'dashboard', 'admin', 'objectives'];
    this.report = {
      timestamp: new Date().toISOString(),
      modules: [],
      recommendations: []
    };
  }

  /**
   * Main execution method
   */
  async run() {
    console.log('🤖 UYTECH Documentation Agent Starting...\n');
    
    // Analyze each module
    for (const module of this.modules) {
      await this.analyzeModule(module);
    }
    
    // Generate report
    await this.generateReport();
    
    console.log('\n✅ Documentation Agent completed successfully!');
    console.log('📊 Report generated: docs-agent-report.md');
  }

  /**
   * Analyze a specific module
   */
  async analyzeModule(moduleName) {
    console.log(`🔍 Analyzing module: ${moduleName}`);
    
    const modulePath = path.join(this.srcPath, 'modules', moduleName);
    const moduleInfo = {
      name: moduleName,
      path: modulePath,
      exists: fs.existsSync(modulePath),
      components: [],
      hooks: [],
      routes: [],
      documentation: {
        exists: false,
        path: '',
        lastModified: null,
        needsUpdate: false
      }
    };

    if (!moduleInfo.exists) {
      console.log(`⚠️  Module ${moduleName} does not exist`);
      return;
    }

    // Analyze module structure
    await this.analyzeModuleStructure(moduleInfo);
    
    // Check existing documentation
    await this.checkExistingDocumentation(moduleInfo);
    
    // Compare and determine if update is needed
    await this.determineUpdateNeeds(moduleInfo);
    
    this.report.modules.push(moduleInfo);
    console.log(`✅ Module ${moduleName} analysis complete\n`);
  }

  /**
   * Analyze the structure of a module
   */
  async analyzeModuleStructure(moduleInfo) {
    const files = this.getFilesRecursively(moduleInfo.path);
    
    for (const file of files) {
      const relativePath = path.relative(moduleInfo.path, file);
      const content = fs.readFileSync(file, 'utf8');
      
      // Analyze React components
      if (file.endsWith('.jsx') && !file.includes('test')) {
        const component = this.analyzeReactComponent(file, content);
        moduleInfo.components.push(component);
      }
      
      // Analyze hooks
      if (file.includes('hooks/') && file.endsWith('.js')) {
        const hook = this.analyzeHook(file, content);
        moduleInfo.hooks.push(hook);
      }
      
      // Analyze routes
      if (file.includes('routes/') && file.endsWith('.js')) {
        const route = this.analyzeRoute(file, content);
        moduleInfo.routes.push(route);
      }
    }
  }

  /**
   * Analyze a React component
   */
  analyzeReactComponent(filePath, content) {
    const fileName = path.basename(filePath, '.jsx');
    const lines = content.split('\n');
    
    return {
      name: fileName,
      path: filePath,
      type: 'component',
      props: this.extractProps(content),
      hooks: this.extractHooksUsed(content),
      exports: this.extractExports(content),
      dependencies: this.extractImports(content),
      hasTests: fs.existsSync(filePath.replace('.jsx', '.test.jsx')),
      lineCount: lines.length,
      lastModified: fs.statSync(filePath).mtime
    };
  }

  /**
   * Analyze a custom hook
   */
  analyzeHook(filePath, content) {
    const fileName = path.basename(filePath, '.js');
    
    return {
      name: fileName,
      path: filePath,
      type: 'hook',
      parameters: this.extractHookParameters(content),
      returns: this.extractHookReturns(content),
      dependencies: this.extractImports(content),
      hasTests: fs.existsSync(filePath.replace('.js', '.test.js')),
      lineCount: content.split('\n').length,
      lastModified: fs.statSync(filePath).mtime
    };
  }

  /**
   * Analyze API routes
   */
  analyzeRoute(filePath, content) {
    const fileName = path.basename(filePath, '.js');
    
    return {
      name: fileName,
      path: filePath,
      type: 'route',
      endpoints: this.extractEndpoints(content),
      methods: this.extractHttpMethods(content),
      middleware: this.extractMiddleware(content),
      dependencies: this.extractImports(content),
      lineCount: content.split('\n').length,
      lastModified: fs.statSync(filePath).mtime
    };
  }

  /**
   * Check if documentation exists for the module
   */
  async checkExistingDocumentation(moduleInfo) {
    const docFileName = `${moduleInfo.name}-module.md`;
    const docPath = path.join(this.docsPath, docFileName);
    
    if (fs.existsSync(docPath)) {
      moduleInfo.documentation.exists = true;
      moduleInfo.documentation.path = docPath;
      moduleInfo.documentation.lastModified = fs.statSync(docPath).mtime;
    }
  }

  /**
   * Determine if documentation needs updating
   */
  async determineUpdateNeeds(moduleInfo) {
    if (!moduleInfo.documentation.exists) {
      moduleInfo.documentation.needsUpdate = true;
      this.report.recommendations.push({
        type: 'create',
        module: moduleInfo.name,
        reason: 'Documentation does not exist'
      });
      return;
    }

    // Check if any component/hook/route was modified after documentation
    const docModified = moduleInfo.documentation.lastModified;
    const hasNewerFiles = [
      ...moduleInfo.components,
      ...moduleInfo.hooks,
      ...moduleInfo.routes
    ].some(item => item.lastModified > docModified);

    if (hasNewerFiles) {
      moduleInfo.documentation.needsUpdate = true;
      this.report.recommendations.push({
        type: 'update',
        module: moduleInfo.name,
        reason: 'Code has been modified since last documentation update'
      });
    }
  }

  /**
   * Generate comprehensive report
   */
  async generateReport() {
    const reportContent = this.generateReportContent();
    const reportPath = path.join(__dirname, '../docs-agent-report.md');
    
    fs.writeFileSync(reportPath, reportContent);
    
    // Also update individual module documentation
    for (const module of this.report.modules) {
      if (module.documentation.needsUpdate) {
        await this.updateModuleDocumentation(module);
      }
    }
  }

  /**
   * Generate report content
   */
  generateReportContent() {
    const { modules, recommendations } = this.report;
    
    return `# 📊 Documentation Agent Report

**Generated**: ${new Date().toLocaleString()}  
**Agent**: UYTECH Documentation Agent  
**Modules Analyzed**: ${modules.length}

## 🎯 Executive Summary

${this.generateExecutiveSummary()}

## 📋 Module Analysis

${modules.map(module => this.generateModuleSection(module)).join('\n\n')}

## 🔧 Recommendations

${recommendations.map(rec => `- **${rec.type.toUpperCase()}**: ${rec.module} - ${rec.reason}`).join('\n')}

## 📈 Statistics

- **Total Components**: ${modules.reduce((sum, m) => sum + m.components.length, 0)}
- **Total Hooks**: ${modules.reduce((sum, m) => sum + m.hooks.length, 0)}
- **Total Routes**: ${modules.reduce((sum, m) => sum + m.routes.length, 0)}
- **Documentation Coverage**: ${modules.filter(m => m.documentation.exists).length}/${modules.length} (${Math.round(modules.filter(m => m.documentation.exists).length / modules.length * 100)}%)

## 🚀 Next Steps

1. Review and approve recommended documentation updates
2. Run \`npm run docs:generate\` to create missing documentation
3. Schedule regular documentation reviews (monthly recommended)

---
*Generated by UYTECH Documentation Agent*
`;
  }

  /**
   * Generate executive summary
   */
  generateExecutiveSummary() {
    const { modules, recommendations } = this.report;
    const hasDocsCount = modules.filter(m => m.documentation.exists).length;
    const needsUpdateCount = modules.filter(m => m.documentation.needsUpdate).length;
    
    return `- **${hasDocsCount}/${modules.length}** modules have documentation
- **${needsUpdateCount}** modules need documentation updates
- **${recommendations.length}** total recommendations generated
- **${modules.reduce((sum, m) => sum + m.components.length, 0)}** React components analyzed
- **${modules.reduce((sum, m) => sum + m.hooks.length, 0)}** custom hooks documented`;
  }

  /**
   * Generate module section for report
   */
  generateModuleSection(module) {
    return `### 📦 ${module.name}

**Status**: ${module.documentation.exists ? '✅ Documented' : '❌ Missing Documentation'}  
**Last Modified**: ${module.documentation.lastModified || 'Never'}  
**Needs Update**: ${module.documentation.needsUpdate ? '⚠️ Yes' : '✅ No'}

**Components**: ${module.components.length}  
**Hooks**: ${module.hooks.length}  
**Routes**: ${module.routes.length}

**Key Components**:
${module.components.slice(0, 5).map(c => `- ${c.name} (${c.lineCount} lines)`).join('\n')}

**Key Hooks**:
${module.hooks.slice(0, 5).map(h => `- ${h.name}`).join('\n')}`;
  }

  /**
   * Update module documentation
   */
  async updateModuleDocumentation(module) {
    const docContent = this.generateModuleDocumentation(module);
    const docPath = path.join(this.docsPath, `${module.name}-module.md`);
    
    fs.writeFileSync(docPath, docContent);
    console.log(`📝 Updated documentation: ${module.name}-module.md`);
  }

  /**
   * Generate module documentation content
   */
  generateModuleDocumentation(module) {
    return `# 📦 ${module.name.charAt(0).toUpperCase() + module.name.slice(1)} Module

**Auto-generated**: ${new Date().toLocaleString()}  
**Module Path**: \`${module.path}\`

## 🎯 Overview

${this.generateModuleOverview(module)}

## 🧩 Components

${module.components.map(comp => this.generateComponentDoc(comp)).join('\n\n')}

## 🎣 Hooks

${module.hooks.map(hook => this.generateHookDoc(hook)).join('\n\n')}

## 🛣️ API Routes

${module.routes.map(route => this.generateRouteDoc(route)).join('\n\n')}

## 🧪 Testing

${this.generateTestingSection(module)}

## 📚 Dependencies

${this.generateDependenciesSection(module)}

---
*Auto-generated by UYTECH Documentation Agent*
`;
  }

  // Helper methods for parsing code
  extractProps(content) {
    const propsMatch = content.match(/const\s+\w+\s*=\s*\(\s*{([^}]+)}/);
    return propsMatch ? propsMatch[1].split(',').map(p => p.trim()) : [];
  }

  extractHooksUsed(content) {
    const hookMatches = content.match(/use\w+/g);
    return hookMatches ? [...new Set(hookMatches)] : [];
  }

  extractExports(content) {
    const exportMatches = content.match(/export\s+(?:default\s+)?(\w+)/g);
    return exportMatches ? exportMatches.map(m => m.replace('export ', '').replace('default ', '')) : [];
  }

  extractImports(content) {
    const importMatches = content.match(/import\s+.*?\s+from\s+['"]([^'"]+)['"]/g);
    return importMatches ? importMatches.map(m => m.match(/from\s+['"]([^'"]+)['"]/)[1]) : [];
  }

  extractHookParameters(content) {
    const paramMatch = content.match(/const\s+use\w+\s*=\s*\(([^)]*)\)/);
    return paramMatch ? paramMatch[1].split(',').map(p => p.trim()) : [];
  }

  extractHookReturns(content) {
    const returnMatches = content.match(/return\s+({[^}]*}|\[.*?\]|\w+)/g);
    return returnMatches ? returnMatches.map(r => r.replace('return ', '')) : [];
  }

  extractEndpoints(content) {
    const endpointMatches = content.match(/router\.\w+\(['"]([^'"]+)['"]/g);
    return endpointMatches ? endpointMatches.map(m => m.match(/['"]([^'"]+)['"]/)[1]) : [];
  }

  extractHttpMethods(content) {
    const methodMatches = content.match(/router\.(\w+)\(/g);
    return methodMatches ? [...new Set(methodMatches.map(m => m.match(/router\.(\w+)\(/)[1].toUpperCase()))] : [];
  }

  extractMiddleware(content) {
    const middlewareMatches = content.match(/app\.use\(['"]([^'"]+)['"][^)]*\)/g);
    return middlewareMatches ? middlewareMatches.map(m => m.match(/['"]([^'"]+)['"]/)[1]) : [];
  }

  generateModuleOverview(module) {
    return `The ${module.name} module contains ${module.components.length} components, ${module.hooks.length} custom hooks, and ${module.routes.length} API routes. This module handles functionality related to ${module.name.replace('-', ' ')}.`;
  }

  generateComponentDoc(comp) {
    return `### 🧩 ${comp.name}

**Type**: React Component  
**File**: \`${comp.path}\`  
**Lines**: ${comp.lineCount}  
**Has Tests**: ${comp.hasTests ? '✅' : '❌'}

**Props**: ${comp.props.join(', ') || 'None'}  
**Hooks Used**: ${comp.hooks.join(', ') || 'None'}`;
  }

  generateHookDoc(hook) {
    return `### 🎣 ${hook.name}

**Type**: Custom Hook  
**File**: \`${hook.path}\`  
**Lines**: ${hook.lineCount}  
**Has Tests**: ${hook.hasTests ? '✅' : '❌'}

**Parameters**: ${hook.parameters.join(', ') || 'None'}  
**Returns**: ${hook.returns.join(', ') || 'Unknown'}`;
  }

  generateRouteDoc(route) {
    return `### 🛣️ ${route.name}

**Type**: API Route  
**File**: \`${route.path}\`  
**Lines**: ${route.lineCount}  
**Methods**: ${route.methods.join(', ') || 'None'}  
**Endpoints**: ${route.endpoints.join(', ') || 'None'}`;
  }

  generateTestingSection(module) {
    const testedComponents = module.components.filter(c => c.hasTests).length;
    const testedHooks = module.hooks.filter(h => h.hasTests).length;
    const total = module.components.length + module.hooks.length;
    const coverage = total > 0 ? Math.round((testedComponents + testedHooks) / total * 100) : 0;
    
    return `**Test Coverage**: ${coverage}% (${testedComponents + testedHooks}/${total} files have tests)`;
  }

  generateDependenciesSection(module) {
    const allDeps = [...new Set([
      ...module.components.flatMap(c => c.dependencies),
      ...module.hooks.flatMap(h => h.dependencies),
      ...module.routes.flatMap(r => r.dependencies)
    ])];
    
    return allDeps.slice(0, 10).map(dep => `- ${dep}`).join('\n');
  }

  /**
   * Get all files recursively from a directory
   */
  getFilesRecursively(dir) {
    const files = [];
    
    if (!fs.existsSync(dir)) return files;
    
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        files.push(...this.getFilesRecursively(fullPath));
      } else if (stat.isFile()) {
        files.push(fullPath);
      }
    }
    
    return files;
  }
}

// Run the agent
if (require.main === module) {
  const agent = new DocumentationAgent();
  agent.run().catch(console.error);
}

module.exports = DocumentationAgent; 