<div align="center">
  <p>
    <a href="https://nodei.co/npm/distube-yandex-music-plugin"><img src="https://nodei.co/npm/distube-yandex-music-plugin.png?downloads=true&downloadRank=true&stars=true"></a>
  </p>
  <p>
    <a href="https://nodei.co/npm/distube-yandex-music-plugin"><img alt="npm peer dependency version" src="https://img.shields.io/npm/dependency-version/distube-yandex-music-plugin/peer/distube?style=flat-square"></a>
    <a href="https://nodei.co/npm/distube-yandex-music-plugin"><img alt="npm" src="https://img.shields.io/npm/dt/distube-yandex-music-plugin?logo=npm&style=flat-square"></a>
    <img alt="GitHub Repo stars" src="https://img.shields.io/github/stars/AlexInCube/distube-yandex-music-plugin?logo=github&logoColor=white&style=flat-square">
  </p>
</div>

# distube-yandex-music-plugin

A DisTube custom plugin for supporting Yandex Music URL.
Created by [AlexInCube](https://vk.com/alexincube)

## Feature

This plugin grabs the songs on Yandexmusic and plays with DisTube.

Examples of supported links:
- Public track https://music.yandex.com/album/10030/track/38634572
- Albums https://music.yandex.ru/album/5307396
- Playlists https://music.yandex.ru/users/alexander.tsimbalistiy/playlists/1000

If you have some troubles, please create an issue

## Installation

```sh
npm install distube-yandex-music-plugin@latest
```

## Usage

```js
const Discord = require("discord.js");
const client = new Discord.Client();

const { DisTube } = require("distube");
const { YandexMusicPlugin } = require("distube-yandex-music-plugin");
const distube = new DisTube(client, {
  plugins: [new YandexMusicPlugin()],
});
```

## Documentation

### YandexMusicPlugin([YandexMusicPluginOptions])

- `oauthToken:`: Required for using Yandex API. You can retrieve token by following this [guide](https://github.com/MarshalX/yandex-music-api/discussions/513)
#### Example

```js
new YandexMusicPlugin({
  oauthToken: "YandexMusicToken"
});
```
