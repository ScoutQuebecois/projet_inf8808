import React from "react"

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


const Home = () => {
    const [data] = React.useState(sampleData)
    
    return (
        <div className="data-container">
          <h2>Comment est-ce que les caractéristiques physiques des médaillés d’un sport ont évolué selon le temps?</h2>
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
    )
}

export default Home;