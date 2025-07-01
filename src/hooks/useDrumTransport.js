// src/hooks/useDrumTransport.js
import { useEffect, useRef } from "react";
import * as Tone from "tone";

export function useDrumTransport({
  isPlaying,
  tracksRef,
  samplersRef,
  bpm,
  steps,
  setCurrentStep,
}) {
  const stepRef = useRef(0);

  useEffect(() => {
    // Ajusta el BPM
    Tone.Transport.bpm.value = bpm;

    if (isPlaying) {
      // Reinicia en el primer paso
      stepRef.current = 0;
      setCurrentStep(0);
      Tone.Transport.stop();
      Tone.Transport.cancel();

      // Programa el loop
      Tone.Transport.scheduleRepeat((time) => {
        const step = stepRef.current % steps;

        tracksRef.current.forEach((track, tIdx) => {
          if (track.steps[step]) {
            const player = samplersRef.current[tIdx];
            if (
              player &&
              player.loaded &&
              player.buffer &&
              player.buffer.loaded
            ) {
              // **Detén cualquier reproducción previa en este mismo tiempo**
              player.stop(time);
              // Actualiza volumen justo antes de arrancar
              player.volume.value = (track.volume ?? 60) * 0.3 - 30;
              // Arranca el sample en el tiempo programado
              player.start(time);
            }
          }
        });

        setCurrentStep(step);
        stepRef.current = (stepRef.current + 1) % steps;
      }, "16n");

      // Inicia el transport
      Tone.Transport.start();
    } else {
      // Detén el transport y oculta el step actual
      Tone.Transport.stop();
      setCurrentStep(-1);
    }

    return () => {
      // Limpia todo al desmontar o al cambiar isPlaying
      Tone.Transport.cancel();
      Tone.Transport.stop();
    };
    // eslint-disable-next-line
  }, [isPlaying, bpm, steps, tracksRef, samplersRef, setCurrentStep]);
}
