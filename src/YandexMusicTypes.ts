import {OtherSongInfo, PlaylistInfo, Song} from "distube";
import {Album, Playlist, Track} from "yandex-music-client";

export type LinkType = "track" | "album" | "users"
export const PluginSource = "yandexmusic"
export class YandexMusicTrack implements OtherSongInfo {
    src = PluginSource;
    name: string;
    url: string;
    duration: number;
    uploader: string;
    thumbnail: string;

    constructor(info: Track, trackUrl: string) {
        this.name = info.title
        this.duration = info.durationMs / 1000
        this.uploader = info.artists[0].name
        this.url = trackUrl
        this.thumbnail = yandexGetCoverUri(info.coverUri, 100)
    }
}

export class YandexMusicAlbum implements PlaylistInfo {
    source= PluginSource;
    songs: Song[];
    name: string;
    url: string;
    thumbnail?: string;
    constructor(info: Album, albumUrl: string) {
        this.name = info.title;
        this.url = albumUrl;
        this.thumbnail = yandexGetCoverUri(info.coverUri, 100)
        if (!info.volumes?.length){ this.songs = []; return }
        this.songs = info.volumes[0].map((track) => new Song(new YandexMusicTrack(track, albumUrl)));
    }
}

export class YandexMusicPlaylist implements PlaylistInfo {
    source= PluginSource;
    songs: Song[];
    name: string;
    url: string;
    thumbnail?: string;
    constructor(info: Playlist, albumUrl: string) {
        this.name = info.title;
        this.url = albumUrl;
        this.songs = []
        if (info.cover?.uri){
            this.thumbnail = yandexGetCoverUri(info.cover?.uri, 100)
        }

        if (!info.tracks.length) return
        info.tracks.forEach((track) => {
            if (track.track){
                this.songs.push(new Song(new YandexMusicTrack(track.track, albumUrl)))
            }
        });
    }
}

export type yandexCoverSize = 30 | 50 | 100 | 150 | 200 | 300 | 400 | 700 | 800 | 1000;
/**
 * Returns cover uri with specified size
 *
 * @param uriTemplate track.coverUri
 * @param size cover size
 */
export function yandexGetCoverUri(uriTemplate: string, size: yandexCoverSize) {
    return `https://${uriTemplate.replace('%%', `${size}x${size}`)}`;
}
