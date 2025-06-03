'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { User, Mail, Search, ArrowLeft, Trash2, Plus, UserPlus } from 'lucide-react';

// Typendefinition für einen Benutzer
interface CompanyUser {
  _id: string;
  name: string;
  email: string;
  role: 'company_admin' | 'employee';
  active: boolean;
  createdAt: string;
}

// Typendefinition für ein Unternehmen
interface Company {
  _id: string;
  name: string;
  contactPerson: string;
  email: string;
}

export default function CompanyUsersPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = params.id as string;
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<CompanyUser | null>(null);
  
  // Form-Daten für die Einladung
  const [inviteData, setInviteData] = useState({
    email: '',
    name: '',
    role: 'employee',
  });
  
  // Fehler-Zustand
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Lade Unternehmensdaten und Benutzer
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Unternehmensdaten laden
        const companyRes = await fetch(`/api/companies/${companyId}`);
        if (!companyRes.ok) {
          throw new Error('Unternehmen konnte nicht geladen werden');
        }
        const companyData = await companyRes.json();
        setCompany(companyData);
        
        // Benutzer des Unternehmens laden
        const usersRes = await fetch(`/api/companies/${companyId}/users`);
        if (!usersRes.ok) {
          throw new Error('Benutzer konnten nicht geladen werden');
        }
        const usersData = await usersRes.json();
        setUsers(usersData);
      } catch (error: any) {
        console.error('Fehler beim Laden der Daten:', error);
        toast({
          title: 'Fehler',
          description: error.message || 'Daten konnten nicht geladen werden',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [companyId, toast]);
  
  // Filter-Funktion für die Suche
  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase();
    return (
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.role.toLowerCase().includes(query)
    );
  });
  
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
      const response = await fetch(`/api/companies/${companyId}/invite`, {
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
  
  return (
    <MainLayout>
      <div className="container mx-auto py-8">
        <div className="flex items-center mb-6">
          <Link href="/admin/companies" className="mr-4">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">
            {isLoading ? (
              <Skeleton className="h-8 w-64" />
            ) : (
              `Benutzer von ${company?.name || 'Unternehmen'}`
            )}
          </h1>
        </div>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Mitarbeiter und Administratoren</CardTitle>
              <CardDescription>
                Verwalten Sie die Benutzer dieses Unternehmens
              </CardDescription>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Suchen..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Button onClick={() => setIsInviteDialogOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Benutzer einladen
              </Button>
            </div>
          </CardHeader>
          
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <User className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium">Keine Benutzer gefunden</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchQuery 
                    ? 'Keine Benutzer entsprechen Ihrer Suche' 
                    : 'Dieses Unternehmen hat noch keine Benutzer'}
                </p>
                {searchQuery ? (
                  <Button 
                    variant="outline" 
                    className="mt-4" 
                    onClick={() => setSearchQuery('')}
                  >
                    Suche zurücksetzen
                  </Button>
                ) : (
                  <Button 
                    className="mt-4" 
                    onClick={() => setIsInviteDialogOpen(true)}
                  >
                    Ersten Benutzer einladen
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>E-Mail</TableHead>
                    <TableHead>Rolle</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{formatRole(user.role)}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          user.active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.active ? 'Aktiv' : 'Inaktiv'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => {
                              setSelectedUser(user);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        
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
                  E-Mail-Adresse
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="max@beispiel.de"
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
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="employee">Mitarbeiter</option>
                  <option value="company_admin">Unternehmensadmin</option>
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
      </div>
    </MainLayout>
  );
}
