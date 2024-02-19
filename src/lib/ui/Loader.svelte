<div class="loader">
  <div class="spinner">
    <div class="spinner__bounce1"></div>
    <div class="spinner__bounce2"></div>
    <div class="spinner__bounce3"></div>
  </div>
</div>

<style>
  .loader {
    position: relative;
    width: 100%;
    height: 100%;
  }
  .spinner {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 100px;
    text-align: center;
  }

  .spinner > div {
    width: 18px;
    height: 18px;
    border-radius: 100%;
    display: inline-block;
    -webkit-animation: a-bouncedelay 1.4s infinite ease-in-out both;
    animation: a-bouncedelay 1.4s infinite ease-in-out both;
  }

  .spinner > div:nth-child(1) {
    background-color: #d1d5db;
  }
  .spinner > div:nth-child(2) {
    background-color: #6b7280;
  }
  .spinner > div:nth-child(3) {
    background-color: #374151;
  }

  .spinner .spinner__bounce1 {
    -webkit-animation-delay: -0.32s;
    animation-delay: -0.32s;
  }

  .spinner .spinner__bounce2 {
    -webkit-animation-delay: -0.16s;
    animation-delay: -0.16s;
  }
  @-webkit-keyframes a-bouncedelay {
    0%,
    80%,
    100% {
      -webkit-transform: scale(0);
    }
    40% {
      -webkit-transform: scale(1);
    }
  }

  @keyframes a-bouncedelay {
    0%,
    80%,
    100% {
      -webkit-transform: scale(0);
      transform: scale(0);
    }
    40% {
      -webkit-transform: scale(1);
      transform: scale(1);
    }
  }
</style>
