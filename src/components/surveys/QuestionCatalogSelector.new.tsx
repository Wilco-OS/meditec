'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, CheckCircle } from 'lucide-react';
import { QuestionType } from '@/types/question';
import { useToast } from '@/components/ui/use-toast';

interface QuestionCatalogSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedQuestions: any[]) => void;
  preselectedQuestions?: string[]; // Optional: IDs von bereits ausgewählten Fragen
}

export default function QuestionCatalogSelector({ 
  isOpen, 
  onClose, 
  onConfirm,
  preselectedQuestions = []
}: QuestionCatalogSelectorProps) {
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [questions, setQuestions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>(preselectedQuestions);
  const [isLoading, setIsLoading] = useState(true);
  
  // Daten laden, wenn Dialog geöffnet wird
  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      fetchQuestions();
    }
  }, [isOpen]);
  
  // Kategorien laden
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/question-categories');
      if (!response.ok) {
        throw new Error('Fehler beim Laden der Kategorien');
      }
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Fehler beim Laden der Kategorien:', error);
      toast({
        title: 'Fehler',
        description: 'Kategorien konnten nicht geladen werden',
        variant: 'destructive',
      });
    }
  };
  
  // Fragen laden
  const fetchQuestions = async () => {
    try {
      setIsLoading(true);
      let url = '/api/question-catalog';
      
      // Filter hinzufügen, falls vorhanden
      const params = new URLSearchParams();
      if (categoryFilter && categoryFilter !== 'all_categories') {
        params.append('categoryId', categoryFilter);
      }
      if (typeFilter && typeFilter !== 'all_types') {
        params.append('type', typeFilter);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Fehler beim Laden der Fragen');
      }
      
      const data = await response.json();
      setQuestions(data);
    } catch (error) {
      console.error('Fehler beim Laden der Fragen:', error);
      toast({
        title: 'Fehler',
        description: 'Fragen konnten nicht geladen werden',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Filter-Funktion für die Suche
  const filteredQuestions = questions.filter(question => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = question.text.toLowerCase().includes(query);
    
    return matchesSearch;
  });
  
  // Gruppiere Fragen nach Kategorien für eine bessere Darstellung
  const groupedQuestions = filteredQuestions.reduce<Record<string, any[]>>((groups, question) => {
    const categoryId = question.categoryId;
    if (!groups[categoryId]) {
      groups[categoryId] = [];
    }
    groups[categoryId].push(question);
    return groups;
  }, {});
  
  // Formatieren des Fragetyps für die Anzeige
  const formatQuestionType = (type: string) => {
    switch (type) {
      case QuestionType.YES_NO:
        return 'Ja/Nein';
      case QuestionType.TEXT:
        return 'Text';
      case QuestionType.MULTIPLE_CHOICE:
        return 'Multiple Choice';
      case QuestionType.AGREE_DISAGREE:
        return 'Zustimmen/Ablehnen';
      case QuestionType.RATING:
        return 'Bewertung';
      default:
        return type;
    }
  };
  
  // Kategoriename abrufen
  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat._id === categoryId);
    return category ? category.name : 'Unbekannt';
  };
  
  // Checkbox-Status ändern
  const toggleQuestionSelection = (questionId: string) => {
    setSelectedQuestionIds(prev => {
      if (prev.includes(questionId)) {
        return prev.filter(id => id !== questionId);
      } else {
        return [...prev, questionId];
      }
    });
  };
  
  // Alle Fragen einer Kategorie auswählen oder abwählen
  const toggleCategoryQuestions = (categoryId: string) => {
    const questionsInCategory = questions.filter(q => q.categoryId === categoryId);
    const questionIds = questionsInCategory.map(q => q._id);
    
    // Prüfen, ob alle Fragen dieser Kategorie bereits ausgewählt sind
    const allSelected = questionIds.every(id => selectedQuestionIds.includes(id));
    
    if (allSelected) {
      // Wenn alle ausgewählt sind, entferne sie
      setSelectedQuestionIds(prev => prev.filter(id => !questionIds.includes(id)));
    } else {
      // Sonst füge alle hinzu, die noch nicht ausgewählt sind
      setSelectedQuestionIds(prev => {
        const newSelection = [...prev];
        questionIds.forEach(id => {
          if (!newSelection.includes(id)) {
            newSelection.push(id);
          }
        });
        return newSelection;
      });
    }
  };
  
  // Ausgewählte Fragen abrufen
  const getSelectedQuestions = () => {
    return questions.filter(question => selectedQuestionIds.includes(question._id));
  };
  
  // Bestätigen und Dialog schließen
  const handleConfirm = () => {
    const selectedQuestions = getSelectedQuestions();
    onConfirm(selectedQuestions);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Fragen aus dem Katalog auswählen</DialogTitle>
          <DialogDescription>
            Wählen Sie Fragen aus dem Fragenkatalog, die Sie zu Ihrem Block hinzufügen möchten
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center space-x-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Suchen..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Select value={categoryFilter} onValueChange={(value) => {
            setCategoryFilter(value);
            // Bei Änderung des Filters Fragen neu laden
            setTimeout(() => fetchQuestions(), 100);
          }}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Kategorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all_categories">Alle Kategorien</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category._id} value={category._id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={typeFilter} onValueChange={(value) => {
            setTypeFilter(value);
            // Bei Änderung des Filters Fragen neu laden
            setTimeout(() => fetchQuestions(), 100);
          }}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Fragetyp" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all_types">Alle Typen</SelectItem>
              <SelectItem value={QuestionType.YES_NO}>Ja/Nein</SelectItem>
              <SelectItem value={QuestionType.TEXT}>Text</SelectItem>
              <SelectItem value={QuestionType.MULTIPLE_CHOICE}>Multiple Choice</SelectItem>
              <SelectItem value={QuestionType.AGREE_DISAGREE}>Zustimmen/Ablehnen</SelectItem>
              <SelectItem value={QuestionType.RATING}>Bewertung</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex-1 overflow-hidden border rounded-md">
          <ScrollArea className="h-full">
            {isLoading ? (
              <div className="p-4 text-center">
                <p>Fragen werden geladen...</p>
              </div>
            ) : filteredQuestions.length === 0 ? (
              <div className="p-4 text-center">
                <p>Keine Fragen gefunden.</p>
              </div>
            ) : (
              <div className="p-1">
                {Object.entries(groupedQuestions).map(([categoryId, categoryQuestions]) => (
                  <div key={categoryId} className="mb-4">
                    <div className="flex items-center justify-between p-2 mb-2 bg-muted rounded-md">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={categoryQuestions.every(q => selectedQuestionIds.includes(q._id))}
                          onCheckedChange={() => toggleCategoryQuestions(categoryId)}
                          className="mr-1"
                        />
                        <h3 className="font-medium">{getCategoryName(categoryId)}</h3>
                        <span className="text-xs text-muted-foreground">({categoryQuestions.length} Fragen)</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => toggleCategoryQuestions(categoryId)}
                      >
                        {categoryQuestions.every(q => selectedQuestionIds.includes(q._id)) 
                          ? 'Alle abwählen' 
                          : 'Alle auswählen'}
                      </Button>
                    </div>
                    
                    <div className="ml-2">
                      {categoryQuestions.map((question) => (
                        <div
                          key={question._id}
                          className={`flex items-start p-3 mb-1 rounded-md ${
                            selectedQuestionIds.includes(question._id)
                              ? 'bg-primary/10'
                              : 'hover:bg-muted'
                          }`}
                          onClick={() => toggleQuestionSelection(question._id)}
                        >
                          <Checkbox
                            checked={selectedQuestionIds.includes(question._id)}
                            onCheckedChange={() => toggleQuestionSelection(question._id)}
                            className="mr-3 mt-1"
                          />
                          <div className="flex-1">
                            <div className="font-medium">{question.text}</div>
                            <div className="flex items-center mt-1 text-sm text-muted-foreground">
                              <span className="mr-4">Typ: {formatQuestionType(question.type)}</span>
                              <span>Pflichtfeld: {question.required ? 'Ja' : 'Nein'}</span>
                            </div>
                          </div>
                          {selectedQuestionIds.includes(question._id) && (
                            <CheckCircle className="h-5 w-5 text-primary" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
        
        <DialogFooter className="mt-4">
          <div className="flex-1 text-sm">
            {selectedQuestionIds.length} {selectedQuestionIds.length === 1 ? 'Frage' : 'Fragen'} ausgewählt
          </div>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Abbrechen
            </Button>
          </DialogClose>
          <Button 
            onClick={handleConfirm}
            disabled={selectedQuestionIds.length === 0}
          >
            Hinzufügen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
