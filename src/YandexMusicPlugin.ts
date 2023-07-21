import {CustomPlugin, DisTubeError, Playlist as DistubePlaylist, PlayOptions, Song as DistubeSong} from "distube";
import {Album, Playlist, Track, TrackItem, YandexMusicClient} from "yandex-music-client";
import {PluginSource, YandexMusicAlbum, YandexMusicPlaylist, YandexMusicTrack} from "./YandexMusicTypes.js";
import {getTrackUrl} from "yandex-music-client/trackUrl.js";
import {VoiceBasedChannel} from "discord.js";
import {parseYandexMusicURL, yandexGenerateMusicTrackUrl, yandexGetTrackMetaData} from "./YandexMusicAPI.js";

let yandexClient: YandexMusicClient

export interface YandexMusicPluginOptions {
    oauthToken: string;
}
export class YandexMusicPlugin extends CustomPlugin {
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

    async play(voiceChannel: VoiceBasedChannel, songLink: string, options: PlayOptions){
        const opt = {...options, source: "yandexmusic"};
        const data = parseYandexMusicURL(songLink)
        if (data === undefined) {
            throw new DisTubeError("YANDEXMUSIC_PLUGIN_RESOLVE_ERROR", "Error when parsing URL. Examples of good url: https://music.yandex.ru/album/5605637/track/42445828 or https://music.yandex.ru/album/5605637");
        }

        switch (data.linkType){
            case "track": {
                const downloadTrackUri = await getTrackUrl(yandexClient, data.trackId!)
                const trackData = await yandexGetTrackMetaData(yandexClient, data.trackId!)
                if (!downloadTrackUri || !trackData) {
                    throw new DisTubeError("YANDEXMUSIC_PLUGIN_RESOLVE_ERROR", "Track data is not found");
                }

                const finalSong = new DistubeSong(new YandexMusicTrack(trackData, songLink))
                finalSong.source = PluginSource
                finalSong.streamURL = downloadTrackUri
                finalSong.url = songLink
                await this.distube.play(voiceChannel, finalSong, opt)
                break
            }
            case "album": {
                const album: Album = await yandexClient.albums.getAlbumsWithTracks(Number(data.albumId)).then(r => {
                    return r.result
                })
                if (!album.volumes?.length) {
                    throw new DisTubeError("YANDEXMUSIC_PLUGIN_RESOLVE_ERROR", "Playlist is empty")
                }
                const albumTracks: Track[] = album.volumes[0]

                // Get streamURL for all tracks in playlist
                const results: string[] = await Promise.all(albumTracks.map(query => getTrackUrl(yandexClient, query.id)));
                const finalPlaylist = new DistubePlaylist(new YandexMusicAlbum(album, songLink))
                finalPlaylist.songs = finalPlaylist.songs.map((song, index) => {
                    song.source = PluginSource
                    song.url = yandexGenerateMusicTrackUrl(albumTracks[index].id, data.albumId)
                    song.streamURL = results[index]
                    return song
                })

                await this.distube.play(voiceChannel, finalPlaylist, options)
                break
            }
            case "users": {
                const playlistData: Playlist = await yandexClient.user.getPlaylistById(data.userId!, Number(data.albumId)).then(r => {
                    return r.result
                })

                if (!playlistData.tracks.length) {
                    throw new DisTubeError("YANDEXMUSIC_PLUGIN_RESOLVE_ERROR", "Playlist is empty")
                }
                const playlistTracks: Array<TrackItem> = playlistData.tracks
                const results: string[] = await Promise.all(playlistTracks.map(trackItem =>
                    getTrackUrl(yandexClient, trackItem.id.toString())
                ));
                // Get streamURL for all tracks in playlist
                const finalPlaylist = new DistubePlaylist(new YandexMusicPlaylist(playlistData, songLink))
                finalPlaylist.songs = finalPlaylist.songs.map((song: DistubeSong, index) => {
                    song.source = PluginSource
                    song.url = yandexGenerateMusicTrackUrl(playlistTracks[index].id.toString())
                    song.streamURL = results[index]
                    return song
                })

                await this.distube.play(voiceChannel, finalPlaylist, options)
                break
            }
        }
    }
}

