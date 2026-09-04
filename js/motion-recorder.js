// Records a canvas animation to a downloadable WebM clip using the browser's
// native MediaRecorder + canvas.captureStream() APIs — no hand-rolled video
// or GIF encoder, so playback/output is exactly as reliable as the browser's
// own video stack.
export function isRecordingSupported() {
  return typeof MediaRecorder !== "undefined" && typeof HTMLCanvasElement.prototype.captureStream === "function";
}

/** Drives `onFrame(elapsedMs)` via requestAnimationFrame for durationMs while
 * capturing the canvas, then resolves with a Blob (video/webm). */
export function recordCanvasAnimation(canvas, { fps = 30, durationMs, onFrame }) {
  return new Promise((resolve, reject) => {
    if (!isRecordingSupported()) { reject(new Error("Recording isn't supported in this browser.")); return; }
    let stream;
    try {
      stream = canvas.captureStream(fps);
    } catch (err) { reject(err); return; }

    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : "video/webm";
    let recorder;
    try {
      recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 6_000_000 });
    } catch (err) { reject(err); return; }

    const chunks = [];
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    recorder.onerror = (e) => reject(e.error || new Error("Recording failed"));
    recorder.onstop = () => resolve(new Blob(chunks, { type: "video/webm" }));

    recorder.start();
    const start = performance.now();
    function tick(now) {
      const elapsed = now - start;
      if (elapsed < durationMs) {
        onFrame(elapsed);
        requestAnimationFrame(tick);
      } else {
        onFrame(durationMs);
        setTimeout(() => recorder.stop(), 150);
      }
    }
    requestAnimationFrame(tick);
  });
}
