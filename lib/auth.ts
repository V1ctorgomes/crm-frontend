export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER' | 'DEVELOPER';
  profilePictureUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export function hasAccess(userRole: string | undefined, requiredRoles: string[]): boolean {
  if (!userRole) return false;
  return requiredRoles.includes(userRole);
}

export function canAccessPage(userRole: string | undefined, page: string): boolean {
  const pageAccess: Record<string, string[]> = {
    '/dashboard': ['ADMIN', 'USER'],
    '/contacts': ['ADMIN', 'USER'],
    '/usuarios': ['ADMIN', 'DEVELOPER'],
    '/solicitacoes': ['ADMIN', 'USER'],
    '/whatsapp': ['ADMIN', 'USER'],
    '/arquivos': ['ADMIN', 'USER'],
    '/developer': ['DEVELOPER'],
    '/configuracoes': ['ADMIN', 'USER', 'DEVELOPER'],
  };

  const requiredRoles = pageAccess[page];
  if (!requiredRoles) return false;
  
  return hasAccess(userRole, requiredRoles);
}
