'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Edit, 
  Trash2, 
  Search, 
  RefreshCw, 
  MessageSquare, 
  CheckSquare, 
  Filter 
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
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
  createdAt: string;
}

interface QuestionListProps {
  questions: Question[];
  categories: Category[];
  isLoading: boolean;
  onRefresh: () => void;
  onEdit?: (question: Question) => void;
  onDelete?: (question: Question) => void;
}

export default function QuestionList({ 
  questions, 
  categories, 
  isLoading, 
  onRefresh, 
  onEdit, 
  onDelete 
}: QuestionListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');

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

  // Filter-Funktion für die Suche und Kategorien
  const filteredQuestions = questions.filter(question => {
    // Textsuche
    const matchesSearch = searchQuery
      ? question.text.toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    // Kategorie
    const matchesCategory = categoryFilter && categoryFilter !== 'all_categories'
      ? (typeof question.categoryId === 'string')
        ? question.categoryId === categoryFilter
        : question.categoryId?._id === categoryFilter
      : true;

    // Typ
    const matchesType = typeFilter && typeFilter !== 'all_types'
      ? question.type === typeFilter
      : true;

    return matchesSearch && matchesCategory && matchesType;
  });

  // Ermitteln des Kategorienamens
  const getCategoryName = (question: Question) => {
    if (typeof question.categoryId === 'object' && question.categoryId.name) {
      return question.categoryId.name;
    }
    
    // Fallback: Kategorie-ID in Kategoriename auflösen
    if (typeof question.categoryId === 'string') {
      const category = categories.find(c => c._id === question.categoryId);
      return category ? category.name : 'Unbekannt';
    }
    
    return 'Unbekannt';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Fragen im Katalog</CardTitle>
        <div className="flex items-center space-x-2">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Suchen..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
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
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Fragetyp" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all_types">Alle Typen</SelectItem>
              <SelectItem value={QuestionType.YES_NO}>Ja/Nein</SelectItem>
              <SelectItem value={QuestionType.TEXT}>Text</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={onRefresh}
            title="Aktualisieren"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="text-center py-8">
            <h3 className="mt-2 text-lg font-medium">Keine Fragen gefunden</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery || categoryFilter || typeFilter
                ? 'Keine Fragen entsprechen Ihren Filterkriterien' 
                : 'Es wurden noch keine Fragen erstellt'}
            </p>
            {(searchQuery || categoryFilter || typeFilter) ? (
              <Button 
                variant="outline" 
                className="mt-4" 
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('');
                  setTypeFilter('');
                }}
              >
                Filter zurücksetzen
              </Button>
            ) : null}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Text</TableHead>
                <TableHead>Kategorie</TableHead>
                <TableHead>Typ</TableHead>
                <TableHead>Pflichtfeld</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQuestions.map((question) => (
                <TableRow key={question._id}>
                  <TableCell className="font-medium">{question.text}</TableCell>
                  <TableCell>{getCategoryName(question)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {question.type === QuestionType.YES_NO ? (
                        <CheckSquare className="mr-1 h-3 w-3" />
                      ) : (
                        <MessageSquare className="mr-1 h-3 w-3" />
                      )}
                      {formatQuestionType(question.type)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {question.required ? 'Ja' : 'Nein'}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={question.isActive ? 'default' : 'secondary'}
                    >
                      {question.isActive ? 'Aktiv' : 'Inaktiv'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {onEdit && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => onEdit(question)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => onDelete(question)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
