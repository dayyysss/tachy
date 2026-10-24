export const roles = ['user', 'moderator', 'admin'] as const
export type Role = (typeof roles)[number]

export const permissions = {
  user: ['self:read', 'self:write'],
  moderator: ['self:read', 'self:write', 'users:read', 'tests:review'],
  admin: ['*'],
} as const satisfies Record<Role, readonly string[]>

export function hasPermission(role: Role, permission: string): boolean {
  const granted = permissions[role] as readonly string[]
  return granted.includes('*') || granted.includes(permission)
}
