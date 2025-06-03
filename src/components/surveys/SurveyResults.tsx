'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, FileText, ChevronDown, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import SurveyResultsStats from './SurveyResultsStats';
import SurveyCategoryChart from './charts/SurveyCategoryChart';
import SurveyCategoryDetail from './SurveyCategoryDetail';
import SurveyResultsSkeleton from './SurveyResultsSkeleton';

// Typdefinitionen
interface Question {
  id: string;
  text: string;
  yesPercentage: number;
  noPercentage: number;
  lastYearYesPercentage?: number;
}

interface Category {
  id: string;
  name: string;
  percentage: number;
  lastYearPercentage?: number;
  questions: Question[];
}

interface SurveyData {
  id: string;
  title: string;
  participants: number;
  completionRate: number;
  completedDate: string;
  overallSatisfaction: number;
  previousOverallSatisfaction?: number;
  categories: Category[];
}

interface SurveyResultsProps {
  surveyId: string;
}

const SurveyResults: React.FC<SurveyResultsProps> = ({ surveyId }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [surveyData, setSurveyData] = useState<SurveyData | null>(null);
  
  // Benchmark für Zufriedenheitswerte
  const BENCHMARK = 60;

  // Daten abrufen
  useEffect(() => {
    const fetchSurveyResults = async () => {
      try {
        setIsLoading(true);
        
        // API-Aufruf zum Abrufen der Umfrageergebnisse
        const response = await fetch(`/api/surveys/${surveyId}/results`);
        
        if (!response.ok) {
          throw new Error(`Fehler beim Abrufen der Daten: ${response.status}`);
        }
        
        const data = await response.json();
        setSurveyData(data);
      } catch (err) {
        console.error('Fehler beim Laden der Umfrageergebnisse:', err);
        setError(err instanceof Error ? err.message : 'Ein unbekannter Fehler ist aufgetreten');
        
        // Für Entwicklungszwecke: Mockdaten laden, wenn die API fehlschlägt
        // In der Produktion sollten Sie diesen Teil entfernen
        if (process.env.NODE_ENV === 'development') {
          loadMockData();
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSurveyResults();
  }, [surveyId]);

  // Mockdaten für Entwicklungszwecke laden
  const loadMockData = () => {
    const mockData: SurveyData = {
      id: surveyId,
      title: "Mitarbeiterzufriedenheit Q2 2023",
      participants: 120,
      completionRate: 87,
      completedDate: "30.04.2023",
      overallSatisfaction: 78,
      previousOverallSatisfaction: 73,
      categories: [
        {
          id: "cat1",
          name: "Arbeitsumgebung",
          percentage: 72,
          lastYearPercentage: 67,
          questions: [
            {
              id: "q1",
              text: "Sind Sie mit Ihrer aktuellen Arbeitsplatzausstattung zufrieden?",
              yesPercentage: 72,
              noPercentage: 28,
              lastYearYesPercentage: 67
            },
            {
              id: "q2",
              text: "Fühlen Sie sich an Ihrem Arbeitsplatz wohl?",
              yesPercentage: 80,
              noPercentage: 20,
              lastYearYesPercentage: 75
            },
            {
              id: "q3",
              text: "Ist die Lautstärke im Büro angemessen für konzentriertes Arbeiten?",
              yesPercentage: 55,
              noPercentage: 45,
              lastYearYesPercentage: 60
            }
          ]
        },
        {
          id: "cat2",
          name: "Arbeitsklima",
          percentage: 83,
          lastYearPercentage: 80,
          questions: [
            {
              id: "q5",
              text: "Herrscht in Ihrem Team ein positives Arbeitsklima?",
              yesPercentage: 85,
              noPercentage: 15,
              lastYearYesPercentage: 82
            },
            {
              id: "q6",
              text: "Fühlen Sie sich von Ihren Kollegen respektiert?",
              yesPercentage: 88,
              noPercentage: 12,
              lastYearYesPercentage: 85
            }
          ]
        }
      ]
    };
    
    setSurveyData(mockData);
  };
  
  // Hilfs-Berechnungen
  const calculateMetrics = () => {
    if (!surveyData) return null;
    
    const allQuestions = surveyData.categories.flatMap(cat => cat.questions);
    const questionsBelowBenchmark = allQuestions.filter(q => q.yesPercentage < BENCHMARK);
    const questionsWithImprovement = allQuestions.filter(
      q => q.lastYearYesPercentage !== undefined && q.yesPercentage > q.lastYearYesPercentage
    );
    
    return {
      allQuestions,
      questionsBelowBenchmark,
      questionsWithImprovement
    };
  };
  
  // CSV-Export Funktion
  const handleCsvExport = () => {
    if (!surveyData) return;
    
    const headers = ['Kategorie', 'Frage', 'Ja (%)', 'Nein (%)', 'Vorjahr Ja (%)'];
    
    const rows = surveyData.categories.flatMap(category => 
      category.questions.map(question => [
        category.name,
        question.text,
        question.yesPercentage,
        question.noPercentage,
        question.lastYearYesPercentage || ''
      ])
    );
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `umfrage-ergebnisse-${surveyId}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // PDF-Export Funktion (hier nur als Platzhalter)
  const handlePdfExport = () => {
    alert('PDF-Export wird generiert...');
    // In einer realen Anwendung würden Sie hier PDF.js oder eine ähnliche Bibliothek verwenden
  };
  
  if (isLoading) {
    return <SurveyResultsSkeleton />;
  }
  
  if (error || !surveyData) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-10">
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Fehler</AlertTitle>
            <AlertDescription>
              {error || 'Keine Daten verfügbar. Bitte versuchen Sie es später erneut.'}
            </AlertDescription>
          </Alert>
          <Button onClick={() => window.location.reload()}>Erneut versuchen</Button>
        </CardContent>
      </Card>
    );
  }

  const metrics = calculateMetrics();
  if (!metrics) return null;
  
  const { allQuestions, questionsBelowBenchmark, questionsWithImprovement } = metrics;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">{surveyData.title}</h1>
          <div className="text-gray-500 flex flex-col md:flex-row md:gap-4">
            <span>{surveyData.participants} Teilnehmer</span>
            <span>{surveyData.completionRate}% Abschlussquote</span>
            <span>Abgeschlossen am {surveyData.completedDate}</span>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline" className="flex items-center gap-2" onClick={handleCsvExport}>
            <Download className="h-4 w-4" />
            CSV-Export
          </Button>
          <Button variant="outline" className="flex items-center gap-2" onClick={handlePdfExport}>
            <FileText className="h-4 w-4" />
            PDF-Bericht
          </Button>
        </div>
      </div>
      
      <SurveyResultsStats 
        overallSatisfaction={surveyData.overallSatisfaction}
        previousOverallSatisfaction={surveyData.previousOverallSatisfaction}
        categoriesCount={surveyData.categories.length}
        questionsBelowBenchmarkCount={questionsBelowBenchmark.length}
        questionsImprovedCount={questionsWithImprovement.length}
        benchmark={BENCHMARK}
        totalQuestionsCount={allQuestions.length}
      />
      
      <SurveyCategoryChart 
        categories={surveyData.categories} 
        benchmark={BENCHMARK}
      />
      
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Detailanalyse nach Kategorien</h2>
        
        <Tabs defaultValue={surveyData.categories[0]?.id}>
          <TabsList className="mb-4">
            {surveyData.categories.map(category => (
              <TabsTrigger key={category.id} value={category.id}>
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {surveyData.categories.map(category => (
            <TabsContent key={category.id} value={category.id}>
              <SurveyCategoryDetail category={category} benchmark={BENCHMARK} />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

export default SurveyResults;
