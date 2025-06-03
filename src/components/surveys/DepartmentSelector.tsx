'use client';

import React, { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';

interface Department {
  name: string;
  id?: string;
}

interface Company {
  id?: string;
  _id?: string; // MongoDB IDs können manchmal als _id statt id vorliegen
  name: string;
  departments?: Department[];
}

interface DepartmentSelectorProps {
  companies: Company[];
  assignedCompanyId: string;
  selectedBlockIndex: number;
  selectedDepartments: string[];
  onDepartmentChange: (blockIndex: number, field: string, value: string[]) => void;
}

/**
 * Komponente zur Auswahl von Abteilungen für abteilungsspezifische Frageblöcke
 * Zeigt nur Abteilungen des ausgewählten Unternehmens an
 */
export function DepartmentSelector({
  companies,
  assignedCompanyId,
  selectedBlockIndex,
  selectedDepartments,
  onDepartmentChange
}: DepartmentSelectorProps) {
  // State für das gefundene Unternehmen
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  
  // Effect für Debugging und Unternehmensfindung
  useEffect(() => {
    // Debugging-Informationen
    console.log('DepartmentSelector - assignedCompanyId:', assignedCompanyId);
    console.log('DepartmentSelector - companies:', companies);
    
    if (assignedCompanyId === 'none' || !assignedCompanyId) {
      setSelectedCompany(null);
      return;
    }
    
    // Flexiblere Suche nach dem Unternehmen mit mehreren ID-Formaten
    const company = companies.find(c => {
      // Alle möglichen ID-Formate prüfen
      const companyIdString = String(c.id || c._id || '').trim();
      const assignedIdString = String(assignedCompanyId).trim();
      
      console.log(`Vergleiche: '${companyIdString}' mit '${assignedIdString}'`);
      
      return companyIdString === assignedIdString;
    });
    
    console.log('DepartmentSelector - Gefundenes Unternehmen:', company);
    setSelectedCompany(company || null);
  }, [companies, assignedCompanyId]);
  
  // Wenn keine Firma ausgewählt ist, zeige eine Meldung an
  if (assignedCompanyId === 'none') {
    return (
      <div className="mt-2 space-y-2">
        <p className="text-sm text-muted-foreground">
          Bitte wählen Sie zuerst ein Unternehmen aus, um Abteilungen zuweisen zu können.
        </p>
      </div>
    );
  }
  
  if (!selectedCompany) {
    return (
      <div className="mt-2 space-y-2">
        <p className="text-sm text-muted-foreground">
          Das ausgewählte Unternehmen wurde nicht gefunden.
        </p>
      </div>
    );
  }

  // Wenn das Unternehmen keine Abteilungen hat, zeige eine Meldung an
  if (!selectedCompany.departments || selectedCompany.departments.length === 0) {
    return (
      <div className="mt-2 space-y-2">
        <p className="text-sm text-muted-foreground pl-4">
          Keine Abteilungen für dieses Unternehmen definiert.
        </p>
      </div>
    );
  }

  // Andernfalls zeige die Abteilungen des ausgewählten Unternehmens an
  return (
    <div className="mt-2 space-y-2">
      <div key={`company-${selectedCompany.id || selectedCompany._id}`} className="space-y-1">
        <h4 className="text-sm font-medium">{selectedCompany.name}</h4>
        <div className="space-y-1 pl-4">
          {selectedCompany.departments.map((dept, deptIndex) => {
            // Verwende eine konsistente ID für die Abteilung
            const companyIdentifier = selectedCompany.id || selectedCompany._id;
            const deptId = `${companyIdentifier}:${dept.name}`;
            
            return (
              <div
                key={`${companyIdentifier}-${deptIndex}`}
                className="flex items-center"
              >
                <input
                  type="checkbox"
                  id={`dept-${companyIdentifier}-${deptIndex}`}
                  className="mr-2"
                  checked={selectedDepartments?.includes(deptId) || false}
                  onChange={(e) => {
                    const currentDepts = [...(selectedDepartments || [])];
                    let newDepts;
                    
                    if (e.target.checked) {
                      newDepts = [...currentDepts, deptId];
                    } else {
                      newDepts = currentDepts.filter(d => d !== deptId);
                    }
                    
                    onDepartmentChange(selectedBlockIndex, "departments", newDepts);
                  }}
                />
                <label
                  htmlFor={`dept-${companyIdentifier}-${deptIndex}`}
                  className="text-sm"
                >
                  {dept.name}
                </label>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
