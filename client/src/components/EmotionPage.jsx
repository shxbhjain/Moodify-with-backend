// "use client"

// import React, { useEffect, useRef, useState } from "react"
// import { useNavigate } from 'react-router-dom'
// import Button from "./ui/Button.jsx"
// import Card from "./ui/Card.jsx"
// import { Camera, CameraOff, Music, ArrowLeft } from "lucide-react"
// import {
//   FilesetResolver,
//   HolisticLandmarker,
//   DrawingUtils,
// } from "https://cdn.skypack.dev/@mediapipe/tasks-vision@latest"

// export default function EmotionPage({ onEmotionDetected, onNavigate }) {
//   const navigate = useNavigate()
//   const videoRef = useRef(null)
//   const canvasRef = useRef(null)
//   const holisticRef = useRef(null)
//   const animationFrameId = useRef(null)
//   const latestLandmarksRef = useRef(null)

//   const [started, setStarted] = useState(false)
//   const [isActive, setIsActive] = useState(false)
//   const [detectedEmotion, setDetectedEmotion] = useState("")
//   const [confidence, setConfidence] = useState(0)
//   const [stream, setStream] = useState(null)
//   const [error, setError] = useState("")
//   const [loading, setLoading] = useState(false)

//   // Diagnostics state
//   const [frameCount, setFrameCount] = useState(0)
//   const [videoReadyState, setVideoReadyState] = useState(0)
//   const [streamAlive, setStreamAlive] = useState(false)
//   const [lastEvent, setLastEvent] = useState(null)
//   const autoRestartRef = useRef({ tried: false, timer: null })

//   // increment-safe helper for frame count (avoid re-renders every frame)
//   const frameCounterRef = useRef(0)
//   const bumpFrameCount = () => {
//     frameCounterRef.current += 1
//     if (frameCounterRef.current % 10 === 0) setFrameCount(frameCounterRef.current)
//   }

//   // resilient per-frame detection loop
//   const detect = async (holistic, video, canvas, ctx, drawingUtils) => {
//     try {
//       if (!holisticRef.current || !videoRef.current || !canvasRef.current || !holistic || !video || !canvas || !ctx || !drawingUtils) {
//         animationFrameId.current = requestAnimationFrame(() => detect(holistic, video, canvas, ctx, drawingUtils))
//         return
//       }

//       // update readyState display
//       setVideoReadyState(video.readyState)

//       // if video not ready yet, schedule next frame
//       if (video.readyState < 2) {
//         animationFrameId.current = requestAnimationFrame(() => detect(holistic, video, canvas, ctx, drawingUtils))
//         return
//       }

//       const now = performance.now()

//       let results = null
//       try {
//         results = holistic.detectForVideo(video, now)
//       } catch (frameErr) {
//         console.warn('detectForVideo error (continuing):', frameErr)
//         animationFrameId.current = requestAnimationFrame(() => detect(holistic, video, canvas, ctx, drawingUtils))
//         return
//       }

//       if (!results) {
//         animationFrameId.current = requestAnimationFrame(() => detect(holistic, video, canvas, ctx, drawingUtils))
//         return
//       }

//       latestLandmarksRef.current = results

//       // draw
//       try {
//         ctx.save()
//         ctx.clearRect(0, 0, canvas.width, canvas.height)
//         ctx.scale(-1, 1)
//         ctx.translate(-canvas.width, 0)
//         ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

//         if (results.faceLandmarks?.length) {
//           drawingUtils.drawConnectors(
//             results.faceLandmarks[0],
//             HolisticLandmarker.FACE_LANDMARKS_TESSELATION,
//             { color: "#C0C0C070", lineWidth: 1 }
//           )
//           drawingUtils.drawLandmarks(results.faceLandmarks[0], { color: "#FF0000", radius: 1 })
//         }

//         if (results.leftHandLandmarks?.length) {
//           drawingUtils.drawConnectors(results.leftHandLandmarks[0], HolisticLandmarker.HAND_CONNECTIONS, { color: "#00FF00", lineWidth: 2 })
//           drawingUtils.drawLandmarks(results.leftHandLandmarks[0], { color: "#00FF00", radius: 3 })
//         }

//         if (results.rightHandLandmarks?.length) {
//           drawingUtils.drawConnectors(results.rightHandLandmarks[0], HolisticLandmarker.HAND_CONNECTIONS, { color: "#00FFFF", lineWidth: 2 })
//           drawingUtils.drawLandmarks(results.rightHandLandmarks[0], { color: "#00FFFF", radius: 3 })
//         }

//         ctx.restore()
//       } catch (drawErr) {
//         console.warn('drawing error (continuing):', drawErr)
//       }

//       // bump frame counter occasionally
//       bumpFrameCount()

//       // schedule next frame
//       animationFrameId.current = requestAnimationFrame(() => detect(holistic, video, canvas, ctx, drawingUtils))
//     } catch (outerErr) {
//       console.error('detect() outer error (will retry):', outerErr)
//       setLastEvent(`detect outer error: ${outerErr.message || outerErr}`)
//       // small backoff and retry
//       setTimeout(() => {
//         if (!animationFrameId.current) animationFrameId.current = requestAnimationFrame(() => detect(holisticRef.current, videoRef.current, canvasRef.current, canvasRef.current?.getContext('2d'), new DrawingUtils(canvasRef.current?.getContext('2d'))))
//       }, 200)
//     }
//   }

//   // stop mediapipe loop and clear
//   const stopMediaPipe = () => {
//     if (animationFrameId.current) {
//       cancelAnimationFrame(animationFrameId.current)
//       animationFrameId.current = null
//     }
//     try { holisticRef.current?.close?.() } catch (e) { /* ignore */ }
//     holisticRef.current = null

//     const canvas = canvasRef.current
//     if (canvas) {
//       const ctx = canvas.getContext('2d')
//       if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
//     }
//     latestLandmarksRef.current = null
//   }

//   // watch stream tracks for ended/mute and attach handlers
//   const attachStreamWatchers = (mediaStream) => {
//     if (!mediaStream) return
//     setStreamAlive(true)
//     setLastEvent('stream-attached')
//     // clear any previous listeners by creating new bound functions
//     const onTrackEnded = (ev) => {
//       console.warn('track ended', ev)
//       setLastEvent('track-ended')
//       setStreamAlive(false)
//       // attempt auto-restart once
//       if (!autoRestartRef.current.tried) {
//         autoRestartRef.current.tried = true
//         autoRestartRef.current.timer = setTimeout(() => {
//           console.log('Attempting auto-restart of camera stream...')
//           setLastEvent('auto-restart-attempt')
//           startCamera().catch(e => console.warn('auto-restart failed', e))
//         }, 700) // 700ms backoff
//       } else {
//         console.log('Auto-restart already tried; not retrying.')
//       }
//     }
//     const onTrackMute = (ev) => {
//       console.warn('track muted', ev)
//       setLastEvent('track-muted')
//     }
//     for (const t of mediaStream.getTracks()) {
//       // ensure we don't attach duplicate listeners by storing them on the track
//       if (!t._moodify_listeners) {
//         t._moodify_listeners = true
//         t.addEventListener('ended', onTrackEnded)
//         t.addEventListener('mute', onTrackMute)
//         t.addEventListener('unmute', () => { setLastEvent('track-unmuted'); setStreamAlive(true) })
//       }
//     }
//   }

//   // remove watchers
//   const detachStreamWatchers = (mediaStream) => {
//     if (!mediaStream) return
//     for (const t of mediaStream.getTracks()) {
//       try {
//         if (t._moodify_listeners) {
//           t.removeEventListener('ended', () => {})
//           t.removeEventListener('mute', () => {})
//           delete t._moodify_listeners
//         }
//       } catch (_) { /* ignore */ }
//     }
//     setStreamAlive(false)
//   }

//   const waitForVideoRef = async (timeout = 2000) => {
//     const interval = 25
//     const start = performance.now()
//     while (!videoRef.current && performance.now() - start < timeout) await new Promise(r => setTimeout(r, interval))
//     return !!videoRef.current
//   }

//   // start camera + mediapipe with GPU->CPU fallback
//   const startCamera = async () => {
//     // clear any pending auto-restart timer
//     if (autoRestartRef.current.timer) {
//       clearTimeout(autoRestartRef.current.timer)
//       autoRestartRef.current.timer = null
//     }

//     stopCamera()
//     setError("")
//     setLastEvent('starting-camera')
//     autoRestartRef.current.tried = false

//     const hasVideoRef = await waitForVideoRef(2000)
//     if (!hasVideoRef) {
//       setError('Internal error: video element not ready')
//       return
//     }

//     try {
//       if (!navigator.mediaDevices?.getUserMedia) {
//         setError('Camera access is not supported or denied.')
//         setIsActive(false)
//         return
//       }

//       let mediaStream = null
//       try {
//         mediaStream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } })
//       } catch (e1) {
//         try { mediaStream = await navigator.mediaDevices.getUserMedia({ video: true }) } catch (e2) {
//           try {
//             const devices = await navigator.mediaDevices.enumerateDevices()
//             const cams = devices.filter(d => d.kind === 'videoinput')
//             if (cams.length > 0) mediaStream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: cams[0].deviceId }, width: 640, height: 480 } })
//             else throw e2
//           } catch (enumErr) {
//             console.error('No usable camera found or permission denied', enumErr)
//             setError('Camera access failed: ' + (enumErr.message || enumErr.name))
//             setIsActive(false)
//             return
//           }
//         }
//       }

//       setStream(mediaStream)
//       attachStreamWatchers(mediaStream)
//       setIsActive(true)

//       const video = videoRef.current
//       video.srcObject = mediaStream

//       // Helpful listeners so we know if browser pauses or ends video
//       video.onpause = () => { console.log('video paused'); setLastEvent('video-paused') }
//       video.onplaying = () => { console.log('video playing'); setLastEvent('video-playing') }
//       video.onended = () => { console.log('video ended'); setLastEvent('video-ended'); setStreamAlive(false) }

//       await new Promise((resolve, reject) => {
//         video.onloadedmetadata = resolve
//         video.onerror = (e) => reject(e)
//       })

//       await video.play()
//       await new Promise(r => setTimeout(r, 60))

//       try {
//         const vision = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm')

//         try {
//           holisticRef.current = await HolisticLandmarker.createFromOptions(vision, {
//             baseOptions: {
//               modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/holistic_landmarker/holistic_landmarker/float16/latest/holistic_landmarker.task',
//               delegate: 'GPU'
//             },
//             runningMode: 'VIDEO',
//             numFaces: 1,
//             numHands: 2
//           })
//           console.log('HolisticLandmarker initialized with GPU')
//           setLastEvent('mp-gpu-ready')
//         } catch (gpuErr) {
//           console.warn('GPU init failed, falling back to CPU:', gpuErr)
//           holisticRef.current = await HolisticLandmarker.createFromOptions(vision, {
//             baseOptions: {
//               modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/holistic_landmarker/holistic_landmarker/float16/latest/holistic_landmarker.task',
//               delegate: 'CPU'
//             },
//             runningMode: 'VIDEO',
//             numFaces: 1,
//             numHands: 2
//           })
//           console.log('HolisticLandmarker initialized with CPU')
//           setLastEvent('mp-cpu-ready')
//         }

//         const canvas = canvasRef.current
//         if (!canvas) {
//           console.error('Canvas missing after init')
//           setError('Internal error: canvas unavailable')
//           return
//         }
//         const ctx = canvas.getContext('2d')
//         canvas.width = video.videoWidth || 640
//         canvas.height = video.videoHeight || 480
//         const drawingUtils = new DrawingUtils(ctx)

//         frameCounterRef.current = 0
//         if (!animationFrameId.current) detect(holisticRef.current, video, canvas, ctx, drawingUtils)
//       } catch (initErr) {
//         console.error('MediaPipe initialization failed:', initErr)
//         setError('Failed to initialize MediaPipe: ' + (initErr.message || initErr.name))
//         // leave camera running to allow retry
//       }
//     } catch (err) {
//       console.error('Camera start failed:', err)
//       setError('Camera access failed: ' + (err.message || err.name))
//       setIsActive(false)
//       stopCamera()
//     }
//   }

//   const stopCamera = () => {
//     stopMediaPipe()
//     if (stream) {
//       detachStreamWatchers(stream)
//       try { stream.getTracks().forEach(t => t.stop()) } catch (e) {}
//     }
//     setStream(null)
//     setStreamAlive(false)
//     if (isActive) setIsActive(false)
//     if (videoRef.current) videoRef.current.srcObject = null
//   }

//   // analyzeEmotion: build 1020-length input and call backend safely
//   const analyzeEmotion = async () => {
//     const results = latestLandmarksRef.current
//     if (!results) { setError('No landmarks detected yet. Please wait.'); return }
//     if (!results.faceLandmarks || results.faceLandmarks.length === 0) { setError('No face detected for analysis.'); return }

//     setLoading(true)
//     setError('')

//     const lst = []
//     const faceAll = results.faceLandmarks[0] || []
//     const face = faceAll.slice(0, 468)
//     const anchorFace = face[1] || { x: 0, y: 0 }

//     for (let i = 0; i < 468; i++) {
//       const p = face[i]
//       if (p && typeof p.x === 'number' && typeof p.y === 'number') lst.push(p.x - anchorFace.x, p.y - anchorFace.y)
//       else lst.push(0.0, 0.0)
//     }

//     // left hand (21 points * 2 coords = 42)
//     const leftHand = results.leftHandLandmarks?.[0]
//     if (leftHand) {
//       const anchorLeft = leftHand[8]
//       if (anchorLeft) {
//         for (let i = 0; i < 21; i++) {
//           const p = leftHand[i]
//           if (p && typeof p.x === 'number' && typeof p.y === 'number') lst.push(p.x - anchorLeft.x, p.y - anchorLeft.y)
//           else lst.push(0.0, 0.0)
//         }
//       } else { for (let i = 0; i < 42; i++) lst.push(0.0) }
//     } else { for (let i = 0; i < 42; i++) lst.push(0.0) }

//     // right hand
//     const rightHand = results.rightHandLandmarks?.[0]
//     if (rightHand) {
//       const anchorRight = rightHand[8]
//       if (anchorRight) {
//         for (let i = 0; i < 21; i++) {
//           const p = rightHand[i]
//           if (p && typeof p.x === 'number' && typeof p.y === 'number') lst.push(p.x - anchorRight.x, p.y - anchorRight.y)
//           else lst.push(0.0, 0.0)
//         }
//       } else { for (let i = 0; i < 42; i++) lst.push(0.0) }
//     } else { for (let i = 0; i < 42; i++) lst.push(0.0) }

//     if (lst.length !== 1020) {
//       setError(`Incorrect number of landmarks generated (${lst.length}).`)
//       setLoading(false)
//       return
//     }

//     try {
//       const res = await fetch('http://localhost:4000/api/predict', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ landmarks: lst }) })
//       if (!res.ok) {
//         let errorMsg = `HTTP error! status: ${res.status}`
//         try { const errorData = await res.json(); errorMsg = errorData.error || `Backend error: ${res.statusText}` } catch (e) { errorMsg = `Backend request failed: ${res.statusText}` }
//         throw new Error(errorMsg)
//       }

//       const data = await res.json()
//       const numericConfidence = Number(data.confidence)
//       const confidenceDisplay = Number.isFinite(numericConfidence) ? numericConfidence.toFixed(1) : '0.0'

//       setDetectedEmotion(data.emotion || 'Unknown')
//       setConfidence(confidenceDisplay)
//       onEmotionDetected?.(data.emotion)
//     } catch (err) {
//       console.error('Backend fetch error:', err)
//       setError('Failed to connect to backend: ' + (err.message || err.name))
//     } finally {
//       setLoading(false)
//     }
//   }

//   useEffect(() => { return () => { stopCamera(); if (autoRestartRef.current.timer) clearTimeout(autoRestartRef.current.timer) } }, [])

//   useEffect(() => {
//     if (started) startCamera()
//     else { stopCamera(); setDetectedEmotion(''); setConfidence(0); setError('') }
//   }, [started])

//   const handleGeneratePlaylist = () => {
//     if (detectedEmotion) { if (onNavigate) onNavigate('playlist'); else navigate('/playlist') }
//     else setError('Detect an emotion first before generating a playlist.')
//   }

//   return (
//     // changed bg-white -> bg-base-100 so Daisy theme applies; layout/size unchanged
//     <div className="min-h-screen flex items-center justify-center bg-base-100 px-6 py-8">
//       <div className="w-full max-w-3xl">
//         {!started ? (
//           <div className="text-center py-20">
//             <div className="mx-auto w-36 h-36 flex items-center justify-center rounded-full  shadow-md">
//               <div className="text-6xl">🤖</div>
//             </div>

//             <h1 className="mt-6 text-4xl md:text-5xl font-extrabold text-current">Hey! <span role="img" aria-hidden>👋</span></h1>
//             <h2 className="mt-4 text-3xl md:text-4xl font-bold text-current">Lets Get Started</h2>
//             <p className="mt-4 text-current opacity-70 max-w-2xl mx-auto">The moodify is just an opensource project to detect the mood</p>

//             <div className="mt-8 flex justify-center">
//               {/* added Daisy classes to preserve look while enabling Daisy styling */}
//               <Button onClick={() => setStarted(true)} className="rounded-full px-8 py-3 shadow-md btn btn-primary" size="lg">Moodify</Button>
//             </div>
//           </div>
//         ) : (
//           // add 'card' class while keeping your Card wrapper and provided classes intact
//           <Card className="rounded-2xl overflow-hidden shadow-xl bg-white card">
//             <div className="p-6 flex items-start justify-between border-b">
//               <div>
//                 <h3 className="text-xl font-semibold text-current">Facial Emotion Detection</h3>
//                 <p className="text-sm text-current opacity-70 mt-1">Allow camera access to detect emotions for music recommendations.</p>
//               </div>
//               <div className="flex items-center gap-2">
//                 <Button variant="ghost" size="sm" onClick={() => setStarted(false)} title="Back" className="flex items-center gap-2 px-2 py-1 btn btn-ghost">
//                   <ArrowLeft className="w-4 h-4" />
//                   Back
//                 </Button>
//               </div>
//             </div>

//             <div className="p-6">
//               <div className="w-full aspect-[4/3] bg-black rounded-md overflow-hidden relative">
//                 <video ref={videoRef} autoPlay muted playsInline className="absolute top-0 left-0 w-full h-full object-cover z-10" />
//                 <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full object-cover z-20 pointer-events-none" style={{ background: 'transparent' }} />
//               </div>

//               <div className="mt-4 flex items-center justify-center gap-3">
//                 {isActive ? (
//                   <>
//                     <Button onClick={stopCamera} variant="outline" size="sm" className="btn btn-outline"><CameraOff className="w-4 h-4 mr-1" /> Stop Camera</Button>
//                     <Button onClick={analyzeEmotion} disabled={loading} size="sm" className="btn btn-sm btn-secondary">{loading ? 'Analyzing...' : 'Analyze Emotion'}</Button>
//                   </>
//                 ) : (
//                   <Button onClick={startCamera} size="sm" disabled={!!error && error.startsWith('Camera access failed')} className="btn btn-primary"><Camera className="w-4 h-4 mr-1" /> Start Camera</Button>
//                 )}
//               </div>

//               {/* Debug/status bar */}
//               <div className="mt-3 text-xs text-current opacity-60 text-center">
//                 <div>readyState: {videoReadyState} • frames: {frameCount} • streamAlive: {streamAlive ? 'yes' : 'no'} • last: {lastEvent}</div>
//               </div>

//               {error && <p className="text-red-500 mt-3 text-sm text-center">{error}</p>}

//               {detectedEmotion && !loading && (
//                 <div className="mt-6 p-4 border border-gray-200 rounded-md bg-gray-50">
//                   <h4 className="text-lg font-semibold mb-2 text-center text-current">Detected Emotion</h4>
//                   <div className="flex justify-between items-center text-lg">
//                     <span className="font-medium text-blue-600">{detectedEmotion}</span>
//                     <span className="text-gray-600 text-sm">{confidence}% confidence</span>
//                   </div>
//                   <Button onClick={handleGeneratePlaylist} className="w-full mt-4 btn btn-success" size="sm"><Music className="w-4 h-4 mr-1" /> Generate Playlist</Button>
//                 </div>
//               )}
//             </div>
//           </Card>
//         )}
//       </div>
//     </div>
//   )
// }



"use client"

import React, { useEffect, useRef, useState } from "react"
import { useNavigate } from 'react-router-dom'
import Navbar from "./Navbar.jsx"
import Button from "./ui/Button.jsx"
import Card from "./ui/Card.jsx"
import { Camera, CameraOff, Music, ArrowLeft } from "lucide-react"
import {
  FilesetResolver,
  HolisticLandmarker,
  DrawingUtils,
} from "https://cdn.skypack.dev/@mediapipe/tasks-vision@latest"

export default function EmotionPage({ onEmotionDetected, onNavigate }) {
  const navigate = useNavigate()
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const holisticRef = useRef(null)
  const animationFrameId = useRef(null)
  const latestLandmarksRef = useRef(null)

  const [started, setStarted] = useState(false)
  const [isActive, setIsActive] = useState(false)
  const [detectedEmotion, setDetectedEmotion] = useState("")
  const [confidence, setConfidence] = useState(0)
  const [stream, setStream] = useState(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // Diagnostics state
  const [frameCount, setFrameCount] = useState(0)
  const [videoReadyState, setVideoReadyState] = useState(0)
  const [streamAlive, setStreamAlive] = useState(false)
  const [lastEvent, setLastEvent] = useState(null)
  const autoRestartRef = useRef({ tried: false, timer: null })

  // increment-safe helper for frame count (avoid re-renders every frame)
  const frameCounterRef = useRef(0)
  const bumpFrameCount = () => {
    frameCounterRef.current += 1
    if (frameCounterRef.current % 10 === 0) setFrameCount(frameCounterRef.current)
  }

  // resilient per-frame detection loop
  const detect = async (holistic, video, canvas, ctx, drawingUtils) => {
    try {
      if (!holisticRef.current || !videoRef.current || !canvasRef.current || !holistic || !video || !canvas || !ctx || !drawingUtils) {
        animationFrameId.current = requestAnimationFrame(() => detect(holistic, video, canvas, ctx, drawingUtils))
        return
      }

      // update readyState display
      setVideoReadyState(video.readyState)

      // if video not ready yet, schedule next frame
      if (video.readyState < 2) {
        animationFrameId.current = requestAnimationFrame(() => detect(holistic, video, canvas, ctx, drawingUtils))
        return
      }

      const now = performance.now()

      let results = null
      try {
        results = holistic.detectForVideo(video, now)
      } catch (frameErr) {
        console.warn('detectForVideo error (continuing):', frameErr)
        animationFrameId.current = requestAnimationFrame(() => detect(holistic, video, canvas, ctx, drawingUtils))
        return
      }

      if (!results) {
        animationFrameId.current = requestAnimationFrame(() => detect(holistic, video, canvas, ctx, drawingUtils))
        return
      }

      latestLandmarksRef.current = results

      // draw
      try {
        ctx.save()
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.scale(-1, 1)
        ctx.translate(-canvas.width, 0)
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        if (results.faceLandmarks?.length) {
          drawingUtils.drawConnectors(
            results.faceLandmarks[0],
            HolisticLandmarker.FACE_LANDMARKS_TESSELATION,
            { color: "#C0C0C070", lineWidth: 1 }
          )
          drawingUtils.drawLandmarks(results.faceLandmarks[0], { color: "#FF0000", radius: 1 })
        }

        if (results.leftHandLandmarks?.length) {
          drawingUtils.drawConnectors(results.leftHandLandmarks[0], HolisticLandmarker.HAND_CONNECTIONS, { color: "#00FF00", lineWidth: 2 })
          drawingUtils.drawLandmarks(results.leftHandLandmarks[0], { color: "#00FF00", radius: 3 })
        }

        if (results.rightHandLandmarks?.length) {
          drawingUtils.drawConnectors(results.rightHandLandmarks[0], HolisticLandmarker.HAND_CONNECTIONS, { color: "#00FFFF", lineWidth: 2 })
          drawingUtils.drawLandmarks(results.rightHandLandmarks[0], { color: "#00FFFF", radius: 3 })
        }

        ctx.restore()
      } catch (drawErr) {
        console.warn('drawing error (continuing):', drawErr)
      }

      // bump frame counter occasionally
      bumpFrameCount()

      // schedule next frame
      animationFrameId.current = requestAnimationFrame(() => detect(holisticRef.current, videoRef.current, canvasRef.current, canvasRef.current?.getContext('2d'), new DrawingUtils(canvasRef.current?.getContext('2d'))))
    } catch (outerErr) {
      console.error('detect() outer error (will retry):', outerErr)
      setLastEvent(`detect outer error: ${outerErr.message || outerErr}`)
      // small backoff and retry
      setTimeout(() => {
        if (!animationFrameId.current) animationFrameId.current = requestAnimationFrame(() => detect(holisticRef.current, videoRef.current, canvasRef.current, canvasRef.current?.getContext('2d'), new DrawingUtils(canvasRef.current?.getContext('2d'))))
      }, 200)
    }
  }

  // stop mediapipe loop and clear
  const stopMediaPipe = () => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current)
      animationFrameId.current = null
    }
    try { holisticRef.current?.close?.() } catch (e) { /* ignore */ }
    holisticRef.current = null

    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
    latestLandmarksRef.current = null
  }

  // watch stream tracks for ended/mute and attach handlers
  const attachStreamWatchers = (mediaStream) => {
    if (!mediaStream) return
    setStreamAlive(true)
    setLastEvent('stream-attached')
    // clear any previous listeners by creating new bound functions
    const onTrackEnded = (ev) => {
      console.warn('track ended', ev)
      setLastEvent('track-ended')
      setStreamAlive(false)
      // attempt auto-restart once
      if (!autoRestartRef.current.tried) {
        autoRestartRef.current.tried = true
        autoRestartRef.current.timer = setTimeout(() => {
          console.log('Attempting auto-restart of camera stream.')
          setLastEvent('auto-restart-attempt')
          startCamera().catch(e => console.warn('auto-restart failed', e))
        }, 700) // 700ms backoff
      } else {
        console.log('Auto-restart already tried; not retrying.')
      }
    }
    const onTrackMute = (ev) => {
      console.warn('track muted', ev)
      setLastEvent('track-muted')
    }
    for (const t of mediaStream.getTracks()) {
      // ensure we don't attach duplicate listeners by storing them on the track
      if (!t._moodify_listeners) {
        t._moodify_listeners = true
        t.addEventListener('ended', onTrackEnded)
        t.addEventListener('mute', onTrackMute)
        t.addEventListener('unmute', () => { setLastEvent('track-unmuted'); setStreamAlive(true) })
      }
    }
  }

  // detach watchers (best-effort)
  const detachStreamWatchers = (mediaStream) => {
    if (!mediaStream) return
    try {
      for (const t of mediaStream.getTracks()) {
        if (t._moodify_listeners) {
          try { t.removeEventListener('ended', () => { }) } catch (e) { }
          try { t.removeEventListener('mute', () => { }) } catch (e) { }
          t._moodify_listeners = false
        }
      }
    } catch (e) { }
  }

  const waitForVideoRef = async (timeout = 2000) => {
    const interval = 25
    const start = performance.now()
    while (!videoRef.current && performance.now() - start < timeout) await new Promise(r => setTimeout(r, interval))
    return !!videoRef.current
  }

  // start camera + mediapipe with GPU->CPU fallback
  const startCamera = async () => {
    // clear any pending auto-restart timer
    if (autoRestartRef.current.timer) {
      clearTimeout(autoRestartRef.current.timer)
      autoRestartRef.current.timer = null
    }

    stopCamera()
    setError("")
    setLastEvent('starting-camera')
    autoRestartRef.current.tried = false

    const hasVideoRef = await waitForVideoRef(2000)
    if (!hasVideoRef) {
      setError('Internal error: video element not ready')
      return
    }

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Camera access is not supported or denied.')
        setIsActive(false)
        return
      }

      let mediaStream = null
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } })
      } catch (e1) {
        try { mediaStream = await navigator.mediaDevices.getUserMedia({ video: true }) } catch (e2) {
          try {
            const devices = await navigator.mediaDevices.enumerateDevices()
            const cams = devices.filter(d => d.kind === 'videoinput')
            if (cams.length > 0) mediaStream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: cams[0].deviceId }, width: 640, height: 480 } })
            else throw e2
          } catch (enumErr) {
            console.error('No usable camera found or permission denied', enumErr)
            setError('Camera access failed: ' + (enumErr.message || enumErr.name))
            setIsActive(false)
            return
          }
        }
      }

      setStream(mediaStream)
      attachStreamWatchers(mediaStream)
      setIsActive(true)

      const video = videoRef.current
      video.srcObject = mediaStream

      // Helpful listeners so we know if browser pauses or ends video
      video.onpause = () => { console.log('video paused'); setLastEvent('video-paused') }
      video.onplaying = () => { console.log('video playing'); setLastEvent('video-playing') }
      video.onended = () => { console.log('video ended'); setLastEvent('video-ended'); setStreamAlive(false) }

      await new Promise((resolve, reject) => {
        video.onloadedmetadata = resolve
        video.onerror = (e) => reject(e)
      })

      await video.play()
      await new Promise(r => setTimeout(r, 60))

      try {
        const vision = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm')

        try {
          holisticRef.current = await HolisticLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/holistic_landmarker/holistic_landmarker/float16/latest/holistic_landmarker.task',
              delegate: 'GPU'
            },
            runningMode: 'VIDEO',
            numFaces: 1,
            numHands: 2
          })
          console.log('HolisticLandmarker initialized with GPU')
          setLastEvent('mp-gpu-ready')
        } catch (gpuErr) {
          console.warn('GPU init failed, falling back to CPU:', gpuErr)
          holisticRef.current = await HolisticLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/holistic_landmarker/holistic_landmarker/float16/latest/holistic_landmarker.task',
              delegate: 'CPU'
            },
            runningMode: 'VIDEO',
            numFaces: 1,
            numHands: 2
          })
          console.log('HolisticLandmarker initialized with CPU')
          setLastEvent('mp-cpu-ready')
        }

        const canvas = canvasRef.current
        if (!canvas) {
          console.error('Canvas missing after init')
          setError('Internal error: canvas unavailable')
          return
        }
        const ctx = canvas.getContext('2d')
        canvas.width = video.videoWidth || 640
        canvas.height = video.videoHeight || 480
        const drawingUtils = new DrawingUtils(ctx)

        frameCounterRef.current = 0
        if (!animationFrameId.current) detect(holisticRef.current, video, canvas, ctx, drawingUtils)
      } catch (initErr) {
        console.error('MediaPipe initialization failed:', initErr)
        setError('Failed to initialize MediaPipe: ' + (initErr.message || initErr.name))
        // leave camera running to allow retry
      }
    } catch (err) {
      console.error('Camera start failed:', err)
      setError('Camera access failed: ' + (err.message || err.name))
      setIsActive(false)
      stopCamera()
    }
  }

  const stopCamera = () => {
    stopMediaPipe()
    if (stream) {
      detachStreamWatchers(stream)
      try { stream.getTracks().forEach(t => t.stop()) } catch (e) { }
    }
    setStream(null)
    setStreamAlive(false)
    if (isActive) setIsActive(false)
    if (videoRef.current) videoRef.current.srcObject = null
  }

  // analyzeEmotion: build 1020-length input and call backend safely
  const analyzeEmotion = async () => {
    const results = latestLandmarksRef.current
    if (!results) { setError('No landmarks detected yet. Please wait.'); return }
    if (!results.faceLandmarks || results.faceLandmarks.length === 0) { setError('No face detected for analysis.'); return }

    setLoading(true)
    setError('')

    const lst = []
    const faceAll = results.faceLandmarks[0] || []
    const face = faceAll.slice(0, 468)
    const anchorFace = face[1] || { x: 0, y: 0 }

    for (let i = 0; i < 468; i++) {
      const p = face[i]
      if (p && typeof p.x === 'number' && typeof p.y === 'number') lst.push(p.x - anchorFace.x, p.y - anchorFace.y)
      else lst.push(0.0, 0.0)
    }

    // left hand (21 points * 2 coords = 42)
    const leftHand = results.leftHandLandmarks?.[0]
    if (leftHand) {
      const anchorLeft = leftHand[8]
      if (anchorLeft) {
        for (let i = 0; i < 21; i++) {
          const p = leftHand[i]
          if (p && typeof p.x === 'number' && typeof p.y === 'number') lst.push(p.x - anchorLeft.x, p.y - anchorLeft.y)
          else lst.push(0.0, 0.0)
        }
      } else { for (let i = 0; i < 42; i++) lst.push(0.0) }
    } else { for (let i = 0; i < 42; i++) lst.push(0.0) }

    // right hand
    const rightHand = results.rightHandLandmarks?.[0]
    if (rightHand) {
      const anchorRight = rightHand[8]
      if (anchorRight) {
        for (let i = 0; i < 21; i++) {
          const p = rightHand[i]
          if (p && typeof p.x === 'number' && typeof p.y === 'number') lst.push(p.x - anchorRight.x, p.y - anchorRight.y)
          else lst.push(0.0, 0.0)
        }
      } else { for (let i = 0; i < 42; i++) lst.push(0.0) }
    } else { for (let i = 0; i < 42; i++) lst.push(0.0) }

    if (lst.length !== 1020) {
      setError(`Incorrect number of landmarks generated (${lst.length}).`)
      setLoading(false)
      return
    }

    try {
      const res = await fetch('http://localhost:4000/api/predict', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ landmarks: lst }) })
      if (!res.ok) {
        let errorMsg = `HTTP error! status: ${res.status}`
        try { const errorData = await res.json(); errorMsg = errorData.error || `Backend error: ${res.statusText}` } catch (e) { errorMsg = `Backend request failed: ${res.statusText}` }
        throw new Error(errorMsg)
      }

      const data = await res.json()
      const numericConfidence = Number(data.confidence)
      const confidenceDisplay = Number.isFinite(numericConfidence) ? numericConfidence.toFixed(1) : '0.0'

      setDetectedEmotion(data.emotion || 'Unknown')
      setConfidence(confidenceDisplay)
      onEmotionDetected?.(data.emotion)
    } catch (err) {
      console.error('Backend fetch error:', err)
      setError('Failed to connect to backend: ' + (err.message || err.name))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { return () => { stopCamera(); if (autoRestartRef.current.timer) clearTimeout(autoRestartRef.current.timer) } }, [])

  useEffect(() => {
    if (started) startCamera()
    else { stopCamera(); setDetectedEmotion(''); setConfidence(0); setError('') }
  }, [started])

  const handleGeneratePlaylist = () => {
    if (detectedEmotion) { if (onNavigate) onNavigate('playlist'); else navigate('/playlist') }
    else setError('Detect an emotion first before generating a playlist.')
  }

  return (
    // keep navbar spacing; use theme-aware bg so entire area follows theme
    <div className="min-h-screen flex flex-col items-center justify-center bg-base-100 px-6 py-8 pt-24">
      <Navbar />

      <div className="w-full max-w-3xl">
        {!started ? (
          <div className="text-center py-20 relative">
            {/* Back Button */}
            <button
              onClick={() => navigate(-1)}
              className="absolute top-4 left-4 flex items-center gap-1 text-sm font-medium text-current opacity-70 hover:opacity-100 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <div className="mx-auto w-36 h-36 flex items-center justify-center rounded-full shadow-md bg-base-200 dark:bg-base-300">
              <div className="text-6xl">🤖</div>
            </div>

            <h1 className="mt-6 text-4xl md:text-5xl font-extrabold text-current">
              Hey! <span role="img" aria-hidden>👋</span>
            </h1>
            <h2 className="mt-4 text-3xl md:text-4xl font-bold text-current">Let's Get Started</h2>
            <p className="mt-4 text-current opacity-70 max-w-2xl mx-auto">
              Moodify is an open-source project to detect mood and suggest music.
            </p>

            <div className="mt-8 flex justify-center">
              <Button onClick={() => setStarted(true)} className="rounded-full px-8 py-3 shadow-md btn btn-primary" size="lg">
                Moodify
              </Button>
            </div>
          </div>
        ) : (

          <Card className="rounded-2xl overflow-hidden shadow-xl card bg-base-100 dark:bg-base-200">
            <div className="p-6 flex items-start justify-between border-b border-base-300 dark:border-base-400">
              <div>
                <h3 className="text-xl font-semibold text-current">Facial Emotion Detection</h3>
                <p className="text-sm text-current opacity-70 mt-1">Allow camera access to detect emotions for music recommendations.</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setStarted(false)} title="Back" className="flex items-center gap-2 px-2 py-1 btn btn-ghost">
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
              </div>
            </div>

            <div className="p-6">
              <div className="w-full aspect-[4/3] bg-black rounded-md overflow-hidden relative">
                <video ref={videoRef} autoPlay muted playsInline className="absolute top-0 left-0 w-full h-full object-cover z-10" />
                <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full object-cover z-20 pointer-events-none" style={{ background: 'transparent' }} />
              </div>

              <div className="mt-4 flex items-center justify-center gap-3">
                {isActive ? (
                  <>
                    <Button onClick={stopCamera} variant="outline" size="sm" className="btn btn-outline"><CameraOff className="w-4 h-4 mr-1" /> Stop Camera</Button>
                    <Button onClick={analyzeEmotion} disabled={loading} size="sm" className="btn btn-sm btn-secondary">{loading ? 'Analyzing...' : 'Analyze Emotion'}</Button>
                  </>
                ) : (
                  <Button onClick={startCamera} size="sm" disabled={!!error && error.startsWith('Camera access failed')} className="btn btn-primary"><Camera className="w-4 h-4 mr-1" /> Start Camera</Button>
                )}
              </div>

              {/* Debug/status bar */}
              <div className="mt-3 text-xs text-current opacity-60 text-center">
                <div>readyState: {videoReadyState} • frames: {frameCount} • streamAlive: {streamAlive ? 'yes' : 'no'} • last: {lastEvent}</div>
              </div>

              {error && <p className="text-red-500 mt-3 text-sm text-center">{error}</p>}

              {detectedEmotion && !loading && (
                <div className="mt-6 p-4 rounded-md border border-base-300 bg-base-200 dark:bg-base-300 dark:border-base-400">
                  <h4 className="text-lg font-semibold mb-2 text-center text-base-content">Detected Emotion</h4>
                  <div className="flex justify-between items-center text-lg">
                    <span className="font-medium text-primary">{detectedEmotion}</span>
                    <span className="text-sm opacity-70 text-base-content">{confidence}% confidence</span>
                  </div>
                  <Button onClick={handleGeneratePlaylist} className="w-full mt-4 btn btn-success" size="sm"><Music className="w-4 h-4 mr-1" /> Generate Playlist</Button>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
