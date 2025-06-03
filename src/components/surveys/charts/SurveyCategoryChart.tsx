'use client';

import React from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  LabelList
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BarChart2, PieChart } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  percentage: number;
  lastYearPercentage?: number;
}

interface SurveyCategoryChartProps {
  categories: Category[];
  benchmark: number;
}

const SurveyCategoryChart: React.FC<SurveyCategoryChartProps> = ({ categories, benchmark }) => {
  // Option zum Anzeigen der Werte im Diagramm
  const [showPreviousValues, setShowPreviousValues] = React.useState(true);
  const formatData = (cats: Category[]) => {
    return cats.map(cat => ({
      category: cat.name,
      current: cat.percentage,
      previous: cat.lastYearPercentage || 0,
      benchmarkValue: benchmark,
    }));
  };

  const chartData = formatData(categories);

  const getColorByValue = (value: number) => {
    if (value >= benchmark + 15) return '#10b981'; // Sehr gut - moderne grüntöne
    if (value >= benchmark) return '#34d399'; // Gut - grün
    if (value >= benchmark - 10) return '#fbbf24'; // Mittel - amber
    return '#f43f5e'; // Schlecht - rose
  };
  
  // Benutzerdefinierte Tooltip-Komponente für ein moderneres Aussehen
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg shadow-md p-3">
          <p className="font-medium text-sm mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <p className="text-sm">
                <span className="font-medium">{entry.name}:</span> {entry.value}%
              </p>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="overflow-hidden border-0 bg-gradient-to-b from-background to-muted/20 shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-2xl font-bold tracking-tight">Kategorien im Überblick</CardTitle>
        <CardDescription className="text-muted-foreground">Zufriedenheit nach Themengebieten im Vergleich</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="bar" className="w-full">
          <div className="flex justify-end px-6 pt-2">
            <TabsList className="grid w-[240px] grid-cols-2 h-9">
              <TabsTrigger value="bar" className="flex items-center gap-1">
                <BarChart2 className="h-4 w-4" />
                <span>Balkendiagramm</span>
              </TabsTrigger>
              <TabsTrigger value="radar" className="flex items-center gap-1">
                <PieChart className="h-4 w-4" />
                <span>Netzdiagramm</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="bar" className="p-6 pt-4 h-[420px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 10, left: -20, bottom: 80 }}
                barGap={8}
              >
                <CartesianGrid vertical={false} stroke="#e5e7eb" strokeOpacity={0.4} />
                <XAxis 
                  dataKey="category" 
                  angle={-45} 
                  textAnchor="end" 
                  height={80} 
                  interval={0}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb', strokeOpacity: 0.4 }}
                />
                <YAxis 
                  domain={[0, 100]} 
                  tickCount={6} 
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="top" 
                  height={36} 
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '13px' }}
                />
                <ReferenceLine 
                  y={benchmark} 
                  stroke="#94a3b8" 
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: `Benchmark ${benchmark}%`,
                    position: 'right',
                    fill: '#64748b',
                    fontSize: 12,
                    fontWeight: 500
                  }}
                />
                <Bar 
                  name="Aktuelle Umfrage" 
                  dataKey="current" 
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={true}
                  maxBarSize={50}
                >
                  <LabelList 
                    dataKey="current" 
                    position="top" 
                    formatter={(value: number) => `${value}%`}
                    style={{ fontSize: '11px', fill: '#64748b', fontWeight: 500 }}
                    offset={5}
                  />
                </Bar>
                {chartData.some(item => item.previous > 0) && (
                  <Bar 
                    name="Vorherige Umfrage" 
                    dataKey="previous" 
                    fill="#6ee7b7" 
                    radius={[4, 4, 0, 0]}
                    opacity={0.75}
                    isAnimationActive={true}
                    maxBarSize={50}
                  >
                    {showPreviousValues && (
                      <LabelList 
                        dataKey="previous" 
                        position="top" 
                        formatter={(value: number) => `${value}%`}
                        style={{ fontSize: '11px', fill: '#64748b', fontWeight: 500 }}
                        offset={5}
                      />
                    )}
                  </Bar>
                )}
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="radar" className="p-6 pt-4 h-[420px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart outerRadius={150} data={chartData}>
                <PolarGrid gridType="polygon" stroke="#e5e7eb" strokeOpacity={0.4} />
                <PolarAngleAxis 
                  dataKey="category" 
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickLine={false}
                />
                <PolarRadiusAxis 
                  angle={30} 
                  domain={[0, 100]} 
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickCount={5}
                  axisLine={false}
                  tickFormatter={(value) => `${value}%`}
                />
                <Radar
                  name="Aktuelle Umfrage"
                  dataKey="current"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="#10b981"
                  fillOpacity={0.5}
                  isAnimationActive={true}
                  dot={{ fill: '#10b981', r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
                {chartData.some(item => item.previous > 0) && (
                  <Radar
                    name="Vorherige Umfrage"
                    dataKey="previous"
                    stroke="#6ee7b7"
                    strokeWidth={2}
                    fill="#6ee7b7"
                    fillOpacity={0.25}
                    isAnimationActive={true}
                    dot={{ fill: '#6ee7b7', r: 4 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                )}
                <Legend 
                  verticalAlign="top" 
                  height={36} 
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '13px' }}
                />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>

        <div className="p-6 pt-0 flex flex-wrap gap-2">
          {categories.map((category) => (
            <Badge 
              key={category.id} 
              variant="outline"
              className="text-sm py-1.5 px-3 font-medium"
              style={{
                backgroundColor: `${getColorByValue(category.percentage)}15`,
                borderColor: getColorByValue(category.percentage),
                color: getColorByValue(category.percentage)
              }}
            >
              {category.name}: {category.percentage}%
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SurveyCategoryChart;
