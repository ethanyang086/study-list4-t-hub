import { useState } from 'react';
import { Article, Category } from '../types';
import { ArticleCard } from './ArticleCard';

const CATEGORIES: Category[] = ['AI编程', 'AI动态', '文哲史', '旅游', '活动展览', '工作思路', '其他'];

interface ArticleListProps {
  articles: Article[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, article: Partial<Article>) => void;
}

export const ArticleList: React.FC<ArticleListProps> = ({
  articles,
  onDelete,
  onUpdate,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<Category | 'all'>('all');

  const filteredArticles = filterCategory === 'all'
    ? articles
    : articles.filter(a => a.category === filterCategory);

  const getCategoryCount = (category: Category): number => {
    return articles.filter(a => a.category === category).length;
  };

  const handleOpenUrl = (url: string) => {
    window.open(url, '_blank');
  };

  const handleEdit = (article: Article) => {
    setEditingId(article.id);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  return (
    <div className="article-list-section">
      <div className="list-header">
        <h2>收藏列表</h2>
        <div className="filter-selector">
          <div className="filter-buttons">
            <button
              type="button"
              className={`filter-button ${filterCategory === 'all' ? 'active' : ''}`}
              onClick={() => setFilterCategory('all')}
            >
              全部 ({articles.length})
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`filter-button ${filterCategory === cat ? 'active' : ''}`}
                onClick={() => setFilterCategory(cat)}
              >
                {cat} ({getCategoryCount(cat)})
              </button>
            ))}
          </div>
        </div>
      </div>

      {filteredArticles.length === 0 ? (
        <div className="empty-state">
          <p>暂无收藏文章</p>
        </div>
      ) : (
        <div className="articles-list">
          {filteredArticles.map((article) => (
            editingId === article.id ? (
              <div key={article.id} className="edit-card-wrapper">
                <ArticleCard
                  article={article}
                  mode="edit"
                  onUpdate={(updated) => {
                    onUpdate(article.id, updated);
                    setEditingId(null);
                  }}
                  onCancel={handleCancelEdit}
                />
              </div>
            ) : (
              <div key={article.id} className="article-list-item">
                <div className="item-main" onClick={() => handleOpenUrl(article.url)}>
                  <div className="item-meta">
                    <span className="item-category">{article.category}</span>
                    {article.source && <span className="item-source">{article.source}</span>}
                    {article.publishTime && <span className="item-time">{article.publishTime}</span>}
                  </div>
                  <h3 className="item-title">{article.title}</h3>
                  <p className="item-summary">{article.summary}</p>
                  {article.notes && (
                    <div className="item-notes">
                      <strong>读后笔记：</strong>
                      <p>{article.notes}</p>
                    </div>
                  )}
                  {article.tags.length > 0 && (
                    <div className="item-tags">
                      {article.tags.map((tag, idx) => (
                        <span key={idx} className="item-tag">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="item-actions">
                  <button
                    type="button"
                    className="action-button edit"
                    onClick={() => handleEdit(article)}
                  >
                    编辑
                  </button>
                  <button
                    type="button"
                    className="action-button delete"
                    onClick={() => onDelete(article.id)}
                  >
                    删除
                  </button>
                </div>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
};
