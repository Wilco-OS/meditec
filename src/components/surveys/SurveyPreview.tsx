'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { QuestionType } from '@/types/question';
import { Label } from '@/components/ui/label';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Question {
  id: string;
  text: string;
  description?: string;
  type: QuestionType;
  isRequired?: boolean;
  order?: number;
  options?: {
    id: string;
    text: string;
    value: string | number;
  }[];
}

interface Block {
  id: string;
  title: string;
  description?: string;
  order?: number;
  questions?: Question[];
}

interface SurveyPreviewProps {
  survey: {
    title: string;
    description?: string;
    blocks: Block[];
  };
  readOnly?: boolean;
  onSubmit?: (answers: Record<string, any>) => void;
}

const SurveyPreview: React.FC<SurveyPreviewProps> = ({ survey, readOnly = false, onSubmit }) => {
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  // Sicherstellen, dass Blöcke existieren und sortieren
  const sortedBlocks = survey.blocks && Array.isArray(survey.blocks) 
    ? [...survey.blocks].sort((a, b) => (a.order || 0) - (b.order || 0))
    : [];
  
  // Aktuelle Fragen aus dem aktuellen Block holen
  const currentBlock = sortedBlocks[currentBlockIndex] || null;
  const currentQuestions = currentBlock && currentBlock.questions && Array.isArray(currentBlock.questions)
    ? [...currentBlock.questions].sort((a, b) => (a.order || 0) - (b.order || 0))
    : [];

  // Beantwortung einer Frage verarbeiten
  const handleAnswer = (questionId: string, value: any) => {
    if (readOnly || completed) return;
    
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  // Prüfen, ob alle erforderlichen Fragen beantwortet wurden
  const areRequiredQuestionsAnswered = () => {
    return currentQuestions
      .filter(q => q.isRequired)
      .every(q => {
        const answer = answers[q.id];
        return answer !== undefined && answer !== '';
      });
  };

  // Zum nächsten Block wechseln
  const goToNextBlock = () => {
    if (currentBlockIndex < sortedBlocks.length - 1) {
      setCurrentBlockIndex(currentBlockIndex + 1);
      window.scrollTo(0, 0);
    } else {
      // Letzte Seite erreicht, Umfrage abschließen
      if (onSubmit && !readOnly) {
        setIsSubmitting(true);
        
        // Hier würden in der realen Implementierung die Antworten an den Server gesendet
        setTimeout(() => {
          onSubmit(answers);
          setCompleted(true);
          setIsSubmitting(false);
        }, 1000);
      }
    }
  };

  // Zum vorherigen Block wechseln
  const goToPreviousBlock = () => {
    if (currentBlockIndex > 0) {
      setCurrentBlockIndex(currentBlockIndex - 1);
      window.scrollTo(0, 0);
    }
  };

  // Umfrage neu starten
  const resetSurvey = () => {
    setAnswers({});
    setCurrentBlockIndex(0);
    setCompleted(false);
  };

  // Rendert eine Frage basierend auf ihrem Typ
  const renderQuestion = (question: Question) => {
    const answer = answers[question.id];
    
    switch (question.type) {
      case QuestionType.TEXT:
        return (
          <div>
            <Label htmlFor={question.id}>{question.text}{question.isRequired && <span className="text-red-500">*</span>}</Label>
            {question.description && <p className="text-sm text-muted-foreground mb-2">{question.description}</p>}
            <Textarea
              id={question.id}
              value={answer || ''}
              onChange={(e) => handleAnswer(question.id, e.target.value)}
              placeholder="Ihre Antwort..."
              disabled={readOnly || completed}
              className="mt-2"
            />
          </div>
        );
        
      case QuestionType.YES_NO:
      case QuestionType.AGREE_DISAGREE:
        return (
          <div>
            <Label>{question.text}{question.isRequired && <span className="text-red-500">*</span>}</Label>
            {question.description && <p className="text-sm text-muted-foreground mb-2">{question.description}</p>}
            <RadioGroup 
              value={answer} 
              onValueChange={(value) => handleAnswer(question.id, value)}
              disabled={readOnly || completed}
              className="mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id={`${question.id}-yes`} />
                <Label htmlFor={`${question.id}-yes`}>Ja</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id={`${question.id}-no`} />
                <Label htmlFor={`${question.id}-no`}>Nein</Label>
              </div>
            </RadioGroup>
          </div>
        );
        
      case QuestionType.MULTIPLE_CHOICE:
        return (
          <div>
            <Label>{question.text}{question.isRequired && <span className="text-red-500">*</span>}</Label>
            {question.description && <p className="text-sm text-muted-foreground mb-2">{question.description}</p>}
            <RadioGroup 
              value={answer} 
              onValueChange={(value) => handleAnswer(question.id, value)}
              disabled={readOnly || completed}
              className="mt-2"
            >
              {question.options?.map((option) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value.toString()} id={`${question.id}-${option.id}`} />
                  <Label htmlFor={`${question.id}-${option.id}`}>{option.text}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );
        
      case QuestionType.RATING:
        const ratings = [1, 2, 3, 4, 5];
        return (
          <div>
            <Label>{question.text}{question.isRequired && <span className="text-red-500">*</span>}</Label>
            {question.description && <p className="text-sm text-muted-foreground mb-2">{question.description}</p>}
            <div className="flex space-x-2 mt-2">
              {ratings.map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => handleAnswer(question.id, rating)}
                  disabled={readOnly || completed}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border",
                    answer === rating
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-input hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  {rating}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-sm text-muted-foreground mt-1">
              <span>Sehr unzufrieden</span>
              <span>Sehr zufrieden</span>
            </div>
          </div>
        );
        
      default:
        return (
          <div className="p-3 border border-yellow-300 bg-yellow-50 rounded-md">
            <p className="text-yellow-800">Fragetyp '{question.type}' wird nicht unterstützt.</p>
          </div>
        );
    }
  };

  // Wenn die Umfrage abgeschlossen ist, Bestätigungsbildschirm anzeigen
  if (completed) {
    return (
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Vielen Dank für Ihre Teilnahme!</CardTitle>
          <CardDescription>Ihre Antworten wurden erfolgreich übermittelt.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <p className="text-xl font-medium">Umfrage abgeschlossen</p>
            <p className="text-muted-foreground mt-2">
              Vielen Dank für Ihre Zeit und Ihre wertvollen Rückmeldungen.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          {!readOnly && (
            <Button variant="outline" onClick={resetSurvey}>
              Zurück zum Anfang
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Fortschrittsanzeige */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span>{currentBlockIndex + 1} von {sortedBlocks.length}</span>
          <span>{Math.round(((currentBlockIndex + 1) / sortedBlocks.length) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full" 
            style={{ width: `${((currentBlockIndex + 1) / sortedBlocks.length) * 100}%` }}
          />
        </div>
      </div>
      
      {/* Survey Card */}
      <Card>
        <CardHeader>
          <CardTitle>{survey.title}</CardTitle>
          {survey.description && <CardDescription>{survey.description}</CardDescription>}
        </CardHeader>
        
        {/* Block Title */}
        <CardHeader className="pt-0 pb-2">
          <div className="border-l-4 border-primary pl-3">
            <CardTitle className="text-lg">{currentBlock.title}</CardTitle>
            {currentBlock.description && <CardDescription>{currentBlock.description}</CardDescription>}
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-8">
            {currentQuestions.map((question) => (
              <div key={question.id} className="py-2">
                {renderQuestion(question)}
              </div>
            ))}
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={goToPreviousBlock}
            disabled={currentBlockIndex === 0}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Zurück
          </Button>
          
          <Button
            type="button"
            onClick={goToNextBlock}
            disabled={
              !readOnly && 
              !areRequiredQuestionsAnswered() || 
              isSubmitting
            }
          >
            {isSubmitting ? 'Wird gesendet...' : currentBlockIndex < sortedBlocks.length - 1 ? 'Weiter' : 'Abschließen'}
            {!isSubmitting && <ChevronRight className="ml-2 h-4 w-4" />}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SurveyPreview;
