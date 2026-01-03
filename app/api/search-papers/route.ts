import { NextRequest, NextResponse } from 'next/server';
import { searchPapers } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query || query.trim().length < 3) {
      return NextResponse.json(
        { error: 'Search query must be at least 3 characters' },
        { status: 400 }
      );
    }

    const papers = await searchPapers(query.trim());

    return NextResponse.json({
      success: true,
      papers,
      count: papers.length
    });
  } catch (error) {
    console.error('Error searching papers:', error);
    return NextResponse.json(
      { error: 'Failed to search papers' },
      { status: 500 }
    );
  }
}
