import {ResolveOptions, Song as DistubeSong, Playlist as DistubePlaylist} from "distube";
import {yandexGenerateMusicTrackUrl} from "./YandexMusicAPI";
import {YandexMusicPlugin} from "./YandexMusicPlugin";
import {Album, Track, Playlist} from "ym-api-meowed/dist/Types";

export type LinkType = "track" | "album" | "users"

const PluginSource = "yandexmusic"

export class YandexMusicSong<T> extends DistubeSong<T>{
    constructor(plugin: YandexMusicPlugin, info: Track, albumId?: string, options: ResolveOptions<T> = {}) {
        super({
            plugin,
            source: PluginSource,
            playFromSource: true,
            id: info.id.toString(),
            url: yandexGenerateMusicTrackUrl(info.id.toString(), albumId),
            name: info.title,
            duration: info.durationMs / 1000,
            isLive: false,
            thumbnail: yandexGetCoverUri(info.coverUri, 100),
            uploader: {
                name: info.artists[0].name
            },
        }, options);
    }
}

export class YandexMusicAlbum extends DistubePlaylist{
    constructor(plugin: YandexMusicPlugin, info: Album, albumUrl: string, options: ResolveOptions = {}) {
        let songs: Array<YandexMusicSong<any>> = []

        if (info?.volumes?.length){
            songs = info.volumes[0].map((track) => new YandexMusicSong(plugin, track, info.id.toString()))
        }

        super({
            songs,
            source: PluginSource,
            id: info.id.toString(),
            name: info.title,
            url: albumUrl,
            thumbnail: yandexGetCoverUri(info.coverUri, 100),
        }, options)
    }
}


export class YandexMusicPlaylist extends DistubePlaylist {
    constructor(plugin: YandexMusicPlugin, info: Playlist, albumUrl: string, options: ResolveOptions = {}) {
        let songs: Array<YandexMusicSong<any>> = []

        if (!info?.tracks?.length) return
        info.tracks.forEach((track) => {
            if (track.track){
                songs.push(new YandexMusicSong(plugin, track.track, track.track.albums[0].id.toString(), options))
            }
        });

        super({
            songs,
            source: PluginSource,
            id: info.uid.toString(),
            name: info.title,
            url: albumUrl,
            thumbnail: yandexGetCoverUri(info.tracks[0].track.coverUri, 100),
        }, options)
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
