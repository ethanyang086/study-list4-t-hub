import { Category } from '../types';

const CATEGORIES: Category[] = ['AI编程', 'AI动态', '文哲史', '旅游', '活动展览', '工作思路', '其他'];

interface LLMResponse {
  summary: string;
  tags: string[];
  suggestedCategory: Category;
  translatedTitle?: string;
  translatedSummary?: string;
}

const MAX_RETRIES = 2;

function isEnglishText(text: string): boolean {
  const englishChars = text.match(/[a-zA-Z]/g);
  if (!englishChars || englishChars.length === 0) return false;
  const englishRatio = englishChars.length / text.length;
  return englishRatio > 0.3;
}

export const llmService = {
  analyzeArticle: async (
    url: string,
    content: string,
    existingTitle?: string
  ): Promise<LLMResponse> => {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + import.meta.env.VITE_SILICONFLOW_API_KEY
          },
          body: JSON.stringify({
            model: 'Qwen/Qwen2.5-14B-Instruct',
            messages: [
              {
                role: 'system',
                content: `你是一个专业的文章分析助手。请根据文章内容生成摘要、标签和分类建议。

## 文章原始信息（仅供参考，不要改动）
- 标题：${existingTitle || '未知'}
- 来源：${content.substring(0, 500).match(/(?:来源|来自|作者|公众号)[：:]\s*([^\n，。,]+)/)?.[1] || '未知'}

## 你的任务
请从以下分类中选择最合适的一个，并生成3-5个精准标签：
${CATEGORIES.join('、')}

## 输出要求
必须返回标准JSON格式，不要添加任何其他文字说明。字段说明：
- summary: 文章摘要，200-300字，简洁准确概括文章核心内容
- tags: 3-5个标签，精确描述文章主题，使用中文
- suggestedCategory: 从分类选项中选择最合适的一个

## 严格遵循JSON格式
{"summary":"摘要内容...","tags":["标签1","标签2","标签3"],"suggestedCategory":"分类"}`
              },
              {
                role: 'user',
                content: `分析以下文章，生成摘要、标签和分类：\n\n文章内容：\n${content.substring(0, 4000)}`
              }
            ],
            temperature: 0.3,
            max_tokens: 2000
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API请求失败: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const content_text = data.choices?.[0]?.message?.content || '';

        const result = parseAndValidateResponse(content_text);
        if (result) {
          return result;
        }

        if (attempt < MAX_RETRIES) {
          console.warn(`AI解析尝试 ${attempt + 1} 失败，将重试...`);
          continue;
        }

      } catch (error) {
        console.error(`AI分析尝试 ${attempt + 1} 失败:`, error);
        if (attempt < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }

    console.error('AI分析最终失败，使用备用方案');
    return generateFallbackResponse(content);
  },

  generateTags: async (content: string): Promise<string[]> => {
    try {
      const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + import.meta.env.VITE_SILICONFLOW_API_KEY
        },
        body: JSON.stringify({
          model: 'Qwen/Qwen2.5-14B-Instruct',
          messages: [
            {
              role: 'system',
              content: '你是一个标签生成专家。请根据文章内容生成3-5个精准标签。标签要简洁、准确反映文章主题。使用中文。请严格返回JSON数组格式，不要其他内容。'
            },
            {
              role: 'user',
              content: `为以下文章生成标签（返回JSON数组）：\n\n${content.substring(0, 2000)}`
            }
          ],
          temperature: 0.3,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        throw new Error('API请求失败');
      }

      const data = await response.json();
      const content_text = data.choices?.[0]?.message?.content || '';

      const jsonMatch = content_text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const tags = JSON.parse(jsonMatch[0]);
        if (Array.isArray(tags) && tags.every(tag => typeof tag === 'string')) {
          return tags.slice(0, 5);
        }
      }

      return [];
    } catch (error) {
      console.error('标签生成失败:', error);
      return [];
    }
  },

  suggestCategory: async (content: string): Promise<Category> => {
    try {
      const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + import.meta.env.VITE_SILICONFLOW_API_KEY
        },
        body: JSON.stringify({
          model: 'Qwen/Qwen2.5-14B-Instruct',
          messages: [
            {
              role: 'system',
              content: `你是一个文章分类专家。请根据文章内容从以下分类中选择最合适的一个：${CATEGORIES.join('、')}。只返回一个分类名称，不要有任何其他内容。`
            },
            {
              role: 'user',
              content: content.substring(0, 1500)
            }
          ],
          temperature: 0.2,
          max_tokens: 100
        })
      });

      if (!response.ok) {
        throw new Error('API请求失败');
      }

      const data = await response.json();
      const category = data.choices?.[0]?.message?.content?.trim() || '';

      if (CATEGORIES.includes(category as Category)) {
        return category as Category;
      }

      return 'AI编程';
    } catch (error) {
      console.error('分类建议失败:', error);
      return 'AI编程';
    }
  },

  translateText: async (text: string): Promise<string> => {
    try {
      const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + import.meta.env.VITE_SILICONFLOW_API_KEY
        },
        body: JSON.stringify({
          model: 'Qwen/Qwen2.5-14B-Instruct',
          messages: [
            {
              role: 'system',
              content: '你是一个专业的翻译专家。请将以下英文文本准确翻译成中文，保持原文的语气和风格，不要添加任何解释或评论，只返回翻译结果。'
            },
            {
              role: 'user',
              content: text
            }
          ],
          temperature: 0.3,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        throw new Error('翻译API请求失败');
      }

      const data = await response.json();
      const translatedText = data.choices?.[0]?.message?.content?.trim() || '';
      return translatedText;
    } catch (error) {
      console.error('翻译失败:', error);
      return text;
    }
  }
};

function parseAndValidateResponse(content: string): LLMResponse | null {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('未找到JSON内容');
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]);

    if (!parsed.summary || typeof parsed.summary !== 'string') {
      parsed.summary = '';
    }

    if (!Array.isArray(parsed.tags)) {
      parsed.tags = [];
    } else {
      parsed.tags = parsed.tags.filter(tag => typeof tag === 'string').slice(0, 5);
    }

    if (!CATEGORIES.includes(parsed.suggestedCategory)) {
      parsed.suggestedCategory = 'AI编程';
    }

    return {
      summary: parsed.summary,
      tags: parsed.tags,
      suggestedCategory: parsed.suggestedCategory
    };
  } catch (error) {
    console.error('JSON解析失败:', error);
    return null;
  }
}

function generateFallbackResponse(content: string): LLMResponse {
  const summary = content.substring(0, 300) || '暂无摘要';

  return {
    summary,
    tags: [],
    suggestedCategory: 'AI编程'
  };
}
