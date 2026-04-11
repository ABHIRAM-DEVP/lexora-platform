export type WorkspaceResponse = {
  id: string;
  name: string;
  description: string;
  accessType: string;
  ownerId: string;
  deleted: boolean;
  deletedAt?: string | null;
};

export type WorkspaceMemberSummary = {
  id: string;
  username: string;
  email: string | null;
  role: string;
  owner: boolean;
};

export type NoteResponse = {
  id: string;
  title: string;
  content: string;
  workspaceId: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  deleted: boolean;
};

export type MediaResponse = {
  id: string;
  fileName: string;
  fileType: string;
  workspaceId: string;
  ownerId: string;
  size: number;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  deleted: boolean;
};

export type ActivityLog = {
  id: string;
  userId: string;
  workspaceId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  timestamp: string;
};

export type NotificationItem = {
  id: string;
  userId: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

export type Paged<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export type PublicationRow = {
  id: string;
  title: string;
  slug: string;
  content?: string;
  publishedAt?: string;
  tags?: string[];
  views?: number;
};

export type PublicBlogResponse = {
  title: string;
  slug: string;
  content: string;
  tags?: string[];
  publishedAt?: string;
  views?: number;
};

export type UserSearchResult = {
  id: string;
  email: string;
  username: string;
};

export type BlogSearchDTO = {
  id: string;
  title: string;
  slug: string;
  content: string;
  tags?: string[];
  publishedAt?: string;
};

export type AnalyticsResponse = {
  isAdmin?: boolean;
  totalActivities?: number;
  activitiesByAction?: Record<string, number>;
  activitiesByEntityType?: Record<string, number>;
  activityTimeline?: Record<string, number>;
  activitiesLast24Hours?: number;
  error?: string;
};
