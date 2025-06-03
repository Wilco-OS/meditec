'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';

export function SurveyDebugger() {
  const [surveyId, setSurveyId] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testSurveyFetch = async () => {
    if (!surveyId.trim()) {
      toast({
        title: 'Fehler',
        description: 'Bitte geben Sie eine Umfrage-ID ein',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('Teste Umfrage-API mit ID:', surveyId);
      const response = await fetch(`/api/surveys/${surveyId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Fehler beim Abrufen der Umfrage');
      }

      setResult(data);
      toast({
        title: 'Erfolg',
        description: 'Umfrage erfolgreich abgerufen',
      });
    } catch (err: any) {
      console.error('Fehler beim Testen der Umfrage-API:', err);
      setError(err.message || 'Ein unbekannter Fehler ist aufgetreten');
      toast({
        title: 'Fehler',
        description: err.message || 'Fehler beim Abrufen der Umfrage',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Umfrage-API Tester</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Input
              value={surveyId}
              onChange={(e) => setSurveyId(e.target.value)}
              placeholder="Umfrage-ID eingeben"
              className="flex-1"
            />
            <Button onClick={testSurveyFetch} disabled={loading}>
              {loading ? 'Wird geladen...' : 'Testen'}
            </Button>
          </div>

          {error && (
            <div className="bg-red-50 p-4 rounded-md border border-red-200">
              <h3 className="text-red-800 font-medium">Fehler:</h3>
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {result && (
            <div className="bg-green-50 p-4 rounded-md border border-green-200">
              <h3 className="text-green-800 font-medium">Ergebnis:</h3>
              <pre className="text-xs mt-2 bg-white p-2 rounded overflow-x-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
