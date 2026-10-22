#!/usr/bin/env node

/**
 * audit-secrets.js
 * Escáner preventivo de seguridad para detectar posibles secretos,
 * contraseñas o URLs de bases de datos expuestas en archivos rastreados por Git.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Iniciando auditoría preventiva de secretos en archivos de Git...\n');

let trackedFiles = [];
try {
  const output = execSync('git ls-files', { encoding: 'utf-8' });
  trackedFiles = output.split('\n').map((f) => f.trim()).filter(Boolean);
} catch (error) {
  console.error('❌ Error obteniendo lista de archivos de Git:', error.message);
  process.exit(1);
}

// Patrones sospechosos de fuga de secretos
const PATTERNS = [
  {
    name: 'URL de PostgreSQL con credenciales reales en archivo público',
    regex: /postgres(?:ql)?:\/\/(?!usuario:contrase|user:password)[^:\s]+:[^@\s]+@[^\s\/]+/gi,
    excludeExtensions: ['.example'],
  },
  {
    name: 'Contraseña en claro asignada en README o Markdown',
    regex: /(?:PASSWORD|SECRET|CLAVE)\s*[:=]\s*['"]?[A-Za-z0-9@#\$\%_!]{8,}['"]?/gi,
    filter: (match) => {
      const lower = match.toLowerCase();
      // Ignorar placeholders comunes conocidos
      return (
        !lower.includes('tupassword') &&
        !lower.includes('ejemplo') &&
        !lower.includes('placeholder') &&
        !lower.includes('super_secret_jwt_key_at_least_32_chars_long') &&
        !lower.includes('contraseña') &&
        !lower.includes('password123') &&
        !lower.includes('admindev123') &&
        !lower.includes('admin1234!') &&
        !lower.includes('profe1234!') &&
        !lower.includes('alumno1234!') &&
        !lower.includes('feltrin_dev_password') &&
        !lower.includes('undefined') &&
        !lower.includes('!password') &&
        !lower.includes('<tu-')
      );
    },
  },
  {
    name: 'Archivo .env rastreado en Git',
    fileCheck: (file) => {
      const base = path.basename(file);
      return base === '.env' || (base.startsWith('.env.') && !base.endsWith('.example'));
    },
  },
];

let issuesFound = 0;

for (const file of trackedFiles) {
  // 1. Validar nombre de archivo
  for (const pattern of PATTERNS) {
    if (pattern.fileCheck && pattern.fileCheck(file)) {
      console.error(`🚨 [ALERTA CRÍTICA] Archivo de entorno rastreado por Git: ${file}`);
      issuesFound++;
    }
  }

  // 2. Validar contenido
  if (!fs.existsSync(file)) continue;

  // Evitar binarios grandes
  const ext = path.extname(file).toLowerCase();
  if (['.png', '.jpg', '.jpeg', '.webp', '.pdf', '.ico', '.woff', '.woff2'].includes(ext)) {
    continue;
  }

  try {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      for (const pattern of PATTERNS) {
        if (!pattern.regex) continue;
        if (pattern.excludeExtensions && pattern.excludeExtensions.includes(ext)) continue;

        const matches = line.match(pattern.regex);
        if (matches) {
          for (const match of matches) {
            if (pattern.filter && !pattern.filter(match)) continue;

            console.warn(`⚠️ [ADVERTENCIA] ${pattern.name}`);
            console.warn(`   Archivo: ${file}:${index + 1}`);
            console.warn(`   Línea:   ${line.trim().slice(0, 80)}...\n`);
            issuesFound++;
          }
        }
      }
    });
  } catch {
    // Ignorar errores de lectura de binarios
  }
}

console.log('───────────────────────────────────────────────────────');
if (issuesFound === 0) {
  console.log('✅ Auditoría completada con éxito: 0 secretos o credenciales expuestas.');
  process.exit(0);
} else {
  console.error(`❌ Se detectaron ${issuesFound} advertencias de posibles secretos expuestos.`);
  process.exit(1);
}
