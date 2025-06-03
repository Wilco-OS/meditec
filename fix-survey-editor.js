// Diese Datei enthält die nötigen Änderungen, um die beiden identifizierten Probleme zu beheben
// 1. Abschnitte wieder anklickbar machen
// 2. Nur Abteilungen des ausgewählten Unternehmens anzeigen

const fs = require('fs');
const path = require('path');

// Pfad zur SurveyEditor.tsx-Datei
const filePath = path.join(__dirname, 'src', 'components', 'surveys', 'SurveyEditor.tsx');

// Backup der originalen Datei erstellen
fs.copyFileSync(filePath, filePath + '.backup');

// Datei einlesen
let content = fs.readFileSync(filePath, 'utf8');

// 1. Fix für die Blockauswahl: Klickbaren Abschnitt reparieren
const blockListPattern = /<div\s+key=\{block\.id\}[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*\)\)\)}/;
const blockListReplacement = `<div
                      key={block.id}
                      className={\`flex items-center p-2 rounded-md cursor-pointer \${selectedBlockIndex === index ? 'bg-primary/10' : 'hover:bg-muted'}\`}
                      onClick={() => setSelectedBlockIndex(index)}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="flex-1 truncate">{block.title}</span>
                        <div className="flex space-x-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              moveBlockUp(index);
                            }}
                            disabled={index === 0}
                          >
                            <ArrowUpDown className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteBlock(index);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}`;

content = content.replace(blockListPattern, blockListReplacement);

// 2. Fix für die Abteilungsanzeige: Nur Abteilungen des ausgewählten Unternehmens anzeigen
const departmentListPattern = /{companies\.map\(\(company\) => \([\s\S]*?<\/div>\s*\)\)}/;
const departmentListReplacement = `{assignedCompanyId === 'none' ? (
                            <p className="text-sm text-muted-foreground">
                              Bitte wählen Sie zuerst ein Unternehmen aus, um Abteilungen zuweisen zu können.
                            </p>
                          ) : (
                            companies
                              .filter(company => company.id === assignedCompanyId)
                              .map((company) => (
                              <div key={company.id} className="space-y-1">
                                <h4 className="text-sm font-medium">
                                  {company.name}
                                </h4>
                                {company.departments &&
                                company.departments.length > 0 ? (
                                  <div className="space-y-1 pl-4">
                                    {company.departments.map(
                                      (dept, deptIndex) => (
                                        <div
                                          key={\`\${company.id}-\${deptIndex}\`}
                                          className="flex items-center"
                                        >
                                          <input
                                          type="checkbox"
                                          id={\`dept-\${company.id}-\${deptIndex}\`}
                                          className="mr-2"
                                          checked={
                                            survey.blocks[
                                              selectedBlockIndex
                                            ]?.departments?.includes(
                                              \`\${company.id}:\${dept.name}\`,
                                            ) || false
                                          }
                                          onChange={(e) => {
                                            const deptId = \`\${company.id}:\${dept.name}\`;
                                            const currentDepts =
                                              survey.blocks[selectedBlockIndex]
                                                ?.departments || [];
                                            let newDepts;

                                            if (e.target.checked) {
                                              newDepts = [
                                                ...currentDepts,
                                                deptId,
                                              ];
                                            } else {
                                              newDepts = currentDepts.filter(
                                                (d) => d !== deptId,
                                              );
                                            }

                                            updateBlock(
                                              selectedBlockIndex,
                                              "departments",
                                              newDepts,
                                            );
                                          }}
                                        />
                                        <label
                                          htmlFor={\`dept-\${company.id}-\${deptIndex}\`}
                                          className="text-sm"
                                        >
                                          {dept.name}
                                        </label>
                                        </div>
                                      )
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground pl-4">
                                    Keine Abteilungen definiert
                                  </p>
                                )}
                              </div>
                            ))
                          )}`;

content = content.replace(departmentListPattern, departmentListReplacement);

// 3. Typprobleme beheben: updateBlock-Funktion anpassen
const updateBlockPattern = /const updateBlock = \(blockIndex: number, field: string, value: string\) => \{/;
const updateBlockReplacement = `const updateBlock = (blockIndex: number, field: string, value: any) => {`;

content = content.replace(updateBlockPattern, updateBlockReplacement);

// 4. Typprobleme beheben: Standardblock-Definition aktualisieren
const defaultBlockPattern = /const defaultBlocks: SurveyBlock\[\] = \[\s*\{\s*id: uuidv4\(\),\s*title: "[^"]*",\s*description: "[^"]*",\s*order: 0,\s*questions: \[\],\s*\},\s*\];/;
const defaultBlockReplacement = `const defaultBlocks: SurveyBlock[] = [
      {
        id: uuidv4(),
        title: "Einführung",
        description: "Willkommen zu unserer Umfrage",
        order: 0,
        questions: [],
        restrictToDepartments: false,
        departments: [],
      },
    ];`;

content = content.replace(defaultBlockPattern, defaultBlockReplacement);

// 5. Typprobleme beheben: SurveyEditorProps aktualisieren
const surveyEditorPropsPattern = /interface SurveyEditorProps \{\s*initialData\?: Partial<Survey>;\s*companies\?: \{ id: string; name: string \}\[\];\s*id: string;\s*name: string;\s*\}/;
const surveyEditorPropsReplacement = `interface SurveyEditorProps {
  initialData?: Partial<Survey>;
  companies?: { 
    id: string; 
    name: string; 
    departments?: { name: string; id?: string }[] 
  }[];
}`;

content = content.replace(surveyEditorPropsPattern, surveyEditorPropsReplacement);

// Änderungen in die Datei schreiben
fs.writeFileSync(filePath, content, 'utf8');

console.log('SurveyEditor.tsx wurde erfolgreich aktualisiert!');
