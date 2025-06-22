import { pool } from "@/lib/database"
import { readFileSync } from "fs"
import { join } from "path"

async function applyMigration() {
  const client = await pool.connect()
  try {
    console.log("Applying migration...")
    
    // Читаем файл миграции
    const migrationPath = join(process.cwd(), "migrations", "20240318_add_cover_fields.sql")
    const migrationSQL = readFileSync(migrationPath, "utf-8")

    // Начинаем транзакцию
    await client.query("BEGIN")

    try {
      // Выполняем миграцию
      await client.query(migrationSQL)
      await client.query("COMMIT")
      console.log("Migration applied successfully!")
    } catch (error) {
      await client.query("ROLLBACK")
      console.error("Error applying migration:", error)
      throw error
    }
  } finally {
    client.release()
  }
}

// Запускаем миграцию
applyMigration()
  .catch(console.error)
  .finally(() => process.exit()) 