declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string
      role: string
      image?: string
      avatar_url?: string | null
    }
  }

  interface User {
    id: string
    email: string
    name?: string
    role: string
    avatar_url?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: string
    avatar_url?: string | null
  }
} 