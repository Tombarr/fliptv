<svelte:options immutable={true} />

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';

  const dispatch = createEventDispatcher();

  export let leftAction: string = '';
  export let middleAction: string = '';
  export let rightAction: string = '';
  export let dir: string = 'ltr';
  export let hidden: boolean = false;

  function dispatchEvent(action: string) {
    return dispatch('softKeyClick', { action });
  }

  function onSoftKeyClick(e: Event, key: string) {
    switch (key) {
      case 'SoftLeft':
        if (dir === 'rtl') {
          dispatchEvent('SoftRight');
        } else {
          dispatchEvent('SoftLeft');
        }
        e.preventDefault();
        return false;
      case 'SoftRight':
        if (dir === 'rtl') {
          dispatchEvent('SoftLeft');
        } else {
          dispatchEvent('SoftRight');
        }
        e.preventDefault();
        return false;
      case 'Enter':
        dispatchEvent('Enter');
        e.preventDefault();
        return false;
    }
  }

  function onKeyDown(e: KeyboardEvent) {
    return onSoftKeyClick(e, e.key);
  }
</script>

<svelte:window on:keydown={onKeyDown} />

{#if !hidden}
  <footer class="soft-bar" {dir} transition:fade>
    <button class="bar-left" disabled={!leftAction}
      on:click|preventDefault={(e) => onSoftKeyClick(e, 'SoftLeft')}>
      {@html leftAction || '' }
    </button>
    <button class="bar-middle" disabled={!middleAction}
      on:click|preventDefault={(e) => onSoftKeyClick(e, 'Enter')}>
      {@html middleAction || '' }
    </button>
    <button class="bar-right" disabled={!rightAction}
      on:click|preventDefault={(e) => onSoftKeyClick(e, 'SoftRight')}>
      {@html rightAction || '' }
    </button>
  </footer>
{/if}

<style>
  footer.soft-bar {
    background-color: rgba(0, 0, 0, 0.5);
    border-top: 1px solid rgba(24, 24, 24, 0.6);
    color: #FFF;
    position: fixed;
    bottom: 0;
    right: 0;
    left: 0;
    width: 100%;
    width: 100vw;
    height: 1.875rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }

  footer.soft-bar button {
    -webkit-user-drag: none;
    cursor: pointer;
    background: transparent;
    color: #FFF;
    border: none;
    font-size: 0.95em;
    width: auto;
    flex: 1;
    height: 100%;
    padding: 0;
    margin: 0;
    flex-grow: 1;
    max-width: 33.3%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    vertical-align: middle;
  }

  :global(footer.soft-bar button svg) {
    vertical-align: middle;
  }

  footer.soft-bar button[disabled] {
    cursor: default;
    pointer-events: none;
    -moz-user-focus: ignore;
  }

  footer.soft-bar .bar-left {
    text-align: left;
    text-align: start;
    padding-inline-start: 0.5rem;
    text-transform: capitalize;
  }

  footer.soft-bar .bar-middle {
    text-align: center;
    margin-inline-start: 0.5rem;
    margin-inline-end: 0.5rem;
    text-transform: uppercase;
    font-weight: 600;
  }

  footer.soft-bar .bar-right {
    text-align: right;
    text-align: end;
    padding-inline-end: 0.5rem;
    text-transform: capitalize;
  }

</style>