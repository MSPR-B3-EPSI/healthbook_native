import { apiFetch } from '@/lib/http';
import { fileFormData, type MediaFile } from '@/lib/upload';

// Auteur minimal embarqué dans les réponses post/commentaire (évite les appels N+1).
export type Author = {
  keycloakId: string;
  username: string | null;
  displayName: string | null;
  profilePictureUrl: string | null;
};

export type Post = {
  id: string;
  title: string;
  content: string;
  mediaUrl: string | null;
  authorId: string;
  author: Author;
  createdAt: string;
  updatedAt: string;
  likesCount: number;
  commentsCount: number;
  likedByMe: boolean;
};

export type Paginated<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
};

export type PostSortBy =
  | 'createdAt'
  | 'updatedAt'
  | 'title'
  | 'likes'
  | 'comments';

export type ListPostsOptions = {
  search?: string;
  authorId?: string;
  sortBy?: PostSortBy;
  sortOrder?: SortOrder;
  page?: number;
  limit?: number;
};

export async function listPosts(
  opts: ListPostsOptions = {},
): Promise<Paginated<Post>> {
  const params = new URLSearchParams();
  if (opts.search) params.set('search', opts.search);
  if (opts.authorId) params.set('authorId', opts.authorId);
  if (opts.sortBy) params.set('sortBy', opts.sortBy);
  if (opts.sortOrder) params.set('sortOrder', opts.sortOrder);
  if (opts.page) params.set('page', String(opts.page));
  if (opts.limit) params.set('limit', String(opts.limit));
  const qs = params.toString();
  return apiFetch<Paginated<Post>>(qs ? `/post?${qs}` : '/post');
}

export type PostListResult = { posts: Post[]; total: number };

export async function listPostsByAuthor(
  authorId: string,
  opts: { page?: number; limit?: number } = {},
): Promise<PostListResult> {
  const res = await listPosts({
    authorId,
    page: opts.page,
    limit: opts.limit,
  });
  return { posts: res.data, total: res.total };
}

export async function getPost(id: string): Promise<Post> {
  return apiFetch<Post>(`/post/${id}`);
}

type CreatePostInput = {
  title: string;
  content: string;
};

export async function createPost(input: CreatePostInput): Promise<Post> {
  return apiFetch<Post>('/post', { method: 'POST', body: input });
}

export async function updatePost(
  id: string,
  input: { title?: string; content?: string },
): Promise<Post> {
  return apiFetch<Post>(`/post/${id}`, { method: 'PATCH', body: input });
}

/** Attache (ou remplace) le média d'un post via upload multipart. */
export async function uploadPostMedia(
  postId: string,
  file: MediaFile,
): Promise<Post> {
  return apiFetch<Post>(`/post/${postId}/media`, {
    method: 'POST',
    body: fileFormData(file),
  });
}

export async function deletePostMedia(postId: string): Promise<Post> {
  return apiFetch<Post>(`/post/${postId}/media`, { method: 'DELETE' });
}

export async function deletePost(postId: string): Promise<void> {
  await apiFetch<{ deleted: boolean }>(`/post/${postId}`, { method: 'DELETE' });
}

export type ToggleLikeResult = { liked: boolean; likesCount: number };

export async function toggleLike(postId: string): Promise<ToggleLikeResult> {
  return apiFetch<ToggleLikeResult>(`/post/like/${postId}`, { method: 'POST' });
}

// --- Commentaires (backend prêt) ---

export type Comment = {
  id: string;
  postId: string;
  content: string;
  authorId: string;
  author: Author;
  createdAt: string;
  updatedAt: string;
  likesCount: number;
  likedByMe: boolean;
};

export type CommentSortBy = 'createdAt' | 'updatedAt' | 'likes';
export type SortOrder = 'asc' | 'desc';

export type ListCommentsOptions = {
  search?: string;
  sortBy?: CommentSortBy;
  sortOrder?: SortOrder;
  page?: number;
  limit?: number;
};

export async function listComments(
  postId: string,
  opts: ListCommentsOptions = {},
): Promise<Paginated<Comment>> {
  const params = new URLSearchParams({ postId });
  if (opts.search) params.set('search', opts.search);
  if (opts.sortBy) params.set('sortBy', opts.sortBy);
  if (opts.sortOrder) params.set('sortOrder', opts.sortOrder);
  if (opts.page) params.set('page', String(opts.page));
  if (opts.limit) params.set('limit', String(opts.limit));
  return apiFetch<Paginated<Comment>>(`/comment?${params.toString()}`);
}

export async function createComment(input: {
  postId: string;
  content: string;
}): Promise<Comment> {
  return apiFetch<Comment>('/comment', { method: 'POST', body: input });
}

export async function updateComment(
  id: string,
  content: string,
): Promise<Comment> {
  return apiFetch<Comment>(`/comment/${id}`, {
    method: 'PATCH',
    body: { content },
  });
}

export async function deleteComment(id: string): Promise<void> {
  await apiFetch<{ deleted: boolean }>(`/comment/${id}`, { method: 'DELETE' });
}

export async function toggleCommentLike(id: string): Promise<ToggleLikeResult> {
  return apiFetch<ToggleLikeResult>(`/comment/like/${id}`, { method: 'POST' });
}
