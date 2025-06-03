const fs = require('fs');
const path = require('path');

// Pfad zum SurveyEditor.tsx
const filePath = path.join(__dirname, 'src', 'components', 'surveys', 'SurveyEditor.tsx');

// Datei lesen
const content = fs.readFileSync(filePath, 'utf8');

// Zeilen aufteilen
const lines = content.split('\n');

// Zeilen mit .map() finden, die möglicherweise keine key prop haben
const suspectLines = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Suche nach .map( ohne key= in den nächsten 5 Zeilen
  if (line.includes('.map(') && !line.includes('key=')) {
    let hasKey = false;
    // Überprüfe die nächsten 5 Zeilen auf ein key=
    for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
      if (lines[j].includes('key=')) {
        hasKey = true;
        break;
      }
    }
    
    if (!hasKey) {
      suspectLines.push({
        lineNumber: i + 1,
        content: line.trim(),
        context: lines.slice(Math.max(0, i - 2), Math.min(lines.length, i + 3)).join('\n')
      });
    }
  }
}

console.log('Potenzielle Stellen mit fehlenden key props:');
suspectLines.forEach(line => {
  console.log(`\nZeile ${line.lineNumber}: ${line.content}`);
  console.log('Kontext:');
  console.log(line.context);
  console.log('-'.repeat(50));
});
