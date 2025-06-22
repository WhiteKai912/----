import { Loader2 } from "lucide-react"

export function Loading() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-900 pt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-cyan-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-slate-400">Загрузка...</p>
          </div>
        </div>
      </div>
    </div>
  )
} 