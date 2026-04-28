import { ParsedArticleData } from '../types';
import { llmService } from './llm';

export const parserService = {
  parseUrl: async (url: string): Promise<ParsedArticleData & { analyzing?: boolean }> => {
    try {
      const response = await fetch(`/api/proxy?url=${encodeURIComponent(url)}`);
      const html = await response.text();

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      const isWechatArticle = url.includes('mp.weixin.qq.com');

      let title = '';
      let content = '';
      let source = '';
      let publishTime = '';

      if (isWechatArticle) {
        title = doc.querySelector('#activity-name')?.textContent?.trim() || doc.querySelector('title')?.textContent?.trim() || '';
        source = doc.querySelector('#js_name')?.textContent?.trim() || '微信公众号';

        publishTime = doc.querySelector('#publish_time')?.textContent?.trim() ||
                      doc.querySelector('meta[property="article:published_time"]')?.getAttribute('content')?.split('T')[0] || '';

        if (!publishTime) {
          const timeMatch = doc.body.textContent?.match(/(\d{4}[-/年]\d{1,2}[-/月]\d{1,2}[日]?\s*\d{1,2}:\d{1,2})|(\d{4}[-/年]\d{1,2}[-/月]\d{1,2}[日]?)/);
          if (timeMatch) {
            publishTime = timeMatch[0].replace(/[年|月|日]/g, '-').replace(/-$/, '').split(' ')[0];
          }
        }

        const contentEl = doc.querySelector('#js_content');
        content = contentEl?.textContent?.trim() || '';
      } else {
        title = doc.querySelector('title')?.textContent?.trim() || '';
        const bodyText = doc.body.textContent?.trim() || '';
        content = bodyText;

        try {
          const hostname = new URL(url).hostname.replace('www.', '');
          source = hostname;
        } catch {
          source = '';
        }

        const ogDate = doc.querySelector('meta[property="article:published_time"]');
        publishTime = ogDate?.getAttribute('content')?.split('T')[0] || '';
      }

      return {
        title: title || '未获取到标题',
        summary: '',
        content,
        source,
        author: '',
        publishTime,
        analyzing: true
      };
    } catch (error) {
      console.error('解析失败:', error);
      return {
        title: '解析失败，请检查链接',
        summary: '无法解析该网页内容',
        content: '',
        source: '',
        author: '',
        publishTime: '',
        analyzing: true
      };
    }
  },

  analyzeWithLLM: async (
    url: string,
    content: string,
    existingTitle?: string
  ) => {
    return await llmService.analyzeArticle(url, content, existingTitle);
  }
};
