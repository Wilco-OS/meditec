# Integration der neuen Komponenten in die SurveyEditor.tsx

Die folgenden Schritte erklären, wie die beiden neuen Komponenten in die bestehende SurveyEditor.tsx-Datei integriert werden können:

## 1. SurveyBlockSelector integrieren

Ersetzen Sie den Code für die Abschnittsliste mit der neuen SurveyBlockSelector-Komponente:

```tsx
{/* Block-Liste (linke Spalte) */}
<Card className="md:col-span-1">
  <CardHeader>
    <CardTitle>Abschnitte</CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    <SurveyBlockSelector
      blocks={survey.blocks}
      selectedBlockIndex={selectedBlockIndex}
      onSelectBlock={(index) => setSelectedBlockIndex(index)}
      onMoveBlockUp={moveBlockUp}
      onDeleteBlock={deleteBlock}
    />
    
    <Button 
      variant="outline" 
      className="w-full" 
      onClick={addBlock}
    >
      <Plus className="h-4 w-4 mr-2" />
      Neuer Abschnitt
    </Button>
  </CardContent>
</Card>
```

## 2. DepartmentSelector integrieren

Ersetzen Sie den Code für die Abteilungsauswahl mit der neuen DepartmentSelector-Komponente:

```tsx
{survey.blocks[selectedBlockIndex]?.restrictToDepartments && (
  <div className="pt-2">
    <Label htmlFor="blockDepartments">
      Abteilungen auswählen
    </Label>
    <DepartmentSelector
      companies={companies}
      assignedCompanyId={assignedCompanyId}
      selectedBlockIndex={selectedBlockIndex}
      selectedDepartments={survey.blocks[selectedBlockIndex]?.departments || []}
      onDepartmentChange={updateBlock}
    />
  </div>
)}
```

## 3. updateBlock-Funktion aktualisieren

Die Funktion muss verschiedene Werttypen unterstützen, nicht nur Strings:

```tsx
const updateBlock = (blockIndex: number, field: string, value: any) => {
  const updatedBlocks = [...survey.blocks];
  updatedBlocks[blockIndex] = {
    ...updatedBlocks[blockIndex],
    [field]: value,
  };

  setSurvey((prev: Survey) => ({
    ...prev,
    blocks: updatedBlocks,
  }));
};
```

## 4. SurveyEditorProps aktualisieren

Die SurveyEditorProps-Schnittstelle muss aktualisiert werden, um das departments-Feld in den Company-Objekten zu unterstützen:

```tsx
interface SurveyEditorProps {
  initialData?: Partial<Survey>;
  companies?: { 
    id: string; 
    name: string; 
    departments?: { name: string; id?: string }[] 
  }[];
}
```

## 5. Standardblock-Definition aktualisieren

Die Standardblock-Definition muss die fehlenden Eigenschaften enthalten:

```tsx
const defaultBlocks: SurveyBlock[] = [
  {
    id: uuidv4(),
    title: "Einführung",
    description: "Willkommen zu unserer Umfrage",
    order: 0,
    questions: [],
    restrictToDepartments: false,
    departments: [],
  },
];
```
