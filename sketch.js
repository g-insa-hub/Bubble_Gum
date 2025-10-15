let video;
let faceMesh;
let faces = [];
let triangles;
let uvCoords;
let img;
let state = "NOTHING";
let bubblePercent = 0;

function preload() {
  faceMesh = ml5.faceMesh({ maxFaces: 1, flipped: true });
  img = loadImage("gum_face.png");
}

function gotFaces(results) {
  faces = results;
}

function setup() {
  createCanvas(1280, 720, WEBGL); // 해상도를 줄여 안정성 확보

  const constraints = {
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      facingMode: "user",
    },
    audio: false
  };

  // 안전한 제약 조건으로 비디오 초기화
  video = createCapture(constraints, () => {
    console.log("🎥 Video stream ready");
  });
  video.hide();

  // 얼굴 인식 시작
  faceMesh.detectStart(video, gotFaces);

  triangles = faceMesh.getTriangles();
  uvCoords = faceMesh.getUVCoords();
}

function drawBubble(face, distMouthH, maxBubbleSize) {
  noStroke();
  ambientLight(255);
  ambientMaterial(255, 119, 188);
  translate(face.keypoints[13].x, face.keypoints[13].y + distMouthH / 2, 0);
  pointLight(255, 255, 255, -100, -50, 100);
  sphere(maxBubbleSize * bubblePercent / 100);
}

function draw() {
  translate(-width / 2, -height / 2);
  background(0);
  image(video, 0, 0);


    push();
  translate(width, 0);
  scale(-1, 1);
  image(video, 0, 0, width, height);
  pop();

  

  if (faces.length === 0) {
    state = "NOTHING";
    return;
  }

  let face = faces[0];
  let blow = false;

  let distMouthW = round(dist(face.keypoints[78].x, face.keypoints[78].y, face.keypoints[308].x, face.keypoints[308].y), 1);
  let distMouthH = round(dist(face.keypoints[14].x, face.keypoints[14].y, face.keypoints[13].x, face.keypoints[13].y), 1);
  let distNoseW = round(dist(face.keypoints[60].x, face.keypoints[60].y, face.keypoints[290].x, face.keypoints[290].y), 1);
  let maxBubbleSize = face.box.height / 1.6;

  if (distMouthW <= distNoseW * 2.2 && distMouthH > distMouthW / 7) {
    blow = true;
  }

  switch (state) {
    case "NOTHING":
      bubblePercent = 0;
      if (blow) state = "BUBBLEGROW";
      break;
    case "BUBBLEGROW":
      if (!blow) {
        state = "BUBBLESHRINK";
        break;
      }
      bubblePercent = bubblePercent + 1 - bubblePercent / 105;
      drawBubble(face, distMouthH, maxBubbleSize);
      if (bubblePercent > 80) state = "BUBBLEPOP";
      break;
    case "BUBBLESHRINK":
      bubblePercent -= 3;
      drawBubble(face, distMouthH, maxBubbleSize);
      if (bubblePercent <= 0) state = "NOTHING";
      break;
    case "BUBBLEPOP":
      background(255, 119, 188);
      bubblePercent = 0;
      state = "GUMONFACE";
      break;
    case "GUMONFACE":
      push();
      texture(img);
      textureMode(NORMAL);
      noStroke();
      beginShape(TRIANGLES);
      for (let i = 0; i < triangles.length; i++) {
        let [a, b, c] = triangles[i];
        let pa = face.keypoints[a], pb = face.keypoints[b], pc = face.keypoints[c];
        let uva = uvCoords[a], uvb = uvCoords[b], uvc = uvCoords[c];
        vertex(pa.x, pa.y, uva[0], uva[1]);
        vertex(pb.x, pb.y, uvb[0], uvb[1]);
        vertex(pc.x, pc.y, uvc[0], uvc[1]);
      }
      endShape();
      pop();
      break;
  }
}
