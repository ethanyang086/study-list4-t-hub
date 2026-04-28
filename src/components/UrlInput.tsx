import { useState } from 'react';

interface UrlInputProps {
  onParse: (url: string) => void;
  loading?: boolean;
}

export const UrlInput: React.FC<UrlInputProps> = ({ onParse, loading }) => {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onParse(url.trim());
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.startsWith('http://') || text.startsWith('https://')) {
        setUrl(text);
      }
    } catch {
      console.error('无法读取剪贴板');
    }
  };

  return (
    <div className="url-input-section">
      <form onSubmit={handleSubmit} className="url-form">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="请粘贴网页链接，支持微信公众号文章..."
          className="url-input"
          disabled={loading}
        />
        <button
          type="button"
          onClick={handlePaste}
          className="paste-button"
          disabled={loading}
        >
          粘贴
        </button>
        <button
          type="submit"
          className="parse-button"
          disabled={loading || !url.trim()}
        >
          {loading ? '解析中...' : '解析'}
        </button>
      </form>
    </div>
  );
};
