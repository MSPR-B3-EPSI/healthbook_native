import { apiFetch } from '@/lib/http';
import { fileFormData, type MediaFile } from '@/lib/upload';

export type Profile = {
  keycloakId: string;
  email: string | null;
  username: string | null;
  displayName: string | null;
  profilePictureUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function getMe(): Promise<Profile> {
  return apiFetch<Profile>('/user/me');
}

export async function getUser(id: string): Promise<Profile> {
  return apiFetch<Profile>(`/user/${id}`);
}

export async function updateMe(input: {
  displayName?: string;
}): Promise<Profile> {
  return apiFetch<Profile>('/user/me', { method: 'PATCH', body: input });
}

export async function uploadAvatar(file: MediaFile): Promise<Profile> {
  return apiFetch<Profile>('/user/me/picture', {
    method: 'POST',
    body: fileFormData(file),
  });
}

export async function deleteAvatar(): Promise<Profile> {
  return apiFetch<Profile>('/user/me/picture', { method: 'DELETE' });
}
