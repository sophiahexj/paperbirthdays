import { NextRequest, NextResponse } from 'next/server';
import { unsubscribeEmail } from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.redirect(new URL('/?error=invalid-token', request.url));
    }

    const result = await unsubscribeEmail(token);

    if (result.success) {
      // Redirect to success page
      return NextResponse.redirect(new URL('/?unsubscribed=success', request.url));
    } else {
      // Redirect to error page
      const errorParam = encodeURIComponent(result.error || 'Unsubscribe failed');
      return NextResponse.redirect(new URL(`/?unsubscribed=error&message=${errorParam}`, request.url));
    }
  } catch (error) {
    console.error('Error unsubscribing:', error);
    return NextResponse.redirect(new URL('/?unsubscribed=error&message=Server+error', request.url));
  }
}
