const DEFAULT_SETTINGS = {
    blurAmount: 3,
    edgeBlurAmount: 10,
};

let model, video, canvas, settings, segmentation, lastSegmentation;

const init = async () => {
    model = await bodyPix.load({
        outputStride: 16,
        multiplier: 0.5,
    });
    video = await prepareWebcam();
    video.height = video.videoHeight;
    video.width = video.videoWidth;
    video.play();

    canvas = document.getElementById("output");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    settings = getSettings();

    await doFrame();
};

const getSettings = () => {
    const urlSearchParams = new URLSearchParams(window.location.search);
    const params = Object.fromEntries(urlSearchParams.entries());
    return Object.assign(DEFAULT_SETTINGS, params);
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

const doFrame = async (now, metadata) => {
    if (!metadata || (!lastSegmentation || lastSegmentation < metadata.presentationTime - 500)) {
        if (metadata) {
            lastSegmentation = metadata.presentationTime;
        }
        segmentation = await model.segmentPerson(video, {
            flipHorizontal: false,
            internalResolution: 0.5,
            segmentationThreshold: 0.7,
            maxDetections: 1,
        });
    }
    const backgroundBlurAmount = parseInt(settings.blurAmount);
    const edgeBlurAmount = parseInt(settings.edgeBlurAmount);
    const flipHorizontal = false;

    bodyPix.drawBokehEffect(
        canvas,
        video,
        segmentation,
        backgroundBlurAmount,
        edgeBlurAmount,
        flipHorizontal
    );

    video.requestVideoFrameCallback(doFrame);
};

(async () => {
    tf.setBackend("webgl").then(async () => await init());
})();
