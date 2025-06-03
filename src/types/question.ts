// Gemeinsame Typen für die Fragen-Verwaltung

export enum QuestionType {
  YES_NO = 'yes_no',
  TEXT = 'text',
  MULTIPLE_CHOICE = 'multiple_choice',
  AGREE_DISAGREE = 'agree_disagree',
  RATING = 'rating'
}

export interface IQuestionCategory {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IQuestionCatalogItem {
  _id: string;
  text: string;
  type: QuestionType;
  required: boolean;
  categoryId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
