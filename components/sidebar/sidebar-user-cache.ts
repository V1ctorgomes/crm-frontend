export type SidebarUser = {
  name?: string;
  role?: string;
  profilePictureUrl?: string;
};

let globalUserCache: SidebarUser | null = null;

export function readSidebarUserCache(): SidebarUser | null {
  return globalUserCache;
}

export function writeSidebarUserCache(user: SidebarUser | null) {
  globalUserCache = user;
}
