<style>
  :global(:root) {
    scroll-behavior: smooth;
    -moz-text-size-adjust: 99%;
    text-size-adjust: 99%;
    font-variant-ligatures: common-ligatures discretionary-ligatures historical-ligatures;
    text-rendering: optimizeLegibility;
    text-decoration-skip-ink: all;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    letter-spacing: normal;
  }

  :global(:root),
  :global(body),
  :global(*) {
    font-family: 'Open Sans', 'Segoe UI', Tahoma, sans-serif;
  }

  :global([id^="ghostery"]),
  :global([class^="ghostery"]) {
    display: none;
  }

  :global(*) {
    box-sizing: border-box;
  }

  :global(html),
  :global(body) {
    position: relative;
    width: 100%;
    height: 100%;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    margin: 0;
    padding: 0;
  }

  :global(body) {
    background-color: black;    
  }

  :global(img),
  :global(video),
  :global(audio) {
    max-width: 100%;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
    -webkit-user-drag: none;
  }

  :global(img) {
    image-rendering: optimizequality;
  }

  :global(video) {
    object-fit: contain;
  }

  :global(iframe) {
    border: none;
    outline: none;
    display: block;
  }
</style>
