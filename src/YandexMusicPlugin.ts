import {DisTubeError, ExtractorPlugin, Playlist, Song} from "distube";
import {Album, Playlist as YandexFetchedPlaylist, YandexMusicClient} from "yandex-music-client";
import {YandexMusicAlbum, YandexMusicPlaylist, YandexMusicTrack} from "./YandexMusicTypes.js";
import {getTrackUrl} from "yandex-music-client/trackUrl.js";
import {GuildMember} from "discord.js";
import {parseYandexMusicURL, yandexGetTrackMetaData} from "./YandexMusicAPI.js";

let yandexClient: YandexMusicClient

export interface YandexMusicPluginOptions {
    oauthToken: string;
}
export class YandexMusicPlugin extends ExtractorPlugin {
    constructor(options: YandexMusicPluginOptions) {
        super();

        if (typeof options !== "object" || Array.isArray(options)) {
            throw new DisTubeError("INVALID_TYPE", ["object", "undefined"], options, "YandexMusicPluginOptions");
        }
        if (options.oauthToken && typeof options.oauthToken !== "string") {
            throw new DisTubeError("INVALID_TYPE", "string", options.oauthToken, "oauthToken");
        }

        yandexClient = new YandexMusicClient({
            BASE: "https://api.music.yandex.net:443",
            HEADERS: {
                'Authorization': `OAuth ${options.oauthToken}`,
                'Accept-Language': 'ru'
            },
        });

    }

    override async validate(url: string): Promise<boolean> {
        if (typeof url !== "string" || !url.includes("yandex")) return false;
        return /(.*)music\.yandex\.[a-z0-9]{0,10}\/(.*)$/.test(url)
    }

    async resolve(songLink: string, options: { member?: GuildMember; metadata?: any }){
        console.log("Yandex Music Resolve")

        const data = parseYandexMusicURL(songLink)
        if (data === undefined) {
            throw new DisTubeError("YANDEXMUSIC_PLUGIN_RESOLVE_ERROR", "Error when parsing URL. Examples of good url: https://music.yandex.ru/album/5605637/track/42445828 or https://music.yandex.ru/album/5605637");
        }

        switch (data.linkType){
            case "track": {
                const trackData = await yandexGetTrackMetaData(yandexClient, data.trackId!)
                if (!trackData) {
                    throw new DisTubeError("YANDEXMUSIC_PLUGIN_RESOLVE_ERROR", "Track data is not found");
                }

                return new Song(new YandexMusicTrack(trackData, songLink), options)
            }
            case "album": {
                const album: Album = await yandexClient.albums.getAlbumsWithTracks(Number(data.albumId)).then(r => {
                    return r.result
                })
                if (!album.volumes?.length) {
                    throw new DisTubeError("YANDEXMUSIC_PLUGIN_RESOLVE_ERROR", "Album is empty")
                }
                // Get streamURL for all tracks in playlist
                return new Playlist(new YandexMusicAlbum(album, songLink), options)
            }
            case "users": {
                // @ts-ignore I need this, because getPlaylistById has a wrong type in userId
                const playlistData: YandexFetchedPlaylist = await yandexClient.user.getPlaylistById(data.userId!, Number(data.albumId)).then(r => {
                    return r.result
                })

                if (!playlistData.tracks.length) {
                    throw new DisTubeError("YANDEXMUSIC_PLUGIN_RESOLVE_ERROR", "Playlist is empty")
                }
                // Get streamURL for all tracks in playlist
                return new Playlist(new YandexMusicPlaylist(playlistData, songLink), options)
            }
        }
    }

    override async getStreamURL(songLink: string) {
        const data = parseYandexMusicURL(songLink)!
        return await getTrackUrl(yandexClient, data.trackId!)
    }
}

