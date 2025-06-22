import { pool } from "@/lib/database"
import { readFileSync } from "fs"
import { join } from "path"

async function initDatabase() {
  const client = await pool.connect()
  try {
    console.log("Initializing database...")
    
    // Читаем SQL файл
    const schemaPath = join(process.cwd(), "database", "schema.sql")
    const schema = readFileSync(schemaPath, "utf-8")
    
    // Выполняем SQL
    await client.query(schema)
    
    console.log("Database initialized successfully!")
  } catch (error) {
    console.error("Error initializing database:", error)
    throw error
  } finally {
    client.release()
  }
}

// Запускаем инициализацию если файл запущен напрямую
if (require.main === module) {
  initDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Failed to initialize database:", error)
      process.exit(1)
    })
}

export default initDatabase 