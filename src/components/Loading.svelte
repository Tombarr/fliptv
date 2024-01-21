<div class="spinner" aria-live="polite">
  <div class="one"></div>
  <div class="two"></div>
  <div class="three"></div>
  <div class="four"></div>
  <div class="five"></div>
</div>

<style>
  @keyframes sk-stretchdelay {
    0%, 40%, 100% { 
      transform: scaleY(0.4);
    }
    
    20% { 
      transform: scaleY(1.0);
    }
  }

  .spinner {
    margin: 100px auto;
    width: 50px;
    height: 40px;
    text-align: center;
    font-size: 10px;
  }

  .spinner > div {
    background-color: white;
    height: 100%;
    width: 6px;
    display: inline-block;
    animation: sk-stretchdelay 1.2s infinite ease-in-out;
    opacity: 0.75;
  }

  .spinner > .two {
    animation-delay: -1.1s;
  }

  .spinner > .three {
    animation-delay: -1.0s;
  }

  .spinner > .four {
    animation-delay: -0.9s;
  }

  .spinner > .five {
    animation-delay: -0.8s;
  }
</style>