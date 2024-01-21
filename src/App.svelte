<script lang="ts">
  import Hls from 'hls.js';
  import { onMount, onDestroy, tick } from 'svelte';

  import { WakeLockTopic } from '../types/dom';

  import GlobalStyles from './GlobalStyles.svelte';
  import ListView from './components/ListView.svelte';
  import SoftBar from './components/SoftBar.svelte';
  import Static from './components/Static.svelte';
  import Loading from './components/Loading.svelte';
  import Tutorial from './components/Tutorial.svelte';

  import { CONTENT, setAudioChannel, setHeadphoneChange, isHeadphones, setAudioChannelType } from './compat/MozAudioManager';
  import { requestFullscreen, exitFullscreen, isFullscreen, FULLSCREENCHANGE, FULLSCREENERROR } from './compat/fullscreen';
  import { setMultiActionHandler, setPlaybackState, setMetadata } from './compat/MediaSession';
  import { HIDDEN, VISIBILITY_CHANGE } from './compat/pageVisibility';
  import { getOrientation, lockOrientation } from './compat/orientation';
  import { requestUp, requestDown } from './compat/VolumeManager';
  import { requestWakeLock, releaseWakeLock } from './compat/wakelock';
  import { canAutoPlay } from './compat/webaudio';
  import { minimizeMemoryUsage } from './compat/utils';
  import { removeNoscript } from './shim';
  import { isHostReachable } from './compat/socket';
  import { getAd } from './data/Ads';
  import { AD_INTERVAL, CONTROLS_DURATION, HLS_CONFIG, NAME, VERSION } from './Static';
  import { strings } from './data/Strings';
  import type { Channel } from "../types/channel";
  import { getFeature } from './compat/feature';
  import { getItem, setItem } from './compat/storage';
  import { isUpdateAvailable, goToStore } from './compat/update';
  import { measurementUrl } from './data/GA';
  import { getFirstChannel, saveChannelIndex, getChannels, fetchChannels } from './data/Channels';
  import { PLAY as PLAY_ICON, PAUSE as PAUSE_ICON, FULLSCREEN as FULLSCREEN_ICON,
    EXIT_FULLSCREEN as EXIT_FULLSCREEN_ICON, MENU as MENU_ICON, NO_WIFI as NO_WIFI_ICON,
    EXIT as EXIT_ICON, HELP as HELP_ICON } from './icons';

  import presetChannels from './initial_channels.json';
  import { getObjectFit, nextObjectFit } from './data/ObjectFit';
  import { getArrowKey } from './compat/arrows';

  const MEDIA_SESSION_EVENTS = (['pause', 'play', 'stop', 'previoustrack', 'nexttrack'] as MediaSessionAction[]);
  const hlsSupported: boolean = Hls.isSupported();
  const hasMozActivity = ('MozActivity' in window && typeof window.MozActivity !== 'undefined');
  const NUM_PATTERN = '[0-9]{1,3}';

  // Check if the app exitted unsuccessful last time
  const failedExit = (getItem('e') === '0');

  let channels: Channel[] = presetChannels;
  let video: HTMLVideoElement = null;
  let channelNumber: HTMLInputElement = null;

  let enableWorker: boolean = (getItem('w') !== '0');
  let fit: string = getObjectFit();
  let online: boolean = navigator.onLine;
  let headphones: boolean = isHeadphones();
  let pageVisible: boolean = !document[HIDDEN];
  let paused: boolean = true;
  let wasPaused: boolean = true;
  let orientation: OrientationLockType = getOrientation();
  let fullscreen: boolean = isFullscreen();
  let controlsHidden: boolean = false;
  let controlsTimeout = null;
  let bufferTimeout = null;
  let adInterval = null;
  let autoplayEnabled: boolean = false;
  let nativeHls: boolean = false;
  let cannotBuffer: boolean = false;
  let silent: boolean = false;
  let missedFrames: number = 0;
  let kaiAdVisible: boolean = false;
  let isBuffering: boolean = false;
  let menuHidden: boolean = true;
  let hasPlayed: boolean = false;
  let exiting: boolean = false;
  let isLoadingSource: boolean = true;
  let isChangingChannel: boolean = false;
  let channelSelect: string = null;
  let hostReachable: boolean = true;
  let hasSetChannel: boolean = false;
  let memory: number = 0;
  let tutorialOpen: boolean = (getItem('t') !== '1');

  // Current Channel
  let channelIndex: number = 0;
  let channel: Channel = channels[channelIndex];
  let hls: Hls;

  $: loadingVisible = (menuHidden && !cannotBuffer) && (isLoadingSource || !online);
  $: altMenu = (!menuHidden || isChangingChannel);
  $: headerVisible = (isChangingChannel || !controlsHidden);
  $: maxChannel = Math.min(999, channels.length);
  $: portrait = (
    orientation === 'natural' ||
    orientation === 'portrait' ||
    orientation === 'portrait-primary' ||
    orientation === 'portrait-secondary'
  );

  const isNonEmptyArray = (arr: any[]) => Array.isArray(arr) && arr.length;

  function restoreLastChannel() {
    setChannel(getFirstChannel(channels, failedExit));
    setTimeout(play, 1000);
  }

  function updateLocalChannelList() {
    return getChannels()
      .then((channelList) => {
        if (isNonEmptyArray(channelList)) {
          console.log('updateLocalChannelList', channelList);
          channels = channelList;
        }
      });
  }

  function updateRemoteChannelList() {
    return fetchChannels()
      .then((channelList) => {
        if (isNonEmptyArray(channelList)) {
          console.log('updateRemoteChannelList', channelList);
          channels = channelList;
        }
      });
  }

  function detachCurrentSource() {
    if (hls) {
      console.log('detachCurrentSource');
      return new Promise((resolve) => {
        hls.once(Hls.Events.MEDIA_DETACHED, () => {
          console.log('detached');
          hls.destroy();
          resolve(true);
        })
        hls.detachMedia();
      });
    }

    return Promise.resolve(true);
  }

  function onTutorialClose() {
    tutorialOpen = false;
    
    // Remember that the tutorial was shown
    setItem('t', '1');

    if (!hasSetChannel) {
      // Load initial channel
      restoreLastChannel();
    }

    if (!wasPaused) {
      play();
    }
  }

  function showTutorial() {
    wasPaused = paused;
    tutorialOpen = true;
    pause();
  }

  function checkReachability(src: string) {
    const url = new URL(src);
    return isHostReachable(url.host)
      .then((reachable) => {
        console.log('reachable', url.host, hostReachable);
        hostReachable = reachable;
      });
  }

  function attachSource(src: string, videoEl: HTMLVideoElement) {
    console.log('attachSource', src);
    checkReachability(src);

    // Dynamically set enableWorker
    const maxBufferSize = (memory === 0.25) ? Math.ceil(HLS_CONFIG.maxBufferSize / 2) : HLS_CONFIG.maxBufferSize;
    const maxMaxBufferLength = (memory === 0.25) ? Math.ceil(HLS_CONFIG.maxMaxBufferLength / 2) : HLS_CONFIG.maxMaxBufferLength;
    const cfg = {
      ...HLS_CONFIG,
      enableWorker,
      maxBufferSize,
      maxMaxBufferLength,
    };

    if (hlsSupported) {
      isLoadingSource = true;
      hls = new Hls(cfg);
      hls.attachMedia(videoEl);
      hls.on(Hls.Events.ERROR, onLiveStreamError);
      hls.on(Hls.Events.FRAG_BUFFERED, onFragBuffered);
      // Save channel index after successfully loading
      hls.once(Hls.Events.FRAG_BUFFERED, () => {
        saveChannelIndex(channelIndex);
      });
      // Load source after attaching to video element
      hls.once(Hls.Events.MEDIA_ATTACHED, () => {
        hls.loadSource(src);
        cannotBuffer = false;
      });
    } else if (nativeHls) {
      videoEl.src = src;
    }
  }

  function setChannel(nextChannel: Channel) {
    console.log('setChannel', nextChannel, channel);
    if (!hasSetChannel || channel.videoid !== nextChannel.videoid) {
      hasSetChannel = true;
      channel = nextChannel;
      channelIndex = getChannelIndex(nextChannel);
      document.title = channel.title;
      playLiveStream(nextChannel.videoid, video);
    }
    cannotBuffer = false;
  }

  function playLiveStream(src: string, videoEl: HTMLVideoElement): Promise<void> {
    console.log('playLiveStream', src);
    if (!online) {
      return Promise.resolve();
    }

    return detachCurrentSource()
      .then(() => attachSource(src, videoEl));
  }

  function updatePlaybackState() {
    if (video.ended) {
      setPlaybackState('none');
    } else if (video.paused) {
      setPlaybackState('paused');
    } else {
      setPlaybackState('playing');
      hasPlayed = true;
    }

    setMetadata({ });
    requestAnimationFrame(restoreControls);
  }

  function hideControls() {
    if (!menuHidden || tutorialOpen) {
      controlsTimeout = setTimeout(hideControls, CONTROLS_DURATION);
    } else {
      controlsHidden = true;
      requestFullscreen();
    }
  }

  function restoreControls() {
    controlsHidden = false;
    exitFullscreen();
    clearTimeout(controlsTimeout);

    if (!(video.paused || video.ended)) {
      controlsTimeout = setTimeout(hideControls, CONTROLS_DURATION);
    }
  }

  function play() {
    silent = false;
    if (video) {
      video.play();
    }

    updatePlaybackState();
  }

  function pause() {
    silent = true;
    if (video) {
      video.pause();
    }

    updatePlaybackState();
  }

  const getChannelIndex = (curChannel = channel): number =>
    channels.findIndex(({ videoid }) => videoid === curChannel.videoid);

  function channelUp() {
    const channelIndex = getChannelIndex();
    const nextChannelIndex = (channelIndex + 1 < channels.length) ? channelIndex + 1 : 0;
    const nextChannel = channels[nextChannelIndex];
    setChannel(nextChannel);
  }

  function channelDown() {
    const channelIndex = getChannelIndex();
    const nextChannelIndex = (channelIndex - 1 >= 0) ? channelIndex - 1 : channels.length - 1;
    const nextChannel = channels[nextChannelIndex];
    setChannel(nextChannel);
  }

  function togglePlayback() {
    const isPaused = (video) ? video.paused || video.ended : paused;
    if (isPaused) {
      play();
    } else {
      pause();
    }
  }

  function toggleMenu() {
    menuHidden = !menuHidden;
  }

  function toggleFullscreen() {
    if (fullscreen || !portrait) {
      exitFullscreen()
        .then(() => lockOrientation(true, 'natural'))
        .catch((e: Error) => console.warn(e));
    } else {
      requestFullscreen()
        .then(() => lockOrientation(true, 'landscape'))
        .catch((e: Error) => console.warn(e));
    }
  }

  function showExitConfirmation() {
    // Close immediately
    if (exiting || !online) {
      // Lifecycle file
      setItem('e', '1');
      requestAnimationFrame(() => close());
    }

    const wasPaused = video.paused;

    // Pause playback
    if (!wasPaused) {
      pause();
    }

    // Alerts don't show in fullscreen
    if (fullscreen) {
      exitFullscreen();
    }

    // Confirm if the user wants to exit
    const exit = confirm(strings.exit_message);
    if (exit) {
      // Trigger app close after animation
      exiting = true;
      // Needs to be longer than animation
      setTimeout(() => {
        // Lifecycle file
        setItem('e', '1');
        close();
      }, 2000);
    } else if (!wasPaused) {
      // Restore playback
      play();
    }
  }

  function launchKaiStore(manifestUrl: string) {
    // Launch KaiStore via 'open-page' activity
    if (hasMozActivity) {
      const req = new window.MozActivity({
        name: "open-page",
        data: {
          type: "url",
          url: manifestUrl,
        },
      });

      // Exit app when KaiStore launched
      req.onsuccess = () => setTimeout(() => close());
    }
  }

  function maybeRenderAdvertisement() {
    // Skip ads if in-app tutorial is open
    if (tutorialOpen) {
      return;
    }

    // Load KaiAds
    getAd()
      .then((kaiad) => {
        wasPaused = paused;
        kaiad.call('display');
        kaiad.on('close', onAdDismiss);
        kaiad.on('display', onAdDisplay);
        kaiad.on('click', onAdClick);
        pause();
      })
      .catch((e) => console.warn(e));

    // Load initial channel, in case of ad error
    setTimeout(() => {
      if (!hasSetChannel && !kaiAdVisible) {
        restoreLastChannel();
      }
    }, 5000);
  }

  function getDeviceMemory() {
    if ('deviceMemory' in navigator) {
      memory = navigator.deviceMemory;
    } else {
      getFeature('hardware.memory')
        .then((deviceMemory) => {
          // deviceMemory = 256 or 512
          memory = deviceMemory / 1024;
        });
    }
  }

  function checkAutoPlay() {
    // Autoplay is enabled on KaiOS 2.5+
    // Disabled on FF 66+
    // See https://hacks.mozilla.org/2019/02/firefox-66-to-block-automatically-playing-audible-video-and-audio/
    canAutoPlay()
      .then((autoplay) => {
        autoplayEnabled = autoplay;
      });
  }

  function checkForUpdates() {
    isUpdateAvailable()
      .then((downloadAvailable) => {
        if (!downloadAvailable) {
          return;
        }

        const update = confirm(strings.update_message);
        if (update) {
          goToStore()
            .then(() => close())
            .catch((e) => console.warn(e));
        }
      })
      .catch((e) => console.warn(e));
  }

  onMount(() => {
    // Lifecycle file
    setItem('e', '0');
    requestAnimationFrame(checkForUpdates);
    // Load local channels
    updateLocalChannelList();
    // Event Listeners
    setHeadphoneChange(onHeadphonesChange);
    document.addEventListener(VISIBILITY_CHANGE, onVisibilityChange);
    document.addEventListener(FULLSCREENCHANGE, onFullscreenChange);
    document.addEventListener(FULLSCREENERROR, onFullscreenChange);
    setMultiActionHandler(onMediaSessionEvent, MEDIA_SESSION_EVENTS);
    // Obtain wake locks
    requestWakeLock(WakeLockTopic.Screen);
    requestWakeLock(WakeLockTopic.Wifi);
    // Video Setup
    nativeHls = (video.canPlayType('application/vnd.apple.mpegurl') === 'probably');
    // Audio Channel = Content
    setAudioChannel(CONTENT);
    setAudioChannelType(video, CONTENT);
    // Check auto-play
    checkAutoPlay();
    // Check device memory
    getDeviceMemory();
    // Fetch remote channels
    if (online) {
      updateRemoteChannelList();
    }
    // Shim & cleanup
    requestAnimationFrame(removeNoscript);
    // Show Ads
    adInterval = setInterval(maybeRenderAdvertisement, AD_INTERVAL);
    requestAnimationFrame(maybeRenderAdvertisement);
    requestAnimationFrame(checkForUpdates);
  });

  onDestroy(() => {
    // Lifecycle file
    setItem('e', '1');
    // Clear HLS
    detachCurrentSource();
    // Call GC to free memory
    requestAnimationFrame(minimizeMemoryUsage);
    // Remove listeners
    document.removeEventListener(VISIBILITY_CHANGE, onVisibilityChange);
    document.removeEventListener(FULLSCREENCHANGE, onFullscreenChange);
    document.removeEventListener(FULLSCREENERROR, onFullscreenChange);
    // Release wake locks
    releaseWakeLock(WakeLockTopic.Screen);
    releaseWakeLock(WakeLockTopic.Wifi);
    // Clear interval
    clearInterval(adInterval);
  });

  function onFragBuffered() {
    isBuffering = false;
    cannotBuffer = false;
    isLoadingSource = false;
    missedFrames = 0;
    clearTimeout(bufferTimeout);
  }

  function setCannotBuffer() {
    missedFrames++;

    // After 3 missed frames, show static 
    if (missedFrames >= 3) {
      clearTimeout(bufferTimeout);
      bufferTimeout = setTimeout(() => {
        cannotBuffer = true;
        bufferTimeout = null;
      }, 1000);
    }
  }

  function onLiveStreamError(e, data) {
    console.log('onLiveStreamError', e, data);
    if (data.type === Hls.ErrorDetails.BUFFER_STALLED_ERROR) {
      isBuffering = true
    }

    if (data.fatal) {
    switch (data.type) {
      case Hls.ErrorTypes.NETWORK_ERROR:
        // try to recover network error
        console.log('fatal network error encountered, try to recover');
        setCannotBuffer();
        hls.startLoad();
        break;
      case Hls.ErrorTypes.MEDIA_ERROR:
        console.log('fatal media error encountered, try to recover');
        setCannotBuffer();
        hls.recoverMediaError();
        break;
      case Hls.ErrorTypes.OTHER_ERROR:
        // Some low-end devices work better without WebWorkers
        if (data.event === 'demuxerWorker') {
          enableWorker = false;
          setItem('w', '0');
          hls.stopLoad();
          playLiveStream(channel.videoid, video);
        }
      default:
        // cannot recover
        console.log('fatal error', e);
        hls.stopLoad();
        detachCurrentSource()
          .then(() => setCannotBuffer());
        break;
      }
    }
  }

  function onFullscreenChange() {
    fullscreen = isFullscreen();
  }

  function onVisibilityChange() {
    const wasPageVisible = pageVisible;
    pageVisible = !document[HIDDEN];

    // Page not visible, i.e. phone flipped closed
    if (wasPageVisible && !pageVisible) {
      if (video) {
        video.pause();
      }

      // Pause loading new fragments
      if (hls) {
        hls.stopLoad();
      }
    } else if (!wasPageVisible && pageVisible) {
      requestAnimationFrame(restoreControls);

      // Resume loading new fragments
      if (hls) {
        hls.startLoad();
      }
    }
  }

  function onOrientationChange() {
    orientation = getOrientation();
  }

  function onHeadphonesChange(headphonesIn: boolean) {
    requestAnimationFrame(restoreControls);

    // Headphones unplugged
    if (headphones && !headphonesIn) {
      pause();
    }

    headphones = headphonesIn
  }

  function onAdDisplay() {
    kaiAdVisible = true;
  }

  function onAdClick() {
    kaiAdVisible = false;

    setTimeout(() => close());
  }

  function onAdDismiss() {
    kaiAdVisible = false;

    if (!hasSetChannel) {
      // Load initial channel
      restoreLastChannel();
    }

    // Restore playback after ad
    if (!wasPaused) {
      play();
    }
  }

  function onMediaSessionEvent(e: MediaSessionActionDetails) {
    switch(e.action) {
      case 'play':
        play();
        break;
      case 'stop':
      case 'pause':
        pause();
        break;
      case 'nexttrack':
        channelUp();
        break;
      case 'previoustrack':
        channelDown();
        break;
    }
  }

  function focusChannelNumber() {
    tick()
      .then(() => {
        // Focus and move cursor to end
        channelNumber.focus();
        channelNumber.selectionStart = channelNumber.selectionEnd = channelNumber.value.length;
      });
  }

  function onSoftKeyClick({ detail: { action } }) {
    if (exiting || isChangingChannel) {
      return false;
    }

    requestAnimationFrame(restoreControls);
    
    switch (action) {
      case 'SoftLeft':
        if (!online) {
          return false;
        }

        if (menuHidden && !tutorialOpen) {
          toggleFullscreen();
        } else if (!menuHidden) {
          showTutorial();
        }
        break;
      case 'Enter':
        if (menuHidden && online && !tutorialOpen) {
          togglePlayback();
        }
        break;
      case 'SoftRight':
        if (isChangingChannel) {
          closeChannel();
        } else if (online) {
          toggleMenu();
        }
        break;
    }
  }

  function onKeyDown(e: KeyboardEvent) {
    console.log('onKeyDown', exiting, isChangingChannel, e);
    if (exiting) {
      e.preventDefault();
      return true;
    }

    requestAnimationFrame(restoreControls);

    if (isChangingChannel) {
      switch (e.key) {
        case 'Delete':
        case 'Backspace':
          closeChannel();
          break;
        case 'Enter':
          onChannelChange();
          break;
      }
      return true;
    }

    // Number keys
    if (e.key >= '0' && e.key <= '9') {
      // Skip when interstitials are open
      if (tutorialOpen || !menuHidden) {
        return true;
      }

      isChangingChannel = true;
      channelSelect = e.key;
      e.preventDefault();
      requestAnimationFrame(focusChannelNumber);
      return true;
    }

    // Map arrow keys based on device orientation
    const key = (e.key && e.key.startsWith('Arrow')) ?
      getArrowKey(orientation, e.key) : e.key;

    switch (key) {
      case 'MicrophoneToggle':
        // Don't launch Google Assistant
        e.preventDefault();
        break;
      case 'Delete':
      case 'Backspace':
        if (tutorialOpen) {
          onTutorialClose();
        } else if (!menuHidden) {
          menuHidden = true;
        } else {
          showExitConfirmation();
        }
        e.preventDefault();
        break;
      case 'ArrowUp':
        if (menuHidden) {
          requestUp();
          e.preventDefault();
        }
        break;
      case 'ArrowDown':
        if (menuHidden) {
          requestDown();
          e.preventDefault();
        }
        break;
      case 'ArrowRight':
        if (!tutorialOpen && menuHidden) {
          channelUp();
          e.preventDefault();
        }
        break;
      case 'ArrowLeft':
        if (!tutorialOpen && menuHidden) {
          channelDown();
          e.preventDefault();
        }
        break;
      case 'MediaPlay':
        play();
        e.preventDefault();
        break;
      case 'MediaStop':
      case 'MediaPause':
        pause();
        e.preventDefault();
        break;
      case 'Space':
      case 'MediaPlayPause':
        togglePlayback();
        e.preventDefault();
        break;
      case '*':
        requestAnimationFrame(() => {
          fit = nextObjectFit();
        });
        break;
    }
  }

  function onChannelClick(e: CustomEvent) {
    const c: Channel = e.detail;
    console.log('onChannelClick', c);
    setChannel(c);
    requestAnimationFrame(() => {
      menuHidden = true;
    });
  }

  function onVideoClick() {
    if (exiting) {
      return false;
    }

    requestAnimationFrame(restoreControls);
    togglePlayback();
  }

  function onPlayback(e: Event) {
    if (!hasPlayed && e.type === 'playing') {
      requestAnimationFrame(restoreControls);
    }

    updatePlaybackState();
  }

  function closeChannel() {
    channelSelect = null;
    isChangingChannel = false;
  }

  function onChannelChange() {
    // Convert user channels (1-index) to 0-index
    const newChannelIndex = Number.parseInt(channelNumber.value, 10) - 1;
    console.log('onChannelChange', newChannelIndex);

    
    if (newChannelIndex >= 0 && newChannelIndex <= channels.length - 1) {
      if (channelIndex !== newChannelIndex) {
        const nextChannel = channels[newChannelIndex];
        setChannel(nextChannel);
      }
    }

    closeChannel();
  }

  function onVideoAnimationEnd() {
    console.log('onVideoAnimationEnd', exiting);
    if (exiting) {
      // Lifecycle file
      setItem('e', '1');
      requestAnimationFrame(() => close());
    }
  }

  function onContextMenu() {
    toggleMenu();
  }

  let trackingEnabled = true;
  function onTrackerError() {
    trackingEnabled = false;
  }

  function getSearchParams(channel: Channel) {
    const params = new URLSearchParams();
    params.set('slug', channel.slug);
    params.set('title', channel.title);
    params.set('language', channel.language);
    params.set('country', channel.country);
    params.set('category', channel.category);
    params.set('i', `${channelIndex}`);
    return params.toString();
  }

  $: showTrackingPixel = (trackingUrl && online && trackingEnabled);
  $: trackingUrl = measurementUrl(document.location.pathname + '?' + getSearchParams(channel), 'pageview');
</script>

<svelte:window
  bind:online={online}
  on:keydown={onKeyDown}
  on:orientationchange={onOrientationChange} />

<svelte:body
  on:contextmenu|preventDefault={onContextMenu} />

<svelte:head>
  {#if channel && channel.videoid}
    <link rel="preload" href={channel.videoid} as="fetch" />
  {/if}
</svelte:head>

<GlobalStyles />

<main class={orientation}>
  <!-- TV Static -->
  {#if cannotBuffer}
    <Static muted={paused || silent} />
  {/if}

  <!-- Video Container -->
  <section class="video-container">
    <video class={["main-video", fit].join(' ')} class:crt={hasPlayed} class:exit={exiting}
      height="240" width="320" bind:this={video} bind:paused on:playing={onPlayback} on:pause={onPlayback}
      on:click={onVideoClick} on:animationend={onVideoAnimationEnd} autoplay={autoplayEnabled}
      src={(nativeHls) ? channel.videoid : null} crossorigin="anonymous" preload="metadata">
      <track kind="captions" />
    </video>
  </section>

  {#if showTrackingPixel}
    <img src={trackingUrl} on:error|once={onTrackerError} alt="ga" hidden aria-hidden="true" width="1" height="1"
      crossorigin="anonymous" decoding="async" />
  {/if}

  {#if headerVisible}
    <header class:fullscreen={fullscreen}>
      <!-- Channel Number -->
      {#if isChangingChannel}
        <section class="channel-number">
          <label for="channel">Channel</label>
          <input type="tel" name="channel" id="channel" required={true}
            min="1" max={maxChannel} step="1" autocomplete="off" pattern={NUM_PATTERN}
            placeholder={`${channelIndex}`} value={channelSelect} spellcheck="false"
            bind:this={channelNumber} on:change={onChannelChange} />
        </section>
      {/if}

      {#if !(controlsHidden || isChangingChannel)}
        <h1 title={channel.title} lang={channel.language}>{channelIndex + 1}. {channel.title}</h1>
      {/if}
    </header>
  {/if}

  <!-- Loading -->
  {#if loadingVisible}
    <div class="loading-container">
      {#if !online}
        <i class="offline-container">
          {@html NO_WIFI_ICON}
          <span>{strings.offline}</span>
        </i>
      {:else if isLoadingSource}
        <Loading />
      {/if}
    </div>
  {/if}

  <!-- Channel Menu -->
  {#if !menuHidden}
    <aside class:fullscreen={fullscreen}>
      <h3>{strings.channels} ({channels.length})</h3>
      <section>
        <ListView listItems={channels} focusIndex={channelIndex} on:click={onChannelClick} />
      </section>
    </aside>
  {/if}
</main>

<SoftBar
  on:softKeyClick={onSoftKeyClick}
  hidden={controlsHidden && menuHidden}
  leftAction={(altMenu) ? ((!menuHidden) ? HELP_ICON : null) : ((fullscreen) ? EXIT_FULLSCREEN_ICON : FULLSCREEN_ICON)}
  middleAction={(altMenu) ? strings.select : ((paused) ? PLAY_ICON : PAUSE_ICON)}
  rightAction={(altMenu) ? EXIT_ICON : MENU_ICON} />

<!-- In-App Tutorial -->
{#if tutorialOpen}
<Tutorial
  on:close={onTutorialClose}
  fullscreen={fullscreen}
  titles={[
    strings.playback_controls,
    strings.change_channels,
    strings.aspect_ratio,
  ]}
  sources={[
    '/img/playback-tutorial.png#-moz-samplesize=4',
    '/img/numbers-tutorial.png#-moz-samplesize=4',
    '/img/fit-tutorial.png#-moz-samplesize=4',
  ]} />
{/if}

<style>
  @keyframes turn-off {
    0% {
      transform: scale(1,1) translate3d(0,0,0);
      filter: brightness(1);
      opacity: 1;
    }

    10% {
      transform: scale(1,1.3) translate3d(0,0,0);
      filter: brightness(5);
      opacity: 0.9;
    }

    60% {
      transform: scale(1.3,0.001) translate3d(0,0,0);
      filter: brightness(10);
      opacity: 0.5;
    }

    100% {
      transform: scale(0.000,0.0001) translate3d(0,0,0);
      filter: brightness(50);
      opacity: 0;
    }
  }

  @keyframes turn-on {
    0% {
      transform: scale(0.000,0.0001) translate3d(0,0,0);
      filter: brightness(50);
      opacity: 0;
    }

    10% {
      transform: scale(1.3,0.001) translate3d(0,0,0);
      filter: brightness(10);
      opacity: 0.5;
    }

    60% {
      transform: scale(1,1.3) translate3d(0,0,0);
      filter: brightness(5);
      opacity: 0.9;
    }

    100% {
      transform: scale(1,1) translate3d(0,0,0);
      filter: brightness(1);
      opacity: 1;
    }
  }

  .app-details img {
    flex-grow: 1;
    height: 100%;
    object-fit: contain;
  }

  header {
    position: absolute;
    background-color: #964a49;
    border-bottom: 1px solid black;
    max-width: 100%;
    max-width: 100vw;
    padding-block-start: 26px; /* StatusBar Height */
    padding-block-end: 0.5rem;
    padding-inline-start: 1rem;
    padding-inline-end: 1rem;
    top: 0;
    right: 0;
    left: 0;
    margin: auto;
    overflow: hidden;
  }

  header.fullscreen {
    padding-block-start: 0;
  }

  header h1 {
    margin: 0;
  }

  aside, .app-details {
    position: absolute;
    background-color: #222;
    top: 26px;
    left: 0;
    right: 0;
    bottom: 1.875rem;
    width: 100%;
    width: 100vw;
    height: 100%;
    height: 100vh;
    height: calc(100vh - 1.875rem - 26px);
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .app-details {
    z-index: 100;
  }

  aside > section {
    display: block;
    padding: 0;
    margin: 0;
    overflow-x: hidden;
    overflow-y: auto;
    overscroll-behavior: contain;
  }

  aside.fullscreen,
  .app-details.fullscreen {
    top: 0;
    height: calc(100vh - 1.875rem);
  }

  aside h3 {
    text-align: center;
    color: white;
    background-color: #964a49;
    display: block;
    height: 26px;
    min-height: 26px;
    width: 100%;
    font-size: 1rem;
    font-weight: bold;
    margin: 0;
    padding: 0;
    border-bottom: 1px solid rgba(211, 211, 211, 0.5);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

	main {
    position: relative;
		text-align: center;
		padding: 0;
    width: 100%;
    width: 100vw;
    height: 100%;
    height: 100vh;
	}

  h1 {
    text-align: left;
    text-align: start;
  }

  h1, .channel-number {
    width: 100%;
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 1.4rem;
    background: transparent;
    color: white;
  }

  .channel-number label[for="channel"] {
    display: none;
    visibility: hidden;
  }

  .channel-number input[type="tel"] {
    outline: none;
    width: 100%;
    text-align: center;
    border: none;
    background: transparent;
    color: white;
    font-size: 1.4rem;
    font-weight: bold;
  }

  .channel-number input[type="tel"]:invalid {
    color: red;
  }

  .offline-container {
    color: white;
    font-style: normal;
  }

  .offline-container span {
    display: block;
  }

  :global(.offline-container svg) {
    width: 6rem;
    height: 6rem;
  }

  .loading-container,
  .video-container {
    position: absolute;
    max-width: 100%;
    max-width: 100vw;
    max-height: 100%;
    max-height: 100vh;
    top: 50%;
    left: 0;
    right: 0;
    transform: translateY(-50%);
    margin: auto;
    overflow: hidden;
  }

  .loading-container {
    z-index: 10;
  }

  video {
    max-width: 100%;
    max-width: 100vw;
    max-height: 100%;
    max-height: 100vh;
    opacity: 0;
  }

  video.contain {
    object-fit: contain;
  }

  video.cover {
    object-fit: cover;
  }

  video.fill {
    object-fit: fill;
  }

  video.scale-down {
    object-fit: scale-down;
  }

  video.none {
    object-fit: none;
  }

  .crt {
    animation-name: turn-on;
    animation-duration: 0.55s;
    animation-fill-mode: forwards;
    animation-timing-function: ease-in;
    animation-timing-function: cubic-bezier(0.755, 0.050, 0.855, 0.060);
    animation-direction: normal;
  }

  .crt.exit {
    animation-name: turn-off;
    animation-fill-mode: backwards;
    animation-timing-function: ease-out;
    animation-timing-function: cubic-bezier(0.230, 1.000, 0.320, 1.000);
  }
</style>