import React from "react";
import { KITS } from "../data/kits";

function Controls({
  isPlaying, onPlay, onStop,
  kit, setKit,
  bpm, setBpm,
  masterVolume, setMasterVolume,
  signatureIdx, setSignatureIdx,
  signatures
}) {
  return (
    <div>
      <h2 style={{margin: 0, marginBottom: 16, color: "#c7c9e7"}}>Controles</h2>

      {/* Transport */}
      <div style={{ background: "#2b2f59", padding: 12, borderRadius: 8, marginBottom: 12 }}>
        <span>Transport:</span>
        <button onClick={onPlay} disabled={isPlaying} style={{ marginLeft: 8 }}>▶</button>
        <button onClick={onStop} disabled={!isPlaying} style={{ marginLeft: 4 }}>■</button>
      </div>

      {/* BPM */}
      <div style={{ background: "#2b2f59", padding: 12, borderRadius: 8, marginBottom: 12, textAlign: "center" }}>
        <span>BPM:</span>
        <input
          type="range"
          min={60}
          max={220}
          value={bpm}
          onChange={e => setBpm(Number(e.target.value))}
          style={{ writingMode: "bt-lr", WebkitAppearance: "slider-vertical", height: 80, marginTop: 8 }}
        />
        <div style={{ color: "#ffca40", fontWeight: 700 }}>{bpm}</div>
      </div>

      {/* Master Volume */}
      <div style={{ background: "#2b2f59", padding: 12, borderRadius: 8, marginBottom: 12, textAlign: "center" }}>
        <span>Master Volume:</span>
        <input
          type="range"
          min={0} max={100}
          value={masterVolume}
          onChange={e => setMasterVolume(Number(e.target.value))}
          style={{ width: "100%", marginTop: 8 }}
        />
        <div style={{ color: "#ffca40", fontWeight: 700 }}>{masterVolume}%</div>
      </div>

      {/* Signature */}
      <div style={{ background: "#2b2f59", padding: 12, borderRadius: 8, marginBottom: 12, display: "flex", alignItems: "center" }}>
        <span>Signatura:</span>
        <select
          value={signatureIdx}
          onChange={e => setSignatureIdx(Number(e.target.value))}
          style={{ marginLeft: 8, flex: 1 }}
        >
          {signatures.map((s, i) => (
            <option key={i} value={i}>{s.name}</option>
          ))}
        </select>
      </div>

      {/* Kit */}
      <div style={{ background: "#2b2f59", padding: 12, borderRadius: 8, marginBottom: 12, display: "flex", alignItems: "center" }}>
        <span>Kit:</span>
        <select
          value={kit}
          onChange={e => setKit(e.target.value)}
          style={{ marginLeft: 8, flex: 1 }}
        >
          {Object.keys(KITS).map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default Controls;
