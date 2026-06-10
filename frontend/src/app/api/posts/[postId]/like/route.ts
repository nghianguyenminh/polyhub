import { NextRequest, NextResponse } from 'next/server';

// ─── In-memory like store (tồn tại suốt session Node.js) ───────────
// Map<postId, Set<username>>
const likeStore = new Map<number, Set<string>>();

function getLikers(postId: number): Set<string> {
  if (!likeStore.has(postId)) {
    likeStore.set(postId, new Set());
  }
  return likeStore.get(postId)!;
}

// Decode JWT payload (không verify, chỉ lấy username cho demo)
function getUsernameFromToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  try {
    const token = authHeader.substring(7);
    const payload = token.split('.')[1];
    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
    return decoded.sub || decoded.username || decoded.name || null;
  } catch {
    return null;
  }
}

// GET /api/posts/[postId]/like — lấy trạng thái like
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const resolvedParams = await params;
  const postId = Number(resolvedParams.postId);
  const username = getUsernameFromToken(request.headers.get('authorization'));
  const likers = getLikers(postId);

  return NextResponse.json({
    likesCount: likers.size,
    isLiked: username ? likers.has(username) : false,
  });
}

// POST /api/posts/[postId]/like — toggle like
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const resolvedParams = await params;
  const postId = Number(resolvedParams.postId);
  const username = getUsernameFromToken(request.headers.get('authorization'));

  if (!username) {
    return NextResponse.json(
      { error: 'Vui lòng đăng nhập để thích bài viết.' },
      { status: 401 }
    );
  }

  const likers = getLikers(postId);
  let isLiked: boolean;

  if (likers.has(username)) {
    likers.delete(username);
    isLiked = false;
  } else {
    likers.add(username);
    isLiked = true;
  }

  return NextResponse.json({
    isLiked,
    likesCount: likers.size,
  });
}
