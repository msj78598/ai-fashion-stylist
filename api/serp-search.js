import axios from 'axios';

export default async function handler(req, res) {
    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { q, direct_link } = req.query;

    if (!q) {
        return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    // Ensure this is securely set in Vercel Environment Variables
    const apiKey = process.env.VITE_SERP_API_KEY || '303a194d749e031e6e62416d9ee4f9e0e57a5b9f4a0fee892a15b8fd60c30dc0';

    try {
        const directLinkParam = direct_link === 'true' ? '&direct_link=true' : '';
        const searchUrl = `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(q)}&gl=sa&hl=ar&api_key=${apiKey}${directLinkParam}`;

        const { data } = await axios.get(searchUrl);

        res.setHeader('Content-Type', 'application/json');
        // Configure CORS for safety if needed, currently Vercel handles same-origin by default
        res.status(200).json(data);
    } catch (error) {
        console.error("Vercel Serverless SerpAPI Proxy error:", error.message);
        res.status(500).json({ error: 'SerpAPI request failed' });
    }
}
