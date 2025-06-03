'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
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
import { SurveyStatus } from '@/types/survey';
import { toast } from '@/components/ui/use-toast';
import { Clock, CheckCircle, AlertTriangle } from 'lucide-react';

interface SurveyStatusManagerProps {
  surveyId: string;
  currentStatus: string;
  userRole: string;
  onStatusChange: (newStatus: string) => void;
}

export function SurveyStatusManager({
  surveyId,
  currentStatus,
  userRole,
  onStatusChange
}: SurveyStatusManagerProps) {
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
  const [isActivateDialogOpen, setIsActivateDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Status in Displaytext umwandeln
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case SurveyStatus.DRAFT:
        return 'Entwurf';
      case SurveyStatus.SCHEDULED:
        return 'Geplant';
      case SurveyStatus.ACTIVE:
        return 'Aktiv';
      case SurveyStatus.COMPLETED:
        return 'Abgeschlossen';
      case SurveyStatus.ARCHIVED:
        return 'Archiviert';
      case SurveyStatus.PENDING:
        return 'Ausstehend';
      case SurveyStatus.IN_PROGRESS:
        return 'In Bearbeitung';
      default:
        return status;
    }
  };

  // Status-Farbe bestimmen
  const getStatusColor = (status: string) => {
    switch (status) {
      case SurveyStatus.DRAFT:
        return 'bg-gray-100 text-gray-700';
      case SurveyStatus.SCHEDULED:
        return 'bg-blue-100 text-blue-700';
      case SurveyStatus.ACTIVE:
        return 'bg-green-100 text-green-700';
      case SurveyStatus.COMPLETED:
        return 'bg-purple-100 text-purple-700';
      case SurveyStatus.ARCHIVED:
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Status-Icon bestimmen
  const getStatusIcon = (status: string) => {
    switch (status) {
      case SurveyStatus.DRAFT:
        return <Clock className="h-4 w-4 mr-1" />;
      case SurveyStatus.SCHEDULED:
        return <Clock className="h-4 w-4 mr-1" />;
      case SurveyStatus.ACTIVE:
        return <CheckCircle className="h-4 w-4 mr-1" />;
      case SurveyStatus.COMPLETED:
        return <CheckCircle className="h-4 w-4 mr-1" />;
      case SurveyStatus.ARCHIVED:
        return <AlertTriangle className="h-4 w-4 mr-1" />;
      default:
        return <Clock className="h-4 w-4 mr-1" />;
    }
  };

  // Funktion zum Ändern des Umfragestatus
  const updateSurveyStatus = async (newStatus: string) => {
    setIsProcessing(true);
    
    try {
      const response = await fetch(`/api/surveys/${surveyId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fehler beim Aktualisieren des Status');
      }

      const data = await response.json();
      
      // Benachrichtigung und Status-Update
      toast({
        title: "Erfolg!",
        description: `Umfragestatus wurde auf "${getStatusDisplay(newStatus)}" aktualisiert.`,
      });

      // Status im Parent-Component aktualisieren
      onStatusChange(newStatus);
      
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Umfragestatus:', error);
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : 'Unbekannter Fehler beim Aktualisieren des Status',
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setIsPublishDialogOpen(false);
      setIsActivateDialogOpen(false);
    }
  };

  // Action-Buttons basierend auf Rolle und Status anzeigen
  const renderActionButtons = () => {
    // Für Meditec-Admins
    if (userRole === 'meditec_admin') {
      if (currentStatus === SurveyStatus.DRAFT) {
        return (
          <Button 
            variant="outline" 
            className="ml-2" 
            onClick={() => setIsPublishDialogOpen(true)}
            disabled={isProcessing}
          >
            Für Unternehmen freigeben
          </Button>
        );
      }
      
      if (currentStatus === SurveyStatus.SCHEDULED || currentStatus === SurveyStatus.ACTIVE) {
        return (
          <Button 
            variant="outline" 
            className="ml-2" 
            onClick={() => updateSurveyStatus(SurveyStatus.DRAFT)}
            disabled={isProcessing}
          >
            Zurück auf Entwurf setzen
          </Button>
        );
      }
    }
    
    // Für Unternehmensadmins
    if (userRole === 'company_admin') {
      if (currentStatus === SurveyStatus.SCHEDULED) {
        return (
          <Button 
            variant="outline" 
            className="ml-2" 
            onClick={() => setIsActivateDialogOpen(true)}
            disabled={isProcessing}
          >
            Umfrage aktivieren
          </Button>
        );
      }
      
      if (currentStatus === SurveyStatus.ACTIVE) {
        return (
          <Button 
            variant="outline" 
            className="ml-2" 
            onClick={() => updateSurveyStatus(SurveyStatus.COMPLETED)}
            disabled={isProcessing}
          >
            Umfrage abschließen
          </Button>
        );
      }
    }
    
    return null;
  };

  return (
    <div className="flex items-center">
      <div className={`flex items-center px-2 py-1 rounded-md text-sm ${getStatusColor(currentStatus)}`}>
        {getStatusIcon(currentStatus)}
        {getStatusDisplay(currentStatus)}
      </div>
      
      {renderActionButtons()}
      
      {/* Dialog für "Für Unternehmen freigeben" */}
      <AlertDialog open={isPublishDialogOpen} onOpenChange={setIsPublishDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Umfrage für Unternehmen freigeben</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie diese Umfrage für das zugewiesene Unternehmen freigeben? 
              Der Unternehmensadmin kann die Umfrage dann sehen und aktivieren.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => updateSurveyStatus(SurveyStatus.SCHEDULED)}
              disabled={isProcessing}
            >
              {isProcessing ? 'Wird freigegeben...' : 'Freigeben'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Dialog für "Umfrage aktivieren" */}
      <AlertDialog open={isActivateDialogOpen} onOpenChange={setIsActivateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Umfrage aktivieren</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie diese Umfrage aktivieren? 
              Die Umfrage wird dann für die zugewiesenen Mitarbeiter zur Beantwortung verfügbar sein.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => updateSurveyStatus(SurveyStatus.ACTIVE)}
              disabled={isProcessing}
            >
              {isProcessing ? 'Wird aktiviert...' : 'Aktivieren'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
