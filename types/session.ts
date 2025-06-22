import { Session } from "next-auth"
import type { User } from "@/lib/database"

export interface CustomUser {
  id: string
  name?: string | null
  email: string
  image?: string | null
  role: "admin" | "user"
}

export interface CustomSession extends Session {
  user: {
    id: string
    email: string
    name?: string | null
    avatar_url?: string | null
    role: "user" | "admin"
  }
} 