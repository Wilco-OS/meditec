'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

const NavLink: React.FC<NavLinkProps> = ({ href, children, className }) => {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={cn(
        "relative px-3 py-1.5 text-sm font-medium transition-all duration-200 rounded-md group flex items-center gap-2",
        isActive
          ? "text-primary bg-primary/10"
          : "text-gray-600 hover:text-primary hover:bg-gray-100/50",
        className
      )}
    >
      {children}
      {isActive && (
        <span className="absolute bottom-0 left-0 h-0.5 w-full bg-primary transform rounded-full" />
      )}
    </Link>
  );
};

export { NavLink };
