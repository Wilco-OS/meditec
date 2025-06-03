'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Download, FileText, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import SurveyResultsStats from '@/components/surveys/SurveyResultsStats';
import SurveyCategoryChart from '@/components/surveys/charts/SurveyCategoryChart';
import SurveyCategoryDetail from '@/components/surveys/SurveyCategoryDetail';

// Beispieldaten für die Demo
const DEMO_DATA = {
  id: 'demo-survey-123',
  title: 'Mitarbeiterzufriedenheit 2025',
  company: {
    name: 'Mustermann GmbH',
    departments: ['Hauptverwaltung', 'Produktion', 'Vertrieb', 'Entwicklung'],
    location: 'München',
    size: 'Mittelgroß (50-249 Mitarbeiter)',
    industry: 'Medizintechnik'
  },
  participants: 87,
  completionRate: 78,
  completedDate: '10.05.2025',
  overallSatisfaction: 76,
  previousOverallSatisfaction: 72,
  totalQuestionsCount: 26, // Gesamt 26 Fragen in allen Kategorien
  benchmark: 70,
  categories: [
    {
      id: '1',
      name: 'Organisation',
      percentage: 78,
      lastYearPercentage: 74,
      questions: [
        {
          id: '101',
          text: 'Ist ein Arbeiten ohne häufige Störungen möglich (z.B. durch Vorgesetzte oder Mitarbeiter)?',
          yesPercentage: 68,
          noPercentage: 32,
          lastYearYesPercentage: 65,
        },
        {
          id: '102',
          text: 'Steht Ihnen ausreichend Zeit zur Erledigung Ihrer Arbeit zur Verfügung?',
          yesPercentage: 72,
          noPercentage: 28,
          lastYearYesPercentage: 70,
        },
        {
          id: '103',
          text: 'Haben Sie Einfluss auf die Zeiteinteilung Ihres Arbeitstages (z.B. Pausen)?',
          yesPercentage: 85,
          noPercentage: 15,
          lastYearYesPercentage: 80,
        },
        {
          id: '104',
          text: 'Wird im Fall von Überstunden zeitnah Freizeitausgleich gewährt?',
          yesPercentage: 75,
          noPercentage: 25,
          lastYearYesPercentage: 72,
        },
        {
          id: '105',
          text: 'Gibt es für Sie klare Entscheidungsstrukturen auf allen Ebenen?',
          yesPercentage: 68,
          noPercentage: 32,
          lastYearYesPercentage: 65,
        },
        {
          id: '106',
          text: 'Besteht die Möglichkeit zum fachlichen Austausch mit den unmittelbaren Vorgesetzten?',
          yesPercentage: 82,
          noPercentage: 18,
          lastYearYesPercentage: 78,
        },
        {
          id: '107',
          text: 'Besteht die Möglichkeit sich gemeinsam untereinander über die Arbeitsabläufe abzustimmen?',
          yesPercentage: 88,
          noPercentage: 12,
          lastYearYesPercentage: 85,
        },
        {
          id: '108',
          text: 'Erhalten Sie ausreichend Informationen zum eigenen Arbeitsbereich?',
          yesPercentage: 80,
          noPercentage: 20,
          lastYearYesPercentage: 76,
        },
        {
          id: '109',
          text: 'Erhalten Sie ausreichend Informationen zu anstehenden Maßnahmen oder zu künftigen Entwicklung des Unternehmens?',
          yesPercentage: 72,
          noPercentage: 28,
          lastYearYesPercentage: 70,
        },
      ],
    },
    {
      id: '2',
      name: 'Arbeitsumgebung',
      percentage: 81,
      lastYearPercentage: 78,
      questions: [
        {
          id: '201',
          text: 'Wird von Seiten Ihres Arbeitgebers genügend getan, um ungünstigen Arbeitsumgebungsbedingungen vorzubeugen?',
          yesPercentage: 78,
          noPercentage: 22,
          lastYearYesPercentage: 75,
        },
        {
          id: '202',
          text: 'Ist Ihre Aufgabe/Tätigkeit frei von erhöhter Verletzungs- und Erkrankungsgefahr?',
          yesPercentage: 85,
          noPercentage: 15,
          lastYearYesPercentage: 82,
        },
        {
          id: '203',
          text: 'Ist die erforderliche Arbeitsschutzkleidung (PSA) verfügbar und in Ordnung?',
          yesPercentage: 90,
          noPercentage: 10,
          lastYearYesPercentage: 85,
        },
        {
          id: '204',
          text: 'Die Zusammensetzung des Arbeitsteams ist überwiegend gut gewählt.',
          yesPercentage: 75,
          noPercentage: 25,
          lastYearYesPercentage: 73,
        },
      ],
    },
    {
      id: '3',
      name: 'Arbeitsaufgabe/Arbeitsinhalt',
      percentage: 77,
      lastYearPercentage: 74,
      questions: [
        {
          id: '301',
          text: 'Werden Sie bei den auszuf. Tätigkeiten von Ihrem Vorgesetzten mit einbezogen (Vorbereit., Orga, Prüfung, Kontrolle)?',
          yesPercentage: 76,
          noPercentage: 24,
          lastYearYesPercentage: 73,
        },
        {
          id: '302',
          text: 'Sind Ihre Aufgaben/Tätigkeiten abwechslungsreich und sind Sie mit Ihren Aufgaben/Tätigkeiten zufrieden?',
          yesPercentage: 80,
          noPercentage: 20,
          lastYearYesPercentage: 78,
        },
        {
          id: '303',
          text: 'Entspricht Ihre Qualifikation den Anforderungen, die durch die Aufgabe/Tätigkeit gestellt werden?',
          yesPercentage: 85,
          noPercentage: 15,
          lastYearYesPercentage: 83,
        },
        {
          id: '304',
          text: 'Ich habe Handlungsspielräume bei der Erledigung meiner Aufgabe/Tätigkeit.',
          yesPercentage: 78,
          noPercentage: 22,
          lastYearYesPercentage: 75,
        },
        {
          id: '305',
          text: 'Haben Sie Einfluss auf die Vorgehensweise bei der Arbeit (z.B. Wahl der Arbeitsmittel/-methoden)?',
          yesPercentage: 72,
          noPercentage: 28,
          lastYearYesPercentage: 69,
        },
        {
          id: '306',
          text: 'Ist Ihre Arbeit/Tätigkeit abwechslungsreich und können Sie kreativ mitgestalten?',
          yesPercentage: 68,
          noPercentage: 32,
          lastYearYesPercentage: 65,
        },
      ],
    },
    {
      id: '4',
      name: 'Soziales',
      percentage: 73,
      lastYearPercentage: 69,
      questions: [
        {
          id: '401',
          text: 'Sind die geselligen Angebote ausreichend, um soziale Beziehungen zu Kolleginnen und Kollegen zu pflegen?',
          yesPercentage: 65,
          noPercentage: 35,
          lastYearYesPercentage: 60,
        },
        {
          id: '402',
          text: 'Erhalten Sie ausreichend Rückmeldung (Anerkennung, Kritik, Beurteilung) über Ihre eigene Leistung?',
          yesPercentage: 70,
          noPercentage: 30,
          lastYearYesPercentage: 67,
        },
        {
          id: '403',
          text: 'In meinem Fachbereich herrscht eine positive Arbeitsatmosphäre.',
          yesPercentage: 78,
          noPercentage: 22,
          lastYearYesPercentage: 75,
        },
        {
          id: '404',
          text: 'Unterschwellige Konflikte werden in Ihrer Fachabteilung ausgesprochen und belasten dadurch nicht das Arbeitsklima.',
          yesPercentage: 68,
          noPercentage: 32,
          lastYearYesPercentage: 65,
        },
        {
          id: '405',
          text: 'Das Verhalten der Vorgesetzten und Kollegen untereinander ist stets höflich und respektvoll.',
          yesPercentage: 82,
          noPercentage: 18,
          lastYearYesPercentage: 77,
        },
        {
          id: '406',
          text: 'In Ihrer Freizeit können Sie entspannen und werden nicht von möglichen Arbeitsbelastungen beeinflusst.',
          yesPercentage: 75,
          noPercentage: 25,
          lastYearYesPercentage: 70,
        },
      ],
    },
  ],
};

// Die Anzahl der Kategorien und Fragen berechnen
const CATEGORIES_COUNT = DEMO_DATA.categories.length;
const QUESTIONS_BELOW_BENCHMARK = DEMO_DATA.categories
  .flatMap(c => c.questions)
  .filter(q => q.yesPercentage < DEMO_DATA.benchmark)
  .length;
const QUESTIONS_IMPROVED = DEMO_DATA.categories
  .flatMap(c => c.questions)
  .filter(q => q.yesPercentage > (q.lastYearYesPercentage || 0))
  .length;

export default function DemoPage() {
  const [showPreviousYear, setShowPreviousYear] = React.useState(false);
  
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <Button 
            variant="outline" 
            size="sm" 
            className="mb-4"
            asChild
          >
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück zum Dashboard
            </Link>
          </Button>
          
          <div className="flex items-center gap-2">
            <label htmlFor="showPreviousYear" className="text-sm font-medium">
              Vorjahresvergleich anzeigen
            </label>
            <Switch 
              id="showPreviousYear"
              checked={showPreviousYear}
              onCheckedChange={setShowPreviousYear}
            />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold mb-2">
          Umfrageergebnisse: {DEMO_DATA.title}
        </h1>
        
        {/* Unternehmensinformationen */}
        <Card className="mb-6 bg-muted/50 border-0">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h3 className="text-sm font-semibold mb-1">Unternehmen</h3>
                <p className="text-base">{DEMO_DATA.company.name}</p>
                <p className="text-sm text-muted-foreground">{DEMO_DATA.company.industry}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-1">Teilnehmer</h3>
                <p className="text-base">{DEMO_DATA.participants} Mitarbeiter</p>
                <p className="text-sm text-muted-foreground">Teilnahmequote: {DEMO_DATA.completionRate}%</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-1">Abteilungen</h3>
                <p className="text-sm">{DEMO_DATA.company.departments.join(', ')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6">
        {/* Statistik-Karten */}
        <SurveyResultsStats 
          overallSatisfaction={DEMO_DATA.overallSatisfaction}
          previousOverallSatisfaction={showPreviousYear ? DEMO_DATA.previousOverallSatisfaction : undefined}
          categoriesCount={CATEGORIES_COUNT}
          questionsBelowBenchmarkCount={QUESTIONS_BELOW_BENCHMARK}
          questionsImprovedCount={showPreviousYear ? QUESTIONS_IMPROVED : 0}
          benchmark={DEMO_DATA.benchmark}
          totalQuestionsCount={DEMO_DATA.totalQuestionsCount}
        />
        
        {/* Export-Buttons */}
        <div className="flex justify-end gap-2 mb-2">
          <Button variant="outline" size="sm" className="flex items-center">
            <Download className="mr-2 h-4 w-4" />
            CSV exportieren
          </Button>
          <Button variant="outline" size="sm" className="flex items-center">
            <FileText className="mr-2 h-4 w-4" />
            PDF exportieren
          </Button>
        </div>
        
        {/* Diagramm-Bereich */}
        <Card className="p-6 shadow-sm border-muted">
          <h2 className="text-xl font-semibold mb-4">Kategorie-Übersicht</h2>
          <div className="p-2">
            <SurveyCategoryChart 
              categories={DEMO_DATA.categories.map(cat => ({
                ...cat,
                lastYearPercentage: showPreviousYear ? cat.lastYearPercentage : undefined
              }))}
              benchmark={DEMO_DATA.benchmark}
            />
          </div>
        </Card>
        
        {/* Kategorie-Tabs */}
        <Card className="shadow-sm border-muted overflow-hidden">
          <Tabs defaultValue={DEMO_DATA.categories[0].id} className="w-full">
            <div className="px-4 pt-4">
              <h2 className="text-xl font-semibold mb-4">Detailansicht nach Kategorien</h2>
              <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full">
                {DEMO_DATA.categories.map((category) => (
                  <TabsTrigger key={category.id} value={category.id}>
                    {category.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            
            {DEMO_DATA.categories.map((category) => (
              <TabsContent key={category.id} value={category.id} className="p-4">
                <SurveyCategoryDetail
                  category={{
                    ...category,
                    lastYearPercentage: showPreviousYear ? category.lastYearPercentage : undefined,
                    questions: category.questions.map(q => ({
                      ...q,
                      lastYearYesPercentage: showPreviousYear ? q.lastYearYesPercentage : undefined
                    }))
                  }}
                  benchmark={DEMO_DATA.benchmark}
                />
              </TabsContent>
            ))}
          </Tabs>
        </Card>
        
        <div className="text-center text-sm text-muted-foreground mt-8 border-t pt-4">
          <p>Dies ist eine Demo-Ansicht der Umfrageauswertung mit Beispieldaten.</p>
          <p>© 2025 Meditec Pulsumfrage</p>
        </div>
      </div>
    </div>
  );
}
