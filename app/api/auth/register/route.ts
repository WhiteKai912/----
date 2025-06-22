import { type NextRequest, NextResponse } from "next/server"
import { createUser, getUserByEmail } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    // Валидация
    if (!email || !password) {
      return NextResponse.json({ error: "Email и пароль обязательны" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Пароль должен содержать минимум 8 символов" }, { status: 400 })
    }

    // Проверка существования пользователя
    const existingUser = await getUserByEmail(email)
    if (existingUser) {
      return NextResponse.json({ error: "Пользователь с таким email уже существует" }, { status: 400 })
    }

    // Создание пользователя
    const user = await createUser(email, password, name)

    return NextResponse.json({
      message: "Пользователь успешно создан",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Ошибка при создании пользователя" }, { status: 500 })
  }
}
