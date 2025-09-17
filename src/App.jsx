import React, { useState, useEffect } from "react";
import "./index.css";

function getDaySeed() {
  const today = new Date().toISOString().slice(0, 10);
  let hash = 0;
  for (let i = 0; i < today.length; i++) {
    hash = (hash << 5) - hash + today.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export default function App() {
  const [solutions, setSolutions] = useState([]);
  const [valid, setValid] = useState([]);
  const [target, setTarget] = useState("");

  useEffect(() => {
    fetch("/api/words")
      .then((res) => res.json())
      .then((data) => {
        setSolutions(data.solutions || []);
        setValid(data.valid || []);
        if (data.solutions && data.solutions.length > 0) {
          const idx = getDaySeed() % data.solutions.length;
          setTarget(data.solutions[idx]);
        }
      });
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-gray-900">
      <h1 className="text-3xl font-bold mb-4">Term.ooo Clone</h1>
      <p className="mb-2">Palavra do dia: {target || "Carregando..."}</p>
      <p className="text-sm text-gray-600">Total soluções: {solutions.length}</p>
      <p className="text-sm text-gray-600">Total válidas: {valid.length}</p>
    </div>
  );
}
