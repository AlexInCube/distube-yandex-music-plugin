import {LinkType} from "./YandexMusicTypes.js";

function isLinkType(value: string): value is LinkType {
    return value === "track" || value === "album" || value === "users";
}

export interface IParsedYandexLinkData{
    linkType: LinkType,
    url: string
    albumId?: number,
    trackId?: number
    userId?: string
}
export function parseYandexMusicURL(url: string): IParsedYandexLinkData| undefined {
    url = url.replace(/:\/\/(m|www)\./g, "://");

    try{
        let parsedData = new URL(url).pathname.split("/").splice(1)
        parsedData = parsedData.filter((element) => {
            return element !== ""
        })

        let type: LinkType = parsedData[0] as LinkType

        if (!isLinkType(type)) return undefined
        if (type === "album"){
            if (parsedData[2] === "track"){
                type = "track"
            }
        }
        //const type = parsedData[parsedData.length - 2]
        switch (type){
            case "track": {
                return yandexMusicParserPartTrackFromAlbum(url, parsedData)
            }

            case "album":{
                return yandexMusicParserPartAlbum(url, parsedData)
            }

            case "users":{
                return yandexMusicParserPartPlaylist(url, parsedData)
            }
            default:
                return undefined
        }
    } catch (e) {
        return undefined
    }
}

// for example, public track https://music.yandex.com/album/10030/track/38634572
export function yandexMusicParserPartTrackFromAlbum(url: string, parsedData: string[]): IParsedYandexLinkData | undefined {
    const albumId = Number(parsedData[1])
    const trackId = Number(parsedData[3])
    if (typeof trackId !== "number" || typeof albumId !== "number") {
        return undefined
    }
    return  {linkType: "track", trackId, albumId, url}
}
// for example, album https://music.yandex.ru/album/5307396
export function yandexMusicParserPartAlbum(url: string, parsedData: string[]): IParsedYandexLinkData | undefined {
    const albumId = Number(parsedData[1])
    if (typeof albumId !== "number") {
        return undefined
    }
    return {linkType: "album", albumId, url}
}
// for example, user playlist https://music.yandex.ru/users/alexander.tsimbalistiy/playlists/1000
export function yandexMusicParserPartPlaylist(url: string, parsedData: string[]): IParsedYandexLinkData | undefined {
    const userId = parsedData[1]
    const albumId = Number(parsedData[3])
    if (typeof albumId !== "number") {
        return undefined
    }
    return {linkType: "users", userId, albumId, url}
}

export function yandexGenerateMusicTrackUrl(trackId: string | number, albumId?: string | number){
    trackId = trackId.toString()
    albumId = albumId?.toString()

    if (albumId){
        return `https://music.yandex.ru/album/${albumId}/track/${trackId}`
    }
    return `https://music.yandex.ru/track/${trackId}`
}
