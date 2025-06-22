const { Pool } = require('pg')

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'ktunes_db',
  password: '1',
  port: 5432,
})

async function createTrack(data) {
  const client = await pool.connect()
  try {
    await client.query("BEGIN")

    // Get or create artist
    const artistResult = await client.query("SELECT id FROM artists WHERE name = $1", [data.artistName])
    let artistId

    if (artistResult.rows.length === 0) {
      const newArtistResult = await client.query(
        "INSERT INTO artists (name) VALUES ($1) RETURNING id",
        [data.artistName]
      )
      artistId = newArtistResult.rows[0].id
    } else {
      artistId = artistResult.rows[0].id
    }

    // Get or create album if provided
    let albumId = null
    if (data.albumTitle) {
      const albumResult = await client.query(
        "SELECT id FROM albums WHERE title = $1 AND artist_id = $2",
        [data.albumTitle, artistId]
      )

      if (albumResult.rows.length === 0) {
        const newAlbumResult = await client.query(
          "INSERT INTO albums (title, artist_id, cover_url) VALUES ($1, $2, $3) RETURNING id",
          [data.albumTitle, artistId, data.coverUrl]
        )
        albumId = newAlbumResult.rows[0].id
      } else {
        albumId = albumResult.rows[0].id
      }
    }

    // Create track
    const trackResult = await client.query(
      `
      INSERT INTO tracks (
        title, 
        artist_id, 
        album_id, 
        file_url, 
        cover_url, 
        duration, 
        file_size,
        embed_url
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, title, created_at
    `,
      [
        data.title,
        artistId,
        albumId,
        data.fileUrl,
        data.coverUrl,
        data.duration,
        data.fileSize,
        data.embedUrl
      ]
    )

    await client.query("COMMIT")

    // Get complete track info
    const trackInfoResult = await client.query(
      `
      SELECT 
        t.id,
        t.title,
        a.name as artist_name,
        al.title as album_title,
        t.duration,
        t.plays_count,
        t.downloads_count,
        t.cover_url,
        t.file_url,
        t.embed_url,
        t.is_active,
        t.created_at
      FROM tracks t
      LEFT JOIN artists a ON t.artist_id = a.id
      LEFT JOIN albums al ON t.album_id = al.id
      WHERE t.id = $1
      `,
      [trackResult.rows[0].id]
    )

    return trackInfoResult.rows[0]
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
}

module.exports = { createTrack } 