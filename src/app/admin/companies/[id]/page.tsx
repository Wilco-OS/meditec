'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

// UI-Komponenten
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { 
  Building, 
  Users, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  ClipboardList, 
  ArrowLeft, 
  Edit,
  Plus,
  FileText,
  Search,
  Trash2,
  UserPlus
} from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { SurveyStatus } from '@/types/survey';

// Schnittstellen
interface Company {
  _id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone?: string;
  city: string;
  active: boolean;
  createdAt?: string;
}

interface Survey {
  _id: string;
  id: string;
  title: string;
  description?: string;
  status: SurveyStatus;
  createdAt: string;
  updatedAt: string;
  startDate?: string;
  endDate?: string;
  isAnonymous: boolean;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt?: string;
}

export default function CompanyDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  
  const [company, setCompany] = useState<Company | null>(null);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [searchQuery, setSearchQuery] = useState('');
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Form-Daten für die Einladung
  const [inviteData, setInviteData] = useState({
    email: '',
    name: '',
    role: 'employee',
  });
  
  // Fehler-Zustand
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  useEffect(() => {
    // Wenn nicht angemeldet oder kein Admin, zur Login-Seite weiterleiten
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (session && session.user.role !== 'meditec_admin' && session.user.role !== 'company_admin') {
      router.push('/dashboard');
      return;
    }
    
    // Wenn angemeldet und berechtigter Nutzer, Daten laden
    if (status === 'authenticated' && params.id) {
      fetchCompanyDetails();
    }
  }, [status, session, params.id]);
  
  // Unternehmensdaten und zugehörige Umfragen laden
  const fetchCompanyDetails = async () => {
    try {
      setLoading(true);
      // Unternehmens-ID aus den Parametern holen
      const companyId = Array.isArray(params.id) ? params.id[0] : params.id;
      
      // Umfragen für dieses Unternehmen abrufen
      const response = await fetch(`/api/companies/${companyId}/surveys`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fehler beim Laden der Unternehmensdaten');
      }
      
      const data = await response.json();
      setCompany(data.company);
      setSurveys(data.surveys);
      
      console.log('Unternehmensdaten geladen:', data.company);
      console.log(`${data.surveys.length} Umfragen für dieses Unternehmen gefunden`);
      
      // Mitarbeiterdaten laden
      fetchCompanyUsers(companyId);
    } catch (error: any) {
      console.error('Fehler beim Laden der Unternehmensdaten:', error);
      toast({
        title: "Fehler",
        description: error.message || "Die Unternehmensdaten konnten nicht geladen werden.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Mitarbeiter des Unternehmens laden
  const fetchCompanyUsers = async (companyId: string | undefined) => {
    if (!companyId) return;
    
    try {
      setUsersLoading(true);
      const response = await fetch(`/api/companies/${companyId}/users`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fehler beim Laden der Mitarbeiterdaten');
      }
      
      const userData = await response.json();
      setUsers(userData);
      
      console.log(`${userData.length} Mitarbeiter für dieses Unternehmen gefunden`);
    } catch (error: any) {
      console.error('Fehler beim Laden der Mitarbeiterdaten:', error);
      toast({
        title: "Fehler",
        description: error.message || "Die Mitarbeiterdaten konnten nicht geladen werden.",
        variant: "destructive",
      });
    } finally {
      setUsersLoading(false);
    }
  };
  
  // Status-Badge für Umfragen
  const getSurveyStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline">Entwurf</Badge>;
      case 'active':
        return <Badge variant="default" className="bg-green-500">Aktiv</Badge>;
      case 'completed':
        return <Badge variant="secondary">Abgeschlossen</Badge>;
      case 'archived':
        return <Badge variant="destructive">Archiviert</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  // Formatierte Datumsanzeige
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Nicht festgelegt';
    return format(new Date(dateString), 'dd. MMMM yyyy', { locale: de });
  };
  
  // Neue Umfrage für dieses Unternehmen erstellen
  const handleCreateSurvey = () => {
    if (company) {
      // Zur Umfrageerstellung navigieren und Unternehmens-ID mitgeben
      router.push(`/admin/surveys/new?companyId=${company._id}`);
    }
  };
  
  // Formular-Änderungen verarbeiten
  const handleInviteChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setInviteData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Fehler zurücksetzen
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };
  
  // Formular validieren
  const validateInviteForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!inviteData.email.trim()) {
      newErrors.email = 'E-Mail ist erforderlich';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteData.email)) {
      newErrors.email = 'Ungültiges E-Mail-Format';
    }
    
    if (!inviteData.name.trim()) {
      newErrors.name = 'Name ist erforderlich';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Benutzer einladen
  const inviteUser = async () => {
    if (!validateInviteForm()) {
      return;
    }
    
    try {
      const response = await fetch(`/api/companies/${company?._id}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inviteData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fehler beim Einladen des Benutzers');
      }
      
      const data = await response.json();
      
      toast({
        title: 'Erfolg',
        description: `Einladung an ${inviteData.email} wurde versendet`,
      });
      
      // Dialog schließen und Formular zurücksetzen
      setIsInviteDialogOpen(false);
      setInviteData({
        email: '',
        name: '',
        role: 'employee',
      });
      
      // Benutzerliste aktualisieren
      setUsers(prevUsers => [...prevUsers, data.user]);
      
    } catch (error: any) {
      console.error('Fehler beim Einladen des Benutzers:', error);
      toast({
        title: 'Fehler',
        description: error.message || 'Benutzer konnte nicht eingeladen werden',
        variant: 'destructive',
      });
    }
  };
  
  // Benutzer löschen
  const deleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      const response = await fetch(`/api/users/${selectedUser._id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fehler beim Löschen des Benutzers');
      }
      
      toast({
        title: 'Erfolg',
        description: `Benutzer ${selectedUser.name} wurde gelöscht`,
      });
      
      // Dialog schließen und Benutzerliste aktualisieren
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
      setUsers(prevUsers => prevUsers.filter(user => user._id !== selectedUser._id));
      
    } catch (error: any) {
      console.error('Fehler beim Löschen des Benutzers:', error);
      toast({
        title: 'Fehler',
        description: error.message || 'Benutzer konnte nicht gelöscht werden',
        variant: 'destructive',
      });
    }
  };
  
  // Formatieren der Rolle für die Anzeige
  const formatRole = (role: string) => {
    switch (role) {
      case 'company_admin':
        return 'Unternehmensadmin';
      case 'employee':
        return 'Mitarbeiter';
      default:
        return role;
    }
  };
  
  // Wenn noch geladen wird, Skeleton anzeigen
  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto py-6 space-y-8">
          <div className="flex justify-between items-center">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-32" />
          </div>
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-full" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }
  
  // Wenn kein Unternehmen gefunden wurde
  if (!company) {
    return (
      <MainLayout>
        <div className="container mx-auto py-6">
          <Card>
            <CardContent className="flex flex-col items-center py-10">
              <Building className="h-16 w-16 text-muted-foreground mb-4" />
              <h2 className="text-2xl font-bold mb-2">Unternehmen nicht gefunden</h2>
              <p className="text-muted-foreground mb-6">
                Das angeforderte Unternehmen konnte nicht gefunden werden.
              </p>
              <Link href="/admin/companies">
                <Button>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Zurück zur Unternehmensübersicht
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
        {/* Kopfzeile mit Zurück-Button und Bearbeiten-Button */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link href="/admin/companies">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">{company.name}</h1>
            <Badge variant={company.active ? "default" : "destructive"} className="ml-2">
              {company.active ? 'Aktiv' : 'Inaktiv'}
            </Badge>
          </div>
          <div className="flex space-x-2">
            <Link href={`/admin/companies/${company._id}/edit`}>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Bearbeiten
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Tabs für verschiedene Inhalte */}
        <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full md:w-[600px] grid-cols-3">
            <TabsTrigger value="details">Unternehmensdaten</TabsTrigger>
            <TabsTrigger value="surveys">Umfragen</TabsTrigger>
            <TabsTrigger value="users">Mitarbeiter</TabsTrigger>
          </TabsList>
          
          {/* Tab: Unternehmensdaten */}
          <TabsContent value="details" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Unternehmensinformationen</CardTitle>
                <CardDescription>Detaillierte Informationen zu {company.name}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="font-medium">Unternehmensname</div>
                        <div>{company.name}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="font-medium">Ansprechpartner</div>
                        <div>{company.contactPerson}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="font-medium">E-Mail</div>
                        <div>{company.email}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {company.phone && (
                      <div className="flex items-start space-x-3">
                        <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <div className="font-medium">Telefon</div>
                          <div>{company.phone}</div>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-start space-x-3">
                      <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="font-medium">Stadt</div>
                        <div>{company.city}</div>
                      </div>
                    </div>
                    
                    {company.createdAt && (
                      <div className="flex items-start space-x-3">
                        <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <div className="font-medium">Erstellt am</div>
                          <div>{formatDate(company.createdAt)}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-6 flex justify-between">
                <Link href={`/admin/companies/${company._id}/users`}>
                  <Button variant="outline">
                    <Users className="h-4 w-4 mr-2" />
                    Benutzer verwalten
                  </Button>
                </Link>
                
                <Button onClick={() => setActiveTab('surveys')}>
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Umfragen anzeigen
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Tab: Umfragen */}
          <TabsContent value="surveys" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Umfragen für {company.name}</CardTitle>
                  <CardDescription>Alle Umfragen, die diesem Unternehmen zugewiesen sind</CardDescription>
                </div>
                <Button onClick={handleCreateSurvey}>
                  <Plus className="h-4 w-4 mr-2" />
                  Neue Umfrage
                </Button>
              </CardHeader>
              <CardContent>
                {surveys.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Titel</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Zeitraum</TableHead>
                          <TableHead>Anonymisiert</TableHead>
                          <TableHead>Aktionen</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {surveys.map((survey) => (
                          <TableRow key={survey._id}>
                            <TableCell className="font-medium">
                              <div className="flex flex-col">
                                <span>{survey.title}</span>
                                {survey.description && (
                                  <span className="text-sm text-muted-foreground truncate max-w-xs">
                                    {survey.description}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{getSurveyStatusBadge(survey.status)}</TableCell>
                            <TableCell>
                              <div className="flex flex-col text-sm">
                                <span>Start: {formatDate(survey.startDate)}</span>
                                <span>Ende: {formatDate(survey.endDate)}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {survey.isAnonymous ? (
                                <Badge variant="outline" className="bg-blue-100 text-blue-800">Ja</Badge>
                              ) : (
                                <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Nein</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Link href={`/admin/surveys/${survey._id}/edit`}>
                                  <Button variant="outline" size="sm">
                                    <Edit className="h-4 w-4 mr-1" />
                                    Bearbeiten
                                  </Button>
                                </Link>
                                <Link href={`/admin/surveys/${survey._id}`}>
                                  <Button variant="outline" size="sm">
                                    <FileText className="h-4 w-4 mr-1" />
                                    Details
                                  </Button>
                                </Link>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Keine Umfragen gefunden</h3>
                    <p className="text-muted-foreground mb-6">
                      Diesem Unternehmen wurden noch keine Umfragen zugewiesen.
                    </p>
                    <Button onClick={handleCreateSurvey}>
                      <Plus className="h-4 w-4 mr-2" />
                      Umfrage erstellen
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Tab: Mitarbeiter */}
          <TabsContent value="users" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Mitarbeiter von {company.name}</CardTitle>
                  <CardDescription>Alle Benutzer, die diesem Unternehmen zugeordnet sind</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="relative w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      type="search"
                      placeholder="Suchen..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  <Button onClick={() => setIsInviteDialogOpen(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Benutzer einladen
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, index) => (
                      <Skeleton key={index} className="h-10 w-full" />
                    ))}
                  </div>
                ) : users.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>E-Mail</TableHead>
                          <TableHead>Rolle</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Registriert am</TableHead>
                          <TableHead>Aktionen</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user) => (
                          <TableRow key={user._id}>
                            <TableCell className="font-medium">{user.name}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              {user.role === 'company_admin' ? (
                                <Badge className="bg-blue-500">Admin</Badge>
                              ) : user.role === 'employee' ? (
                                <Badge variant="outline">Mitarbeiter</Badge>
                              ) : (
                                <Badge variant="secondary">{user.role}</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {user.active ? (
                                <Badge variant="outline" className="bg-green-100 text-green-800">Aktiv</Badge>
                              ) : (
                                <Badge variant="outline" className="bg-red-100 text-red-800">Inaktiv</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {user.createdAt ? formatDate(user.createdAt) : 'Unbekannt'}
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Link href={`/admin/users/${user._id}/edit`}>
                                  <Button variant="outline" size="sm">
                                    <Edit className="h-4 w-4 mr-1" />
                                    Bearbeiten
                                  </Button>
                                </Link>
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setIsDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Löschen
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Keine Mitarbeiter gefunden</h3>
                    <p className="text-muted-foreground mb-4">
                      Für dieses Unternehmen wurden noch keine Benutzer angelegt.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Dialog für Benutzereinladung */}
      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neuen Benutzer einladen</DialogTitle>
            <DialogDescription>
              Senden Sie eine Einladung an einen neuen Benutzer für dieses Unternehmen.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Name
              </label>
              <Input
                id="name"
                name="name"
                placeholder="Max Mustermann"
                value={inviteData.name}
                onChange={handleInviteChange}
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                E-Mail
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="max.mustermann@example.com"
                value={inviteData.email}
                onChange={handleInviteChange}
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <label htmlFor="role" className="text-sm font-medium">
                Rolle
              </label>
              <select
                id="role"
                name="role"
                value={inviteData.role}
                onChange={handleInviteChange}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              >
                <option value="employee">Mitarbeiter</option>
                <option value="company_admin">Administrator</option>
              </select>
            </div>
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Abbrechen</Button>
            </DialogClose>
            <Button onClick={inviteUser}>Einladung senden</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog für Benutzer löschen */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Benutzer löschen</DialogTitle>
            <DialogDescription>
              Sind Sie sicher, dass Sie diesen Benutzer löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {selectedUser && (
              <div className="space-y-2">
                <p><strong>Name:</strong> {selectedUser.name}</p>
                <p><strong>E-Mail:</strong> {selectedUser.email}</p>
                <p><strong>Rolle:</strong> {formatRole(selectedUser.role)}</p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Abbrechen</Button>
            </DialogClose>
            <Button variant="destructive" onClick={deleteUser}>Löschen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
