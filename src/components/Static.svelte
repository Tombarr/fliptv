<svelte:options immutable={true} />

<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { randomInteger, random, mulberry32 } from '../compat/random';

  export let muted: boolean = false;

  // Min/max amount of black/white to draw per frame
  const SKIP_THRESHOLD = 0.20;
  const AUDIO_BUFFER_SIZE = 4096;

  let canvas: HTMLCanvasElement = null;
  let context: CanvasRenderingContext2D = null;

  let audioContext: AudioContext = null;
  let gainNode: GainNode = null;
  let processNode: ScriptProcessorNode = null;

  let toggle: boolean = true;
  let isDestroyed: boolean = false;
  let rafId: number = null;

  let frame: ImageData = null;
  let buffer: Uint32Array = null;

  function drawNoise() {
    if (!frame || !buffer) {
      return;
    }

    const seed = randomInteger();
    const getRandom = mulberry32(seed);

    let black = 0;
		for (let i = 0, l = buffer.length; i < l; i++) {
      if (getRandom() < 0.4) {
        buffer[i] = 0xff000000;
      } else {
        buffer[i] = 0x00000000;
        black++;
      }
    }

    if ((black < buffer.length * (1 - SKIP_THRESHOLD)) &&
        (black > buffer.length * SKIP_THRESHOLD)) {
		  context.putImageData(frame, 0, 0);
    }
	}

  function loop() {
    toggle = !toggle;
    
    if (isDestroyed) {
      return;
    }

    if (toggle) {
      rafId = requestAnimationFrame(loop);
      return;
    }

    drawNoise();
    rafId = requestAnimationFrame(loop);
  }

  function setupPinkNoise() {
    audioContext = new AudioContext();
    gainNode = audioContext.createGain();
    processNode = pinkNoise();
    processNode.connect(audioContext.destination);
    setMute(muted);
  }

  function setupCanvas() {
    context = canvas.getContext("2d");
    frame = context.createImageData(canvas.width, canvas.height);
    buffer = new Uint32Array(frame.data.buffer);
    rafId = requestAnimationFrame(loop);
  }

  onMount(() => {
    // Check for canvas support
    if (!canvas.getContext) {
      return;
    }

    setupPinkNoise();
    setupCanvas();
  });

  onDestroy(() => {
    isDestroyed = true;
    rafId = null;
    frame = null;
    buffer = null;
    setMute(true);
    processNode.disconnect();
    audioContext.close();
    gainNode = null;
    processNode = null;

    if (rafId) {
      cancelAnimationFrame(rafId);
    }
  });
  
  // Generate random pink noise
  function pinkNoise(): ScriptProcessorNode {
    let b0, b1, b2, b3, b4, b5, b6;
    b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
    
    const node = audioContext.createScriptProcessor(AUDIO_BUFFER_SIZE, 1, 1);
    node.addEventListener('audioprocess', (e: AudioProcessingEvent) => {
      const output = e.outputBuffer.getChannelData(0);
      for (let i = 0; i < AUDIO_BUFFER_SIZE; i++) {
        const white = random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        output[i] *= 0.11;
        b6 = white * 0.115926;
      }
    });

    return node;
  }

  export function setMute(mute: boolean) {
    if (mute !== muted) {
      gainNode.gain.setValueAtTime((mute) ? 0 : 1, audioContext.currentTime);
      muted = mute;
    }
  }

  $: size = Math.max(window.outerHeight, window.outerWidth);
</script>

<div>
  <canvas bind:this={canvas} height={size} width={size}></canvas>
</div>

<style>
  div {
    position: relative;
    display: block;
    text-align: center;
    margin: auto;
    overflow: hidden;
    max-width: 100%;
    max-width: 100vw;
    max-height: 100%;
    max-height: 100vh;
  }

  canvas {
    background-color: #484848;
    width: 100%;
    width: 100vw;
    height: 100%;
    height: 100vh;
    margin: auto;
    padding: 0;
    margin: 0;
    border: none;
  }
</style>