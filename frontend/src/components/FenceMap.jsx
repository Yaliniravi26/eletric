import { useEffect, useState } from 'react'
import { CircleMarker, MapContainer, Polygon, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet'

// Recenter map dynamically when coordinates change
function ChangeMapView({ coords }) {
  const map = useMap()
  useEffect(() => {
    if (coords) {
      map.setView(coords, 15)
    }
  }, [coords, map])
  return null
}

export default function FenceMap({ locations, boundary }) {
  const [mapType, setMapType] = useState('hybrid') // 'satellite' | 'roadmap' | 'hybrid'
  const [userCoords, setUserCoords] = useState(null)
  const [geoStatus, setGeoStatus] = useState('Detecting GPS...')

  // Automatically detect Live Device GPS on mount
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude, accuracy } = pos.coords
          setUserCoords([latitude, longitude])
          setGeoStatus(`📍 Live GPS Locked (±${Math.round(accuracy)}m)`)
        },
        (err) => {
          console.warn('Geolocation error or denied:', err)
          setGeoStatus('⚠️ GPS Denied (Using Default)')
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
      )
    } else {
      setGeoStatus('⚠️ GPS not supported')
    }
  }, [])

  // If live user GPS is available, dynamically construct fence perimeter and sensor nodes around user's exact location
  const center = userCoords || (locations?.length ? [locations[0].latitude, locations[0].longitude] : [8.321, 77.104])

  const dynamicFencePoints = userCoords
    ? [
        [userCoords[0] + 0.0035, userCoords[1] - 0.0040],
        [userCoords[0] + 0.0050, userCoords[1] + 0.0015],
        [userCoords[0] + 0.0028, userCoords[1] + 0.0055],
        [userCoords[0] - 0.0025, userCoords[1] + 0.0045],
        [userCoords[0] - 0.0040, userCoords[1] - 0.0020],
        [userCoords[0] - 0.0015, userCoords[1] - 0.0050],
      ]
    : boundary?.length ? boundary : [
        [8.325, 77.094], [8.331, 77.101], [8.328, 77.112], [8.320, 77.117],
        [8.313, 77.108], [8.315, 77.098],
      ]

  const activeSensors = userCoords
    ? [
        { id: 'gps-u1', name: 'Field Command Point (Your GPS)', description: 'Active Station', status: 'normal', status_label: 'Normal', latitude: userCoords[0], longitude: userCoords[1], isUser: true },
        { id: 'gps-s1', name: 'Fence Sector A - North Perimeter', description: 'Continuous Energized Wire', status: 'normal', status_label: 'Secure', latitude: userCoords[0] + 0.0035, longitude: userCoords[1] - 0.0040 },
        { id: 'gps-s2', name: 'Fence Sector B - East Outpost', description: 'Step-up Transformer Node', status: 'warning', status_label: 'Voltage Check', latitude: userCoords[0] + 0.0028, longitude: userCoords[1] + 0.0055 },
        { id: 'gps-s3', name: 'Fence Sector C - South Wildlife Path', description: 'Elephant Intrusion Sensor', status: 'alert', status_label: 'Intrusion Alert', latitude: userCoords[0] - 0.0040, longitude: userCoords[1] - 0.0020 },
      ]
    : locations || []

  // Google Map High-Resolution Tile URLs:
  const googleTileUrls = {
    hybrid: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    satellite: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
    roadmap: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
  }

  return (
    <div className="leaflet-wrap" style={{ position: 'relative', height: '440px', width: '100%', borderRadius: '12px', overflow: 'hidden' }}>
      <MapContainer
        center={center}
        zoom={15}
        maxZoom={20}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <ChangeMapView coords={userCoords} />

        <TileLayer
          key={mapType}
          attribution="&copy; Google Maps Satellite Imagery"
          url={googleTileUrls[mapType]}
          maxZoom={20}
          subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
        />

        {/* Precise High-Visibility Electric Fence Line */}
        <Polygon
          positions={dynamicFencePoints}
          pathOptions={{
            color: '#10b981',
            weight: 2,
            fillColor: '#10b981',
            fillOpacity: 0.15,
            dashArray: '6 6',
          }}
        />
        <Polyline
          positions={dynamicFencePoints}
          pathOptions={{
            color: '#34d399',
            weight: 3.5,
            opacity: 0.95,
          }}
        />

        {/* Precise Fence Monitoring Points / Sensors - Clean Dot Markers */}
        {activeSensors.map((loc) => {
          const isUser = loc.isUser
          const isAlert = loc.status === 'alert' || loc.status === 'danger'
          const isWarning = loc.status === 'warning'
          const markerColor = isUser ? '#38bdf8' : isAlert ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981'

          return (
            <CircleMarker
              key={loc.id}
              center={[loc.latitude, loc.longitude]}
              radius={isUser ? 8 : isAlert ? 7 : 6}
              pathOptions={{
                color: '#ffffff',
                fillColor: markerColor,
                fillOpacity: 1,
                weight: 2,
              }}
            />
          )
        })}
      </MapContainer>
    </div>
  )
}
