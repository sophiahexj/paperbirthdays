import { NextRequest, NextResponse } from 'next/server';
import { verifySubscription } from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.redirect(new URL('/?error=invalid-token', request.url));
    }

    const result = await verifySubscription(token);

    if (result.success) {
      // Redirect to success page
      return NextResponse.redirect(new URL('/?verified=success', request.url));
    } else {
      // Redirect to error page
      const errorParam = encodeURIComponent(result.error || 'Verification failed');
      return NextResponse.redirect(new URL(`/?verified=error&message=${errorParam}`, request.url));
    }
  } catch (error) {
    console.error('Error verifying email:', error);
    return NextResponse.redirect(new URL('/?verified=error&message=Server+error', request.url));
  }
}
