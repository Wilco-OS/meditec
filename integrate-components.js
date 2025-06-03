// Dieses Skript integriert die neuen Komponenten in die SurveyEditor.tsx-Datei

const fs = require('fs');
const path = require('path');

// Pfad zur SurveyEditor.tsx-Datei
const editorPath = path.join(__dirname, 'src', 'components', 'surveys', 'SurveyEditor.tsx');

// 1. Imports für die neuen Komponenten hinzufügen
let editorContent = fs.readFileSync(editorPath, 'utf8');

// Überprüfen, ob die Imports bereits vorhanden sind
if (!editorContent.includes('import { SurveyBlockSelector }')) {
  const importStatement = `import { SurveyBlockSelector } from './SurveyBlockSelector';
import { DepartmentSelector } from './DepartmentSelector';`;
  
  // Nach dem letzten Import einfügen
  const lastImportIndex = editorContent.lastIndexOf('import');
  const lastImportEndIndex = editorContent.indexOf(';', lastImportIndex) + 1;
  
  editorContent = editorContent.substring(0, lastImportEndIndex) + 
                 '\n' + importStatement + 
                 editorContent.substring(lastImportEndIndex);
}

// 2. Änderungen speichern
fs.writeFileSync(editorPath, editorContent, 'utf8');

console.log('Imports für die neuen Komponenten wurden hinzugefügt. Weitere Integrationsschritte müssen manuell durchgeführt werden.');
