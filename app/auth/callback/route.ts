import { NextResponse } from 'next/server'
import { ServerAuthService } from '@/services/ServerAuthService'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    try {
      await ServerAuthService.exchangeCodeForSession(code);
      
      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalhost = process.env.NODE_ENV === 'development';
      
      if (isLocalhost) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    } catch (error) {
      console.error(error);
    }
  }

  // 오류 발생 시 홈으로
  return NextResponse.redirect(`${origin}?error=auth`)
}
