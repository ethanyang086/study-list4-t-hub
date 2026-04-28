export const translationService = {
  translate: async (text: string, from: string = 'auto', to: string = 'zh'): Promise<string> => {
    try {
      const response = await fetch('https://api.mymemory.translated.net/get', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          q: text,
          langpair: `${from}|${to}`,
        }),
      });
      
      const data = await response.json();
      
      if (data.responseStatus === 200 && data.responseData) {
        return data.responseData.translatedText;
      }
      
      return text;
    } catch {
      return text;
    }
  }
};
