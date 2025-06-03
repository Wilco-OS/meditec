'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const SurveyResultsSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <Skeleton className="h-9 w-64 mb-2" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-32" />
          </div>
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      {/* Stats Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-6 w-32 mb-2" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-5 w-12" />
              </div>
              <div className="mt-2">
                <Skeleton className="h-2 w-full mb-2" />
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48 mb-1" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="flex justify-end mb-4">
            <Skeleton className="h-8 w-48" />
          </div>
          <Skeleton className="h-[400px] w-full mb-6" />
          <div className="flex flex-wrap gap-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-7 w-24 rounded-full" />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Categories Skeleton */}
      <div className="mt-8">
        <Skeleton className="h-8 w-64 mb-4" />
        <div>
          <Skeleton className="h-10 w-full mb-4" />
          <Card>
            <CardContent className="py-6">
              <div className="space-y-8">
                {[...Array(3)].map((_, i) => (
                  <div key={i}>
                    <div className="flex justify-between items-center mb-2">
                      <Skeleton className="h-6 w-48" />
                      <Skeleton className="h-6 w-12" />
                    </div>
                    <Skeleton className="h-2 w-full mb-4" />
                    {[...Array(3)].map((_, j) => (
                      <div key={j} className="mb-6 pb-4">
                        <div className="flex justify-between items-start mb-2">
                          <Skeleton className="h-5 w-3/4" />
                          <Skeleton className="h-5 w-12" />
                        </div>
                        <Skeleton className="h-2 w-full mb-2" />
                        <div className="flex justify-between">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SurveyResultsSkeleton;
