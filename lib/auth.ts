export type AuthUser = {
  name: 'Benja' | 'Vale'
  color: string
  token: string
}

export function getUserFromToken(token?: string): AuthUser | null {
  if (!token) return null

  if (token === process.env.BENJA_SECRET_TOKEN) {
    return { name: 'Benja', color: '#5DCAA5', token }
  }
  if (token === process.env.VALE_SECRET_TOKEN) {
    return { name: 'Vale', color: '#AFA9EC', token }
  }

  return null
}
