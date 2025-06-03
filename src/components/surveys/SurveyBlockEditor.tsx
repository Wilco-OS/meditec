'use client';

import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Plus, Trash2, ArrowUp, ArrowDown, MoveVertical, Edit, FilePlus, Database } from 'lucide-react';
import mongoose from 'mongoose';
import { ISurveyBlock, ISurveyQuestion } from '@/models/Survey';
import { QuestionType } from '@/types/question';
import BlockQuestionEditor from './BlockQuestionEditor';
import QuestionCatalogSelector from './QuestionCatalogSelector';

interface SurveyBlockEditorProps {
  blocks: ISurveyBlock[];
  onChange: (blocks: ISurveyBlock[]) => void;
}

export default function SurveyBlockEditor({ blocks, onChange }: SurveyBlockEditorProps) {
  const [expandedBlocks, setExpandedBlocks] = useState<string[]>([]);
  const [draggingBlock, setDraggingBlock] = useState<string | null>(null);
  const [isCatalogSelectorOpen, setIsCatalogSelectorOpen] = useState(false);
  const [currentBlockId, setCurrentBlockId] = useState<string | null>(null);
  
  // Beim ersten Rendern des leeren Editors einen Block hinzufügen
  useEffect(() => {
    if (blocks.length === 0) {
      addNewBlock();
    }
  }, []);
  
  // Neuen Block hinzufügen
  const addNewBlock = () => {
    const newBlockId = uuidv4();
    const newBlock: ISurveyBlock = {
      id: newBlockId,
      title: `Block ${blocks.length + 1}`,
      description: '',
      order: blocks.length,
      questions: []
    };
    
    const updatedBlocks = [...blocks, newBlock];
    onChange(updatedBlocks);
    
    // Automatisch den neuen Block öffnen
    setExpandedBlocks(prev => [...prev, newBlockId]);
  };
  
  // Block bearbeiten
  const updateBlock = (blockId: string, field: keyof ISurveyBlock, value: any) => {
    const updatedBlocks = blocks.map(block => {
      if (block.id === blockId) {
        return { ...block, [field]: value };
      }
      return block;
    });
    
    onChange(updatedBlocks);
  };
  
  // Block löschen
  const deleteBlock = (blockId: string) => {
    const updatedBlocks = blocks.filter(block => block.id !== blockId)
      .map((block, index) => ({ ...block, order: index }));
    
    onChange(updatedBlocks);
    
    // Aus expandierten Blöcken entfernen
    setExpandedBlocks(prev => prev.filter(id => id !== blockId));
  };
  
  // Block nach oben verschieben
  const moveBlockUp = (blockId: string) => {
    const blockIndex = blocks.findIndex(block => block.id === blockId);
    if (blockIndex <= 0) return;
    
    const updatedBlocks = [...blocks];
    const temp = updatedBlocks[blockIndex];
    updatedBlocks[blockIndex] = { ...updatedBlocks[blockIndex - 1], order: blockIndex };
    updatedBlocks[blockIndex - 1] = { ...temp, order: blockIndex - 1 };
    
    onChange(updatedBlocks);
  };
  
  // Block nach unten verschieben
  const moveBlockDown = (blockId: string) => {
    const blockIndex = blocks.findIndex(block => block.id === blockId);
    if (blockIndex >= blocks.length - 1) return;
    
    const updatedBlocks = [...blocks];
    const temp = updatedBlocks[blockIndex];
    updatedBlocks[blockIndex] = { ...updatedBlocks[blockIndex + 1], order: blockIndex };
    updatedBlocks[blockIndex + 1] = { ...temp, order: blockIndex + 1 };
    
    onChange(updatedBlocks);
  };
  
  // Fragen eines Blocks aktualisieren
  const updateBlockQuestions = (blockId: string, questions: ISurveyQuestion[]) => {
    const updatedBlocks = blocks.map(block => {
      if (block.id === blockId) {
        return { ...block, questions };
      }
      return block;
    });
    
    onChange(updatedBlocks);
  };
  
  // Fragen aus dem Katalog hinzufügen
  const addQuestionsFromCatalog = (blockId: string) => {
    setCurrentBlockId(blockId);
    setIsCatalogSelectorOpen(true);
  };
  
  // Ausgewählte Katalogfragen zu einem Block hinzufügen
  const handleSelectedCatalogQuestions = (selectedQuestions: Array<{
    _id: string;
    text: string;
    type: QuestionType;
    required: boolean;
    categoryId: string;
    isActive: boolean;
  }>) => {
    if (!currentBlockId) return;
    
    const block = blocks.find(b => b.id === currentBlockId);
    if (!block) return;
    
    // Konvertiere Katalogfragen in ISurveyQuestion-Format
    const newQuestions: ISurveyQuestion[] = selectedQuestions.map((q, index) => ({
      id: uuidv4(),
      text: q.text,
      type: q.type as QuestionType,
      required: q.required,
      catalogRef: new mongoose.Types.ObjectId(q._id),
      order: block.questions.length + index
    }));
    
    // Aktualisiere den Block mit den neuen Fragen
    const updatedQuestions = [...block.questions, ...newQuestions];
    updateBlockQuestions(currentBlockId, updatedQuestions);
    
    // Dialog schließen
    setIsCatalogSelectorOpen(false);
    setCurrentBlockId(null);
  };
  
  // Accordion-Status umschalten
  const toggleBlock = (blockId: string) => {
    setExpandedBlocks(prev => {
      if (prev.includes(blockId)) {
        return prev.filter(id => id !== blockId);
      } else {
        return [...prev, blockId];
      }
    });
  };
  
  return (
    <div className="space-y-4">
      {blocks.length === 0 ? (
        <div className="text-center py-8">
          <h3 className="mt-2 text-lg font-medium">Keine Blöcke vorhanden</h3>
          <p className="mt-1 text-sm text-gray-500">
            Beginnen Sie mit dem Hinzufügen eines neuen Blocks
          </p>
          <Button 
            className="mt-4" 
            onClick={addNewBlock}
          >
            <Plus className="mr-2 h-4 w-4" />
            Block hinzufügen
          </Button>
        </div>
      ) : (
        <Accordion
          type="multiple"
          value={expandedBlocks}
          className="space-y-4"
        >
          {blocks.map((block, index) => (
            <AccordionItem
              key={block.id}
              value={block.id}
              className="border rounded-lg overflow-hidden"
              onDoubleClick={() => toggleBlock(block.id)}
              draggable
              onDragStart={() => setDraggingBlock(block.id)}
              onDragOver={(e: React.DragEvent) => e.preventDefault()}
              onDragEnd={() => setDraggingBlock(null)}
              data-state={draggingBlock === block.id ? 'dragging' : 'idle'}
            >
              <AccordionTrigger className="px-4 py-2 hover:no-underline">
                <div className="flex items-center w-full">
                  <MoveVertical className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="font-semibold flex-1 text-left">
                    {block.title} 
                    <span className="ml-2 text-sm text-gray-500">
                      ({block.questions.length} Fragen)
                    </span>
                  </span>
                  <div className="flex items-center space-x-2 ml-4" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => moveBlockUp(block.id)}
                      disabled={index === 0}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => moveBlockDown(block.id)}
                      disabled={index === blocks.length - 1}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => deleteBlock(block.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pt-2 pb-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`block-title-${block.id}`}>Titel</Label>
                      <Input
                        id={`block-title-${block.id}`}
                        value={block.title}
                        onChange={(e) => updateBlock(block.id, 'title', e.target.value)}
                        placeholder="Blocktitel"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`block-description-${block.id}`}>Beschreibung</Label>
                      <Textarea
                        id={`block-description-${block.id}`}
                        value={block.description || ''}
                        onChange={(e) => updateBlock(block.id, 'description', e.target.value)}
                        placeholder="Optionale Beschreibung"
                        rows={1}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Fragen</Label>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addQuestionsFromCatalog(block.id)}
                        >
                          <Database className="mr-2 h-4 w-4" />
                          Aus Katalog
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newQuestion: ISurveyQuestion = {
                              id: uuidv4(),
                              text: '',
                              type: QuestionType.YES_NO,
                              required: true,
                              order: block.questions.length
                            };
                            updateBlockQuestions(block.id, [...block.questions, newQuestion]);
                          }}
                        >
                          <FilePlus className="mr-2 h-4 w-4" />
                          Neue Frage
                        </Button>
                      </div>
                    </div>
                    
                    <BlockQuestionEditor
                      questions={block.questions}
                      onChange={(questions) => updateBlockQuestions(block.id, questions)}
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
      
      <div className="flex justify-center mt-6">
        <Button 
          variant="outline" 
          onClick={addNewBlock}
        >
          <Plus className="mr-2 h-4 w-4" />
          Weiteren Block hinzufügen
        </Button>
      </div>
      
      {/* Dialog zum Auswählen von Fragen aus dem Katalog */}
      <QuestionCatalogSelector
        isOpen={isCatalogSelectorOpen}
        onClose={() => {
          setIsCatalogSelectorOpen(false);
          setCurrentBlockId(null);
        }}
        onConfirm={handleSelectedCatalogQuestions}
      />
    </div>
  );
}
