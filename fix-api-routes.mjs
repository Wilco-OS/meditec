#!/usr/bin/env node

// Skript zum Finden und Korrigieren von API-Route-Handlern in Next.js 13+ App Router
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_DIR = path.join(__dirname, 'src', 'app', 'api');

// RegExp für API-Routenhandler mit altem Signaturformat
const OLD_HANDLER_REGEX = /export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)\s*\(\s*(?:req|request)\s*:\s*(?:NextRequest|Request)(?:\s*,\s*\{\s*params\s*\}\s*:\s*\{\s*params\s*:\s*\{\s*[a-zA-Z0-9_]+\s*:\s*string(?:\s*;\s*)?\}\s*\})/g;

// RegExp für den gesamten Handler-Block, um die genaue Position zu finden
const HANDLER_BLOCK_REGEX = /(export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)\s*\(\s*(?:req|request)\s*:\s*(?:NextRequest|Request)(?:\s*,\s*\{\s*params\s*\}\s*:\s*\{\s*params\s*:\s*\{\s*([a-zA-Z0-9_]+)\s*:\s*string(?:\s*;\s*)?\}\s*\}))/;

function findApiRouteFiles(dir) {
  const files = [];
  
  function scanDir(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.name === 'route.ts' || entry.name === 'route.js') {
        files.push(fullPath);
      }
    }
  }
  
  scanDir(dir);
  return files;
}

function fixApiRouteHandler(filePath) {
  let fileContent = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  // Prüfe, ob die Datei den alten Signaturstil verwendet
  if (OLD_HANDLER_REGEX.test(fileContent)) {
    // Finde alle Handler-Blöcke
    const match = fileContent.match(HANDLER_BLOCK_REGEX);
    
    if (match) {
      const [fullMatch, _, method, paramName] = match;
      
      // Erstelle den neuen Handler mit korrekter Signatur
      const newHandler = `export async function ${method}(
  req: NextRequest,
  context: { params: { ${paramName}: string } }
) {
  const { params } = context;`;
      
      // Ersetze den alten Handler
      fileContent = fileContent.replace(fullMatch, newHandler);
      
      // Überprüfe, ob wir auch {id} direkt verwenden müssen
      if (fileContent.includes('const { id } = params;') || 
          fileContent.includes('const {id} = params;') ||
          fileContent.includes('const { id } = await params;') ||
          fileContent.includes('const {id} = await params;')) {
        
        fileContent = fileContent.replace(/const\s*\{\s*id\s*\}\s*=\s*(?:await\s*)?params;/g, 
                                         'const id = params.id;');
      }
      
      fs.writeFileSync(filePath, fileContent, 'utf8');
      changed = true;
      console.log(`✅ Korrigiert: ${filePath}`);
    }
  }
  
  return changed;
}

// Hauptfunktion
function main() {
  console.log('🔍 Suche nach API-Route-Dateien...');
  const apiRouteFiles = findApiRouteFiles(API_DIR);
  console.log(`🔎 ${apiRouteFiles.length} API-Route-Dateien gefunden.`);
  
  let fixedCount = 0;
  
  for (const filePath of apiRouteFiles) {
    const wasFixed = fixApiRouteHandler(filePath);
    if (wasFixed) {
      fixedCount++;
    }
  }
  
  console.log(`\n✨ Ergebnis: ${fixedCount} von ${apiRouteFiles.length} Dateien wurden korrigiert.`);
}

main();
