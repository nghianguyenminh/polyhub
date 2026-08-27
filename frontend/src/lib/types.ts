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
  role?: {
    id: string;
    name: string;
  };
}

export interface Post {
  id: number;
  content: string;
  imageUrl?: string;
  imageUrls?: string[];
  isPrivate: boolean;
  createdAt: string;
  isSaved?: boolean;
  isLiked?: boolean;
  likesCount: number;
  user: SimpleUser;
  commentsCount: number;
  sharesCount: number;
  sharedPost?: Omit<Post, 'commentsCount' | 'sharesCount' | 'isSaved' | 'sharedPost' | 'isLiked' | 'likesCount'>;
  moderationStatus?: string;
  moderationCategory?: string;
}

export interface Comment {
  id: number;
  content: string;
  postId: number;
  username: string;
  fullname: string;
  avatar?: string;
  parentId?: number;
  createdAt: string;
  updatedAt?: string;
  replies?: Comment[];
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
  aiSummary?: string;
  aiKeywords?: string;
  summaryStatus?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'UNSUPPORTED';
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
  averageRating?: number;
  reviewCount?: number;
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
