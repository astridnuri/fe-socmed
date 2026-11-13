export interface User {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
  bio: string | null;
}

export type PublicProfile = Pick<User, "id" | "name" | "avatar" | "bio">;

export interface PostUser {
  id: number;
  name: string;
  avatar: string | null;
}

export interface Post {
  id: number;
  content: string | null;
  image: string | null;
  location: string | null;
  created_at: string;
  updated_at: string | null;
  user: PostUser;
  likes_count: number;
  comments_count: number;
  liked_by_me: boolean;
}

// Dinamai PostComment agar tidak bentrok dengan tipe global "Comment" milik DOM
export interface PostComment {
  id: number;
  post_id: number;
  parent_comment_id: number | null;
  comment: string | null;
  image: string | null;
  likes_count: number;
  liked_by_me: boolean;
  created_at: string;
  updated_at: string | null;
  user: PostUser;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface PostsResponse {
  posts: Post[];
  nextCursor: number | null;
}