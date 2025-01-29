export default {
  async fetch(request, env) {
    // Handle CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    try {
      const url = new URL(request.url);
      
      if (request.method !== 'POST') {
        return new Response('Method not allowed', { 
          status: 405,
          headers: {
            'Access-Control-Allow-Origin': '*',
          }
        });
      }

      const path = url.pathname;
      let body;
      try {
        body = await request.json();
        console.log('Request body:', body);  // Debug log
      } catch (e) {
        console.error('Error parsing request body:', e);
        return new Response(JSON.stringify({ error: 'Invalid JSON in request body' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        });
      }

      // Helper function for DeepSeek API calls with better error handling
      const callDeepSeekAPI = async (messages) => {
        try {
          console.log('Calling DeepSeek with messages:', messages); // Debug log

          if (!env.DEEPSEEK_API_KEY) {
            throw new Error('DeepSeek API key not configured');
          }

          const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${env.DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
              model: 'deepseek-chat',
              messages,
              temperature: 0.3,
              max_tokens: 700
            })
          });

          console.log('DeepSeek response status:', response.status); // Debug log

          if (!response.ok) {
            const errorText = await response.text();
            console.error('DeepSeek error response:', errorText);
            throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
          }

          const data = await response.json();
          console.log('DeepSeek response data:', data); // Debug log

          if (!data.choices?.[0]?.message?.content) {
            throw new Error('Invalid response format from DeepSeek');
          }

          return data.choices[0].message.content.trim();
        } catch (error) {
          console.error('Error in callDeepSeekAPI:', error);
          throw error; // Re-throw to handle in route handlers
        }
      };

      let result;

      switch (path) {
        case '/api/analyze': {
          const { pageContent, prompt } = body;
          
          if (!pageContent || !prompt) {
            return new Response(JSON.stringify({ error: 'Missing required fields' }), {
              status: 400,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              }
            });
          }

          const messages = [
            {
              role: 'system',
              content: 'You are a helpful assistant that analyzes webpage content.'
            },
            {
              role: 'user',
              content: `Page Content: ${pageContent}\n\nPrompt: ${prompt}`
            }
          ];
          result = await callDeepSeekAPI(messages);
          break;
        }

        case '/api/analyze-token': {
          const { tokenData } = body;
          
          if (!tokenData) {
            return new Response(JSON.stringify({ error: 'Missing token data' }), {
              status: 400,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              }
            });
          }

          const messages = [
            {
              role: "system",
              content: `You're a crypto analyst. Analyze this token using EXACTLY this format. Be concise. Highlight risks. Current UTC: ${new Date().toISOString()}`
            },
            {
              role: "user",
              content: `Analyze this token using these metrics:\n${tokenData}`
            }
          ];
          result = await callDeepSeekAPI(messages);
          break;
        }

        default:
          return new Response('Not found', { 
            status: 404,
            headers: {
              'Access-Control-Allow-Origin': '*',
            }
          });
      }

      return new Response(JSON.stringify({ result }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });

    } catch (error) {
      console.error('Worker error:', error);
      
      // More descriptive error response
      return new Response(JSON.stringify({ 
        error: error.message,
        details: error.stack,
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  },
};
