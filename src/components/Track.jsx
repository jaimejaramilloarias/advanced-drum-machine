import React from "react";

function Track({
  steps,
  onStepToggle,
  sampleOptions,
  selectedSample,
  onChangeSample,
  currentStep,
  volume,
  onChangeVolume,
  dragHandleProps,
  signature,
  stepsInBar,
  numBars
}) {
  // Pulsos del compás
  const groupStarts = [];
  let acc = 0;
  for (let g of signature.groups) {
    groupStarts.push(acc);
    acc += g;
  }

  // Pulsos de todos los compases
  const totalSteps = steps.length;
  const barMarkers = [];
  for (let b = 0; b < numBars; b++) {
    barMarkers.push(b * stepsInBar);
  }
  const pulseIndices = [];
  for (let b = 0; b < numBars; b++) {
    groupStarts.forEach(offset => {
      pulseIndices.push(b * stepsInBar + offset);
    });
  }

  return (
    <div
      style={{
        background: "#293063",
        borderRadius: "12px",
        padding: "12px 18px 10px 18px",
        fontWeight: "500",
        marginBottom: "10px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        minWidth: "max-content",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "4px",
          flexWrap: "nowrap",
        }}
      >
        <span
          {...dragHandleProps}
          style={{
            cursor: "grab",
            fontSize: 20,
            marginRight: 8,
            color: "#fd2",
            minWidth: 20,
            display: "inline-block",
          }}
          title="Arrastrar para reordenar"
        >
          ☰
        </span>
        {/* SOLO menú de samples */}
        <select
          value={selectedSample}
          style={{
            background: "#22253f",
            color: "#fff",
            borderRadius: "5px",
            border: "none",
            padding: "2px 8px",
            fontSize: "0.95rem",
            minWidth: 120,
            marginRight: 8,
          }}
          onChange={e => onChangeSample(e.target.value)}
        >
          {sampleOptions.map(opt => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        {/* Slider vertical de volumen */}
        <div style={{
          marginLeft: 16,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          minWidth: 36,
        }}>
          <input
            type="range"
            min={0}
            max={100}
            value={volume}
            onChange={e => onChangeVolume(Number(e.target.value))}
            style={{
              writingMode: "bt-lr",
              WebkitAppearance: "slider-vertical",
              height: 44,
              width: 18,
              marginBottom: 2,
              accentColor: "#fd2"
            }}
          />
          <span style={{fontSize: 10, color: "#fc2", marginTop: 2}}>Vol</span>
        </div>
      </div>
      {/* Matriz de pasos + etiquetas de compás */}
      <div style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "flex-end",
        gap: "7px",
        marginTop: "2px",
      }}>
        {steps.map((active, idx) => {
          const isBarStart = barMarkers.includes(idx);
          const barNum = Math.floor(idx / stepsInBar) + 1;
          const isPulse = pulseIndices.includes(idx);
          return (
            <React.Fragment key={idx}>
              {/* Etiqueta de compás */}
              {isBarStart &&
                <span style={{
                  fontSize: 10,
                  color: "#ffca40",
                  fontWeight: "bold",
                  marginRight: "3px",
                  marginLeft: idx === 0 ? 0 : "8px"
                }}>
                  Compás {barNum}
                </span>
              }
              {/* Paso */}
              <button
                onClick={() => onStepToggle(idx)}
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "7px",
                  border: active
                    ? isPulse ? "2px solid rgba(255,68,68,0.20)" : "2px solid #9af"
                    : isPulse ? "2px solid rgba(255,68,68,0.20)" : "2px solid #555a",
                  background:
                    currentStep === idx
                      ? "#ffca40"
                      : active
                      ? "#90b5fa"
                      : isPulse
                      ? "rgba(255,68,68,0.20)"
                      : "#22253f",
                  color: isPulse ? "#fff" : "#22253f",
                  fontWeight: isPulse ? 900 : 700,
                  fontSize: "1rem",
                  transition: "all 0.1s",
                  cursor: "pointer",
                  boxShadow: active
                    ? "0 0 8px 2px #98f8"
                    : "0 1px 3px #0007",
                  padding: 0,
                }}
                title={`Paso ${idx + 1}`}
              >
                {idx + 1}
              </button>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

export default Track;
