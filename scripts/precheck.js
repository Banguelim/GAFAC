import { execSync } from 'child_process';
import fs from 'fs';

class PreDeployChecker {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  // Verificar arquivos essenciais
  checkEssentialFiles() {
    const requiredFiles = [
      'package.json',
      'vercel.json',
      'dist/index.js',
      'dist/public/index.html'
    ];

    requiredFiles.forEach(file => {
      if (!fs.existsSync(file)) {
        this.errors.push(`Arquivo obrigatório não encontrado: ${file}`);
      }
    });
  }

  // Verificar dependências
  checkDependencies() {
    try {
      execSync('npm audit --audit-level=high', { stdio: 'pipe' });
    } catch (error) {
      this.warnings.push('Vulnerabilidades encontradas nas dependências');
    }
  }

  // Verificar build
  checkBuild() {
    try {
      execSync('npm run build', { stdio: 'pipe' });
      console.log('✅ Build executado com sucesso');
    } catch (error) {
      this.errors.push('Build falhou: ' + error.message);
    }
  }

  // Verificar tipos TypeScript
  checkTypeScript() {
    try {
      execSync('npx tsc --noEmit', { stdio: 'pipe' });
      console.log('✅ Tipos TypeScript verificados');
    } catch (error) {
      this.errors.push('Erro de tipos TypeScript: ' + error.message);
    }
  }

  // Verificar tamanho do bundle
  checkBundleSize() {
    const bundlePath = 'dist/public/assets/';
    if (fs.existsSync(bundlePath)) {
      const files = fs.readdirSync(bundlePath);
      let totalSize = 0;
      
      files.forEach(file => {
        const stats = fs.statSync(`${bundlePath}/${file}`);
        totalSize += stats.size;
      });
      
      const sizeMB = totalSize / (1024 * 1024);
      
      if (sizeMB > 5) { // 5MB
        this.warnings.push(`Bundle muito grande: ${sizeMB.toFixed(2)}MB`);
      }
    }
  }

  // Verificar performance
  checkPerformance() {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    // Verificar dependências pesadas
    const heavyDependencies = [
      'lodash',
      'moment',
      'jquery',
    ];
    
    heavyDependencies.forEach(dep => {
      if (packageJson.dependencies && packageJson.dependencies[dep]) {
        this.warnings.push(`Dependência pesada encontrada: ${dep}`);
      }
    });
  }

  // Executar todas as verificações
  async runAllChecks() {
    console.log('🔍 Iniciando verificações pré-deploy...\n');
    
    this.checkEssentialFiles();
    this.checkDependencies();
    this.checkBuild();
    this.checkTypeScript();
    this.checkBundleSize();
    this.checkPerformance();
    
    // Mostrar resultados
    console.log('\n📋 Resultados das verificações:');
    
    if (this.errors.length > 0) {
      console.log('\n❌ ERROS ENCONTRADOS:');
      this.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    if (this.warnings.length > 0) {
      console.log('\n⚠️  AVISOS:');
      this.warnings.forEach(warning => console.log(`  - ${warning}`));
    }
    
    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('\n✅ Todas as verificações passaram!');
    }
    
    // Sair com erro se houver problemas críticos
    if (this.errors.length > 0) {
      console.log('\n❌ Deploy não pode prosseguir devido aos erros acima.');
      process.exit(1);
    }
    
    console.log('\n🚀 Pronto para deploy!');
  }
}

// Executar verificações
const checker = new PreDeployChecker();
checker.runAllChecks();
