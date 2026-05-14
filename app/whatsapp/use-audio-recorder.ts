'use client';

import { useRef, useState } from 'react';
import { pickAudioRecordingMimeType, audioFileExtensionFromMime } from './utils';

interface UseAudioRecorderArgs {
  onRecorded: (file: File) => void | Promise<void>;
  onTooShort: () => void;
  onPermissionDenied: () => void;
}

/**
 * Encapsula a gravação de áudio com `MediaRecorder`. Expõe `start`, `stopAndSend` e `cancel`,
 * mais o estado visível (`isRecording`, `recordingTime`).
 */
export function useAudioRecorder({ onRecorded, onTooShort, onPermissionDenied }: UseAudioRecorderArgs) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingMimeRef = useRef<string>('audio/webm');
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isCancelledRef = useRef<boolean>(false);

  const clearTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeChoice = pickAudioRecordingMimeType();
      const mediaRecorder = mimeChoice
        ? new MediaRecorder(stream, { mimeType: mimeChoice })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      isCancelledRef.current = false;
      recordingMimeRef.current = mediaRecorder.mimeType || 'audio/webm';

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        if (isCancelledRef.current) return;
        const chunks = audioChunksRef.current;
        const totalBytes = chunks.reduce((n, b) => n + b.size, 0);
        if (totalBytes < 256) {
          onTooShort();
          return;
        }
        const blobType = recordingMimeRef.current || 'audio/webm';
        const audioBlob = new Blob(chunks, { type: blobType });
        const ext = audioFileExtensionFromMime(blobType);
        const audioFile = new File([audioBlob], `audio_${Date.now()}.${ext}`, { type: blobType });
        await onRecorded(audioFile);
      };

      // Timeslice garante chunks antes do stop (sem isto, alguns browsers gravam silêncio / ficheiro vazio).
      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordingTime(0);
      timerIntervalRef.current = setInterval(() => setRecordingTime((prev) => prev + 1), 1000);
    } catch {
      onPermissionDenied();
    }
  };

  const stopAndSend = () => {
    const mr = mediaRecorderRef.current;
    if (!mr || !isRecording) return;
    try {
      if (mr.state === 'recording') mr.requestData();
    } catch {
      /* ignore */
    }
    mr.stop();
    setIsRecording(false);
    clearTimer();
  };

  const cancel = () => {
    const mr = mediaRecorderRef.current;
    if (!mr || !isRecording) return;
    isCancelledRef.current = true;
    try {
      if (mr.state === 'recording') mr.requestData();
    } catch {
      /* ignore */
    }
    mr.stop();
    setIsRecording(false);
    clearTimer();
  };

  return { isRecording, recordingTime, start, stopAndSend, cancel } as const;
}
