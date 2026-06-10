import { apiFetch } from '@/lib/http';

export type Post = {
  id: string;
  title: string;
  content: string;
  mediaUrl: string | null;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  likesCount: number;
  commentsCount: number;
};

type PostListResponse = {
  data: Post[];
  total: number;
  page: number;
  limit: number;
};

export async function listPosts(): Promise<Post[]> {
  const res = await apiFetch<PostListResponse>('/post');
  return res.data;
}

export type PostListResult = { posts: Post[]; total: number };

export async function listPostsByAuthor(
  authorId: string,
  limit = 50,
): Promise<PostListResult> {
  const res = await apiFetch<PostListResponse>(
    `/post?authorId=${encodeURIComponent(authorId)}&limit=${limit}`,
  );
  return { posts: res.data, total: res.total };
}

export async function getPost(id: string): Promise<Post> {
  return apiFetch<Post>(`/post/${id}`);
}

type CreatePostInput = {
  title: string;
  content: string;
  mediaUrl?: string;
};

export async function createPost(input: CreatePostInput): Promise<Post> {
  return apiFetch<Post>('/post', { method: 'POST', body: input });
}

export async function deletePost(postId: string): Promise<void> {
  await apiFetch<{ deleted: boolean }>(`/post/${postId}`, { method: 'DELETE' });
}

export type ToggleLikeResult = { liked: boolean; likesCount: number };

export async function toggleLike(postId: string): Promise<ToggleLikeResult> {
  return apiFetch<ToggleLikeResult>(`/post/like/${postId}`, { method: 'POST' });
}

// --- Commentaires : API backend en 501. Stub local, signatures finales pour
// brancher plus tard (remplacer le corps par apiFetch sans toucher aux appels). ---

export type Comment = {
  id: string;
  postId: string;
  authorId: string;
  authorLabel?: string;
  content: string;
  createdAt: string;
};

export async function listComments(postId: string): Promise<Comment[]> {
  // TODO (backend prêt) :
  // const res = await apiFetch<{ data: Comment[] }>(`/comment?postId=${postId}`);
  // return res.data;
  void postId;
  return [];
}

export async function createComment(input: {
  postId: string;
  content: string;
}): Promise<Comment> {
  // TODO (backend prêt) :
  // return apiFetch<Comment>('/comment', { method: 'POST', body: input });
  void input;
  throw new Error('LOCAL_ONLY');
}
