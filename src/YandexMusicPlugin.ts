import {DisTubeError, PlayableExtractorPlugin, Playlist as DistubePlaylist, ResolveOptions, Song} from "distube";
import {YandexMusicAlbum, YandexMusicPlaylist, YandexMusicSong} from "./YandexMusicTypes.js";
import {parseYandexMusicURL} from "./YandexMusicAPI.js";
import {YMApi} from "ym-api-meowed";
import {Album, Playlist as YandexPlaylist} from "ym-api-meowed/dist/Types";

export const api: YMApi = new YMApi();

export interface YandexMusicPluginOptions {
    uid: number;
    oauthToken: string;
}
export class YandexMusicPlugin extends PlayableExtractorPlugin {
    constructor(options: YandexMusicPluginOptions) {
        super();

        if (typeof options !== "object" || Array.isArray(options)) {
            throw new DisTubeError("INVALID_TYPE", ["object", "undefined"], options, "YandexMusicPluginOptions");
        }
        if (options.oauthToken && typeof options.oauthToken !== "string") {
            throw new DisTubeError("INVALID_TYPE", "string", options.oauthToken, "oauthToken");
        }

        api.init({access_token: options.oauthToken, uid: options.uid}).then(r => {});
    }

    override async validate(url: string): Promise<boolean> {
        if (typeof url !== "string" || !url.includes("yandex")) return false;
        return /(.*)music\.yandex\.[a-z0-9]{0,10}\/(.*)$/.test(url)
    }

    async resolve<T>(songLink: string, options: ResolveOptions<T>): Promise<Song<any> | DistubePlaylist<any>>{
        const data = parseYandexMusicURL(songLink)
        if (data === undefined) {
            throw new DisTubeError("YANDEXMUSIC_PLUGIN_RESOLVE_ERROR", "Error when parsing URL. Examples of good url: https://music.yandex.ru/album/5605637/track/42445828 or https://music.yandex.ru/album/5605637");
        }

        switch (data.linkType){
            case "track": {
                const trackData = await api.getTrack(Number(data.trackId))
                if (!trackData) {
                    throw new DisTubeError("YANDEXMUSIC_PLUGIN_RESOLVE_ERROR", "Track data is not found");
                }

                return new YandexMusicSong(this, trackData[0], songLink, options)
            }
            case "album": {
                const album: Album = await api.getAlbumWithTracks(data.albumId!)
                if (!album.volumes?.length) {
                    throw new DisTubeError("YANDEXMUSIC_PLUGIN_RESOLVE_ERROR", "Album is empty")
                }
                // Get streamURL for all tracks in playlist
                return new YandexMusicAlbum(this, album, songLink, options)
            }
            case "users": {
                const playlistData: YandexPlaylist = await api.getPlaylist(Number(data.albumId), data.userId)

                if (!playlistData.tracks?.length) {
                    throw new DisTubeError("YANDEXMUSIC_PLUGIN_RESOLVE_ERROR", "Playlist is empty")
                }
                // Get streamURL for all tracks in playlist
                return new YandexMusicPlaylist(this, playlistData, songLink, options)
            }
        }
    }

    override async getStreamURL(song: Song): Promise<string> {
        if (!song.url) {
            throw new DisTubeError("YANDEXMUSIC_PLUGIN_INVALID_SONG", "Cannot get stream url from invalid song.");
        }

        const trackData = await api.getTrackDownloadInfo(Number(song.id))

        const downloadUrl = await api.getTrackDirectLink(trackData[0].downloadInfoUrl)

        return downloadUrl
    }

    getRelatedSongs() {
        return [];
    }
}

