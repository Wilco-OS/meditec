'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Plus, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';

type Department = {
  name: string;
  description?: string;
};

export default function CreateCompanyPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Formular-Daten
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'Deutschland',
    active: true,
    adminName: '',
    adminEmail: '',
    departments: [] as Department[],
  });
  
  // Neue Abteilung
  const [newDepartment, setNewDepartment] = useState<Department>({
    name: '',
    description: ''
  });
  
  // Fehler für die Abteilungsverwaltung
  const [departmentError, setDepartmentError] = useState('');

  // Fehler-Zustand
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Formular-Änderungsbehandlung
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
    
    // Löschen des Fehlers für dieses Feld, wenn der Benutzer tippt
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };
  
  // Behandlung von Änderungen an der neuen Abteilung
  const handleDepartmentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewDepartment({
      ...newDepartment,
      [name]: value
    });
    
    if (departmentError) {
      setDepartmentError('');
    }
  };
  
  // Hinzufügen einer neuen Abteilung
  const addDepartment = () => {
    if (!newDepartment.name.trim()) {
      setDepartmentError('Der Name der Abteilung ist erforderlich');
      return;
    }
    
    // Prüfen, ob bereits eine Abteilung mit diesem Namen existiert
    if (formData.departments.some(dept => dept.name.toLowerCase() === newDepartment.name.toLowerCase())) {
      setDepartmentError('Eine Abteilung mit diesem Namen existiert bereits');
      return;
    }
    
    setFormData({
      ...formData,
      departments: [...formData.departments, { ...newDepartment }]
    });
    
    // Zurücksetzen des Formulars für die neue Abteilung
    setNewDepartment({ name: '', description: '' });
  };
  
  // Entfernen einer Abteilung
  const removeDepartment = (index: number) => {
    const updatedDepartments = [...formData.departments];
    updatedDepartments.splice(index, 1);
    
    setFormData({
      ...formData,
      departments: updatedDepartments
    });
  };

  // Formular-Validierung
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Unternehmensname ist erforderlich';
    }
    
    if (!formData.contactPerson.trim()) {
      newErrors.contactPerson = 'Ansprechpartner ist erforderlich';
    }
    
    if (!formData.city.trim()) {
      newErrors.city = 'Stadt ist erforderlich';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'E-Mail ist erforderlich';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Ungültiges E-Mail-Format';
    }
    
    // Admin-Validierung - wenn ein Feld ausgefüllt ist, muss auch das andere ausgefüllt sein
    if ((formData.adminName && !formData.adminEmail) || (!formData.adminName && formData.adminEmail)) {
      if (!formData.adminName) newErrors.adminName = 'Admin-Name ist erforderlich, wenn eine Admin-E-Mail angegeben ist';
      if (!formData.adminEmail) newErrors.adminEmail = 'Admin-E-Mail ist erforderlich, wenn ein Admin-Name angegeben ist';
    }
    
    // Wenn Admin-E-Mail ausgefüllt ist, überprüfe das Format
    if (formData.adminEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.adminEmail)) {
      newErrors.adminEmail = 'Ungültiges E-Mail-Format für Admin';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Formular-Absendungsbehandlung
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fehler beim Erstellen des Unternehmens');
      }
      
      toast({
        title: 'Erfolg',
        description: 'Unternehmen wurde erfolgreich erstellt',
      });
      
      // Zurück zur Unternehmensliste navigieren
      setTimeout(() => {
        router.push('/admin/companies');
      }, 1500);
      
    } catch (error: any) {
      console.error('Fehler beim Erstellen des Unternehmens:', error);
      toast({
        title: 'Fehler',
        description: error.message || 'Unternehmen konnte nicht erstellt werden',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-8">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">Neues Unternehmen erstellen</CardTitle>
            <CardDescription>
              Geben Sie die Daten des neuen Unternehmens ein
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Unternehmensname *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Unternehmen GmbH"
                  value={formData.name}
                  onChange={handleChange}
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contactPerson">Ansprechpartner *</Label>
                <Input
                  id="contactPerson"
                  name="contactPerson"
                  placeholder="Max Mustermann"
                  value={formData.contactPerson}
                  onChange={handleChange}
                  className={errors.contactPerson ? 'border-red-500' : ''}
                />
                {errors.contactPerson && <p className="text-sm text-red-500">{errors.contactPerson}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">E-Mail *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="kontakt@unternehmen.de"
                  value={formData.email}
                  onChange={handleChange}
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  name="phone"
                  placeholder="+49 123 456789"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Adresse</Label>
                  <Input
                    id="address"
                    name="address"
                    placeholder="Musterstraße 123"
                    value={formData.address}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="city">Stadt</Label>
                  <Input
                    id="city"
                    name="city"
                    placeholder="Berlin"
                    value={formData.city}
                    onChange={handleChange}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postleitzahl</Label>
                  <Input
                    id="postalCode"
                    name="postalCode"
                    placeholder="12345"
                    value={formData.postalCode}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="country">Land</Label>
                  <Input
                    id="country"
                    name="country"
                    placeholder="Deutschland"
                    value={formData.country}
                    onChange={handleChange}
                  />
                </div>
              </div>
              
              {/* Unternehmensadmin-Bereich */}
              <div className="space-y-4">
                <h3 className="font-medium text-lg">Unternehmensadministrator (optional)</h3>
                <p className="text-sm text-gray-500">Wenn Sie hier einen Administrator angeben, wird automatisch ein Benutzer erstellt und eine E-Mail mit Zugangsdaten versendet.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="adminName">Name des Administrators</Label>
                    <Input
                      id="adminName"
                      name="adminName"
                      placeholder="Max Mustermann"
                      value={formData.adminName}
                      onChange={handleChange}
                      className={errors.adminName ? 'border-red-500' : ''}
                    />
                    {errors.adminName && <p className="text-sm text-red-500">{errors.adminName}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="adminEmail">E-Mail des Administrators</Label>
                    <Input
                      id="adminEmail"
                      name="adminEmail"
                      type="email"
                      placeholder="admin@unternehmen.de"
                      value={formData.adminEmail}
                      onChange={handleChange}
                      className={errors.adminEmail ? 'border-red-500' : ''}
                    />
                    {errors.adminEmail && <p className="text-sm text-red-500">{errors.adminEmail}</p>}
                  </div>
                </div>
              </div>
              
              {/* Abteilungen-Bereich */}
              <div className="space-y-4">
                <Separator className="my-4" />
                <h3 className="font-medium text-lg">Abteilungen</h3>
                <p className="text-sm text-gray-500">Fügen Sie Abteilungen des Unternehmens hinzu (z.B. Vertrieb, Service, Produktion).</p>
                
                {/* Liste der Abteilungen */}
                {formData.departments.length > 0 && (
                  <div className="space-y-2 mb-4">
                    <p className="text-sm font-medium">Hinzugefügte Abteilungen:</p>
                    <div className="flex flex-wrap gap-2">
                      {formData.departments.map((department, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {department.name}
                          <button
                            type="button"
                            onClick={() => removeDepartment(index)}
                            className="ml-1 text-gray-500 hover:text-red-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Formular für neue Abteilungen */}
                <div className="p-4 border rounded-md bg-gray-50">
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="departmentName">Name der Abteilung</Label>
                      <Input
                        id="departmentName"
                        name="name"
                        placeholder="z.B. Vertrieb"
                        value={newDepartment.name}
                        onChange={handleDepartmentChange}
                        className={departmentError ? 'border-red-500' : ''}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="departmentDescription">Beschreibung (optional)</Label>
                      <Textarea
                        id="departmentDescription"
                        name="description"
                        placeholder="Kurze Beschreibung der Abteilung"
                        value={newDepartment.description || ''}
                        onChange={handleDepartmentChange}
                        className="h-20"
                      />
                    </div>
                    
                    {departmentError && <p className="text-sm text-red-500">{departmentError}</p>}
                    
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={addDepartment}
                      className="mt-2"
                    >
                      <Plus className="h-4 w-4 mr-2" /> Abteilung hinzufügen
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="active"
                  name="active"
                  checked={formData.active}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="active" className="cursor-pointer">Unternehmen ist aktiv</Label>
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-between">
              <Link href="/admin/companies">
                <Button variant="outline" type="button">Abbrechen</Button>
              </Link>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Speichern...
                  </>
                ) : (
                  'Unternehmen erstellen'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </MainLayout>
  );
}
