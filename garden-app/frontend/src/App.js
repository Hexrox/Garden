
import React, { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
  const [plots, setPlots] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:3001/api/plots').then(res => setPlots(res.data));
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Poletka</h1>
      <ul>
        {plots.map(plot => (
          <li key={plot.id} className="border p-2 rounded mb-2">
            <strong>{plot.name}</strong><br />
            {plot.description}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
