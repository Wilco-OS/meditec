'use client';

import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export type QuestionType = 
  | 'text' // Freitext
  | 'yesNo'; // Eher ja/eher nein

export interface QuestionOption {
  id: string;
  text: string;
  value?: string;
}

export interface Question {
  id: string;
  text: string;
  description?: string;
  type: QuestionType;
  required: boolean;
  options?: QuestionOption[];
  order: number;
}

interface QuestionEditorProps {
  questions: Question[];
  selectedQuestionIndex: number;
  onSelectQuestion: (index: number) => void;
  onAddQuestion: () => void;
  onUpdateQuestion: (index: number, field: string, value: any) => void;
  onDeleteQuestion: (index: number) => void;
  onMoveQuestion: (fromIndex: number, toIndex: number) => void;
}

export function QuestionEditor({
  questions,
  selectedQuestionIndex,
  onSelectQuestion,
  onAddQuestion,
  onUpdateQuestion,
  onDeleteQuestion,
  onMoveQuestion
}: QuestionEditorProps) {
  // Hilfsfunktion zum Aktualisieren der Frageoptionen
  const updateOption = (questionIndex: number, optionIndex: number, field: string, value: string) => {
    const updatedOptions = [...(questions[questionIndex].options || [])];
    updatedOptions[optionIndex] = {
      ...updatedOptions[optionIndex],
      [field]: value
    };
    
    onUpdateQuestion(questionIndex, 'options', updatedOptions);
  };

  // Hilfsfunktion zum Hinzufügen einer Option
  const addOption = (questionIndex: number) => {
    const currentOptions = [...(questions[questionIndex].options || [])];
    const newOption: QuestionOption = {
      id: uuidv4(),
      text: `Option ${currentOptions.length + 1}`,
    };
    
    onUpdateQuestion(questionIndex, 'options', [...currentOptions, newOption]);
  };

  // Hilfsfunktion zum Löschen einer Option
  const deleteOption = (questionIndex: number, optionIndex: number) => {
    const updatedOptions = [...(questions[questionIndex].options || [])];
    updatedOptions.splice(optionIndex, 1);
    
    onUpdateQuestion(questionIndex, 'options', updatedOptions);
  };

  return (
    <div className="space-y-6">
      {/* Fragen-Liste */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label>Fragen</Label>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onAddQuestion}
          >
            <Plus className="h-4 w-4 mr-2" />
            Neue Frage
          </Button>
        </div>
        
        {questions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Keine Fragen in diesem Block. Klicken Sie auf "Neue Frage", um eine hinzuzufügen.
          </p>
        ) : (
          <div className="space-y-1 mt-2">
            {questions.map((question, index) => (
              <div
                key={question.id}
                className={`flex items-center p-2 rounded-md cursor-pointer ${
                  selectedQuestionIndex === index ? 'bg-primary/10' : 'hover:bg-muted'
                }`}
                onClick={() => onSelectQuestion(index)}
              >
                <GripVertical className="h-4 w-4 mr-2 text-muted-foreground" />
                <div className="flex-1 truncate mr-2">{question.text || 'Unbenannte Frage'}</div>
                <Badge variant="outline" className="mr-2">
                  {question.type === 'text' && 'Freitext'}
                  {question.type === 'yesNo' && 'Eher ja/eher nein'}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteQuestion(index);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Separator */}
      <Separator />

      {/* Frage-Editor */}
      {questions.length > 0 && selectedQuestionIndex >= 0 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="questionText">Fragetext</Label>
            <Input
              id="questionText"
              value={questions[selectedQuestionIndex]?.text || ''}
              onChange={(e) => onUpdateQuestion(selectedQuestionIndex, 'text', e.target.value)}
              placeholder="Geben Sie Ihre Frage ein"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="questionDescription">Beschreibung (optional)</Label>
            <Textarea
              id="questionDescription"
              value={questions[selectedQuestionIndex]?.description || ''}
              onChange={(e) => onUpdateQuestion(selectedQuestionIndex, 'description', e.target.value)}
              placeholder="Zusätzliche Informationen zur Frage"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="questionType">Fragetyp</Label>
            <Select
              value={questions[selectedQuestionIndex]?.type}
              onValueChange={(value) => onUpdateQuestion(
                selectedQuestionIndex, 
                'type', 
                value as QuestionType
              )}
            >
              <SelectTrigger id="questionType">
                <SelectValue placeholder="Fragetyp auswählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Freitext</SelectItem>
                <SelectItem value="yesNo">Eher ja/eher nein</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Antwortoptionen für "Eher ja/eher nein"-Fragen */}
          {questions[selectedQuestionIndex]?.type === 'yesNo' && (
            <div className="space-y-2">
              <Label>Antwortoptionen</Label>
              <p className="text-sm text-muted-foreground">
                Für "Eher ja/eher nein"-Fragen werden automatisch die Optionen "Eher ja" und "Eher nein" verwendet.
              </p>
              
              {/* Automatisch Optionen erstellen, wenn sie noch nicht existieren */}
              {(!questions[selectedQuestionIndex]?.options || questions[selectedQuestionIndex]?.options.length === 0) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const yesNoOptions: QuestionOption[] = [
                      {
                        id: uuidv4(),
                        text: "Eher ja",
                        value: "ja"
                      },
                      {
                        id: uuidv4(),
                        text: "Eher nein",
                        value: "nein"
                      }
                    ];
                    onUpdateQuestion(selectedQuestionIndex, 'options', yesNoOptions);
                  }}
                  className="mt-2"
                >
                  Standardoptionen erstellen
                </Button>
              )}
              
              {/* Anzeige der Optionen, falls vorhanden */}
              {(questions[selectedQuestionIndex]?.options || []).length > 0 && (
                <div className="space-y-2 mt-2 pl-4">
                  {(questions[selectedQuestionIndex]?.options || []).map((option) => (
                    <div key={option.id} className="flex items-center">
                      <span className="text-sm font-medium">{option.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
