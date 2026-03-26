import React from 'react'
import './index.css'
import 'bootstrap/dist/css/bootstrap.min.css';


// Static data bundled with the frontend
const sampleData = {
  message: 'Hello from the Data Visualization App!',
  timestamp: new Date().toISOString(),
  datasets: [
    { name: 'Dataset 1', value: 100 },
    { name: 'Dataset 2', value: 200 },
    { name: 'Dataset 3', value: 150 }
  ]
}

const App: React.FC = () => {
  const [data] = React.useState(sampleData)

  return (
    <div className="app">
      <header>
        <h1>📊 Data Visualization</h1>
      </header>
      <main>
        <div className="data-container">
          <h2>Welcome to the Data Visualization App</h2>
          <p>{data.message}</p>
          <p><small>Loaded at: {data.timestamp}</small></p>
          <div className="data-list">
            <h3>Sample Data:</h3>
            <ul>
              {data.datasets.map((item, index) => (
                <li key={index}>{item.name}: {item.value}</li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
