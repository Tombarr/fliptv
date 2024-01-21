<svelte:options immutable={true} />

<script lang="ts">
  import { onMount, createEventDispatcher } from "svelte";
  import { getArrowKey } from "../compat/arrows";
  import { getOrientation } from "../compat/orientation";

  interface ListItem {
    title: string;
  }

  const dispatch = createEventDispatcher();

  let listEl: HTMLOListElement;

  export let listItems: Array<ListItem> = [];
  export let hidden: boolean = false;
  export let focusIndex: number = 0;

  function focusListItem() {
    if (listEl) {
      const focusedItem: HTMLElement = (listEl.children[focusIndex] as HTMLElement);
      console.log('focusListItem', focusedItem);
      if (focusedItem) {
        focusedItem.querySelector('button').focus();
      }
    }
  }

  function nav(up: boolean) {
    const index = focusIndex + ((up) ? -1 : 1);
    focusIndex = ((index < 0) ? listItems.length - 1 : ((index >= listItems.length) ? 0 : index));
    requestAnimationFrame(() => focusListItem());
  }

  function onListItemClick(l: ListItem) {
    console.log('onListItemClick', l);
    dispatch('click', l);
  }

  function onKeyDown(e: KeyboardEvent) {
    console.log('ListView', 'onKeyDown', e);
    const key = (e.key && e.key.startsWith('Arrow')) ?
      getArrowKey(getOrientation(), e.key) : e.key;

    switch (key) {
      case 'ArrowUp':
        nav(true);
        e.preventDefault();
        break;
      case 'ArrowDown':
        nav(false);
        e.preventDefault();
        break;
      case 'Enter':
        onListItemClick(listItems[focusIndex]);
        e.preventDefault();
        break;
    }
  }

  onMount(() => {
    requestAnimationFrame(() => focusListItem());
  });
</script>

<svelte:body on:keydown={onKeyDown} />

<ol hidden={hidden} aria-hidden={hidden} bind:this={listEl}>
  {#each listItems as listItem, i}
    <li>
      <button on:click={() => onListItemClick(listItem)}
        class:focused={i === focusIndex}>
        <span>{i + 1}.</span>
        <em>{listItem.title}</em>
      </button>
    </li>
  {/each}
</ol>

<style>
  ol, ol > li {
    display: block;
    list-style-type: none;
    padding: 0;
    margin: 0;
    scroll-snap-align: start;
  }

  ol > li > button {
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
    cursor: pointer;
    width: 100%;
    height: 3.5rem;
    border-radius: 0;
    padding: 0.75rem 1rem;
    font-size: 1rem;
    background: transparent;
    border: none;
    outline: none;
    display: block;
    text-align: left;
    text-align: start;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: white;
  }

  ol > li > button > em {
    font-style: normal;
  }

  ol > li > button > span {
    opacity: 0.65;
    font-size: 0.9rem;
    font-weight: bold;
    padding-inline-end: 0.2rem;
  }

  ol > li::after {
    display: block;
    content: '';
    width: 100%;
    height: 1px;
    background-color: lightgrey;
    padding: 0;
    margin: 0;
    opacity: 0.5;
  }

  ol > li:last-child::after {
    display: none;
  }

  ol > li > button.focused {
    background-color: #964a49;
    color: white;
  }

  ol[hidden] {
    display: none;
  }
</style>
