import { Article } from '../types';

const API_BASE = 'http://localhost:3001/api';

export const storageService = {
  getArticles: async (): Promise<Article[]> => {
    try {
      const response = await fetch(`${API_BASE}/articles`);
      const articles = await response.json();
      return articles.sort((a, b) => b.updatedAt - a.updatedAt);
    } catch (error) {
      console.error('获取文章失败:', error);
      return [];
    }
  },

  addArticle: async (article: Article): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE}/articles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(article),
      });
      return response.ok;
    } catch (error) {
      console.error('添加文章失败:', error);
      return false;
    }
  },

  updateArticle: async (id: string, updatedArticle: Partial<Article>): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE}/articles/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedArticle),
      });
      return response.ok;
    } catch (error) {
      console.error('更新文章失败:', error);
      return false;
    }
  },

  deleteArticle: async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE}/articles/${id}`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch (error) {
      console.error('删除文章失败:', error);
      return false;
    }
  },

  getArticleById: async (id: string): Promise<Article | undefined> => {
    try {
      const articles = await storageService.getArticles();
      return articles.find(a => a.id === id);
    } catch (error) {
      console.error('获取文章失败:', error);
      return undefined;
    }
  },

  exportToFile: (): void => {
    storageService.getArticles().then(articles => {
      const dataStr = JSON.stringify(articles, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = 'study-articles.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });
  },

  importFromFile: async (file: File): Promise<{ success: boolean; count: number; error?: string }> => {
    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          const articles = JSON.parse(content);

          if (!Array.isArray(articles)) {
            resolve({ success: false, count: 0, error: '文件格式错误：期望JSON数组' });
            return;
          }

          const validArticles = articles.filter(a =>
            a.id && a.title && a.url && a.createdAt
          );

          if (validArticles.length === 0) {
            resolve({ success: false, count: 0, error: '文件中没有有效的数据' });
            return;
          }

          for (const article of validArticles) {
            await storageService.addArticle(article);
          }

          resolve({ success: true, count: validArticles.length });
        } catch (error) {
          resolve({ success: false, count: 0, error: '文件解析失败：' + (error as Error).message });
        }
      };

      reader.onerror = () => {
        resolve({ success: false, count: 0, error: '文件读取失败' });
      };

      reader.readAsText(file);
    });
  }
};
