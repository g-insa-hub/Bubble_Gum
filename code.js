let video, faceMesh, faces = [];
let triangles, uvCoords;
let img;
let states = [];
let bubblePercents = [];
let popAudio;

function preload() {
  faceMesh = ml5.faceMesh({ maxFaces: 2, flipped: true });
  img = loadImage("gum_face.png");
}

function setup() {
  createCanvas(1280, 720, WEBGL);
  const constraints = {
    video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
    audio: false,
  };
  video = createCapture(constraints);
  video.hide();
  faceMesh.detectStart(video, gotFaces);
  triangles = faceMesh.getTriangles();
  uvCoords = faceMesh.getUVCoords();
  popAudio = document.getElementById("popSound");
}

function gotFaces(results) {
  faces = results;
}

function draw() {
  background(0);
  translate(-width / 2, -height / 2);

  // 거울 모드 영상
  push();
  translate(width, 0);
  scale(-1, 1);
  image(video, 0, 0, width, height);
  pop();

  // 얼굴 인식됨
  if (faces.length > 0) {
    for (let i = 0; i < faces.length; i++) {
      let face = faces[i];
      if (!states[i]) states[i] = "NOTHING";
      if (!bubblePercents[i]) bubblePercents[i] = 0;

      let { blow, distMouthH, maxBubbleSize } = getFaceMetrics(face);
      states[i] = updateBubbleState(states[i], blow, i, face, distMouthH, maxBubbleSize);
    }
  } else {
    // 😶 사람이 사라졌으면 초기화
    resetAll();
  }
}

function getFaceMetrics(face) {
  const distMouthW = dist(face.keypoints[78].x, face.keypoints[78].y, face.keypoints[308].x, face.keypoints[308].y);
  const distMouthH = dist(face.keypoints[14].x, face.keypoints[14].y, face.keypoints[13].x, face.keypoints[13].y);
  const distNoseW = dist(face.keypoints[60].x, face.keypoints[60].y, face.keypoints[290].x, face.keypoints[290].y);

  const blow = distMouthW <= distNoseW * 2.2 && distMouthH > distMouthW / 7;
  const maxBubbleSize = face.box.height / 1.6;

  // 🙈 입이 거의 안 보이거나 손으로 가려짐 → 초기화 트리거
  const mouthVisible = distMouthW > 0.5 && distMouthH > 0.5;

  return { blow, distMouthH, maxBubbleSize, mouthVisible };
}

function updateBubbleState(state, blow, i, face, distMouthH, maxBubbleSize) {
  switch (state) {
    case "NOTHING":
      bubblePercents[i] = 0;
      if (blow) return "BUBBLEGROW";
      break;

    case "BUBBLEGROW":
      if (!blow) return "BUBBLESHRINK";
      bubblePercents[i] += 1 - bubblePercents[i] / 105;
      drawBubble(face, distMouthH, maxBubbleSize, i);
      if (bubblePercents[i] > 60) {
        popAudio.currentTime = 0;
        popAudio.play();
        return "BUBBLEPOP";
      }
      break;

    case "BUBBLESHRINK":
      bubblePercents[i] -= 3;
      drawBubble(face, distMouthH, maxBubbleSize, i);
      if (bubblePercents[i] <= 0) return "NOTHING";
      break;

    case "BUBBLEPOP":
      bubblePercents[i] = 0;
      return "GUMONFACE";

    case "GUMONFACE":
      drawGumOnFace(face);
      // 👋 입이 가려지거나 사라짐 → 리셋
      const { mouthVisible } = getFaceMetrics(face);
      if (!mouthVisible) return "NOTHING";
      break;
  }
  return state;
}

function drawBubble(face, distMouthH, maxBubbleSize, i) {
  push();
  noStroke();
  ambientLight(255);
  ambientMaterial(255, 119, 188);
  translate(face.keypoints[13].x, face.keypoints[13].y + distMouthH / 2, 0);
  pointLight(255, 255, 255, -100, -50, 100);
  sphere(maxBubbleSize * bubblePercents[i] / 100);
  pop();
}

function drawGumOnFace(face) {
  push();
  texture(img);
  textureMode(NORMAL);
  noStroke();
  beginShape(TRIANGLES);
  for (let i = 0; i < triangles.length; i++) {
    const [a, b, c] = triangles[i];
    const pa = face.keypoints[a], pb = face.keypoints[b], pc = face.keypoints[c];
    const uva = uvCoords[a], uvb = uvCoords[b], uvc = uvCoords[c];
    vertex(pa.x, pa.y, uva[0], uva[1]);
    vertex(pb.x, pb.y, uvb[0], uvb[1]);
    vertex(pc.x, pc.y, uvc[0], uvc[1]);
  }
  endShape();
  pop();
}

function resetAll() {
  for (let i = 0; i < states.length; i++) {
    states[i] = "NOTHING";
    bubblePercents[i] = 0;
  }
}
