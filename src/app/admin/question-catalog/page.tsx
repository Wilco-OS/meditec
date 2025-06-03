'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import CategoryList from '@/components/question-catalog/CategoryList';
import QuestionList from '@/components/question-catalog/QuestionList';
import CreateCategoryDialog from '@/components/question-catalog/CreateCategoryDialog';
import CreateQuestionDialog from '@/components/question-catalog/CreateQuestionDialog';
import EditCategoryDialog from '@/components/question-catalog/EditCategoryDialog';
import EditQuestionDialog from '@/components/question-catalog/EditQuestionDialog';
import { useToast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function QuestionCatalogPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('categories');
  const [categories, setCategories] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Dialog-Status
  const [isCreateCategoryDialogOpen, setIsCreateCategoryDialogOpen] = useState(false);
  const [isCreateQuestionDialogOpen, setIsCreateQuestionDialogOpen] = useState(false);
  const [isEditCategoryDialogOpen, setIsEditCategoryDialogOpen] = useState(false);
  const [isEditQuestionDialogOpen, setIsEditQuestionDialogOpen] = useState(false);
  
  // Löschdialog-Status
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteItemType, setDeleteItemType] = useState<'category' | 'question' | null>(null);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  
  // Ausgewählte Elemente zum Bearbeiten
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);
  
  // Prüfen, ob Benutzer angemeldet und Meditec-Admin ist
  useEffect(() => {
    if (status === 'authenticated') {
      if (session.user.role !== 'meditec_admin') {
        toast({
          title: 'Zugriff verweigert',
          description: 'Nur Meditec-Administratoren können auf diese Seite zugreifen',
          variant: 'destructive',
        });
        router.push('/admin/dashboard');
      }
    } else if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, session, router, toast]);
  
  // Daten laden
  useEffect(() => {
    if (status === 'authenticated' && session.user.role === 'meditec_admin') {
      fetchCategories();
      fetchQuestions();
    }
  }, [status, session]);
  
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
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchQuestions = async () => {
    try {
      const response = await fetch('/api/question-catalog');
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
    }
  };
  
  // Handler für die Erstellung neuer Kategorien
  const handleCreateCategory = async (categoryData: { name: string; description?: string }) => {
    try {
      const response = await fetch('/api/question-categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(categoryData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fehler beim Erstellen der Kategorie');
      }
      
      await response.json();
      
      toast({
        title: 'Erfolg',
        description: 'Kategorie wurde erfolgreich erstellt',
      });
      
      setIsCreateCategoryDialogOpen(false);
      fetchCategories(); // Aktualisieren der Kategorieliste
    } catch (error: any) {
      console.error('Fehler beim Erstellen der Kategorie:', error);
      toast({
        title: 'Fehler',
        description: error.message || 'Kategorie konnte nicht erstellt werden',
        variant: 'destructive',
      });
    }
  };
  
  // Handler für die Bearbeitung von Kategorien
  const handleEditCategory = async (id: string, categoryData: { name: string; description?: string; isActive: boolean }) => {
    try {
      const response = await fetch(`/api/question-categories/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(categoryData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fehler beim Aktualisieren der Kategorie');
      }
      
      await response.json();
      
      toast({
        title: 'Erfolg',
        description: 'Kategorie wurde erfolgreich aktualisiert',
      });
      
      setIsEditCategoryDialogOpen(false);
      setSelectedCategory(null);
      fetchCategories(); // Aktualisieren der Kategorieliste
    } catch (error: any) {
      console.error('Fehler beim Aktualisieren der Kategorie:', error);
      toast({
        title: 'Fehler',
        description: error.message || 'Kategorie konnte nicht aktualisiert werden',
        variant: 'destructive',
      });
    }
  };
  
  // Handler für das Löschen von Kategorien
  const handleDeleteCategory = async (id: string) => {
    try {
      const response = await fetch(`/api/question-categories/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fehler beim Löschen der Kategorie');
      }
      
      toast({
        title: 'Erfolg',
        description: 'Kategorie wurde erfolgreich gelöscht',
      });
      
      fetchCategories(); // Aktualisieren der Kategorieliste
    } catch (error: any) {
      console.error('Fehler beim Löschen der Kategorie:', error);
      toast({
        title: 'Fehler',
        description: error.message || 'Kategorie konnte nicht gelöscht werden',
        variant: 'destructive',
      });
    }
  };

  // Handler für die Erstellung neuer Fragen
  const handleCreateQuestion = async (questionData: any) => {
    try {
      const response = await fetch('/api/question-catalog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(questionData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fehler beim Erstellen der Frage');
      }
      
      await response.json();
      
      toast({
        title: 'Erfolg',
        description: 'Frage wurde erfolgreich erstellt',
      });
      
      setIsCreateQuestionDialogOpen(false);
      fetchQuestions(); // Aktualisieren der Fragenliste
    } catch (error: any) {
      console.error('Fehler beim Erstellen der Frage:', error);
      toast({
        title: 'Fehler',
        description: error.message || 'Frage konnte nicht erstellt werden',
        variant: 'destructive',
      });
    }
  };
  
  // Handler für die Bearbeitung von Fragen
  const handleEditQuestion = async (id: string, questionData: any) => {
    try {
      const response = await fetch(`/api/question-catalog/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(questionData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fehler beim Aktualisieren der Frage');
      }
      
      await response.json();
      
      toast({
        title: 'Erfolg',
        description: 'Frage wurde erfolgreich aktualisiert',
      });
      
      setIsEditQuestionDialogOpen(false);
      setSelectedQuestion(null);
      fetchQuestions(); // Aktualisieren der Fragenliste
    } catch (error: any) {
      console.error('Fehler beim Aktualisieren der Frage:', error);
      toast({
        title: 'Fehler',
        description: error.message || 'Frage konnte nicht aktualisiert werden',
        variant: 'destructive',
      });
    }
  };
  
  // Handler für das Löschen von Fragen
  const handleDeleteQuestion = async (id: string) => {
    try {
      const response = await fetch(`/api/question-catalog/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fehler beim Löschen der Frage');
      }
      
      toast({
        title: 'Erfolg',
        description: 'Frage wurde erfolgreich gelöscht',
      });
      
      fetchQuestions(); // Aktualisieren der Fragenliste
    } catch (error: any) {
      console.error('Fehler beim Löschen der Frage:', error);
      toast({
        title: 'Fehler',
        description: error.message || 'Frage konnte nicht gelöscht werden',
        variant: 'destructive',
      });
    }
  };
  
  // Handler zum Öffnen des Bearbeitungsdialogs für Kategorien
  const openEditCategoryDialog = (category: any) => {
    setSelectedCategory(category);
    setIsEditCategoryDialogOpen(true);
  };
  
  // Handler zum Öffnen des Bearbeitungsdialogs für Fragen
  const openEditQuestionDialog = (question: any) => {
    setSelectedQuestion(question);
    setIsEditQuestionDialogOpen(true);
  };
  
  // Handler zum Öffnen des Löschdialogs
  const openDeleteDialog = (type: 'category' | 'question', item: any) => {
    setDeleteItemType(type);
    setItemToDelete(item);
    setIsDeleteDialogOpen(true);
  };
  
  // Handler für das Bestätigen des Löschens
  const confirmDelete = () => {
    if (deleteItemType === 'category' && itemToDelete) {
      handleDeleteCategory(itemToDelete._id);
    } else if (deleteItemType === 'question' && itemToDelete) {
      handleDeleteQuestion(itemToDelete._id);
    }
    
    setIsDeleteDialogOpen(false);
    setItemToDelete(null);
    setDeleteItemType(null);
  };
  
  return (
    <MainLayout>
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Fragenkatalog-Verwaltung</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="categories">Kategorien</TabsTrigger>
              <TabsTrigger value="questions">Fragen</TabsTrigger>
            </TabsList>
            
            {activeTab === 'categories' ? (
              <Button onClick={() => setIsCreateCategoryDialogOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Neue Kategorie
              </Button>
            ) : (
              <Button onClick={() => setIsCreateQuestionDialogOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Neue Frage
              </Button>
            )}
          </div>
          
          <TabsContent value="categories">
            <CategoryList 
              categories={categories} 
              isLoading={isLoading} 
              onRefresh={fetchCategories}
              onEdit={openEditCategoryDialog}
              onDelete={(category) => openDeleteDialog('category', category)}
            />
          </TabsContent>
          
          <TabsContent value="questions">
            <QuestionList 
              questions={questions} 
              categories={categories}
              isLoading={isLoading} 
              onRefresh={fetchQuestions}
              onEdit={openEditQuestionDialog}
              onDelete={(question) => openDeleteDialog('question', question)}
            />
          </TabsContent>
        </Tabs>
        
        {/* Dialoge für das Erstellen */}
        <CreateCategoryDialog 
          isOpen={isCreateCategoryDialogOpen}
          onClose={() => setIsCreateCategoryDialogOpen(false)}
          onSubmit={handleCreateCategory}
        />
        
        <CreateQuestionDialog 
          isOpen={isCreateQuestionDialogOpen}
          onClose={() => setIsCreateQuestionDialogOpen(false)}
          onSubmit={handleCreateQuestion}
          categories={categories}
        />
        
        {/* Dialoge für das Bearbeiten */}
        <EditCategoryDialog
          isOpen={isEditCategoryDialogOpen}
          onClose={() => {
            setIsEditCategoryDialogOpen(false);
            setSelectedCategory(null);
          }}
          onSubmit={handleEditCategory}
          category={selectedCategory}
        />
        
        <EditQuestionDialog
          isOpen={isEditQuestionDialogOpen}
          onClose={() => {
            setIsEditQuestionDialogOpen(false);
            setSelectedQuestion(null);
          }}
          onSubmit={handleEditQuestion}
          question={selectedQuestion}
          categories={categories}
        />
        
        {/* Dialog für das Löschen */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {deleteItemType === 'category' ? 'Kategorie löschen' : 'Frage löschen'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {deleteItemType === 'category' 
                  ? 'Möchten Sie diese Kategorie wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.'
                  : 'Möchten Sie diese Frage wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Löschen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}
