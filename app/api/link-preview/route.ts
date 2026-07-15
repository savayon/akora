import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export const revalidate = 86400; // Cache for 24 hours

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 seconds timeout

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AkoraBot/1.0; +https://akora.site)',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch url: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Get URL domain
    let domain = '';
    try {
      domain = new URL(url).hostname;
    } catch (e) {
      domain = url;
    }

    // Fallbacks
    const title = 
      $('meta[property="og:title"]').attr('content') || 
      $('meta[name="twitter:title"]').attr('content') ||
      $('title').text() || 
      domain;

    const description = 
      $('meta[property="og:description"]').attr('content') || 
      $('meta[name="twitter:description"]').attr('content') ||
      $('meta[name="description"]').attr('content') || 
      '';

    const image = 
      $('meta[property="og:image"]').attr('content') || 
      $('meta[name="twitter:image"]').attr('content') || 
      '';

    return NextResponse.json({
      success: true,
      data: {
        title: title.trim(),
        description: description.trim(),
        image: image.trim(),
        domain: domain,
        url: url
      }
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200',
      }
    });

  } catch (error) {
    console.error('Link preview error:', error);
    // Return gracefully so the frontend just doesn't show the card
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch preview' 
    }, { status: 200 }); // Return 200 to prevent Next.js from throwing fetch errors
  }
}
