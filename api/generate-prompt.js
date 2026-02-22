export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { image_base64, mode } = req.body || {};
  if (!image_base64 || !mode) {
    return res.status(400).json({ error: 'image_base64 e mode sao obrigatorios' });
  }

  const MODES = {
    capa: {
      label: 'Foto de Capa',
      count: 4,
      instruction: `Generate 4 prompts for COVER/HERO product photos for e-commerce listings (Mercado Livre, Shopee, Amazon).
Requirements per prompt:
- Clean white or light gradient background
- Professional studio lighting (softbox, rim light)
- Product centered, front-facing or slight 3/4 angle
- Ultra-sharp details, photorealistic quality
- Minimal props, focus 100% on the product
- Commercial photography style`
    },
    ecommerce: {
      label: 'Fotos E-commerce Adjacentes',
      count: 6,
      instruction: `Generate 6 prompts for SECONDARY/ADJACENT e-commerce listing photos.
Requirements - each prompt should be a DIFFERENT type:
1. Lifestyle shot (product in realistic use context)
2. Detail/close-up shot (textures, materials, finishing)
3. Scale reference shot (product next to common object for size)
4. Alternative angle (top-down, side, back view)
5. Group/arrangement shot (multiple units or with accessories)
6. Packaging/unboxing shot (premium presentation)
Each should feel professional but varied to tell a complete product story.`
    },
    social: {
      label: 'Instagram & TikTok',
      count: 5,
      instruction: `Generate 5 prompts for INSTAGRAM & TIKTOK content photos.
Requirements per prompt:
1. Aesthetic flat lay composition (trending, Pinterest-worthy)
2. Lifestyle/mood shot (warm tones, golden hour, aspirational)
3. Reels/Stories vertical format (9:16, dynamic, eye-catching)
4. UGC-style photo (casual, authentic, "customer sharing" feel)
5. Seasonal/trending composition (current visual trends, color palettes)
Each should feel native to social media, visually striking, and shareable.`
    }
  };

  const modeConfig = MODES[mode];
  if (!modeConfig) return res.status(400).json({ error: 'Mode invalido. Use: capa, ecommerce, social' });

  const systemPrompt = `You are a world-class e-commerce product photographer and AI image prompt engineer specializing in Brazilian marketplaces (Mercado Livre, Shopee, Amazon BR, Magazine Luiza).

Analyze the uploaded product photo carefully - identify the product type, materials, colors, size, and key selling features.

${modeConfig.instruction}

CRITICAL RULES:
- Each prompt must be specific to THIS exact product (reference its actual colors, materials, shape)
- Prompts must work in Midjourney v6, DALL-E 3, or Flux
- Include technical details: camera angle, lens (e.g. 85mm), lighting setup, f-stop
- Each prompt should be 2-4 sentences, detailed but not bloated
- Write prompts in ENGLISH (universal for AI image tools)
- Include a short Portuguese title for each prompt

Return ONLY valid JSON - no markdown, no code blocks, no extra text.
Format: [{"titulo": "Titulo em PT-BR", "prompt": "Full English prompt...", "negativo": "What to avoid in English"}]
Return exactly ${modeConfig.count} items.`;

  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  try {
    let prompts;

    if (openaiKey) {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiKey}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          max_tokens: 2000,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: [
              { type: 'text', text: `Analyze this product photo and generate ${modeConfig.count} prompts for: ${modeConfig.label}` },
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${image_base64}`, detail: 'high' } }
            ]}
          ]
        })
      });
      if (!response.ok) {
        const err = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${err}`);
      }
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '[]';
      prompts = JSON.parse(content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
    } else if (anthropicKey) {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          system: systemPrompt,
          messages: [{
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: image_base64 } },
              { type: 'text', text: `Analyze this product photo and generate ${modeConfig.count} prompts for: ${modeConfig.label}` }
            ]
          }]
        })
      });
      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Anthropic API error: ${response.status} - ${err}`);
      }
      const data = await response.json();
      const content = data.content?.[0]?.text || '[]';
      prompts = JSON.parse(content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
    } else {
      return res.status(500).json({ error: 'Nenhuma API key configurada. Adicione OPENAI_API_KEY ou ANTHROPIC_API_KEY nas env vars do Vercel.' });
    }

    return res.status(200).json({ success: true, mode, prompts });
  } catch (err) {
    console.error('Generate prompt error:', err);
    return res.status(500).json({ error: err.message || 'Erro ao gerar prompts' });
  }
}
