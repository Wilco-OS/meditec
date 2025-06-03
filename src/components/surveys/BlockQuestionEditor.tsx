'use client';

import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2, ArrowUp, ArrowDown, GripVertical } from 'lucide-react';
import { ISurveyQuestion } from '@/models/Survey';
import { QuestionType } from '@/types/question';

interface BlockQuestionEditorProps {
  questions: ISurveyQuestion[];
  onChange: (questions: ISurveyQuestion[]) => void;
}

export default function BlockQuestionEditor({ questions, onChange }: BlockQuestionEditorProps) {
  // Frage aktualisieren
  const updateQuestion = (questionId: string, field: keyof ISurveyQuestion, value: any) => {
    const updatedQuestions = questions.map(question => {
      if (question.id === questionId) {
        return { ...question, [field]: value };
      }
      return question;
    });
    
    onChange(updatedQuestions);
  };
  
  // Frage löschen
  const deleteQuestion = (questionId: string) => {
    const updatedQuestions = questions
      .filter(question => question.id !== questionId)
      .map((question, index) => ({ ...question, order: index }));
    
    onChange(updatedQuestions);
  };
  
  // Frage nach oben verschieben
  const moveQuestionUp = (questionId: string) => {
    const questionIndex = questions.findIndex(question => question.id === questionId);
    if (questionIndex <= 0) return;
    
    const updatedQuestions = [...questions];
    const temp = updatedQuestions[questionIndex];
    updatedQuestions[questionIndex] = { ...updatedQuestions[questionIndex - 1], order: questionIndex };
    updatedQuestions[questionIndex - 1] = { ...temp, order: questionIndex - 1 };
    
    onChange(updatedQuestions);
  };
  
  // Frage nach unten verschieben
  const moveQuestionDown = (questionId: string) => {
    const questionIndex = questions.findIndex(question => question.id === questionId);
    if (questionIndex >= questions.length - 1) return;
    
    const updatedQuestions = [...questions];
    const temp = updatedQuestions[questionIndex];
    updatedQuestions[questionIndex] = { ...updatedQuestions[questionIndex + 1], order: questionIndex };
    updatedQuestions[questionIndex + 1] = { ...temp, order: questionIndex + 1 };
    
    onChange(updatedQuestions);
  };
  
  // Formatieren des Fragetyps für die Anzeige
  const formatQuestionType = (type: string) => {
    switch (type) {
      case QuestionType.YES_NO:
        return 'Ja/Nein';
      case QuestionType.TEXT:
        return 'Text';
      default:
        return type;
    }
  };
  
  return (
    <div className="space-y-4">
      {questions.length === 0 ? (
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-sm text-gray-500">
              Keine Fragen in diesem Block.
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => {
                // Neue Frage am Ende hinzufügen
                const newQuestion = {
                  id: uuidv4(),
                  text: '',
                  type: QuestionType.YES_NO,
                  required: true,
                  order: questions.length // Die Reihenfolge basiert auf der aktuellen Länge
                };
                
                // Bestehende Fragen + neue Frage
                onChange([...questions, newQuestion]);
              }}
            >
              Frage hinzufügen
            </Button>
          </CardContent>
        </Card>
      ) : (
        questions
          .sort((a, b) => a.order - b.order)
          .map((question, index) => (
            <Card key={question.id} className="relative">
              <CardContent className="p-4">
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-1 flex items-center justify-center">
                    <div className="flex flex-col items-center space-y-1">
                      <GripVertical className="h-5 w-5 text-gray-400" />
                      <div className="flex flex-col space-y-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => moveQuestionUp(question.id)}
                          disabled={index === 0}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => moveQuestionDown(question.id)}
                          disabled={index === questions.length - 1}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-span-11 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="w-full mr-4">
                        <Label htmlFor={`question-text-${question.id}`} className="mb-1 block">
                          Fragetext
                        </Label>
                        <Input
                          id={`question-text-${question.id}`}
                          value={question.text}
                          onChange={(e) => updateQuestion(question.id, 'text', e.target.value)}
                          placeholder="Geben Sie den Fragetext ein"
                          className="w-full"
                        />
                      </div>
                      
                      <Button
                        variant="destructive"
                        size="icon"
                        className="mt-6"
                        onClick={() => deleteQuestion(question.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`question-type-${question.id}`} className="mb-1 block">
                          Fragetyp
                        </Label>
                        <Select
                          value={question.type}
                          onValueChange={(value) => updateQuestion(question.id, 'type', value)}
                        >
                          <SelectTrigger id={`question-type-${question.id}`}>
                            <SelectValue placeholder="Typ auswählen">
                              {formatQuestionType(question.type)}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem key="yes_no" value={QuestionType.YES_NO}>Ja/Nein</SelectItem>
                            <SelectItem key="text" value={QuestionType.TEXT}>Text</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label className="mb-3 block">Pflichtfeld</Label>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id={`question-required-${question.id}`}
                            checked={question.required}
                            onCheckedChange={(checked) => updateQuestion(question.id, 'required', checked)}
                          />
                          <Label htmlFor={`question-required-${question.id}`}>
                            {question.required ? 'Ja' : 'Nein'}
                          </Label>
                        </div>
                      </div>
                    </div>
                    
                    {question.catalogRef && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500">
                          Diese Frage stammt aus dem Fragenkatalog
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
      )}
    </div>
  );
}
