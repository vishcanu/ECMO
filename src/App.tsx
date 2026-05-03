import { ScenarioBuilder } from './app/ScenarioBuilder'
import { useDeviceSync } from './hooks/useDeviceSync'
import './App.css'

function App() {
  useDeviceSync();
  return <ScenarioBuilder />
}

export default App
