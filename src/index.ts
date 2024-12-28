// src/api/index.ts
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import supabase from './repo'
import { Track } from './types/Track'
import { v4 as uuidv4 } from 'uuid'
const app = new Hono()

app.use('*', cors())

// ユーザ登録
app.post('/api/user/register', async (c) => {
  const { spotify_id, spotify_display_name, spotify_email } = await c.req.json()
  console.log('ユーザ登録リクエスト:', { spotify_id, spotify_display_name, spotify_email })

  // 同じIDが存在（すでに登録済み）の場合はなにもしない
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('id', spotify_id)
    .single()

  if (data) return c.json({ message: 'User already registered' }, 200)

  await supabase.from('users').insert({ id: spotify_id, name: spotify_display_name, email: spotify_email })

  return c.json({ message: 'User registered' }, 200)
})

// ユーザのプレイリスト全取得
app.get('/api/playlists/:userId', async (c) => {
  const { userId } = c.req.param()
  const { data, error } = await supabase
    .from('playlists')
    .select(`
      id,
      name,
      tracks:tracks!inner ( 
        id,
        spotify_track_id,
        name,
        artist,
        cover_url,
        start_time,
        end_time,
        position
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) return c.json({ error: error.message }, 400)

  // データを必要な形式に変換
  const formattedPlaylists = data?.map(playlist => ({
    id: playlist.id,
    name: playlist.name,
    tracks: playlist.tracks
  }))

  return c.json(formattedPlaylists)
})

// プレイリスト作成
app.post('/api/playlists', async (c) => {
  try {
    const { userId, playlist } = await c.req.json()

    console.log('リクエストデータ:', { userId, playlist }); // デバッグログ追加
    
    // 1. まずplaylistsテーブルにプレイリスト情報を保存
    const { error: playlistError } = await supabase
      .from('playlists')
      .insert({ id: playlist.id, user_id: userId, name: playlist.name })

    if (playlistError) {
      console.error('プレイリスト作成エラー:', playlistError); // デバッグログ追加
      return c.json({ error: playlistError.message }, 400)
    }

    // 2. tracksテーブルに曲情報を保存

    const tracks = playlist.tracks.map((track: Track) => ({
      id: track.id,
      playlist_id: playlist.id,
      spotify_track_id: track.spotify_track_id,
      name: track.name,
      artist: track.artist,
      cover_url: track.cover_url,
      start_time: track.start_time,
      end_time: track.end_time,
      position: track.position
    }))

    const { error: tracksError } = await supabase
      .from('tracks')
      .insert(tracks)

    if (tracksError) {
      console.error('トラック情報保存エラー:', tracksError); // デバッグログ追加
      return c.json({ error: tracksError.message }, 400)
    }

    return c.json({ message: 'Playlist created' }, 200)
  } catch (error) {
    console.error('予期せぬエラー:', error); // デバッグログ追加
    return c.json({ error: '予期せぬエラーが発生しました' }, 500)
  }
})

// プレイリストの削除
app.delete('/api/playlists/:playlistId', async (c) => {
  const { playlistId } = c.req.param()

  // まず、tracksテーブルからplaylist_idに紐づくデータを削除  
  const { error: tracksError } = await supabase.from('tracks').delete().eq('playlist_id', playlistId)
  if (tracksError) return c.json({ error: tracksError.message }, 400)

  // 次に、playlistsテーブルからplaylist_idに紐づくデータを削除
  const { error } = await supabase.from('playlists').delete().eq('id', playlistId)
  if (error) return c.json({ error: error.message }, 400)

  return c.json({ message: 'Playlist deleted' }, 200)
})

// プレイリストの編集
app.put('/api/playlists/:userId/:playlistId', async (c) => {
  const { userId, playlistId } = c.req.param()
  const { updatedPlaylist } = await c.req.json()

  try {
    // トランザクションを使用して、すべての操作を一つのアトミックな操作として実行
    const { error: transactionError } = await supabase.from('playlists').upsert({
      id: playlistId,
      user_id: userId,
      name: updatedPlaylist.name
    })

    if (transactionError) {
      console.error('プレイリスト名更新エラー:', transactionError)
      return c.json({ error: transactionError.message }, 400)
    }

    // トラックの更新処理
    const tracksToUpsert = updatedPlaylist.tracks.map((track: Track) => ({
      id: track.id,
      playlist_id: playlistId,
      spotify_track_id: track.spotify_track_id,
      name: track.name,
      artist: track.artist,
      cover_url: track.cover_url,
      start_time: track.start_time,
      end_time: track.end_time,
      position: track.position
    }))

    // 既存のトラックを全て削除してから新しいトラックを挿入
    const { error: deleteError } = await supabase
      .from('tracks')
      .delete()
      .eq('playlist_id', playlistId)

    if (deleteError) {
      console.error('トラック削除エラー:', deleteError)
      return c.json({ error: deleteError.message }, 400)
    }

    const { error: insertError } = await supabase
      .from('tracks')
      .insert(tracksToUpsert)

    if (insertError) {
      console.error('トラック挿入エラー:', insertError)
      return c.json({ error: insertError.message }, 400)
    }

    return c.json({ message: 'プレイリストが正常に更新されました' }, 200)
  } catch (error) {
    console.error('プレイリスト更新エラー:', error)
    return c.json({ error: '予期せぬエラーが発生しました' }, 500)
  }
})

export default app
