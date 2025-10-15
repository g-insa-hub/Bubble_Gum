
let video;
let faceMesh;
let faces = [];
let triangles;
let uvCoords;
let img;
let state = "NOTHING"; //NOTHING, BUBBLEGROW, BUBBLESHRINK, BUBBLEPOP, GUMONFACE
let bubblePercent = 0;

function preload() {
  // Load the face mesh model and the gum image
  faceMesh = ml5.faceMesh({ maxFaces: 1, flipped: true });
  img = loadImage("gum_face.png");
}

function gotFaces(results) {
  // Update the faces array with the detected faces
  faces = results;
}

function setup() {
  createCanvas(1920, 1080, WEBGL);
 
  var constraints = {
    audio: false,
    video: {
      mandatory: {
        minWidth: 1920,
        minHeight: 1080
      }
    }
  };
  
  // Capture video from webcam, flipped horizontally
  video = createCapture(constraints, { flipped: true });
  //video.size(1920,1080);
  video.hide();

  // Start detecting faces from the video
  faceMesh.detectStart(video, gotFaces);

  // Get the face mesh triangles and UV coordinates
  triangles = faceMesh.getTriangles();
  uvCoords = faceMesh.getUVCoords();
}

function drawBubble(face, distMouthH, maxBubbleSize) {
  noStroke();
  ambientLight(255);
  ambientMaterial(255,119,188);
  translate(face.keypoints[13].x, face.keypoints[13].y+distMouthH/2, 0);
  pointLight(255, 255, 255, -100, -50, 100);
  sphere(maxBubbleSize*bubblePercent/100);
}

function draw() {
  // Set origin to top-left corner and clear background
  translate(-width / 2, -height / 2);
  background(0);

  // Display the webcam video
  image(video, 0, 0);

  if (faces.length == 0) {
    state = "NOTHING";
  }
  
  if (faces.length > 0) {
    let face = faces[0];
    let blow = false;
    
    let distMouthW = round(dist(face.keypoints[78].x,face.keypoints[78].y, face.keypoints[308].x,face.keypoints[308].y),1);
    let distMouthH = round(dist(face.keypoints[14].x,face.keypoints[14].y, face.keypoints[13].x,face.keypoints[13].y),1);
    let distNoseW = round(dist(face.keypoints[60].x,face.keypoints[60].y, face.keypoints[290].x,face.keypoints[290].y),1);
    let maxBubbleSize = (face.box.height)/1.6;
    if (distMouthW <= (distNoseW*2.2) && distMouthH > (distMouthW/7))
    {   
      blow = true;
    }
    
    switch(state) {
      case 'NOTHING':
        bubblePercent = 0;
        if (blow) { state = 'BUBBLEGROW';}
        break;
      case 'BUBBLEGROW':
        if (!blow) 
        {
          state = 'BUBBLESHRINK';
          break;
        } 
        bubblePercent=bubblePercent+1-(bubblePercent/105);
        drawBubble(face, distMouthH, maxBubbleSize);        
        if (bubblePercent > 50)
        {
          state = "BUBBLEPOP";
        }
        break;
      case 'BUBBLESHRINK':
        // grow bubble
        bubblePercent=bubblePercent-3;
        drawBubble(face, distMouthH, maxBubbleSize);        
        if (bubblePercent <= 0)
        {
          state = "NOTHING";
        }
        break;
      case 'BUBBLEPOP':
        background(255,119,188);
        bubblePercent = 0;
        state = "GUMONFACE";
        break;
      case 'GUMONFACE':
        // Apply the texture from the image
        push();
        texture(img);
        textureMode(NORMAL);
        noStroke();
        beginShape(TRIANGLES);

        // Draw each triangle of the face mesh with UV mapping
        for (let i = 0; i < triangles.length; i++) {
          let tri = triangles[i];
          let [a, b, c] = tri;
          let pointA = face.keypoints[a];
          let pointB = face.keypoints[b];
          let pointC = face.keypoints[c];
          let uvA = uvCoords[a];
          let uvB = uvCoords[b];
          let uvC = uvCoords[c];

          vertex(pointA.x, pointA.y, uvA[0], uvA[1]);
          vertex(pointB.x, pointB.y, uvB[0], uvB[1]);
          vertex(pointC.x, pointC.y, uvC[0], uvC[1]);
        }
        endShape();
        pop();
        break;
    }
  }
}
