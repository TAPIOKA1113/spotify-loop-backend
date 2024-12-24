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

// プレイリスト取得
app.get('/api/playlists/:userId', async (c) => {
  const { userId } = c.req.param()
  const { data, error } = await supabase
    .from('playlists')
    .select(`
      id,
      name,
      playlist_tracks (
        track_id,
        start_time,
        end_time,
        position,
        track:tracks!inner ( 
          id,
          spotify_track_id,
          name,
          artist,
          cover_url
        )
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) return c.json({ error: error.message }, 400)

  // データを必要な形式に変換
  const formattedPlaylists = data?.map(playlist => ({
    id: playlist.id,
    name: playlist.name,
    tracks: playlist.playlist_tracks.map(pt => ({
      id: pt.track_id,
      trackId: pt.track.spotify_track_id,
      artist: pt.track.artist,
      name: pt.track.name,
      cover: pt.track.cover_url,
      startTime: pt.start_time,
      endTime: pt.end_time
    }))
  }))

  return c.json(formattedPlaylists)
})

// プレイリスト作成
app.post('/api/playlists', async (c) => {
  try {
    const { userId, name, tracks } = await c.req.json()

    console.log('リクエストデータ:', { userId, name, tracks }); // デバッグログ追加
    
    // 1. まずtracksテーブルに曲情報を保存
    const tracksToInsert = tracks.map((track: Track) => ({
      id: uuidv4(),
      spotify_track_id: track.id,
      name: track.name,
      artist: track.artist,
      cover_url: track.cover,
    }))

    const { data: trackData, error: tracksInsertError } = await supabase
      .from('tracks')
      .upsert(tracksToInsert, { 
        onConflict: 'id',  // id が既に存在する場合は更新
      })
      .select()
      .single()

    if (tracksInsertError) {
      console.error('トラック情報保存エラー:', tracksInsertError)
      return c.json({ error: tracksInsertError.message }, 400)
    }

    // 2. プレイリストの作成（既存のコード）
    const { data: playlist, error: playlistError } = await supabase
      .from('playlists')
      .insert({ 
        id: uuidv4(),
        user_id: userId, 
        name: name 
      })
      .select()
      .single()

    if (playlistError) {
      console.error('プレイリスト作成エラー:', playlistError); // デバッグログ追加
      return c.json({ error: playlistError.message }, 400)
    }

  // トラックの挿入処理
  const playlistTracks = tracks.map((track: Track, index: number) => ({
    id: uuidv4(),
    playlist_id: playlist.id,
    track_id: trackData.id,
    start_time: track.startTime,
    end_time: track.endTime,
    position: index
  }))

    console.log('プレイリストトラックデータ:', playlistTracks); // デバッグログ追加

    const { error: tracksError } = await supabase
      .from('playlist_tracks')
      .insert(playlistTracks)

    if (tracksError) {
      console.error('トラック追加エラー:', tracksError); // デバッグログ追加
      return c.json({ error: tracksError.message }, 400)
    }

    return c.json(playlist)
  } catch (error) {
    console.error('予期せぬエラー:', error); // デバッグログ追加
    return c.json({ error: '予期せぬエラーが発生しました' }, 500)
  }
})

export default app