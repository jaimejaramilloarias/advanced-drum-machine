import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import * as Tone from "tone";
import Track from "./components/Track";
import Controls from "./components/Controls";
import { KITS } from "./data/kits";
import { SIGNATURES } from "./data/signatures";
import { useDrumTransport } from "./hooks/useDrumTransport";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { appWindow, LogicalSize } from '@tauri-apps/api/window';
import "./index.css";

function isTauri() {
  return !!(window.__TAURI__ || window.__TAURI_IPC__);
}

function App() {
  const [kit, setKit] = useState("Electronic Kit");
  const [signatureIdx, setSignatureIdx] = useState(2);
  const signature = SIGNATURES[signatureIdx];
  const [numBars, setNumBars] = useState(1);

  const stepsInBar = signature.groups.reduce((a, b) => a + b, 0);
  const totalSteps = stepsInBar * numBars;

  const [tracks, setTracks] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [bpm, setBpm] = useState(120);
  // NUEVO: Estado de volumen maestro
  const [masterVolume, setMasterVolume] = useState(100);

  // Presets
  const [presets, setPresets] = useState(() => {
    const saved = localStorage.getItem("adm_presets");
    return saved ? JSON.parse(saved) : [];
  });
  const [presetName, setPresetName] = useState("");

  const samplersRef = useRef([]);
  const tracksRef = useRef([]);
  const mainContainerRef = useRef(null);

  // Ajuste de ancho automático con Tauri
useLayoutEffect(() => {
  if (mainContainerRef.current && isTauri()) {
    try {
      const contentWidth = mainContainerRef.current.scrollWidth;
      appWindow.setSize(new LogicalSize(Math.max(contentWidth, 1000), 820));
    } catch (err) {
      // Ignora error si ocurre
    }
  }
}, [tracks, signatureIdx, numBars, kit]);

  useEffect(() => {
    setNumBars(1);
    const kitSamples = KITS[kit] || [];
    const newTracks = kitSamples.map((sample, idx) => ({
      id: idx + 1,
      sample: sample,
      steps: Array(stepsInBar).fill(false),
      volume: 60,
    }));
    setTracks(newTracks);
    tracksRef.current = newTracks;
    setIsPlaying(false);
  }, [kit, signatureIdx]);

  useEffect(() => {
    setTracks(tracks =>
      tracks.map(track => ({
        ...track,
        steps: [
          ...track.steps.slice(0, totalSteps),
          ...Array(Math.max(0, totalSteps - track.steps.length)).fill(false)
        ]
      }))
    );
    tracksRef.current = tracksRef.current.map(track => ({
      ...track,
      steps: [
        ...track.steps.slice(0, totalSteps),
        ...Array(Math.max(0, totalSteps - track.steps.length)).fill(false)
      ]
    }));
  }, [numBars, stepsInBar]);

  useEffect(() => {
    Tone.Destination.volume.value = (masterVolume / 100) * -12; // -12 dB a 100%
    samplersRef.current.forEach(s => s.dispose && s.dispose());
    samplersRef.current = tracks.map(track => {
      const url = `/assets/samples/${kit}/${track.sample}`;
      console.log("Intentando cargar:", url);
      // Si usas Tone.Sampler
      const sampler = new Tone.Sampler({
      C3: url,
       onload: () => console.log("Sample cargado", url)
      });

      const player = new Tone.Player(url).toDestination();
      player.volume.value = (track.volume ?? 60) * 0.3 - 30;
      return player;
    });
    tracksRef.current = tracks;
  }, [tracks, kit, masterVolume]);
    // Hook de transporte con retrigger limpio
  useDrumTransport({
    isPlaying,
    tracksRef,
    samplersRef,
    bpm,
    steps: totalSteps,
    setCurrentStep,
  });

  const handleStepToggle = (trackIdx, stepIdx) => {
    const updated = tracksRef.current.map((track, t) =>
      t === trackIdx
        ? {
            ...track,
            steps: track.steps.map((v, s) => (s === stepIdx ? !v : v)),
          }
        : track
    );
    tracksRef.current = updated;
    setTracks(updated);
  };

  const handleChangeSample = (trackIdx, newSample) => {
    const updated = tracksRef.current.map((track, t) =>
      t === trackIdx
        ? {
            ...track,
            sample: newSample
          }
        : track
    );
    tracksRef.current = updated;
    setTracks(updated);
  };

  const handleChangeVolume = (trackIdx, newVolume) => {
    const updated = tracksRef.current.map((track, t) =>
      t === trackIdx
        ? { ...track, volume: newVolume }
        : track
    );
    tracksRef.current = updated;
    setTracks(updated);
    const player = samplersRef.current[trackIdx];
    if (player) {
      player.volume.value = newVolume * 0.3 - 30;
    }
  };
    const handleDragEnd = result => {
    if (!result.destination) return;
    const reordered = Array.from(tracksRef.current);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    tracksRef.current = reordered;
    setTracks(reordered);
  };

  const handlePlay = () => {
  Tone.start(); // <-- ESTA LÍNEA
    setIsPlaying(true);
  };

  const handleStop = () => {
    setIsPlaying(false);
  };

  // --- PRESETS ---
  const savePreset = () => {
    if (!presetName.trim()) return;
    const newPreset = {
      name: presetName,
      kit,
      bpm,
      signatureIdx,
      numBars,
      tracks: tracksRef.current.map(t => ({
        sample: t.sample,
        steps: [...t.steps],
        volume: t.volume,
      })),
    };
    const updated = [...presets, newPreset];
    setPresets(updated);
    localStorage.setItem("adm_presets", JSON.stringify(updated));
    setPresetName("");
  };
  const loadPreset = idx => {
    const p = presets[idx];
    if (!p) return;
    setKit(p.kit);
    setBpm(p.bpm);
    setSignatureIdx(p.signatureIdx);
    setNumBars(p.numBars);
    setTimeout(() => {
      setTracks(
        p.tracks.map(t => ({
          ...t,
          steps: [...t.steps],
        }))
      );
      tracksRef.current = p.tracks.map(t => ({
        ...t,
        steps: [...t.steps],
      }));
    }, 120);
  };

  const deletePreset = idx => {
    const updated = presets.filter((_, i) => i !== idx);
    setPresets(updated);
    localStorage.setItem("adm_presets", JSON.stringify(updated));
  };

  // --- BLOQUE BOTONES DE COMPÁS ---
  const addBar = () => {
    setTracks(tracks => {
      const newTracks = tracks.map(track => {
        const steps = [...track.steps];
        const compasPrev = steps.slice(-stepsInBar);
        return {
          ...track,
          steps: steps.concat(compasPrev)
        };
      });
      tracksRef.current = newTracks;
      return newTracks;
    });
    setNumBars(n => n + 1);
  };
  const removeBar = () => {
    if (numBars === 1) return;
    setTracks(tracks => {
      const newTracks = tracks.map(track => ({
        ...track,
        steps: track.steps.slice(0, -stepsInBar)
      }));
      tracksRef.current = newTracks;
      return newTracks;
    });
    setNumBars(n => Math.max(1, n - 1));
  };

  return (
    <div className="app-root" style={{
      minHeight: "100vh",
      background: "#181926",
      color: "#fff",
      fontFamily: "Inter, Arial, sans-serif",
      display: "flex",
      flexDirection: "column"
    }}>
      {/* Header */}
      <header style={{
        width: "100%",
        background: "#222341",
        padding: "20px 36px 12px 36px",
        fontWeight: "bold",
        fontSize: "2rem",
        letterSpacing: "1.5px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        boxSizing: "border-box"
      }}>
        <span style={{ fontWeight: "700" }}>Advanced Drum Machine</span>
        <span style={{
          fontWeight: "400",
          fontSize: "1rem",
          letterSpacing: "1px",
          opacity: 0.65,
          marginLeft: "16px"
        }}>© Jaime Jaramillo Arias - 2025</span>
      </header>
      {/* Main layout */}
      <div
        ref={mainContainerRef}
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "flex-start",
          padding: "28px 0 0 0",
          gap: "16px",
          boxSizing: "border-box",
          overflowX: "visible"
        }}>
        {/* Secuenciador */}
        <section style={{
          background: "#23244a",
          borderRadius: "20px",
          minWidth: "max-content",
          maxWidth: "unset",
          flex: "1 1 auto",
          marginLeft: "32px",
          marginBottom: "36px",
          padding: "28px 36px 34px 36px",
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
          boxShadow: "0 6px 30px #0003",
          maxHeight: "680px",
          overflowY: "auto",
          overflowX: "visible"
        }}>
          <h2 style={{
            margin: 0,
            marginBottom: "28px",
            fontSize: "1.25rem",
            fontWeight: "700",
            letterSpacing: "1px"
          }}>Secuenciador</h2>
          {/* Botones agregar/quitar compás */}
          <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 16 }}>
            <button
              onClick={addBar}
              style={{
                padding: "6px 18px",
                borderRadius: 8,
                border: "none",
                background: "#ffca40",
                color: "#22253f",
                fontWeight: 700,
                fontSize: "1.09rem",
                cursor: "pointer",
                marginRight: 4,
                boxShadow: "0 1px 8px #0003"
              }}
              title="Agregar compás"
            >
              Compás +
            </button>
            <button
              onClick={removeBar}
              style={{
                padding: "6px 18px",
                borderRadius: 8,
                border: "none",
                background: numBars === 1 ? "#555a" : "#444a",
                color: "#fff",
                fontWeight: 700,
                fontSize: "1.09rem",
                cursor: numBars === 1 ? "not-allowed" : "pointer",
                boxShadow: "0 1px 8px #0003",
                marginRight: 4
              }}
              disabled={numBars === 1}
              title="Eliminar último compás"
            >
              Compás −
            </button>
            <span style={{ color: "#ffca40", fontWeight: 600 }}>
              {numBars} compás{numBars > 1 ? "es" : ""}
            </span>
          </div>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="tracks">
              {provided => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px"
                  }}
                >
                  {tracks.map((track, tIdx) => (
                    <Draggable key={track.id} draggableId={String(track.id)} index={tIdx}>
                      {providedDraggable => (
                        <div
                          ref={providedDraggable.innerRef}
                          {...providedDraggable.draggableProps}
                          style={{...providedDraggable.draggableProps.style}}
                        >
                          <Track
                            steps={track.steps}
                            sampleOptions={KITS[kit]}
                            selectedSample={track.sample}
                            onStepToggle={stepIdx => handleStepToggle(tIdx, stepIdx)}
                            onChangeSample={sample => handleChangeSample(tIdx, sample)}
                            currentStep={isPlaying ? currentStep : -1}
                            volume={track.volume}
                            onChangeVolume={value => handleChangeVolume(tIdx, value)}
                            dragHandleProps={providedDraggable.dragHandleProps}
                            signature={signature}
                            stepsInBar={stepsInBar}
                            numBars={numBars}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </section>
        {/* Controles */}
        <aside style={{
          background: "#22253f",
          borderRadius: "20px",
          minWidth: "285px",
          maxWidth: "330px",
          marginLeft: "24px",
          marginBottom: "36px",
          padding: "26px 18px 30px 18px",
          boxSizing: "border-box",
          boxShadow: "0 6px 30px #0003"
        }}>
          {/* --- AÑADE LOS PROPS DEL MASTER VOLUME --- */}
          <Controls
            isPlaying={isPlaying}
            onPlay={handlePlay}
            onStop={handleStop}
            kit={kit}
            setKit={setKit}
            bpm={bpm}
            setBpm={setBpm}
            signatureIdx={signatureIdx}
            setSignatureIdx={setSignatureIdx}
            signatures={SIGNATURES}
            masterVolume={masterVolume}
            setMasterVolume={setMasterVolume}
          />
          {/* --- Presets UI --- */}
          <div style={{
            background: "#2b2f59", borderRadius: "8px", padding: "12px 16px",
            color: "#c7c9e7", fontWeight: 500, opacity: 0.93,
            marginTop: "20px"
          }}>
            <strong style={{ fontSize: "1.05rem" }}>Presets</strong>
            <div style={{ display: "flex", gap: 8, margin: "8px 0" }}>
              <input
                type="text"
                placeholder="Nombre del preset"
                value={presetName}
                onChange={e => setPresetName(e.target.value)}
                style={{ flex: 1, minWidth: 60, borderRadius: 5, border: "1px solid #333", padding: "2px 7px" }}
                onKeyDown={e => { if (e.key === "Enter") savePreset(); }}
              />
              <button
                onClick={savePreset}
                style={{
                  padding: "2px 12px",
                  borderRadius: 5,
                  border: "none",
                  background: "#54a", color: "#fff", fontWeight: "bold", cursor: "pointer"
                }}
              >Guardar</button>
            </div>
            <div style={{ margin: 0 }}>
              {presets.length === 0 && <div style={{ color: "#8c8c8c" }}>No hay presets guardados.</div>}
              {presets.map((preset, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", marginBottom: 4 }}>
                  <button
                    onClick={() => loadPreset(idx)}
                    style={{ flex: 1, textAlign: "left", background: "#3b3667", color: "#ffd", border: "none", borderRadius: 4, padding: "2px 7px", cursor: "pointer" }}
                  >
                    {preset.name}
                  </button>
                  <button
                    onClick={() => deletePreset(idx)}
                    style={{ background: "#c44", color: "#fff", border: "none", borderRadius: 4, padding: "2px 7px", marginLeft: 4, cursor: "pointer" }}
                    title="Eliminar preset"
                  >🗑️</button>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
      <footer style={{
        background: "#222341",
        padding: "14px 0 10px 0",
        color: "#c7c9e7",
        fontSize: "1rem",
        textAlign: "center",
        letterSpacing: "0.5px"
      }}>
        Advanced Drum Machine
      </footer>
      <button style={{margin:20, fontSize:22}} onClick={() => {
        Tone.start();
         const synth = new Tone.Synth().toDestination();
          synth.triggerAttackRelease("C4", "8n");
      }}>
        Probar Audio
        </button>
    </div>
  );
}

export default App;


