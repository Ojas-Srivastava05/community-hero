/** Browser voice capture for civic reporting — Web Speech + MediaRecorder fallback. */

export type VoiceCaptureResult = {
  transcript: string
  audioBlob?: Blob
  mimeType?: string
  durationMs: number
}

function pickSpeechRecognition(): SpeechRecognition | null {
  const w = window as Window & {
    SpeechRecognition?: typeof SpeechRecognition
    webkitSpeechRecognition?: typeof SpeechRecognition
  }
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition
  if (!Ctor) return null
  return new Ctor()
}

export function speechRecognitionSupported(): boolean {
  return Boolean(pickSpeechRecognition())
}

export function mediaRecorderSupported(): boolean {
  return typeof MediaRecorder !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia)
}

/** Live dictation via Web Speech API (Chrome/Android/Safari). */
export function startSpeechDictation(opts: {
  lang?: string
  onPartial?: (text: string) => void
  onFinal?: (text: string) => void
  onError?: (err: string) => void
}): { stop: () => void } {
  const rec = pickSpeechRecognition()
  if (!rec) {
    opts.onError?.('Speech recognition not supported in this browser')
    return { stop: () => undefined }
  }
  rec.continuous = true
  rec.interimResults = true
  rec.lang = opts.lang || 'en-IN'
  let finalText = ''
  rec.onresult = (ev: SpeechRecognitionEvent) => {
    let interim = ''
    for (let i = ev.resultIndex; i < ev.results.length; i++) {
      const r = ev.results[i]
      if (r.isFinal) finalText += r[0].transcript + ' '
      else interim += r[0].transcript
    }
    opts.onPartial?.((finalText + interim).trim())
    if (ev.results[ev.results.length - 1]?.isFinal) {
      opts.onFinal?.(finalText.trim())
    }
  }
  rec.onerror = (e: SpeechRecognitionErrorEvent) => {
    opts.onError?.(e.error || 'speech_error')
  }
  rec.start()
  return {
    stop: () => {
      try {
        rec.stop()
      } catch {
        /* ignore */
      }
      opts.onFinal?.(finalText.trim())
    },
  }
}

/** Record mic audio for Gemini transcription fallback. */
export async function recordVoiceNote(maxMs = 30_000): Promise<{
  stop: () => Promise<VoiceCaptureResult>
  stream: MediaStream
}> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
    ? 'audio/webm;codecs=opus'
    : MediaRecorder.isTypeSupported('audio/webm')
      ? 'audio/webm'
      : 'audio/mp4'
  const chunks: BlobPart[] = []
  const recorder = new MediaRecorder(stream, { mimeType: mime })
  const started = Date.now()
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data)
  }
  recorder.start(250)
  const autoStop = window.setTimeout(() => {
    if (recorder.state === 'recording') recorder.stop()
  }, maxMs)

  return {
    stream,
    stop: () =>
      new Promise((resolve) => {
        window.clearTimeout(autoStop)
        recorder.onstop = () => {
          stream.getTracks().forEach((t) => t.stop())
          const audioBlob = new Blob(chunks, { type: mime })
          resolve({
            transcript: '',
            audioBlob,
            mimeType: mime,
            durationMs: Date.now() - started,
          })
        }
        if (recorder.state === 'recording') recorder.stop()
        else {
          stream.getTracks().forEach((t) => t.stop())
          resolve({
            transcript: '',
            audioBlob: new Blob(chunks, { type: mime }),
            mimeType: mime,
            durationMs: Date.now() - started,
          })
        }
      }),
  }
}
