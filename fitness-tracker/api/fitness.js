/**
 * GET /api/fitness
 *
 * Demo serverless function. Returns today's fitness data.
 * Replace the hardcoded data here with a real Notion API call:
 *
 *   const { Client } = require('@notionhq/client');
 *   const notion = new Client({ auth: process.env.NOTION_TOKEN });
 *   const response = await notion.databases.query({ database_id: process.env.NOTION_DB_ID });
 */

export default function handler(req, res) {
  // Simulate data that would come from Notion
  const seed = new Date().getHours();
  const steps = 6000 + (seed * 347) % 8000;
  const calories = 1500 + (seed * 89) % 1500;
  const heartRate = 62 + (seed * 7) % 20;

  res.status(200).json({
    today: {
      steps,
      calories,
      heartRate,
      sleep: { hours: 7, minutes: 30 },
      _updated: new Date().toISOString(),
      _source: 'vercel-serverless',
    }
  });
}
