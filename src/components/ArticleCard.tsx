import { useState, useEffect } from 'react';
import { ParsedArticleData, Category, Article } from '../types';
import { CategorySelector } from './CategorySelector';
import { TagManager } from './TagManager';
import { translationService } from '../services/translation';
import { llmService } from '../services/llm';

function isEnglishText(text: string): boolean {
  const englishChars = text.match(/[a-zA-Z]/g);
  if (!englishChars || englishChars.length === 0) return false;
  const englishRatio = englishChars.length / text.length;
  return englishRatio > 0.3;
}

interface ArticleCardProps {
  parsedData?: ParsedArticleData;
  article?: Article;
  url?: string;
  onSave?: (article: Omit<Article, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdate?: (article: Partial<Article>) => void;
  onCancel?: () => void;
  mode: 'create' | 'edit';
}

export const ArticleCard: React.FC<ArticleCardProps> = ({
  parsedData,
  article,
  url: propUrl,
  onSave,
  onUpdate,
  onCancel,
  mode,
}) => {
  const [title, setTitle] = useState(mode === 'create' ? (parsedData?.title || '') : (article?.title || ''));
  const [summary, setSummary] = useState(mode === 'create' ? (parsedData?.summary || '') : (article?.summary || ''));
  const [tags, setTags] = useState<string[]>(mode === 'create' ? [] : (article?.tags || []));
  const [category, setCategory] = useState<Category>(mode === 'create' ? 'AI编程' : (article?.category || 'AI编程'));
  const [url, setUrl] = useState(mode === 'create' ? (propUrl || '') : (article?.url || ''));
  const [source, setSource] = useState(mode === 'create' ? (parsedData?.source || '') : (article?.source || ''));
  const [publishTime, setPublishTime] = useState(mode === 'create' ? (parsedData?.publishTime || '') : (article?.publishTime || ''));
  const [notes, setNotes] = useState(mode === 'create' ? '' : (article?.notes || ''));
  const [translating, setTranslating] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);

  useEffect(() => {
    if (mode === 'create' && parsedData?.analyzing && parsedData.content && !analyzed) {
      const doAnalyze = async () => {
        setAnalyzing(true);
        try {
          const result = await llmService.analyzeArticle(
            propUrl || '',
            parsedData.content,
            parsedData.title
          );

          let finalTitle = parsedData.title;
          let finalSummary = result.summary;

          if (isEnglishText(parsedData.title)) {
            finalTitle = await llmService.translateText(parsedData.title);
          }

          if (isEnglishText(result.summary)) {
            finalSummary = await llmService.translateText(result.summary);
          }

          setTitle(finalTitle);
          setSummary(finalSummary);
          setTags(result.tags);
          setCategory(result.suggestedCategory);
          setAnalyzed(true);
        } catch (error) {
          console.error('AI分析失败:', error);
        } finally {
          setAnalyzing(false);
        }
      };
      doAnalyze();
    }
  }, [mode, parsedData?.analyzing, parsedData?.content, analyzed, parsedData?.title, propUrl]);

  const handleTranslate = async () => {
    if (!summary) return;
    setTranslating(true);
    try {
      const translated = await translationService.translate(summary);
      setSummary(translated);
    } finally {
      setTranslating(false);
    }
  };

  const handleSave = () => {
    if (mode === 'create' && onSave) {
      onSave({
        url,
        title,
        summary,
        tags,
        category,
        content: parsedData?.content,
        source,
        publishTime,
        notes,
      });
    } else if (mode === 'edit' && onUpdate && article) {
      onUpdate({
        title,
        summary,
        tags,
        category,
        source,
        publishTime,
        notes,
      });
    }
  };

  return (
    <div className="article-card">
      {mode === 'create' && analyzing && (
        <div className="analyzing-overlay">
          <div className="analyzing-spinner"></div>
          <p>AI正在分析文章，请稍候...</p>
        </div>
      )}

      <div className="form-group">
        <label>标题</label>
        <input
          type="text"
          className="form-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="文章标题"
        />
      </div>

      <div className="form-group">
        <label>链接</label>
        <input
          type="text"
          className="form-input"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="文章链接"
        />
      </div>

      <div className="form-group">
        <label>来源</label>
        <input
          type="text"
          className="form-input"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="文章来源"
        />
      </div>

      <div className="form-group">
        <label>发布时间</label>
        <input
          type="text"
          className="form-input"
          value={publishTime}
          onChange={(e) => setPublishTime(e.target.value)}
          placeholder="发布时间"
        />
      </div>

      <div className="form-group">
        <label>摘要</label>
        <textarea
          className="form-textarea"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="文章摘要，将自动生成或可手动输入"
          rows={5}
        />
      </div>

      <div className="form-group">
        <label>读后笔记</label>
        <textarea
          className="form-textarea"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="添加你的读后思考和想法..."
          rows={4}
        />
      </div>

      <div className="form-group">
        <label>分类</label>
        <CategorySelector
          selected={category}
          onChange={setCategory}
        />
      </div>

      <div className="form-group">
        <label>标签</label>
        <TagManager
          tags={tags}
          onChange={setTags}
        />
      </div>

      <div className="card-actions">
        <button className="cancel-button" onClick={onCancel}>
          取消
        </button>
        <button className="save-button" onClick={handleSave}>
          {mode === 'create' ? '收藏' : '保存修改'}
        </button>
      </div>
    </div>
  );
};
