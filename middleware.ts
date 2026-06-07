import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const firebaseToken = request.cookies.get('firebaseToken')?.value;
  const userRole = request.cookies.get('userRole')?.value;

  const isAuthPage = request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/register');
  const isBrandRoute = request.nextUrl.pathname.startsWith('/brand');
  const isInfluencerRoute = request.nextUrl.pathname.startsWith('/influencer');

  // 로그인되지 않은 사용자가 보호된 라우트 접근 시
  if (!firebaseToken) {
    if (isBrandRoute || isInfluencerRoute) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  // 로그인된 사용자가 Auth 페이지 접근 시 대시보드로 이동
  if (firebaseToken && isAuthPage) {
    if (userRole === 'brand') {
      return NextResponse.redirect(new URL('/brand/dashboard', request.url));
    } else if (userRole === 'influencer') {
      return NextResponse.redirect(new URL('/influencer/dashboard', request.url));
    }
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 역할에 맞지 않는 라우트 접근 시 제한
  if (isBrandRoute && userRole !== 'brand') {
    return NextResponse.redirect(new URL('/', request.url));
  }
  if (isInfluencerRoute && userRole !== 'influencer') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/brand/:path*', '/influencer/:path*', '/login', '/register'],
};
