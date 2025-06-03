'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Users, Trash2, Plus, User, Shield, AlertCircle } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: 'meditec_admin';
  active: boolean;
  createdAt: string;
  emailVerified?: boolean;
}

export default function MeditecAdminsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  
  // Formular-Zustand für neuen Admin
  const [newAdmin, setNewAdmin] = useState({
    name: '',
    email: '',
  });
  const [formErrors, setFormErrors] = useState({
    name: '',
    email: '',
  });

  // Meditec-Admins laden
  useEffect(() => {
    if (status === 'authenticated') {
      if (session?.user?.role === 'meditec_admin') {
        fetchAdmins();
      } else {
        // Weiterleitung, falls kein Admin
        router.push('/');
        toast({
          title: "Zugriff verweigert",
          description: "Sie haben keine Berechtigung, auf diese Seite zuzugreifen.",
          variant: "destructive",
        });
      }
    }
  }, [status, session]);

  // Meditec-Admins vom Server abrufen
  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/users?role=meditec_admin&limit=100');
      
      if (!response.ok) {
        throw new Error('Fehler beim Laden der Administratoren');
      }
      
      const data = await response.json();
      setAdmins(data.users);
    } catch (error) {
      console.error('Fehler beim Laden der Administratoren:', error);
      toast({
        title: "Fehler",
        description: "Die Administratoren konnten nicht geladen werden.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Formular-Validierung
  const validateForm = () => {
    let valid = true;
    const errors = { name: '', email: '' };

    if (!newAdmin.name.trim()) {
      errors.name = 'Name ist erforderlich';
      valid = false;
    }

    if (!newAdmin.email.trim()) {
      errors.email = 'E-Mail ist erforderlich';
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newAdmin.email)) {
      errors.email = 'Bitte geben Sie eine gültige E-Mail-Adresse ein';
      valid = false;
    }

    setFormErrors(errors);
    return valid;
  };

  // Neuen Admin hinzufügen
  const handleAddAdmin = async () => {
    if (!validateForm()) return;

    setIsAddingAdmin(true);
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newAdmin.name,
          email: newAdmin.email,
          role: 'meditec_admin',
          sendInvitation: true
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fehler beim Erstellen des Administrators');
      }

      const data = await response.json();
      await fetchAdmins();
      setIsAddingAdmin(false);
      setNewAdmin({ name: '', email: '' });
      
      // Generiere Einladungs-URL basierend auf dem invitationToken
      const invitationUrl = `${window.location.origin}/admin/invitation?token=${data.user.invitationToken}`;
      
      toast({
        title: "Erfolg",
        description: (
          <div className="space-y-2">
            <p>Administrator wurde erfolgreich erstellt.</p>
            <p className="text-sm">Einladungslink (gültig für 48 Stunden):</p>
            <div className="p-2 bg-gray-100 rounded border text-xs break-all">
              {invitationUrl}
            </div>
            <p className="text-sm italic">Der Admin kann über diesen Link sein Passwort festlegen.</p>
          </div>
        ),
        variant: "default",
        duration: 10000, // 10 Sekunden anzeigen
      });

    } catch (error: any) {
      console.error('Fehler beim Erstellen des Administrators:', error);
      toast({
        title: "Fehler",
        description: error.message || "Der Administrator konnte nicht erstellt werden.",
        variant: "destructive",
      });
    } finally {
      setIsAddingAdmin(false);
    }
  };

  // Admin löschen
  const handleDeleteAdmin = async () => {
    if (!deleteUserId) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/users/${deleteUserId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Fehler beim Löschen des Administrators');
      }

      toast({
        title: "Erfolg",
        description: "Administrator wurde erfolgreich gelöscht.",
      });

      // Admin aus der Liste entfernen und Dialog schließen
      setAdmins(admins.filter(admin => admin._id !== deleteUserId));
      setDeleteUserId(null);

    } catch (error) {
      console.error('Fehler beim Löschen des Administrators:', error);
      toast({
        title: "Fehler",
        description: "Der Administrator konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Meditec-Administratoren</h1>
            <p className="text-muted-foreground">Verwalten Sie die Meditec-Administratoren des Systems</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Neuer Administrator
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Neuen Administrator erstellen</DialogTitle>
                <DialogDescription>
                  Erstellen Sie einen neuen Meditec-Administrator, der Zugriff auf alle Systemfunktionen hat.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="Vollständiger Name"
                    value={newAdmin.name}
                    onChange={(e) => setNewAdmin(prev => ({ ...prev, name: e.target.value }))}
                  />
                  {formErrors.name && (
                    <p className="text-sm text-red-500">{formErrors.name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-Mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@beispiel.de"
                    value={newAdmin.email}
                    onChange={(e) => setNewAdmin(prev => ({ ...prev, email: e.target.value }))}
                  />
                  {formErrors.email && (
                    <p className="text-sm text-red-500">{formErrors.email}</p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Abbrechen</Button>
                </DialogClose>
                <Button 
                  onClick={handleAddAdmin} 
                  disabled={isAddingAdmin}
                >
                  {isAddingAdmin ? 'Wird erstellt...' : 'Administrator erstellen'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="mr-2 h-5 w-5" />
              Administratoren
            </CardTitle>
            <CardDescription>
              Liste aller Meditec-Administratoren mit vollen Systemrechten
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>E-Mail</TableHead>
                      <TableHead>Erstellt am</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {admins.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4">
                          <div className="flex flex-col items-center justify-center text-muted-foreground">
                            <User className="h-10 w-10 mb-2" />
                            <p>Keine Administratoren gefunden</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      admins.map((admin) => (
                        <TableRow key={admin._id}>
                          <TableCell className="font-medium">{admin.name}</TableCell>
                          <TableCell>{admin.email}</TableCell>
                          <TableCell>
                            {admin.createdAt ? 
                              format(new Date(admin.createdAt), 'dd.MM.yyyy', { locale: de }) : 
                              'Unbekannt'
                            }
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              admin.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {admin.active ? 'Aktiv' : 'Inaktiv'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="icon"
                              className="text-red-500 hover:text-red-700"
                              onClick={() => setDeleteUserId(admin._id)}
                              disabled={session?.user?.email === admin.email} // Eigenen Account nicht löschen
                              title={session?.user?.email === admin.email ? 
                                "Sie können Ihren eigenen Account nicht löschen" : 
                                "Administrator löschen"}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bestätigungsdialog für Löschung */}
        {deleteUserId && (
          <Dialog open={!!deleteUserId} onOpenChange={(open) => !open && setDeleteUserId(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <AlertCircle className="mr-2 h-5 w-5 text-red-500" />
                  Administrator löschen
                </DialogTitle>
                <DialogDescription>
                  Sind Sie sicher, dass Sie diesen Administrator löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setDeleteUserId(null)}
                >
                  Abbrechen
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleDeleteAdmin}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Wird gelöscht...' : 'Administrator löschen'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </MainLayout>
  );
}
