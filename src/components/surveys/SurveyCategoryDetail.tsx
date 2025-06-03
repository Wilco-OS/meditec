'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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

interface SurveyCategoryDetailProps {
  category: Category;
  benchmark: number;
}

const SurveyCategoryDetail: React.FC<SurveyCategoryDetailProps> = ({ category, benchmark }) => {
  const getProgressColor = (value: number) => {
    if (value >= benchmark + 15) return 'bg-emerald-500'; // Sehr gut - moderne Farbtöne
    if (value >= benchmark) return 'bg-emerald-400'; // Gut
    if (value >= benchmark - 10) return 'bg-amber-400'; // Mittel
    return 'bg-rose-500'; // Schlecht
  };
  
  const getProgressBackground = (value: number) => {
    if (value >= benchmark + 15) return 'bg-emerald-50'; // Sehr gut - moderne Farbtöne
    if (value >= benchmark) return 'bg-emerald-50'; // Gut
    if (value >= benchmark - 10) return 'bg-amber-50'; // Mittel
    return 'bg-rose-50'; // Schlecht
  };
  
  const getTextColor = (value: number) => {
    if (value >= benchmark + 15) return 'text-emerald-600'; // Sehr gut - moderne Farbtöne
    if (value >= benchmark) return 'text-emerald-600'; // Gut
    if (value >= benchmark - 10) return 'text-amber-600'; // Mittel
    return 'text-rose-600'; // Schlecht
  };

  return (
    <Card className="shadow-sm border-muted bg-gradient-to-b from-background to-muted/10">
      <CardHeader className="pb-0 pt-6">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-bold tracking-tight">{category.name}</CardTitle>
          <div className="flex items-center gap-2">
            <div className={`text-2xl font-bold ${getTextColor(category.percentage)}`}>
              {category.percentage}%
            </div>
            {category.lastYearPercentage && (
              <div className="flex items-center">
                {category.percentage > category.lastYearPercentage ? (
                  <div className="text-emerald-600 flex items-center text-sm font-medium">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    {(category.percentage - category.lastYearPercentage).toFixed(1)}%
                  </div>
                ) : (
                  <div className="text-rose-600 flex items-center text-sm font-medium">
                    <TrendingDown className="h-4 w-4 mr-1" />
                    {(category.percentage - category.lastYearPercentage).toFixed(1)}%
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-2 text-sm text-muted-foreground">
          <div className="relative w-full pt-1">
            <div className={`w-full h-2 rounded-full ${getProgressBackground(category.percentage)}`}></div>
            <div 
              className={`absolute top-1 left-0 h-2 rounded-full ${getProgressColor(category.percentage)}`}
              style={{ width: `${category.percentage}%` }}
            ></div>
            {category.lastYearPercentage && (
              <div 
                className="absolute top-1 left-0 w-1 h-2 bg-slate-600"
                style={{ marginLeft: `${category.lastYearPercentage}%` }}
              ></div>
            )}
          </div>
          {category.lastYearPercentage && (
            <div className="text-xs text-muted-foreground flex justify-end mt-1">
              Vorjahreswert: {category.lastYearPercentage}%
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-3 pb-6">

        <div className="space-y-5">
          {category.questions.map((question) => {
            const isAboveBenchmark = question.yesPercentage >= benchmark;
            const hasImproved = question.lastYearYesPercentage !== undefined && 
              question.yesPercentage > question.lastYearYesPercentage;
            
            return (
              <div key={question.id} className="rounded-lg p-4 last:mb-0 hover:bg-muted/40 transition-colors" 
                style={{ borderLeft: `3px solid ${isAboveBenchmark ? '#10b981' : '#f43f5e'}` }}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 pr-4">
                    <div className="flex items-start gap-2">
                      {isAboveBenchmark ? (
                        <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                      )}
                      <h4 className={`text-base font-medium ${!isAboveBenchmark ? getTextColor(question.yesPercentage) : ''}`}>
                        {question.text}
                      </h4>
                    </div>
                  </div>
                  <div className={`text-lg font-bold ${getTextColor(question.yesPercentage)} min-w-[60px] text-right`}>
                    {question.yesPercentage}%
                  </div>
                </div>
                
                <div className="pl-7">
                  <div className="mb-2">
                    <div className="relative w-full">
                      <div className={`w-full h-2 rounded-full ${getProgressBackground(question.yesPercentage)}`}></div>
                      <div 
                        className={`absolute top-0 left-0 h-2 rounded-full transition-all ${getProgressColor(question.yesPercentage)}`}
                        style={{ width: `${question.yesPercentage}%` }}
                      ></div>
                      {question.lastYearYesPercentage !== undefined && (
                        <div 
                          className="absolute top-0 left-0 w-1 h-2 bg-slate-600"
                          style={{ marginLeft: `${question.lastYearYesPercentage}%` }}
                        ></div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center text-muted-foreground hover:text-foreground cursor-help">
                            <Info className="h-3.5 w-3.5 mr-1" />
                            <span>
                              {isAboveBenchmark ? 'Über Benchmark' : 'Unter Benchmark'}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <span>Benchmark: {benchmark}%</span>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-muted-foreground">
                        Nein: {question.noPercentage}%
                      </div>
                      
                      {question.lastYearYesPercentage !== undefined && (
                        <div className="flex items-center">
                          <span className="text-muted-foreground mr-1">
                            Vorjahr: {question.lastYearYesPercentage}%
                          </span>
                          {hasImproved ? (
                            <span className="text-emerald-600 flex items-center ml-1 font-medium">
                              <TrendingUp className="h-3.5 w-3.5 mr-1" />
                              {(question.yesPercentage - question.lastYearYesPercentage).toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-rose-600 flex items-center ml-1 font-medium">
                              <TrendingDown className="h-3.5 w-3.5 mr-1" />
                              {(question.yesPercentage - question.lastYearYesPercentage).toFixed(1)}%
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default SurveyCategoryDetail;
