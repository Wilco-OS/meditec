'use client';

// Eine modifizierte Version des SurveyEditor mit zusätzlichen key Props
// Diese Datei hilft bei der Identifizierung und Behebung fehlender key Props

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
// Andere Importe hier...

// Hilfsfunktion zum Hinzufügen von key Props zu Arrays
function addKeysToSurveyBlocks(blocks) {
  if (!blocks) return [];
  
  return blocks.map((block, index) => {
    // Stelle sicher, dass der Block eine ID hat
    const blockWithId = block.id ? block : { ...block, id: uuidv4() };
    
    // Stelle sicher, dass alle Fragen IDs haben
    const questionsWithIds = blockWithId.questions?.map((question, qIndex) => {
      const questionWithId = question.id ? question : { ...question, id: uuidv4() };
      
      // Stelle sicher, dass alle Optionen IDs haben (für Multiple-Choice)
      const optionsWithIds = questionWithId.options?.map((option, optIndex) => {
        return option.id ? option : { ...option, id: uuidv4() };
      }) || [];
      
      return {
        ...questionWithId,
        options: optionsWithIds
      };
    }) || [];
    
    return {
      ...blockWithId,
      questions: questionsWithIds
    };
  });
}

// Diese Funktion kann in die bestehende Komponente integriert werden,
// um sicherzustellen, dass alle Arrays in Ihrer Komponente eindeutige keys haben
