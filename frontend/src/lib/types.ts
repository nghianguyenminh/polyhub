export interface User {
  username: string;
  fullname: string;
  email: string;
  phone?: string;
  gender?: boolean;
  birthday?: string;
  major?: string;
  avatar?: string;
  coverImage?: string;
  bio?: string;
  followersCount?: number;
  followingCount?: number;
  role?: string;
}

export interface SimpleUser {
  username: string;
  fullname: string;
  avatar?: string;
  major?: string;
}

export interface Post {
  id: number;
  content: string;
  imageUrl?: string;
  isPrivate: boolean;
  createdAt: string;
  isSaved?: boolean;
  user: SimpleUser;
  commentsCount: number;
  sharesCount: number;
  sharedPost?: Omit<Post, 'commentsCount' | 'sharesCount' | 'isSaved' | 'sharedPost'>;
}

export interface Category {
  id: number;
  name: string;
  code: string;
}

export interface Document {
  id: number;
  title: string;
  description: string;
  documentType: string;
  fileUrl: string;
  fileSize: number;
  downloadCount: number;
  createdAt: string;
  isSaved?: boolean;
  category?: {
    id: number;
    name: string;
  };
  uploader?: SimpleUser;
}

export interface Mentor {
  id: number;
  fullname: string;
  email: string;
  phone: string;
  birthday: string;
  introduction: string;
  motivation: string;
  cvFile: string;
  certificateFile?: string;
  degreeFile?: string;
  createdAt: string;
  user?: {
    username: string;
    avatar: string;
    major: string;
  };
}

export interface ConnectionUser {
  username: string;
  fullname: string;
  email: string;
  avatar?: string;
  major?: string;
  bio?: string;
  isFollowing: boolean;
  isSelf: boolean;
}
