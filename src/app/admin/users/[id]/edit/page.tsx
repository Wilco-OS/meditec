'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Save, User, Building } from 'lucide-react';

interface UserData {
  _id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  companyId?: string;
  companyName?: string;
}

export default function EditUserPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const params = useParams();
  const { toast } = useToast();
  
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companies, setCompanies] = useState<{_id: string, name: string}[]>([]);
  
  // Form-Daten
  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    role: string;
    active: boolean;
    companyId?: string;
  }>({
    name: '',
    email: '',
    role: 'employee',
    active: true,
    companyId: undefined
  });
  
  // Lade Benutzerdaten
  useEffect(() => {
    // Überprüfe Authentifizierung
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    if (session && session.user.role !== 'meditec_admin') {
      router.push('/dashboard');
      return;
    }
    
    if (status === 'authenticated' && params.id) {
      fetchUserData();
      fetchCompanies();
    }
  }, [status, session, params.id]);
  
  const fetchUserData = async () => {
    try {
      setLoading(true);
      const userId = Array.isArray(params.id) ? params.id[0] : params.id;
      
      const response = await fetch(`/api/users/${userId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fehler beim Laden der Benutzerdaten');
      }
      
      const userData = await response.json();
      setUser(userData);
      
      // Formular mit den Benutzerdaten initialisieren
      setFormData({
        name: userData.name || '',
        email: userData.email || '',
        role: userData.role || 'employee',
        active: userData.active !== undefined ? userData.active : true,
        companyId: userData.companyId
      });
      
      console.log('Benutzerdaten geladen:', userData);
    } catch (error: any) {
      console.error('Fehler beim Laden der Benutzerdaten:', error);
      toast({
        title: "Fehler",
        description: error.message || "Die Benutzerdaten konnten nicht geladen werden.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const fetchCompanies = async () => {
    try {
      const response = await fetch('/api/companies');
      
      if (!response.ok) {
        throw new Error('Fehler beim Laden der Unternehmen');
      }
      
      const data = await response.json();
      setCompanies(data.companies || []);
    } catch (error: any) {
      console.error('Fehler beim Laden der Unternehmen:', error);
      toast({
        title: "Fehler",
        description: "Die Unternehmen konnten nicht geladen werden.",
        variant: "destructive",
      });
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSwitchChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, active: checked }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      const userId = Array.isArray(params.id) ? params.id[0] : params.id;
      
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fehler beim Aktualisieren des Benutzers');
      }
      
      const updatedUser = await response.json();
      
      toast({
        title: "Erfolg",
        description: "Der Benutzer wurde erfolgreich aktualisiert.",
      });
      
      // Zurück zur Übersicht oder Unternehmensseite
      if (user?.companyId) {
        router.push(`/admin/companies/${user.companyId}/users`);
      } else {
        router.push('/admin/users');
      }
      
    } catch (error: any) {
      console.error('Fehler beim Aktualisieren des Benutzers:', error);
      toast({
        title: "Fehler",
        description: error.message || "Der Benutzer konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto py-6 space-y-6">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-8 w-64" />
          </div>
          
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-full" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }
  
  if (!user) {
    return (
      <MainLayout>
        <div className="container mx-auto py-6">
          <Card>
            <CardContent className="flex flex-col items-center py-10">
              <User className="h-16 w-16 text-muted-foreground mb-4" />
              <h2 className="text-2xl font-bold mb-2">Benutzer nicht gefunden</h2>
              <p className="text-muted-foreground mb-6">
                Der angeforderte Benutzer konnte nicht gefunden werden.
              </p>
              <Link href="/admin/users">
                <Button>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Zurück zur Benutzerübersicht
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            {user.companyId ? (
              <Link href={`/admin/companies/${user.companyId}/users`}>
                <Button variant="outline" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Link href="/admin/users">
                <Button variant="outline" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
            )}
            <h1 className="text-2xl font-bold">Benutzer bearbeiten</h1>
          </div>
        </div>
        
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Benutzerinformationen</CardTitle>
              <CardDescription>
                Bearbeiten Sie die Informationen für {user.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">E-Mail-Adresse</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role">Rolle</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => handleSelectChange('role', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Rolle auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">Mitarbeiter</SelectItem>
                      <SelectItem value="company_admin">Unternehmens-Admin</SelectItem>
                      {session?.user.role === 'meditec_admin' && (
                        <SelectItem value="meditec_admin">Meditec-Admin</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="companyId">Unternehmen</Label>
                  <Select
                    value={formData.companyId || ''}
                    onValueChange={(value) => handleSelectChange('companyId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Unternehmen auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company._id} value={company._id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={formData.active}
                    onCheckedChange={handleSwitchChange}
                  />
                  <Label htmlFor="active">Aktiv</Label>
                </div>
              </div>
              
              {user.companyName && (
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Building className="h-4 w-4" />
                  <span>Aktuelles Unternehmen: {user.companyName}</span>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-6">
              {user.companyId ? (
                <Link href={`/admin/companies/${user.companyId}/users`}>
                  <Button variant="outline">Abbrechen</Button>
                </Link>
              ) : (
                <Link href="/admin/users">
                  <Button variant="outline">Abbrechen</Button>
                </Link>
              )}
              
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>Wird gespeichert...</>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Speichern
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </MainLayout>
  );
}
