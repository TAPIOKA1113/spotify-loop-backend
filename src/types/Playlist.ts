import { Track } from './Track'

export interface Playlist {
    id: string;
    name: string;
    tracks: Track[];
}