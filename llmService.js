const axios = require('axios');
const { Configuration, OpenAIApi } = require('openai');

class LLMService {
  constructor() {
    this.provider = null;
    this.client = null;
  }

  configure(config) {
    this.provider = config.provider;

    if (this.provider === 'openai') {
      const configuration = new Configuration({
        apiKey: config.apiKey,
      });
      this.client = new OpenAIApi(configuration);
    } else if (this.provider === 'custom') {
      this.client = axios.create({
        baseURL: config.endpoint,
        auth: config.username ? {
          username: config.username,
          password: config.password
        } : undefined,
        headers: !config.username && config.password ? {
          'Authorization': `Bearer ${config.password}`
        } : undefined
      });
    }
  }

  async createCompletion(prompt) {
    try {
      if (this.provider === 'openai') {
        const completion = await this.client.createChatCompletion({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: "You are a data integration expert specializing in NetSuite implementations."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.2,
          max_tokens: 2000
        });
        return completion.data.choices[0].message.content;
      } else if (this.provider === 'custom') {
        // Adapt this based on your custom LLM API format
        const response = await this.client.post('/completions', {
          prompt,
          max_tokens: 2000,
          temperature: 0.2
        });
        return response.data.choices[0].text;
      }
    } catch (error) {
      console.error('LLM error:', error);
      throw new Error(`Failed to get completion from ${this.provider}: ${error.message}`);
    }
  }

  async validateConfig(config) {
    try {
      // Configure temporarily for validation
      this.configure(config);

      // Test prompt
      const testPrompt = "Test connection. Please respond with 'OK'.";
      const response = await this.createCompletion(testPrompt);

      return response.includes('OK');
    } catch (error) {
      console.error('LLM validation error:', error);
      throw new Error(`Failed to validate ${config.provider} configuration: ${error.message}`);
    }
  }
}

module.exports = new LLMService();
