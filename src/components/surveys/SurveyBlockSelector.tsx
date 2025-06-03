'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, Trash2 } from 'lucide-react';

interface SurveyBlock {
  id: string;
  title: string;
  description: string;
  order: number;
  questions?: any[];
  restrictToDepartments: boolean;
  departments?: string[];
}

interface SurveyBlockSelectorProps {
  blocks: SurveyBlock[];
  selectedBlockIndex: number;
  onSelectBlock: (index: number) => void;
  onMoveBlockUp: (index: number) => void;
  onDeleteBlock: (index: number) => void;
}

/**
 * Komponente zur Auswahl und Verwaltung von Umfrageblöcken
 * Ermöglicht das Anklicken, Verschieben und Löschen von Blöcken
 */
export function SurveyBlockSelector({
  blocks,
  selectedBlockIndex,
  onSelectBlock,
  onMoveBlockUp,
  onDeleteBlock
}: SurveyBlockSelectorProps) {
  return (
    <div className="space-y-2">
      {blocks.map((block, index) => (
        <div
          key={block.id}
          className={`flex items-center p-2 rounded-md cursor-pointer ${
            selectedBlockIndex === index ? 'bg-primary/10' : 'hover:bg-muted'
          }`}
          onClick={() => onSelectBlock(index)}
        >
          <div className="flex items-center justify-between w-full">
            <span className="flex-1 truncate">{block.title}</span>
            <div className="flex space-x-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveBlockUp(index);
                }}
                disabled={index === 0}
              >
                <ArrowUpDown className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteBlock(index);
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
