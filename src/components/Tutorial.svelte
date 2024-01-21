<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  import { strings } from '../data/Strings';

  const dispatch = createEventDispatcher();

  let page = 0;

  export let sources = [];
  export let titles = [];
  export let fullscreen = false;

  $: lastPage = Math.max(0, Math.min(sources.length - 1, titles.length - 1));

  function onNextClick() {
    if (page < lastPage) {
      page++;
    } else {
      dispatch('close');
    }
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      onNextClick();
    }

    switch (e.key) {
      case 'Enter':
      case 'SoftLeft':
      case 'SoftRight':
      case 'ArrowLeft':
      case 'ArrowRight':
        e.preventDefault();
        return false;
    }
  }
</script>

<svelte:window on:keydown|capture={onKeyDown} />
<svelte:head>
  <meta name="theme-color" content='rgb(0, 0, 0)' />
</svelte:head>

<section role="dialog" class:fullscreen={fullscreen}>
  <h2>{titles[page]}</h2>
  <img src={sources[page]} alt={titles[page]} draggable="false" />
  <button on:click={onNextClick}>{(page === lastPage) ? strings.close : strings.next}</button>
</section>

<style>
  section {
    position: absolute;
    top: 26px;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100vw;
    height: calc(100vh - 26px);
    overflow: hidden;
    display: flex;
    justify-content: space-between;
    flex-direction: column;
    background-color: black;
    color: white;
    text-align: center;
    z-index: 1000;
  }

  section.fullscreen {
    top: 0;
    height: 100vh;
  }

  section > img {
    margin: auto;
    flex-grow: 1;
    height: 100%;
    width: 100%;
  }

  section > h2 {
    width: 100%;
    font-size: 1.2rem;
    font-weight: bold;
    margin: 0;
    padding: 0;
  }

  section > button {
    -webkit-user-drag: none;
    cursor: pointer;
    background: transparent;
    color: #FFF;
    border: none;
    font-size: 0.95em;
    text-transform: uppercase;
    font-weight: 600;
    padding: 0;
    margin: 0;
    padding-block-end: 0.5rem;
  }

  section > img,
  section > button {
    vertical-align: middle;
  }
</style>
