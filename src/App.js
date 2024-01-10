import { useRef, useEffect, useState } from "react";
import "./App.css";
import * as faceapi from "face-api.js";
import { fabric } from "fabric";

function App() {
  const videoRef = useRef();
  const canvasRef = useRef();
  const fabricCanvasRef = useRef(null);
  const interval = useRef();
  const [isPlaying, setIsPlaying] = useState(false);

 // Initialize Fabric.js canvas when the component mounts
  
 useEffect(() => {
    if (!fabricCanvasRef.current) {
      fabricCanvasRef.current = new fabric.Canvas(canvasRef.current);
    }
  }, []);

  const drawFaceReactangel = (left, top, width, height) => {
    const rect = new fabric.Rect({
      left,
      top,
      width,
      height,
      fill: "transparent",
      stroke: "blue",
      strokeWidth: 4,
    });

    fabricCanvasRef.current.add(rect);
    fabricCanvasRef.current.renderAll();
  };

 // Function to clear the Fabric.js canvas

  const clearCanvas = () => {
    fabricCanvasRef.current.clear();
  };

   // Function to handle play/pause button click

  const handlePlayPause = () => {
    const video = videoRef.current;

      // If the video is paused or ended, start playing

    if (video.paused || video.ended) {
      video
        .play()
        .then(() => {
          loadModels();
          setIsPlaying(true);
        })
        .catch((error) => {
          console.error("Failed to start the video:", error);
        });
    } else {
       // If the video is playing, pause it
      video.pause();
      setIsPlaying(false);
      clearCanvas();
      clearInterval(interval.current);
    }
  };
// Function to load faceapi models
  const loadModels = async () => {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
      faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
      faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
      faceapi.nets.faceExpressionNet.loadFromUri("/models"),
    ]);
    detectFaces();// Start face detection
  };
  // Function to detect faces using faceapi and draw rectangles
  const detectFaces = () => {
    interval.current = videoRef.current.play().then(() => {
      setInterval(async () => {
        const detections = await faceapi
          .detectAllFaces(
            videoRef.current,
            new faceapi.TinyFaceDetectorOptions()
          )
          .withFaceLandmarks()
          .withFaceExpressions();
        canvasRef.current.innerHtml = faceapi.createCanvasFromMedia(
          videoRef.current
        );

        faceapi.matchDimensions(canvasRef.current, {
          width: videoRef.current.width,
          height: videoRef.current.height,
        });
        const resized = faceapi.resizeResults(detections, {
          width: canvasRef.current.width,
          height: canvasRef.current.height,
        });
        faceapi.draw.drawDetections(canvasRef.current, resized);
        faceapi.draw.drawFaceLandmarks(canvasRef.current, resized);
        faceapi.draw.drawFaceExpressions(canvasRef.current, resized);

        resized.forEach((detection) => {
          const { _box } = detection.detection;
          new fabric.Rect({
            left: _box._x,
            top: _box._y,
            width: _box._width,
            height: _box._height,
            fill: "transparent",
            stroke: "blue",
            strokeWidth: 2,
          });
        });
      }, 1000);
    });
  };

   // Function to handle file input change
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const videoURL = URL.createObjectURL(file);
      videoRef.current.src = videoURL;
      videoRef.current.load();

      videoRef.current.onloadedmetadata = () => {
        loadModels();
      };
    }
  };

   // Rendered JSX for the component
  return (
    <div className="container">
      <div>
        <input type="file" accept="video/*" onChange={handleFileChange} />
        <button onClick={handlePlayPause} className="control-button">
          {isPlaying ? "Pause" : "Play"}
        </button>
      </div>
      <div className="video-container">
        <video
          style={{ position: "absolute" }}
          width={450}
          height={460}
          crossOrigin="anonymous"
          ref={videoRef}
        ></video>
        <canvas
          style={{ position: "absolute" }}
          ref={canvasRef}
          width={450}
          height={450}
        />
      </div>
    </div>
  );
}

export default App;
