'use client';

import React, { useState } from 'react';
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

interface CreateQuestionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { 
    text: string; 
    type: string; 
    required: boolean; 
    categoryId: string;
  }) => void;
  categories: Category[];
}

export default function CreateQuestionDialog({ 
  isOpen, 
  onClose, 
  onSubmit, 
  categories 
}: CreateQuestionDialogProps) {
  const [formData, setFormData] = useState({
    text: '',
    type: QuestionType.YES_NO,
    required: true,
    categoryId: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Formular zurücksetzen beim Öffnen/Schließen
  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        text: '',
        type: QuestionType.YES_NO,
        required: true,
        categoryId: categories.length > 0 ? categories[0]._id : '',
      });
      setErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen, categories]);
  
  // Text-Formular-Änderungen verarbeiten
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Fehler zurücksetzen
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  // Select-Änderungen verarbeiten
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Fehler zurücksetzen
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  // Switch-Änderungen verarbeiten
  const handleSwitchChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      required: checked,
    }));
  };
  
  // Formular validieren
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.text.trim()) {
      newErrors.text = 'Der Fragetext ist erforderlich';
    }
    
    if (!formData.categoryId) {
      newErrors.categoryId = 'Eine Kategorie muss ausgewählt werden';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Formular absenden
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    // Daten an übergeordnete Komponente senden
    onSubmit({
      text: formData.text,
      type: formData.type,
      required: formData.required,
      categoryId: formData.categoryId,
    });
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Neue Frage erstellen</DialogTitle>
            <DialogDescription>
              Fügen Sie eine neue Frage zum Katalog hinzu
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="categoryId" className="text-right">
                Kategorie <span className="text-red-500">*</span>
              </Label>
              <div className="col-span-3">
                <Select 
                  value={formData.categoryId} 
                  onValueChange={(value) => handleSelectChange('categoryId', value)}
                >
                  <SelectTrigger className={errors.categoryId ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Kategorie auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category._id} value={category._id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.categoryId && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.categoryId}
                  </p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Fragetyp
              </Label>
              <div className="col-span-3">
                <Select 
                  value={formData.type} 
                  onValueChange={(value) => handleSelectChange('type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Typ auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={QuestionType.YES_NO}>Ja/Nein</SelectItem>
                    <SelectItem value={QuestionType.TEXT}>Text</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="text" className="text-right pt-2">
                Fragetext <span className="text-red-500">*</span>
              </Label>
              <div className="col-span-3">
                <Textarea
                  id="text"
                  name="text"
                  value={formData.text}
                  onChange={handleTextChange}
                  placeholder="z.B. Wie zufrieden sind Sie mit der Arbeitsatmosphäre?"
                  className={errors.text ? 'border-red-500' : ''}
                  rows={3}
                />
                {errors.text && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.text}
                  </p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="required" className="text-right">
                Pflichtfeld
              </Label>
              <div className="flex items-center space-x-2 col-span-3">
                <Switch
                  id="required"
                  checked={formData.required}
                  onCheckedChange={handleSwitchChange}
                />
                <Label htmlFor="required">
                  {formData.required ? 'Ja' : 'Nein'}
                </Label>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Abbrechen
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Wird erstellt...' : 'Frage erstellen'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
