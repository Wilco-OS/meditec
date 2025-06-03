'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { QuestionType } from '@/types/question';

interface Category {
  _id: string;
  name: string;
}

interface Question {
  _id: string;
  text: string;
  type: string;
  required: boolean;
  categoryId: string | { _id: string; name: string };
  isActive: boolean;
  options?: Array<{ text: string; value: string }>;
  description?: string;
}

interface EditQuestionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: string, data: any) => void;
  question: Question | null;
  categories: Category[];
}

export default function EditQuestionDialog({ 
  isOpen, 
  onClose, 
  onSubmit, 
  question, 
  categories 
}: EditQuestionDialogProps) {
  const [formData, setFormData] = useState({
    text: '',
    description: '',
    type: 'text',
    required: true,
    isActive: true,
    categoryId: '',
    options: [{ text: '', value: '' }],
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Formular mit Fragen-Daten füllen, wenn sich die Frage ändert
  useEffect(() => {
    if (!question) return;

    // Für besseres Debugging
    console.log('Original question before processing:', question);
    
    // Kategorien-ID extrahieren
    const categoryId = typeof question.categoryId === 'object' 
      ? question.categoryId._id 
      : question.categoryId;
    
    // Fragetyp normalisieren
    // Bei Ja/Nein-Fragen ist der Typ in der Datenbank 'yes_no'
    let questionType = 'text'; // Standardwert
    
    // Explizite Prüfung auf den Typ 'yes_no' oder 'radio'
    if (question.type === 'yes_no' || question.type === 'radio') {
      questionType = 'yes_no';
      console.log('Detected question type: yes_no (Ja/Nein)'); 
    } else {
      questionType = 'text';
      console.log('Using default type: text (Freitext)');
    }
    
    // Optionen basierend auf dem Typ festlegen
    const options = questionType === 'yes_no' 
      ? [{ text: 'Ja', value: 'ja' }, { text: 'Nein', value: 'nein' }] 
      : (question.options && question.options.length > 0 ? question.options : [{ text: '', value: '' }]);
    
    // State aktualisieren
    const newFormData = {
      text: question.text || '',
      description: question.description || '',
      type: questionType,
      required: true,
      isActive: true,
      categoryId: categoryId,
      options: options,
    };
    
    console.log('Setting form data with type:', newFormData.type);
    setFormData(newFormData);
    
    setErrors({});
    setIsSubmitting(false);
  }, [question]);
  
  // Formular-Änderungen verarbeiten
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Fehler zurücksetzen
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  // Switch-Status (für required und isActive) verarbeiten
  const handleSwitchChange = (name: string) => (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked,
    }));
  };
  
  // Select-Änderungen verarbeiten
  const handleSelectChange = (name: string) => (value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Wenn der Typ geändert wird, passen wir die Optionen an
    if (name === 'type') {
      if (value === 'yes_no') {
        // Automatisch Ja/Nein-Optionen setzen
        setFormData(prev => ({
          ...prev,
          options: [
            { text: 'Ja', value: 'ja' },
            { text: 'Nein', value: 'nein' }
          ],
        }));
      }
    }
    
    // Fehler zurücksetzen
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  // Optionen verarbeiten
  const handleOptionChange = (index: number, field: 'text' | 'value', value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    
    setFormData(prev => ({
      ...prev,
      options: newOptions,
    }));
  };
  
  // Option hinzufügen
  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, { text: '', value: '' }],
    }));
  };
  
  // Option entfernen
  const removeOption = (index: number) => {
    if (formData.options.length <= 1) return;
    
    const newOptions = [...formData.options];
    newOptions.splice(index, 1);
    
    setFormData(prev => ({
      ...prev,
      options: newOptions,
    }));
  };
  
  // Formular validieren
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.text.trim()) {
      newErrors.text = 'Fragetext ist erforderlich';
    }
    
    if (!formData.categoryId) {
      newErrors.categoryId = 'Kategorie ist erforderlich';
    }
    
    // Wir müssen keine Optionen mehr validieren, da sie automatisch gesetzt werden
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Formular absenden
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !question) return;
    
    setIsSubmitting(true);
    
    // Für alle Fragetypen die relevanten Daten senden
    const dataToSubmit = {
      text: formData.text,
      description: formData.description,
      type: formData.type,
      required: true, // Immer auf true setzen
      isActive: true, // Immer auf true setzen
      categoryId: formData.categoryId,
    };
    
    // Für Ja/Nein-Fragen die standardisierten Optionen senden
    if (formData.type === 'yes_no') {
      Object.assign(dataToSubmit, { 
        options: [
          { text: 'Ja', value: 'ja' },
          { text: 'Nein', value: 'nein' }
        ] 
      });
    }
    
    try {
      await onSubmit(question._id, dataToSubmit);
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Frage:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Frage bearbeiten</DialogTitle>
            <DialogDescription>
              Aktualisieren Sie die Details der Frage.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="text" className="required">Fragetext</Label>
              <Textarea
                id="text"
                name="text"
                value={formData.text}
                onChange={handleChange}
                placeholder="z.B. Wie zufrieden sind Sie mit Ihrem Arbeitsplatz?"
                required
                rows={2}
              />
              {errors.text && (
                <span className="text-sm text-destructive">{errors.text}</span>
              )}
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Beschreibung/Hilfetext</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Optionale Beschreibung oder Hilfetext zur Frage"
                rows={2}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="type" className="required">Fragetyp</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={handleSelectChange('type')}
                  defaultValue={formData.type}
                >
                  <SelectTrigger id="question-type-select">
                    <SelectValue placeholder="Fragetyp auswählen">
                      {formData.type === 'yes_no' ? 'Ja/Nein' : 'Freitext'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Freitext</SelectItem>
                    <SelectItem value="yes_no">Ja/Nein</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="categoryId" className="required">Kategorie</Label>
                <Select 
                  value={formData.categoryId} 
                  onValueChange={handleSelectChange('categoryId')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Kategorie auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category._id} value={category._id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.categoryId && (
                  <span className="text-sm text-destructive">{errors.categoryId}</span>
                )}
              </div>
            </div>
            
            {/* Optionen für Ja/Nein-Fragen werden automatisch gesetzt */}
            {formData.type === 'radio' && (
              <div className="grid gap-2">
                <Label>Antwortmöglichkeiten</Label>
                <div className="text-sm text-muted-foreground">Für Ja/Nein-Fragen werden die Optionen automatisch gesetzt.</div>
              </div>
            )}
            
            {/* Die Erforderlich- und Aktiv-Regler wurden entfernt, da sie keine Funktion haben */}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Abbrechen</Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                  Wird gespeichert...
                </>
              ) : 'Speichern'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
