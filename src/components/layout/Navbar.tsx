'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '../ui/button';
import { Menu, LayoutDashboard, Building2, FileSpreadsheet, Users, Shield, BookOpen, LogOut, User, Settings } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { NavLink } from '@/components/ui/nav-link';

const Navbar: React.FC = () => {
  const { data: session, status } = useSession();
  const isLoading = status === 'loading';
  
  return (
    <header className="bg-white border-b sticky top-0 z-40 w-full backdrop-blur-sm bg-white/90 supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto flex justify-between items-center h-16 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-6">
          <Link href="/" className="flex items-center">
            <div className="relative h-10 w-32">
              <Image 
                src="/meditec-logo.png" 
                alt="Meditec Logo" 
                fill
                style={{ objectFit: 'contain' }}
                priority
              />
            </div>
          </Link>
          
          {session && session.user && (
            <>
              <nav className="hidden md:flex items-center space-x-1">
                {session.user.role === 'meditec_admin' && (
                  <>
                    <NavLink href="/admin/dashboard">
                      <LayoutDashboard className="h-4 w-4" />
                      <span>Dashboard</span>
                    </NavLink>
                    <NavLink href="/admin/companies">
                      <Building2 className="h-4 w-4" />
                      <span>Unternehmen</span>
                    </NavLink>
                    <NavLink href="/admin/surveys">
                      <FileSpreadsheet className="h-4 w-4" />
                      <span>Umfragen</span>
                    </NavLink>

                    <NavLink href="/admin/meditec-admins">
                      <Shield className="h-4 w-4" />
                      <span>Administratoren</span>
                    </NavLink>
                    <NavLink href="/admin/question-catalog">
                      <BookOpen className="h-4 w-4" />
                      <span>Fragenkatalog</span>
                    </NavLink>
                  </>
                )}
                
                {session.user.role === 'company_admin' && (
                  <>
                    <Link href="/company/dashboard" className="text-gray-600 hover:text-primary font-medium px-3 py-2 rounded-md hover:bg-gray-50 transition-colors">
                      Dashboard
                    </Link>
                    <Link href="/company/employees" className="text-gray-600 hover:text-primary font-medium px-3 py-2 rounded-md hover:bg-gray-50 transition-colors">
                      Mitarbeiter
                    </Link>
                    <Link href="/company/surveys" className="text-gray-600 hover:text-primary font-medium px-3 py-2 rounded-md hover:bg-gray-50 transition-colors">
                      Umfragen
                    </Link>
                  </>
                )}
                
                {session.user.role === 'employee' && (
                  <Link href="/surveys" className="text-gray-600 hover:text-primary font-medium px-3 py-2 rounded-md hover:bg-gray-50 transition-colors">
                    Meine Umfragen
                  </Link>
                )}
              </nav>
              
              {/* Mobile Menu */}
              <div className="md:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="px-2">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56 p-1">
                    {session.user.role === 'meditec_admin' && (
                      <>
                        <DropdownMenuItem asChild className="flex items-center py-2 px-3 cursor-pointer">
                          <Link href="/admin/dashboard" className="w-full flex items-center">
                            <LayoutDashboard className="h-4 w-4 mr-2 text-primary" />
                            <span>Dashboard</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="flex items-center py-2 px-3 cursor-pointer">
                          <Link href="/admin/companies" className="w-full flex items-center">
                            <Building2 className="h-4 w-4 mr-2 text-primary" />
                            <span>Unternehmen</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="flex items-center py-2 px-3 cursor-pointer">
                          <Link href="/admin/surveys" className="w-full flex items-center">
                            <FileSpreadsheet className="h-4 w-4 mr-2 text-primary" />
                            <span>Umfragen</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />

                        <DropdownMenuItem asChild className="flex items-center py-2 px-3 cursor-pointer">
                          <Link href="/admin/meditec-admins" className="w-full flex items-center">
                            <Shield className="h-4 w-4 mr-2 text-primary" />
                            <span>Administratoren</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild className="flex items-center py-2 px-3 cursor-pointer">
                          <Link href="/admin/question-catalog" className="w-full flex items-center">
                            <BookOpen className="h-4 w-4 mr-2 text-primary" />
                            <span>Fragenkatalog</span>
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    
                    {session.user.role === 'company_admin' && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link href="/company/dashboard" className="w-full">
                            Dashboard
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/company/employees" className="w-full">
                            Mitarbeiter
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/company/surveys" className="w-full">
                            Umfragen
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    
                    {session.user.role === 'employee' && (
                      <DropdownMenuItem asChild>
                        <Link href="/surveys" className="w-full">
                          Meine Umfragen
                        </Link>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {isLoading ? (
            <div className="h-10 w-24 bg-gray-200 animate-pulse rounded"></div>
          ) : session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="flex items-center gap-2 hover:bg-gray-100 hover:text-primary-foreground rounded-full px-3 py-2"
                >
                  <span className="font-medium truncate max-w-[120px] hidden sm:inline">
                    {session.user?.name || session.user?.email}
                  </span>
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    {session.user?.name ? (
                      <span className="text-sm font-semibold">
                        {session.user.name.charAt(0).toUpperCase()}
                      </span>
                    ) : (
                      <Users className="h-5 w-5" />
                    )}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-1">
                <div className="px-3 py-2 text-sm">
                  <p className="font-medium">{session.user?.name || 'Benutzer'}</p>
                  <p className="text-xs text-muted-foreground mt-1 truncate">{session.user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="flex items-center py-2 px-3 cursor-pointer">
                  <Link href="/settings" className="w-full flex items-center">
                    <Settings className="h-4 w-4 mr-2 text-primary" />
                    <span>Einstellungen</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="flex items-center py-2 px-3 cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => signOut({ callbackUrl: '/' })}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  <span>Abmelden</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/auth/login">
              <Button>Anmelden</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
