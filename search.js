#!/usr/bin/env node

const https = require('https');

const query = process.argv.slice(2).join(' ') || 'latest AI news';
const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    const results = data.match(/<a class="result__a"[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/g) || [];
    const snippets = data.match(/<a class="result__snippet"[^>]*>([^<]*)<\/a>/g) || [];

    console.log(`\nSearch results for: "${query}"\n`);
    results.slice(0, 10).forEach((match, i) => {
      const urlMatch = match.match(/href="([^"]*)"/);
      const titleMatch = match.match(/>([^<]*)</);
      const snippet = snippets[i]?.match(/>([^<]*)</)?.[1] || '';

      if (urlMatch && titleMatch) {
        console.log(`${i + 1}. ${titleMatch[1]}`);
        console.log(`   ${urlMatch[1]}`);
        if (snippet) console.log(`   ${snippet}`);
        console.log('');
      }
    });
  });
}).on('error', (e) => console.error('Error:', e.message));
