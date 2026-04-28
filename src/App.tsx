import { useState, useRef } from 'react';
import { Article, ParsedArticleData } from './types';
import { UrlInput } from './components/UrlInput';
import { ArticleCard } from './components/ArticleCard';
import { ArticleList } from './components/ArticleList';
import { useArticles } from './hooks/useArticles';
import { parserService } from './services/parser';
import { storageService } from './services/storage';
import './index.css';

function App() {
  const { articles, addArticle, updateArticle, deleteArticle } = useArticles();
  const [parsedData, setParsedData] = useState<ParsedArticleData | null>(null);
  const [parsing, setParsing] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');
  const [importMessage, setImportMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    storageService.exportToFile();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await storageService.importFromFile(file);

    if (result.success) {
      setImportMessage(`导入成功！共 ${result.count} 条文摘`);
      window.location.reload();
    } else {
      setImportMessage(`导入失败：${result.error}`);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    setTimeout(() => setImportMessage(''), 3000);
  };

  const handleParse = async (url: string) => {
    setParsing(true);
    setCurrentUrl(url);
    try {
      const data = await parserService.parseUrl(url);
      setParsedData(data);
    } catch (error) {
      console.error('解析失败:', error);
      setParsedData({
        title: '解析失败，请检查链接或使用代理服务',
        summary: '无法解析该网页内容，请确保网络连接正常',
        content: '',
        source: '',
        analyzing: false,
      });
    } finally {
      setParsing(false);
    }
  };

  const handleSave = (articleData: Omit<Article, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newArticle: Article = {
      ...articleData,
      id: Date.now().toString(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    addArticle(newArticle);
    setParsedData(null);
    setCurrentUrl('');
  };

  const handleCancel = () => {
    setParsedData(null);
    setCurrentUrl('');
  };

  return (
    <div className="container">
      <header className="header">
        <div className="header-content">
          <div>
            <h1>📚 学习文摘收藏</h1>
            <p>AI智能分析，一键收藏你喜欢的文章</p>
          </div>
          <div className="header-actions">
            <button onClick={handleExport} className="btn-secondary">
              导出数据
            </button>
            <button onClick={handleImportClick} className="btn-secondary">
              导入数据
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </div>
        </div>
        {importMessage && (
          <div className="import-message">{importMessage}</div>
        )}
      </header>

      <UrlInput onParse={handleParse} loading={parsing} />

      {parsedData && (
        <ArticleCard
          parsedData={parsedData}
          url={currentUrl}
          mode="create"
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}

      <ArticleList
        articles={articles}
        onDelete={deleteArticle}
        onUpdate={updateArticle}
      />
    </div>
  );
}

export default App;
