import { useState, useEffect, useRef } from 'react'
import Map, { Source, Layer } from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

const geojsonTemplate = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature', id: 'zone-main',
      properties: { name: 'Main Entrance', color: '#22c55e' },
      geometry: { type: 'Polygon', coordinates: [[[-74.0060, 40.7128], [-74.0050, 40.7128], [-74.0050, 40.7138], [-74.0060, 40.7138], [-74.0060, 40.7128]]] }
    },
    {
      type: 'Feature', id: 'zone-gardens',
      properties: { name: 'Royal Gardens', color: '#22c55e' },
      geometry: { type: 'Polygon', coordinates: [[[-74.0050, 40.7128], [-74.0030, 40.7128], [-74.0030, 40.7138], [-74.0050, 40.7138], [-74.0050, 40.7128]]] }
    }
  ]
}

function App() {
  const [geoData, setGeoData] = useState(geojsonTemplate)
  const [alertMsg, setAlertMsg] = useState('')
  const [broadcastStatus, setBroadcastStatus] = useState('')
  const ws = useRef(null)

  useEffect(() => {
    ws.current = new WebSocket('wss://remains-science-served-back.trycloudflare.com/ws/heatmaps')
    ws.current.onmessage = (event) => {
      const msg = JSON.parse(event.data)
      if (msg.type === 'DENSITY_UPDATE') {
        const updates = msg.data
        setGeoData(prev => {
            const newGeo = { ...prev }
            const colors = { 'GREEN': '#22c55e', 'YELLOW': '#eab308', 'RED': '#ef4444' }
            newGeo.features = newGeo.features.map(f => {
                const randomUpdate = updates[Math.floor(Math.random() * updates.length)]
                if(randomUpdate) f.properties.color = colors[randomUpdate.status] || '#22c55e'
                return f
            })
            return newGeo
        })
      }
    }
    return () => { if(ws.current) ws.current.close() }
  }, [])

  const sendAlert = async () => {
    if (!alertMsg) return
    try {
        const response = await fetch('https://remains-science-served-back.trycloudflare.com/admin/broadcast?message=' + encodeURIComponent(alertMsg), { method: 'POST' })
        if(response.ok) {
            setBroadcastStatus('Alert broadcasted successfully!')
            setAlertMsg('')
            setTimeout(() => setBroadcastStatus(''), 3000)
        }
    } catch(e) {
        setBroadcastStatus('Failed to send alert.')
    }
  }

  return (
    <div className="bg-background text-on-background h-screen overflow-hidden flex flex-col antialiased">
        <header className="fixed top-0 w-full z-50 bg-surface text-primary border-b border-surface-variant flex justify-between items-center px-container-padding h-16 shadow-sm">
            <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-primary cursor-pointer hover:bg-surface-container-low rounded-full p-2 transition-colors active:scale-95 duration-200">location_on</span>
                <span className="font-title-lg text-title-lg font-bold text-primary">FlowScape</span>
            </div>
            <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:bg-surface-container-low rounded-full p-2 transition-colors active:scale-95 duration-200">notifications</span>
                <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-label-lg text-label-lg cursor-pointer hover:bg-primary/80 transition-colors">
                    AM
                </div>
            </div>
        </header>

        <main className="flex-1 mt-16 flex overflow-hidden">
            <nav className="hidden md:flex flex-col w-64 bg-surface border-r border-surface-variant h-full p-container-padding shrink-0 overflow-y-auto">
                <div className="space-y-2">
                    <a className="flex items-center gap-4 p-3 rounded-lg bg-secondary-container text-on-secondary-container transition-colors" href="#">
                        <span className="material-symbols-outlined" data-weight="fill">map</span>
                        <span className="font-label-lg text-label-lg">Live Map</span>
                    </a>
                    <a className="flex items-center gap-4 p-3 rounded-lg text-on-surface-variant hover:bg-surface-container-low transition-colors" href="#">
                        <span className="material-symbols-outlined">analytics</span>
                        <span className="font-label-lg text-label-lg">Metrics</span>
                    </a>
                    <a className="flex items-center gap-4 p-3 rounded-lg text-on-surface-variant hover:bg-surface-container-low transition-colors" href="#">
                        <span className="material-symbols-outlined">campaign</span>
                        <span className="font-label-lg text-label-lg">Broadcasts</span>
                    </a>
                    <a className="flex items-center gap-4 p-3 rounded-lg text-on-surface-variant hover:bg-surface-container-low transition-colors" href="#">
                        <span className="material-symbols-outlined">settings</span>
                        <span className="font-label-lg text-label-lg">Settings</span>
                    </a>
                </div>
            </nav>

            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
                <div className="flex-1 relative h-full bg-surface-variant">
                    <Map
                        initialViewState={{ longitude: -74.0045, latitude: 40.7133, zoom: 16 }}
                        mapStyle="mapbox://styles/mapbox/light-v11"
                        mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
                        style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
                    >
                        <Source id="zones" type="geojson" data={geoData}>
                            <Layer 
                                id="zone-fills" type="fill"
                                paint={{ 'fill-color': ['get', 'color'], 'fill-opacity': 0.7 }}
                            />
                            <Layer 
                                id="zone-borders" type="line"
                                paint={{ 'line-color': '#ffffff', 'line-width': 2 }}
                            />
                        </Source>
                    </Map>
                </div>

                <div className="w-full lg:w-[400px] h-full bg-surface border-l border-surface-variant flex flex-col shrink-0 overflow-y-auto shadow-xl z-20">
                    <div className="p-container-padding flex-1 space-y-gutter">
                        <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm">
                            <h2 className="font-title-lg text-title-lg text-on-surface mb-4">Site Status</h2>
                            <div className="flex justify-between items-center">
                                <div>
                                    <div className="font-display-lg text-display-lg text-primary">14.2k</div>
                                    <div className="font-body-md text-body-md text-on-surface-variant">Total Occupancy</div>
                                </div>
                                <div className="relative w-24 h-24">
                                    <svg className="w-full h-full gauge-meter" viewBox="0 0 100 100">
                                        <circle className="text-surface-container-high" cx="50" cy="50" fill="none" r="40" stroke="currentColor" strokeWidth="8"></circle>
                                        <circle className="text-primary" cx="50" cy="50" fill="none" r="40" stroke="currentColor" strokeDasharray="251.2" strokeDashoffset="62.8" strokeWidth="8"></circle>
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                                        <span className="font-label-lg text-label-lg font-bold text-on-surface">75%</span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="bg-error-container/30 border border-error/20 rounded-xl p-4 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-2 opacity-10">
                                <span className="material-symbols-outlined text-[64px]" data-weight="fill">campaign</span>
                            </div>
                            <h2 className="font-title-lg text-title-lg text-error mb-2 flex items-center gap-2 relative z-10">
                                <span className="material-symbols-outlined">campaign</span>
                                Broadcast Control
                            </h2>
                            <p className="font-body-sm text-body-md text-on-surface-variant mb-4 relative z-10">Push alerts to mobile users in specific sectors or site-wide.</p>
                            
                            <div className="space-y-3 relative z-10">
                                <textarea 
                                    className="w-full bg-surface-container-lowest border-outline-variant rounded-lg font-body-md text-body-md focus:ring-2 focus:ring-primary p-3" 
                                    placeholder="Enter broadcast message here..." 
                                    rows="3"
                                    value={alertMsg}
                                    onChange={e => setAlertMsg(e.target.value)}
                                ></textarea>
                                {broadcastStatus && <p className="text-sm text-green-600 font-bold">{broadcastStatus}</p>}
                                <div className="flex gap-2 mt-2">
                                    <button 
                                        onClick={sendAlert}
                                        className="w-full bg-error text-on-error hover:bg-error/90 font-label-lg text-label-lg h-12 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md">
                                        <span className="material-symbols-outlined">send</span> Send Alert
                                    </button>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h3 className="font-label-lg text-label-lg text-on-surface-variant uppercase tracking-wider mb-3">Sector Breakdown</h3>
                            <div className="space-y-2">
                                <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-3 flex items-center justify-between hover:bg-surface-container-low transition-colors cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-error"></div>
                                        <span className="font-label-lg text-label-lg">Sector 7G</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-24 bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                                            <div className="bg-error h-full" style={{width: '92%'}}></div>
                                        </div>
                                        <span className="font-body-md text-body-md font-medium w-8 text-right">92%</span>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </main>
    </div>
  )
}

export default App
