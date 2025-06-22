"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Music, Eye, EyeOff, Check, X, Loader2 } from "lucide-react"

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const router = useRouter()

  const passwordRequirements = {
    length: formData.password.length >= 8,
    hasLetter: /[a-zA-Z]/.test(formData.password),
    hasNumber: /\d/.test(formData.password),
    match: formData.password === formData.confirmPassword && formData.password.length > 0,
  }

  const isFormValid = Object.values(passwordRequirements).every(Boolean) && formData.email && acceptTerms

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid) return

    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name || undefined,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess("Аккаунт успешно создан! Теперь вы можете войти.")
        setTimeout(() => {
          router.push("/auth/login")
        }, 2000)
      } else {
        setError(data.error || "Произошла ошибка при регистрации")
      }
    } catch (error) {
      setError("Произошла ошибка при регистрации")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-700">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-lg flex items-center justify-center">
              <Music className="w-7 h-7 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-slate-200">Регистрация в K-Tunes</CardTitle>
          <CardDescription className="text-gray-600 dark:text-slate-400">
            Создайте аккаунт для доступа к бесплатной музыке
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50 text-green-800">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-700 dark:text-slate-300">
                Имя (опционально)
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Ваше имя"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                disabled={isLoading}
                className="bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-700"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 dark:text-slate-300">
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                required
                disabled={isLoading}
                className="bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-700"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 dark:text-slate-300">
                Пароль *
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Создайте пароль"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  required
                  disabled={isLoading}
                  className="bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-700 pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-400" />
                  )}
                </Button>
              </div>

              {/* Password Requirements */}
              {formData.password && (
                <div className="space-y-1 text-xs">
                  <div
                    className={`flex items-center gap-1 ${passwordRequirements.length ? "text-green-600" : "text-gray-500"}`}
                  >
                    {passwordRequirements.length ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    Минимум 8 символов
                  </div>
                  <div
                    className={`flex items-center gap-1 ${passwordRequirements.hasLetter ? "text-green-600" : "text-gray-500"}`}
                  >
                    {passwordRequirements.hasLetter ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    Минимум одна буква
                  </div>
                  <div
                    className={`flex items-center gap-1 ${passwordRequirements.hasNumber ? "text-green-600" : "text-gray-500"}`}
                  >
                    {passwordRequirements.hasNumber ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    Минимум одна цифра
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-700 dark:text-slate-300">
                Подтвердите пароль *
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Повторите пароль"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  required
                  disabled={isLoading}
                  className="bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-700 pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-400" />
                  )}
                </Button>
              </div>

              {formData.confirmPassword && (
                <div
                  className={`flex items-center gap-1 text-xs ${passwordRequirements.match ? "text-green-600" : "text-rose-500"}`}
                >
                  {passwordRequirements.match ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                  Пароли совпадают
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="terms" checked={acceptTerms} onCheckedChange={setAcceptTerms} disabled={isLoading} />
              <Label htmlFor="terms" className="text-sm text-gray-600 dark:text-slate-400">
                Я согласен с{" "}
                <Link href="/terms" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                  условиями использования
                </Link>
              </Label>
            </div>

            <Button
              type="submit"
              className="w-full bg-cyan-400 hover:bg-cyan-300 text-white"
              disabled={!isFormValid || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Регистрация...
                </>
              ) : (
                "Зарегистрироваться"
              )}
            </Button>

            <div className="text-center text-sm text-gray-600 dark:text-slate-400">
              Уже есть аккаунт?{" "}
              <Link href="/auth/login" className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium">
                Войти
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
