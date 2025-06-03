'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Building } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface CompanySelectorProps {
  selectedCompanies: string[];
  onChange: (companies: string[]) => void;
}

interface Company {
  _id: string;
  name: string;
  email: string;
  city: string;
  active: boolean;
}

export default function CompanySelector({ 
  selectedCompanies, 
  onChange 
}: CompanySelectorProps) {
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Unternehmen laden
  useEffect(() => {
    fetchCompanies();
  }, []);
  
  const fetchCompanies = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/companies');
      
      if (!response.ok) {
        throw new Error('Fehler beim Laden der Unternehmen');
      }
      
      const data = await response.json();
      setCompanies(data);
    } catch (error) {
      console.error('Fehler beim Laden der Unternehmen:', error);
      toast({
        title: 'Fehler',
        description: 'Unternehmen konnten nicht geladen werden',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Filter-Funktion für die Suche
  const filteredCompanies = companies.filter(company => {
    const query = searchQuery.toLowerCase();
    return (
      company.name.toLowerCase().includes(query) ||
      company.email.toLowerCase().includes(query) ||
      company.city.toLowerCase().includes(query)
    );
  });
  
  // Checkbox-Status ändern
  const toggleCompanySelection = (companyId: string) => {
    onChange(
      selectedCompanies.includes(companyId)
        ? selectedCompanies.filter(id => id !== companyId)
        : [...selectedCompanies, companyId]
    );
  };
  
  // Alle auswählen/abwählen
  const toggleAllCompanies = () => {
    if (selectedCompanies.length === filteredCompanies.length) {
      // Alle abwählen
      onChange([]);
    } else {
      // Alle auswählen
      onChange(filteredCompanies.map(company => company._id));
    }
  };
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Unternehmen suchen..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={toggleAllCompanies}
              disabled={isLoading || companies.length === 0}
            >
              {selectedCompanies.length === filteredCompanies.length && filteredCompanies.length > 0
                ? 'Alle abwählen'
                : 'Alle auswählen'}
            </Button>
          </div>
          
          <div className="border rounded-md h-[300px] overflow-hidden">
            <ScrollArea className="h-full">
              {isLoading ? (
                <div className="p-4 space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : companies.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-4">
                  <Building className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-center text-muted-foreground">
                    Keine Unternehmen gefunden. Bitte erstellen Sie zunächst Unternehmen im System.
                  </p>
                </div>
              ) : filteredCompanies.length === 0 ? (
                <div className="p-4 text-center">
                  <p className="text-muted-foreground">
                    Keine Unternehmen entsprechen Ihrer Suche.
                  </p>
                  {searchQuery && (
                    <Button 
                      variant="link" 
                      className="mt-2 p-0 h-auto" 
                      onClick={() => setSearchQuery('')}
                    >
                      Suche zurücksetzen
                    </Button>
                  )}
                </div>
              ) : (
                <div className="p-1">
                  {filteredCompanies.map((company) => (
                    <div
                      key={company._id}
                      className={`flex items-start p-3 mb-1 rounded-md ${
                        selectedCompanies.includes(company._id)
                          ? 'bg-primary/10'
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => toggleCompanySelection(company._id)}
                    >
                      <Checkbox
                        checked={selectedCompanies.includes(company._id)}
                        onCheckedChange={() => toggleCompanySelection(company._id)}
                        className="mr-3 mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-medium">{company.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {company.city} • {company.email}
                        </div>
                      </div>
                      {!company.active && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                          Inaktiv
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
          
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>
              {selectedCompanies.length} {selectedCompanies.length === 1 ? 'Unternehmen' : 'Unternehmen'} ausgewählt
            </span>
            <Button 
              variant="link" 
              className="p-0 h-auto" 
              onClick={fetchCompanies}
            >
              Aktualisieren
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
