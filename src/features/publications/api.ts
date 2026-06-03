import { apiFetch } from '@/lib/http';

export type Post = {
  id: number;
  title: string;
  content: string | null;
  published: boolean | null;
  authorId: string | null;
};

export async function listPublishedPosts(): Promise<Post[]> {
  return apiFetch<Post[]>('/publication');
}

type CreatePostInput = {
  title: string;
  content?: string;
  authorEmail: string;
};

export async function createAndPublishPost(input: CreatePostInput): Promise<Post> {
  const created = await apiFetch<Post>('/publication', {
    method: 'POST',
    body: input,
  });
  return apiFetch<Post>(`/publication/${created.id}/publish`, {
    method: 'PUT',
  });
}
