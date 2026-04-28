export type Category = 'AI编程' | 'AI动态' | '文哲史' | '旅游' | '活动展览' | '工作思路' | '其他';

export interface Article {
  id: string;
  url: string;
  title: string;
  summary: string;
  tags: string[];
  category: Category;
  content?: string;
  source?: string;
  publishTime?: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface ParsedArticleData {
  title: string;
  summary: string;
  content: string;
  source?: string;
  author?: string;
  publishTime?: string;
  analyzing?: boolean;
  suggestedCategory?: Category;
}

export type ParsedData = ParsedArticleData | null;
