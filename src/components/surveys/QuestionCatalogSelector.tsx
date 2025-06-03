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
  const [categoryFilter, setCategoryFilter] = useState<string>('all_categories');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [questions, setQuestions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>(preselectedQuestions);
  const [isLoading, setIsLoading] = useState(true);
  
  // Daten laden, wenn Dialog geöffnet wird
  useEffect(() => {
    if (isOpen) {
      // Zuerst Kategorien laden, damit sie beim Filtern verfügbar sind
      fetchCategories().then(() => {
        // Erst nachdem Kategorien geladen sind, Fragen laden
        fetchQuestions();
      });
    } else {
      // Wenn Dialog geschlossen wird, alle Zustände zurücksetzen
      setSearchQuery('');
      // Kategorien und Fragen behalten wir, damit sie bei erneutem Öffnen schneller da sind
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
      console.log('Geladene Kategorien:', data);
      setCategories(data);
    } catch (error) {
      console.error('Fehler beim Laden der Kategorien:', error);
      toast({
        title: 'Fehler',
        description: 'Kategorien konnten nicht geladen werden.',
        variant: 'destructive'
      });
      setCategories([]);
    }
  };

  // Debug-Funktion, um zu überprüfen, ob eine Kategorie in der Liste der Kategorien existiert
  const debugCategory = (categoryId: string) => {
    console.log(`Suche Kategorie mit ID: ${categoryId}`);
    const match = categories.find(cat => 
      cat._id === categoryId || 
      cat.id === categoryId);
    console.log('Gefunden:', match);
    return match;
  };

  // Detaillierte Debug-Information ausgeben
  const logDebugInfo = (message: string, data: any) => {
    console.log('%c' + message, 'background: #333; color: #bada55; padding: 2px;', data);
  };

  // Fragen laden
  const fetchQuestions = async () => {
    try {
      setIsLoading(true);
      let url = '/api/question-catalog';
      
      // WICHTIG: Ausgewählte Kategorie protokollieren
      logDebugInfo('Aktuelle Kategorie-Filter', categoryFilter);
      
      // WICHTIG: Alle verfügbaren Kategorien protokollieren
      logDebugInfo('Alle Kategorien', categories);
      
      // Die aktuelle ausgewählte Kategorie finden
      let selectedCategory = null;
      if (categoryFilter && categoryFilter !== 'all_categories') {
        selectedCategory = categories.find(cat => 
          cat._id === categoryFilter || cat.id === categoryFilter
        );
        logDebugInfo('Gefundene Kategorie für Filter', selectedCategory);
      }
      
      // Filter hinzufügen
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
      
      logDebugInfo('API-Aufruf URL', url);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Fehler beim Laden der Fragen');
      }
      
      const data = await response.json();
      logDebugInfo('Rohdaten von API', data.slice(0, 2)); // Nur die ersten zwei Fragen anzeigen
      
      // IMMER alle Fragen mit Kategorieinformationen anreichern
      const processedData = data.map(q => {
        // Kategorie ermitteln - DIREKTER ANSATZ
        let categoryName = 'Unbekannt';
        let categoryObject = null;
        
        // 1. Wenn eine Kategorie ausgewählt ist, diese verwenden
        if (categoryFilter && categoryFilter !== 'all_categories' && selectedCategory) {
          categoryName = selectedCategory.name;
          categoryObject = selectedCategory;
        }
        // 2. Sonst, aus der Frage selbst ermitteln
        else if (q.categoryId) {
          if (typeof q.categoryId === 'string') {
            // Nach ID in den Kategorien suchen
            const category = categories.find(c => c._id === q.categoryId || c.id === q.categoryId);
            if (category) {
              categoryName = category.name;
              categoryObject = category;
            }
          } else if (typeof q.categoryId === 'object' && q.categoryId !== null) {
            // Das Objekt selbst hat vielleicht den Namen
            if (q.categoryId.name) {
              categoryName = q.categoryId.name;
              categoryObject = q.categoryId;
            } else {
              // Nach ID in den Kategorien suchen
              const category = categories.find(c => 
                c._id === q.categoryId._id || c.id === q.categoryId._id
              );
              if (category) {
                categoryName = category.name;
                categoryObject = category;
              }
            }
          }
        }
        
        return {
          ...q,
          // Essentielle Felder für die Anzeige
          categoryName, // Der tatsächliche Name der Kategorie
          categoryObject, // Das vollständige Kategorieobjekt (falls vorhanden)
          displayCategoryId: categoryFilter !== 'all_categories' ? categoryFilter : q.categoryId, // Für die Gruppierung
          forcedCategoryFilter: categoryFilter !== 'all_categories' // Zeigt an, ob ein Filter aktiv ist
        };
      });
      
      // Die ersten beiden verarbeiteten Fragen anzeigen
      if (processedData.length > 0) {
        logDebugInfo('Erste verarbeitete Frage', processedData[0]);
      }
      
      setQuestions(processedData);
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
  
  // Gruppiere Fragen nach Kategorien - komplett überarbeitete Version
  const groupedQuestions = filteredQuestions.reduce<Record<string, any[]>>((groups, question) => {
    // WICHTIG: Wir verwenden eine spezielle ID für die Gruppierung
    // Dies ist entweder die erzwungene Kategorie aus dem Filter oder die originale categoryId
    let groupKey;
    
    if (question.forcedCategoryFilter && categoryFilter !== 'all_categories') {
      // Wenn ein Kategoriefilter aktiv ist, gruppieren wir alles unter dieser Kategorie
      groupKey = 'filtered-' + categoryFilter;
    } else {
      // Ansonsten verwenden wir die originale categoryId
      if (typeof question.categoryId === 'string') {
        groupKey = question.categoryId;
      } else if (typeof question.categoryId === 'object' && question.categoryId !== null) {
        groupKey = question.categoryId._id || String(question.categoryId);
      } else {
        groupKey = 'unknown';
      }
    }
    
    // Sicherstellen, dass der Schlüssel ein String ist
    const safeKey = String(groupKey);
    
    if (!groups[safeKey]) {
      groups[safeKey] = [];
    }
    groups[safeKey].push(question);
    return groups;
  }, {});
  
  // Debug-Ausgabe für die gruppierten Fragen
  logDebugInfo('Gruppierte Fragen Schlüssel', Object.keys(groupedQuestions));
  
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
  
  // Kategoriename abrufen - verbesserte Version
  const getCategoryName = (categoryId: string) => {
    // Wenn eine Kategorie-ID vorhanden ist, versuchen wir, den Namen zu finden
    if (categoryId) {
      // In der Liste der geladenen Kategorien suchen
      const category = categories.find(cat => 
        cat._id === categoryId || 
        cat.id === categoryId || 
        (typeof cat._id === 'object' && cat._id.toString() === categoryId)
      );
      
      if (category && category.name) {
        return category.name;
      }
      
      // Wenn nicht gefunden, sauberen Namen zurückgeben
      if (categoryId.length > 10) {
        return 'Kategorie ' + categoryId.substring(0, 8);
      }
      return 'Kategorie ' + categoryId;
    }
    
    return 'Allgemein';
  };
  
  // Checkbox-Status ändern
  const toggleQuestionSelection = (questionId: string, checked: boolean) => {
    console.log('Toggle einzelne Frage:', questionId, checked);
    if (checked) {
      setSelectedQuestionIds(prev => [...prev, questionId]);
    } else {
      setSelectedQuestionIds(prev => prev.filter(id => id !== questionId));
    }
  };
  
  // Alle Fragen einer Kategorie umschalten
  const toggleCategoryQuestions = (categoryId: string) => {
    console.log('Toggle komplette Kategorie:', categoryId);
    const categoryQuestions = groupedQuestions[categoryId] || [];
    const allSelected = categoryQuestions.every(q => selectedQuestionIds.includes(q._id));
    
    if (allSelected) {
      // Alle abwählen
      setSelectedQuestionIds(prev => 
        prev.filter(id => !categoryQuestions.some(q => q._id === id))
      );
    } else {
      // Alle auswählen
      const newIds = categoryQuestions
        .filter(q => !selectedQuestionIds.includes(q._id))
        .map(q => q._id);
      setSelectedQuestionIds(prev => [...prev, ...newIds]);
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
          
          <Select
            value={categoryFilter} 
            onValueChange={(value) => {
              logDebugInfo('Kategorie im Dropdown gewählt', value);
              
              // Die ausgewählte Kategorie explizit anzeigen
              const selected = categories.find(cat => 
                cat._id === value || cat.id === value
              );
              logDebugInfo('Ausgewählte Kategorie Objekt', selected);
              
              setCategoryFilter(value);
              // Nach dem Ändern der Kategorie sofort Fragen neu laden
              fetchQuestions();
            }}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Alle Kategorien" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem key="all_categories" value="all_categories">Alle Kategorien</SelectItem>
              {categories && categories.length > 0 ? (
                categories.map(category => {
                  // Sicherstellen, dass wir eindeutige Werte haben
                  const categoryId = category._id || category.id;
                  const categoryName = category.name || 'Kategorie';
                  
                  logDebugInfo(`Rendering Kategorie ${categoryName}`, {
                    id: categoryId,
                    name: categoryName,
                    fullObject: category
                  });
                  
                  return (
                    <SelectItem 
                      key={categoryId || Math.random().toString()} 
                      value={categoryId}>
                      {categoryName}
                    </SelectItem>
                  );
                })
              ) : (
                <SelectItem key="no_categories" value="no_categories" disabled>Keine Kategorien verfügbar</SelectItem>
              )}
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
              <SelectItem key="all_types" value="all_types">Alle Typen</SelectItem>
              <SelectItem key="yes_no" value={QuestionType.YES_NO}>Ja/Nein</SelectItem>
              <SelectItem key="text" value={QuestionType.TEXT}>Text</SelectItem>
              <SelectItem key="multiple_choice" value={QuestionType.MULTIPLE_CHOICE}>Multiple Choice</SelectItem>
              <SelectItem key="agree_disagree" value={QuestionType.AGREE_DISAGREE}>Zustimmen/Ablehnen</SelectItem>
              <SelectItem key="rating" value={QuestionType.RATING}>Bewertung</SelectItem>
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
                          onCheckedChange={(checked) => {
                            console.log('Kategorie-Checkbox geklickt:', categoryId, checked);
                            toggleCategoryQuestions(categoryId);
                          }}
                          className="mr-1"
                          // Wichtig: Klickevent stoppen, damit es nicht zum Container bubbled
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        />
                        <h3 className="font-medium">
                          {/* DIREKT den Kategorienamen aus der ersten Frage nehmen */}
                          {(() => {
                            // Bei gefilterten Fragen den Kategorienamen aus dem Filter nehmen
                            if (categoryId.startsWith('filtered-') && categoryFilter !== 'all_categories') {
                              const filterCategory = categories.find(c => c._id === categoryFilter || c.id === categoryFilter);
                              return filterCategory?.name || 'Gefilterte Kategorie';
                            }
                            
                            // Sonst den explizit berechneten categoryName aus der Frage verwenden
                            return categoryQuestions[0]?.categoryName || 'Kategorie';
                          })()}
                        </h3>
                        <span className="text-xs text-muted-foreground">({categoryQuestions.length} Fragen)</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation(); // Verhindert Bubbling
                          toggleCategoryQuestions(categoryId);
                        }}
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
                          onClick={() => toggleQuestionSelection(question._id, !selectedQuestionIds.includes(question._id))}
                        >
                          <Checkbox
                            checked={selectedQuestionIds.includes(question._id)}
                            onCheckedChange={(checked) => toggleQuestionSelection(question._id, !!checked)}
                            className="mr-1"
                            id={`question-${question._id}`}
                            // Wichtig: Klickevent stoppen, damit es nicht zum Container bubbled
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
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
