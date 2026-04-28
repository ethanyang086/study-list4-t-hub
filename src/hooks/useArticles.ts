import { useState, useEffect, useCallback } from 'react';
import { Article, Category } from '../types';
import { storageService } from '../services/storage';

export const useArticles = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [filterCategory, setFilterCategory] = useState<Category | 'all'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadArticles = async () => {
      const loadedArticles = await storageService.getArticles();
      setArticles(loadedArticles);
      setLoading(false);
    };
    loadArticles();
  }, []);

  const filteredArticles = filterCategory === 'all'
    ? articles
    : articles.filter(a => a.category === filterCategory);

  const addArticle = useCallback(async (article: Article) => {
    await storageService.addArticle(article);
    const updatedArticles = await storageService.getArticles();
    setArticles(updatedArticles);
  }, []);

  const updateArticle = useCallback(async (id: string, updatedArticle: Partial<Article>) => {
    await storageService.updateArticle(id, updatedArticle);
    const updatedArticles = await storageService.getArticles();
    setArticles(updatedArticles);
  }, []);

  const deleteArticle = useCallback(async (id: string) => {
    await storageService.deleteArticle(id);
    const updatedArticles = await storageService.getArticles();
    setArticles(updatedArticles);
  }, []);

  return {
    articles: filteredArticles,
    allArticles: articles,
    filterCategory,
    setFilterCategory,
    addArticle,
    updateArticle,
    deleteArticle,
    loading,
  };
};
