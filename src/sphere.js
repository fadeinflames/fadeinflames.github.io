/** A decorative, original wire sculpture. The caller owns the motion preference. */
export function mountSphere(canvas) {
  const context = canvas.getContext('2d');
  if (!context) return { setPaused() {}, destroy() {} };

  const TAU = Math.PI * 2;
  const frameInterval = 1000 / 30;
  const rings = 29;
  const columns = 64;
  const pointCount = rings * columns;
  const projected = new Float32Array(pointCount * 3);
  const edges = [];
  const depthBuckets = Array.from({ length: 8 }, () => []);
  const accentPoints = [137, 471, 1081];
  const quietPoints = [219, 393, 641, 846, 1247, 1419, 1581];

  // Every ring is connected, with fewer meridians to keep the mesh airy.
  for (let ring = 0; ring < rings; ring += 1) {
    for (let column = 0; column < columns; column += 1) {
      const point = ring * columns + column;
      edges.push([point, ring * columns + (column + 1) % columns]);
      if (ring < rings - 1 && column % 2 === 0) {
        edges.push([point, point + columns]);
      }
    }
  }

  let width = 320;
  let height = 320;
  let pixelRatio = 1;
  let elapsed = 0;
  let previousFrame = null;
  let animationFrame = 0;
  let paused = false;
  let destroyed = false;
  let pointerX = 0;
  let pointerY = 0;
  let smoothX = 0;
  let smoothY = 0;

  function render() {
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.clearRect(0, 0, width, height);
    const radius = Math.min(width, height) * 0.355;
    const turn = elapsed * 0.075 + 0.5 + smoothX * 0.08;
    const tilt = -0.3 + Math.sin(elapsed * 0.1) * 0.05 + smoothY * 0.06;
    const cosTurn = Math.cos(turn);
    const sinTurn = Math.sin(turn);
    const cosTilt = Math.cos(tilt);
    const sinTilt = Math.sin(tilt);

    for (let ring = 0; ring < rings; ring += 1) {
      const latitude = Math.PI * (ring + 0.6) / (rings + 0.2);
      const sinLatitude = Math.sin(latitude);
      const cosLatitude = Math.cos(latitude);
      for (let column = 0; column < columns; column += 1) {
        const longitude = TAU * column / columns;
        // A slow travelling fold gives the surface a soft, sculptural shape.
        const fold = Math.sin(longitude * 3 + latitude * 2 + elapsed * 0.19);
        const ripple = Math.cos(latitude * 5 - longitude * 2 - elapsed * 0.13);
        const swell = 1 + fold * 0.075 * sinLatitude + ripple * 0.028;
        const twist = longitude + Math.sin(latitude * 2 + elapsed * 0.12) * 0.19;
        const x = sinLatitude * Math.cos(twist) * swell;
        const y = cosLatitude * swell * 1.055;
        const z = sinLatitude * Math.sin(twist) * swell;
        const turnedX = x * cosTurn + z * sinTurn;
        const turnedZ = z * cosTurn - x * sinTurn;
        const tiltedY = y * cosTilt - turnedZ * sinTilt;
        const tiltedZ = y * sinTilt + turnedZ * cosTilt;
        const perspective = 3.8 / (3.8 - tiltedZ);
        const index = (ring * columns + column) * 3;
        projected[index] = width * 0.5 + turnedX * radius * perspective;
        projected[index + 1] = height * 0.5 + tiltedY * radius * perspective;
        projected[index + 2] = tiltedZ;
      }
    }

    for (const bucket of depthBuckets) bucket.length = 0;
    for (let edgeIndex = 0; edgeIndex < edges.length; edgeIndex += 1) {
      const [from, to] = edges[edgeIndex];
      const depth = (projected[from * 3 + 2] + projected[to * 3 + 2]) * 0.5;
      const bucket = Math.max(0, Math.min(7, Math.floor((depth + 1.15) / 2.3 * 8)));
      depthBuckets[bucket].push(edgeIndex);
    }

    context.lineWidth = 0.55;
    for (let bucketIndex = 0; bucketIndex < depthBuckets.length; bucketIndex += 1) {
      context.beginPath();
      for (const edgeIndex of depthBuckets[bucketIndex]) {
        const [from, to] = edges[edgeIndex];
        context.moveTo(projected[from * 3], projected[from * 3 + 1]);
        context.lineTo(projected[to * 3], projected[to * 3 + 1]);
      }
      const opacity = 0.035 + (bucketIndex / 7) ** 1.6 * 0.3;
      context.strokeStyle = `rgba(228, 234, 236, ${opacity})`;
      context.stroke();
    }

    function drawPoints(points, color, size) {
      for (const point of points) {
        const index = point * 3;
        const depth = projected[index + 2];
        if (depth < -0.25) continue;
        context.globalAlpha = Math.min(0.85, 0.35 + (depth + 0.25) * 0.4);
        context.beginPath();
        context.arc(projected[index], projected[index + 1], size, 0, TAU);
        context.fillStyle = color;
        context.fill();
      }
    }

    drawPoints(quietPoints, '#e4eaec', 1.1);
    drawPoints(accentPoints, '#00eeff', 1.45);
    context.globalAlpha = 1;
  }

  function resize() {
    if (destroyed) return;
    const bounds = canvas.getBoundingClientRect();
    width = bounds.width || 320;
    height = bounds.height || 320;
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    render();
  }

  function tick(timestamp) {
    animationFrame = 0;
    if (destroyed || paused || document.hidden) return;
    if (previousFrame === null) previousFrame = timestamp;
    const delta = timestamp - previousFrame;
    if (delta >= frameInterval) {
      elapsed += Math.min(delta - delta % frameInterval, 100) / 1000;
      previousFrame = timestamp - delta % frameInterval;
      smoothX += (pointerX - smoothX) * 0.055;
      smoothY += (pointerY - smoothY) * 0.055;
      render();
    }
    animationFrame = requestAnimationFrame(tick);
  }

  function syncAnimation() {
    if (animationFrame) cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    previousFrame = null;
    if (!destroyed && !paused && !document.hidden) {
      animationFrame = requestAnimationFrame(tick);
    }
  }

  function onPointerMove(event) {
    const bounds = canvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    pointerX = Math.max(-1, Math.min(1, (event.clientX - bounds.left) / bounds.width * 2 - 1));
    pointerY = Math.max(-1, Math.min(1, (event.clientY - bounds.top) / bounds.height * 2 - 1));
  }

  function onPointerLeave() {
    pointerX = 0;
    pointerY = 0;
  }

  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  canvas.addEventListener('pointermove', onPointerMove, { passive: true });
  canvas.addEventListener('pointerleave', onPointerLeave, { passive: true });
  document.addEventListener('visibilitychange', syncAnimation);
  window.addEventListener('resize', resize, { passive: true });
  resize();
  syncAnimation();

  return {
    setPaused(value) {
      if (destroyed || paused === Boolean(value)) return;
      paused = Boolean(value);
      syncAnimation();
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      syncAnimation();
      observer.disconnect();
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      document.removeEventListener('visibilitychange', syncAnimation);
      window.removeEventListener('resize', resize);
      context.clearRect(0, 0, width, height);
    },
  };
}
