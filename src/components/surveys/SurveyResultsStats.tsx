'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, CheckCircle2, XCircle, PieChart, Target, ArrowUpCircle } from 'lucide-react';

interface SurveyResultsStatsProps {
  overallSatisfaction: number;
  previousOverallSatisfaction?: number;
  categoriesCount: number;
  questionsBelowBenchmarkCount: number;
  questionsImprovedCount: number;
  benchmark: number;
  totalQuestionsCount: number;
}

const SurveyResultsStats: React.FC<SurveyResultsStatsProps> = ({
  overallSatisfaction,
  previousOverallSatisfaction,
  categoriesCount,
  questionsBelowBenchmarkCount,
  questionsImprovedCount,
  benchmark,
  totalQuestionsCount,
}) => {
  const satisfactionDelta = previousOverallSatisfaction 
    ? overallSatisfaction - previousOverallSatisfaction 
    : null;
  
  const isTrendPositive = satisfactionDelta === null ? true : satisfactionDelta >= 0;
  
  const getSatisfactionColor = (value: number) => {
    if (value >= benchmark + 15) return 'bg-emerald-500'; // Sehr gut
    if (value >= benchmark) return 'bg-emerald-400'; // Gut
    if (value >= benchmark - 10) return 'bg-amber-400'; // Mittel
    return 'bg-rose-500'; // Schlecht
  };
  
  const getSatisfactionBackground = (value: number) => {
    if (value >= benchmark + 15) return 'bg-emerald-50'; // Sehr gut
    if (value >= benchmark) return 'bg-emerald-50'; // Gut
    if (value >= benchmark - 10) return 'bg-amber-50'; // Mittel
    return 'bg-rose-50'; // Schlecht
  };
  
  const getSatisfactionText = (value: number) => {
    if (value >= benchmark + 15) return 'Sehr gut';
    if (value >= benchmark) return 'Gut';
    if (value >= benchmark - 10) return 'Verbesserungsfähig';
    return 'Kritisch';
  };
  
  const getSatisfactionTextColor = (value: number) => {
    if (value >= benchmark + 15) return 'text-emerald-600'; // Sehr gut
    if (value >= benchmark) return 'text-emerald-600'; // Gut
    if (value >= benchmark - 10) return 'text-amber-600'; // Mittel
    return 'text-rose-600'; // Schlecht
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="shadow-sm border-0 bg-gradient-to-b from-background to-muted/20 overflow-hidden">
        <CardHeader className="pb-2 space-y-0">
          <div className="flex justify-between">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              Gesamtzufriedenheit
            </CardTitle>
            {satisfactionDelta !== null && (
              <Badge variant="outline" className={`${isTrendPositive ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'} flex items-center h-6 px-2`}>
                {isTrendPositive ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
                {isTrendPositive ? '+' : ''}{Math.abs(satisfactionDelta).toFixed(1)}%
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-3 mb-3">
            <div className={`text-4xl font-bold tracking-tight ${getSatisfactionTextColor(overallSatisfaction)}`}>{overallSatisfaction}%</div>
            <div className="flex flex-col">
              <span className={`text-sm font-medium ${getSatisfactionTextColor(overallSatisfaction)}`}>{getSatisfactionText(overallSatisfaction)}</span>
              <span className="text-xs text-muted-foreground">Benchmark: {benchmark}%</span>
            </div>
          </div>
          <div className="relative w-full h-2 mb-2">
            <div className={`w-full h-2 rounded-full ${getSatisfactionBackground(overallSatisfaction)}`}></div>
            <div 
              className={`absolute top-0 left-0 h-2 rounded-full transition-all ${getSatisfactionColor(overallSatisfaction)}`}
              style={{ width: `${overallSatisfaction}%` }}
            ></div>
            <div 
              className="absolute top-0 left-0 w-0.5 h-2 bg-slate-500"
              style={{ marginLeft: `${benchmark}%` }}
            ></div>
          </div>
          {previousOverallSatisfaction && (
            <div className="flex justify-end text-xs text-muted-foreground">
              Vorjahr: {previousOverallSatisfaction}%
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm border-0 bg-gradient-to-b from-background to-muted/20 overflow-hidden">
        <CardHeader className="pb-2 space-y-0">
          <div className="flex justify-between">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <PieChart className="h-4 w-4 text-muted-foreground" />
              Kategorien
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-start gap-3 mb-3">
            <div className="text-4xl font-bold tracking-tight">{categoriesCount}</div>
            <div className="flex flex-col mt-1">
              <span className="text-sm font-medium">Themengebiete</span>
              <span className="text-xs text-muted-foreground">in der Umfrage</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {[...Array(Math.min(categoriesCount, 8))].map((_, i) => (
              <Badge key={i} variant="outline" 
                className={`rounded-md border px-2 py-1 text-xs ${i < 4 ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}
              >
                Kategorie {i+1}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-0 bg-gradient-to-b from-background to-muted/20 overflow-hidden">
        <CardHeader className="pb-2 space-y-0">
          <div className="flex justify-between">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <XCircle className="h-4 w-4 text-muted-foreground" />
              Unter Benchmark
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-start gap-3 mb-3">
            <div className="text-4xl font-bold tracking-tight text-rose-600">{questionsBelowBenchmarkCount}</div>
            <div className="flex flex-col mt-1">
              <span className="text-sm font-medium">Fragen</span>
              <span className="text-xs text-muted-foreground">unter {benchmark}% Zufriedenheit</span>
            </div>
          </div>
          <div className="mt-4 py-3 px-3 rounded-md bg-rose-50 border border-rose-200">
            <div className="flex items-center text-rose-600 text-sm font-medium">
              <XCircle className="h-4 w-4 mr-2 shrink-0" />
              <div>
                <span className="font-semibold">{Math.round((questionsBelowBenchmarkCount / totalQuestionsCount) * 100)}%</span> der Fragen 
                benötigen Aufmerksamkeit ({questionsBelowBenchmarkCount} von {totalQuestionsCount})
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-0 bg-gradient-to-b from-background to-muted/20 overflow-hidden">
        <CardHeader className="pb-2 space-y-0">
          <div className="flex justify-between">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <ArrowUpCircle className="h-4 w-4 text-muted-foreground" />
              Verbesserungen
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-start gap-3 mb-3">
            <div className="text-4xl font-bold tracking-tight text-emerald-600">{questionsImprovedCount}</div>
            <div className="flex flex-col mt-1">
              <span className="text-sm font-medium">Fragen</span>
              <span className="text-xs text-muted-foreground">mit positiver Entwicklung</span>
            </div>
          </div>
          {previousOverallSatisfaction ? (
            <div className="mt-4 py-3 px-3 rounded-md bg-emerald-50 border border-emerald-200">
              <div className="flex items-center text-emerald-600 text-sm font-medium">
                <CheckCircle2 className="h-4 w-4 mr-2 shrink-0" />
                <div>
                  <span className="font-semibold">{Math.round((questionsImprovedCount / totalQuestionsCount) * 100)}%</span> der Fragen 
                  haben sich verbessert ({questionsImprovedCount} von {totalQuestionsCount})
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4 py-3 px-3 rounded-md bg-muted border">
              <div className="flex items-center text-muted-foreground text-sm">
                <div>Keine Vorjahresdaten vorhanden</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SurveyResultsStats;
