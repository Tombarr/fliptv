# FlipTV

[FlipTV](https://kaios.app/apps/kamXx7F81YPzDogu5jEP) is a simple Internet Protocol TV (IPTV) app for [KaiOS](https://www.kaiostech.com/) feature phones, available for free on the KaiStore. Made by [Tom Barrasso](https://barrasso.me), developer of [PodLP](https://podlp.com/).

## Technical notes

FlipTV is built using [SvelteJS](https://svelte.dev/) and [TypeScript](https://www.typescriptlang.org/), with the only runtime dependency being [hls.js](https://github.com/video-dev/hls.js).

These were great choices to keep the package size small and provide a responsive experience, given the memory and CPU consumption needed for audio-video streaming. The final package size is only ~200kb zipped.

### IPTV

FlipTV includes a pre-defined list of ["channels](./src/initial_channels.json) that point to [.m3u](https://en.wikipedia.org/wiki/M3U) files. This list can be extended via a remote list in [Channels.ts](./src/data/Channels.ts).

Each M3U file a remote text file with a list of available media formats. FlipTV automatically sources the media format closest to the device screen size of 240x320.

To mimic the static that old analog TVs used to display, FlipTV generates "pink noise" [static](./src/components/Static.svelte) as the background rendered to canvas when it's unable to load.

### KaiOS 3.0

FlipTV was never adapted for KaiOS 3.0. Despite including both a [`manifest.webapp`](./public/manifest.webapp) into [`manifest.webmanifest`](./public/manifest.webmanifest), several changes would be necessary including styles and how auto-fullscreen is handled. Since no KaiOS 3.0 device supports [DevTools](https://kaios.dev/2024/01/whats-missing-from-kaios-development/#kaios-30-developer-mode), debugging is a challenge.

### Data Types

Custom data types are provided based on KaiOS API documentation. These have proven helpful coding against KaiOS with type safety and having auto-complete in VS Code.

### KaiAds

FlipTV is provided free to charge, with [KaiAds](https://kaiads.com/) installed per the KaiOS KaiStore Submission Guidelines.

## Get started

Install dependencies:

```bash
npm install
```

Start [Rollup](https://rollupjs.org):

```bash
npm run dev
```

Navigate to [localhost:5000](http://localhost:5000). You should see your app running. Edit a component file in `src`, save it, and reload the page to see your changes.

By default, the server will only respond to requests from localhost. To allow connections from other computers, edit the `sirv` commands in package.json to include the option `--host 0.0.0.0`.

If you're using [Visual Studio Code](https://code.visualstudio.com/) we recommend installing the official extension [Svelte for VS Code](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode). If you are using other editors you may need to install a plugin in order to get syntax highlighting and intellisense.

## Building and running in production mode

To create an optimised, minified version of the app:

```bash
npm run build
```

The resulting code in `/public` can then be zipped as a packaged app for distribution on the KaiStore.
