import { NextRequest, NextResponse } from 'next/server';
import { createSubscription, getPaperById } from '@/lib/database';
import { sendVerificationEmail } from '@/lib/email';
import crypto from 'crypto';

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, paperId } = body;

    // Validate input
    if (!email || !paperId) {
      return NextResponse.json(
        { error: 'Email and paper ID are required' },
        { status: 400 }
      );
    }

    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Get paper details
    const paper = await getPaperById(paperId);
    if (!paper) {
      return NextResponse.json(
        { error: 'Paper not found' },
        { status: 404 }
      );
    }

    if (!paper.publication_month_day) {
      return NextResponse.json(
        { error: 'Paper does not have a publication date' },
        { status: 400 }
      );
    }

    // Generate tokens
    const verificationToken = generateToken();
    const unsubscribeToken = generateToken();

    // Create subscription in database
    const result = await createSubscription(
      email,
      paperId,
      paper.title,
      paper.publication_month_day,
      verificationToken,
      unsubscribeToken
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to create subscription' },
        { status: 400 }
      );
    }

    // Send verification email
    const emailSent = await sendVerificationEmail(
      email,
      paper.title,
      verificationToken,
      paper.publication_month_day
    );

    if (!emailSent) {
      return NextResponse.json(
        { error: 'Failed to send verification email. Please try again later.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Verification email sent! Please check your inbox to confirm your subscription.'
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
