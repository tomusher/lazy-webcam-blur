const init = async () => {
  const model = await bodyPix.load();
  const video = await prepareWebcam();
  video.play();

  const canvas = document.getElementById("output");
  canvas.width = videoWidth;
  canvas.height = videoHeight;

  await doFrame(model, canvas);
};

const getSettings = () => {
  const urlSearchParams = new URLSearchParams(window.location.search);
  const params = Object.fromEntries(urlSearchParams.entries());
  return params;
};

const prepareWebcam = async () => {
  const video = document.getElementById("video");
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      facingMode: "user",
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 30, max: 30 },
    },
  });
  video.srcObject = stream;

  return new Promise((resolve) => {
    video.onloadedmetadata = () => {
      resolve(video);
    };
  });
};

const doFrame = async (model, canvas) => {
  const segmentation = await model.segmentPerson(video, {
    flipHorizontal: false,
    internalResolution: "low",
    segmentationThreshold: 0.7,
  });
  const backgroundBlurAmount = 3;
  const edgeBlurAmount = 10;
  const flipHorizontal = false;

  bodyPix.drawBokehEffect(
    canvas,
    video,
    segmentation,
    backgroundBlurAmount,
    edgeBlurAmount,
    flipHorizontal
  );

  // Next frame
  requestAnimationFrame(async () => await doFrame(model, canvas));
};

(async () => {
  await init();
})();
