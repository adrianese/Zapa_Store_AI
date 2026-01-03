/**
 * watch-contracts.js - Vigila cambios en contratos y auto-sincroniza ABIs
 * 
 * Uso:
 *   npm run watch:contracts
 * 
 * Detecta cambios en:
 *   - src/*.sol (contratos Solidity)
 *   - artifacts/ (compilados)
 * 
 * Flujo automático:
 *   1. Detecta cambio en .sol
 *   2. Compila con Hardhat
 *   3. Copia ABIs al frontend
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { syncAbis } = require('./sync-abis');

// Configuración
const WATCH_CONFIG = {
  contractsDir: path.join(__dirname, '..', 'src'),
  debounceMs: 1000, // Esperar 1 segundo después del último cambio
  extensions: ['.sol']
};

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  dim: '\x1b[2m'
};

function log(message, color = 'reset') {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${colors.dim}[${timestamp}]${colors.reset} ${colors[color]}${message}${colors.reset}`);
}

let debounceTimer = null;
let isCompiling = false;

async function runCompile() {
  return new Promise((resolve, reject) => {
    log('🔨 Compilando contratos...', 'yellow');
    
    const compile = spawn('npx', ['hardhat', 'compile'], {
      cwd: path.join(__dirname, '..'),
      shell: true,
      stdio: 'pipe'
    });
    
    let output = '';
    
    compile.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    compile.stderr.on('data', (data) => {
      output += data.toString();
    });
    
    compile.on('close', (code) => {
      if (code === 0) {
        log('✅ Compilación exitosa', 'green');
        resolve(true);
      } else {
        log('❌ Error de compilación:', 'red');
        console.log(output);
        resolve(false);
      }
    });
    
    compile.on('error', (err) => {
      log(`❌ Error: ${err.message}`, 'red');
      reject(err);
    });
  });
}

async function handleChange(filename) {
  if (isCompiling) {
    log('⏳ Compilación en progreso, esperando...', 'dim');
    return;
  }
  
  // Debounce para evitar múltiples compilaciones
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  
  debounceTimer = setTimeout(async () => {
    isCompiling = true;
    log(`\n📝 Cambio detectado: ${filename}`, 'magenta');
    
    try {
      const compiled = await runCompile();
      
      if (compiled) {
        log('🔄 Sincronizando ABIs...', 'cyan');
        syncAbis();
        log('✨ Listo para usar en frontend\n', 'green');
      }
    } catch (error) {
      log(`❌ Error: ${error.message}`, 'red');
    } finally {
      isCompiling = false;
    }
  }, WATCH_CONFIG.debounceMs);
}

function startWatcher() {
  log('\n👀 Vigilando cambios en contratos...', 'cyan');
  log(`📂 Carpeta: ${WATCH_CONFIG.contractsDir}`, 'dim');
  log('   Presiona Ctrl+C para detener\n', 'dim');
  
  // Verificar que existe la carpeta
  if (!fs.existsSync(WATCH_CONFIG.contractsDir)) {
    log(`❌ No existe la carpeta: ${WATCH_CONFIG.contractsDir}`, 'red');
    process.exit(1);
  }
  
  // Vigilar cambios
  fs.watch(WATCH_CONFIG.contractsDir, { recursive: true }, (eventType, filename) => {
    if (!filename) return;
    
    const ext = path.extname(filename);
    if (WATCH_CONFIG.extensions.includes(ext)) {
      handleChange(filename);
    }
  });
  
  // Sincronizar ABIs al iniciar (por si hay cambios pendientes)
  log('🔄 Sincronización inicial...', 'cyan');
  syncAbis();
  log('✅ Watcher activo\n', 'green');
}

// Manejar cierre limpio
process.on('SIGINT', () => {
  log('\n👋 Deteniendo watcher...', 'yellow');
  process.exit(0);
});

// Ejecutar
startWatcher();
