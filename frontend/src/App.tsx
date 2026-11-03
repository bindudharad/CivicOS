import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/layout/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import LiveMap from './pages/LiveMap'
import CommandPalette from './components/CommandPalette'

// Intelligence Features
import RelationshipGraph from './pages/features/RelationshipGraph'
import GeospatialIntelligence from './pages/features/GeospatialIntelligence'
import PredictiveML from './pages/features/PredictiveML'
import CascadingImpact from './pages/features/CascadingImpact'
import ImpactSeverity from './pages/features/ImpactSeverity'
import SmartPriority from './pages/features/SmartPriority'
import WhatIfSimulation from './pages/features/WhatIfSimulation'
import PreventiveRecommendations from './pages/features/PreventiveRecommendations'
import PreventionImpact from './pages/features/PreventionImpact'
import WeatherRisk from './pages/features/WeatherRisk'

// Operations
import IncidentIntake from './pages/operations/IncidentIntake'
import WorkOrders from './pages/operations/WorkOrders'

function ProtectedRoute({ children }: { children: React.ReactElement }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen bg-bg-midnight flex items-center justify-center">
        <div className="relative">
          <div className="w-10 h-10 border-2 border-accent-cyan/20 border-t-accent-cyan rounded-full animate-spin" />
          <div
            className="absolute inset-0 w-10 h-10 border-2 border-accent-blue/30 border-b-accent-blue rounded-full animate-spin"
            style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}
          />
        </div>
      </div>
    )
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <CommandPalette />
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="map" element={<LiveMap />} />

            {/* Feature 1 */}
            <Route path="features/relationship-graph" element={<RelationshipGraph />} />
            <Route path="features/graph" element={<RelationshipGraph />} />

            {/* Feature 2 */}
            <Route path="features/geospatial" element={<GeospatialIntelligence />} />

            {/* Feature 3 */}
            <Route path="features/predictive-ml" element={<PredictiveML />} />
            <Route path="features/predictive" element={<PredictiveML />} />

            {/* Feature 4 */}
            <Route path="features/cascading-impact" element={<CascadingImpact />} />
            <Route path="features/cascade" element={<CascadingImpact />} />

            {/* Feature 5 */}
            <Route path="features/impact-severity" element={<ImpactSeverity />} />
            <Route path="features/impact" element={<ImpactSeverity />} />

            {/* Feature 6 */}
            <Route path="features/smart-priority" element={<SmartPriority />} />
            <Route path="features/priority" element={<SmartPriority />} />

            {/* Feature 7 */}
            <Route path="features/what-if" element={<WhatIfSimulation />} />
            <Route path="features/whatif" element={<WhatIfSimulation />} />

            {/* Feature 8 */}
            <Route path="features/recommendations" element={<PreventiveRecommendations />} />

            {/* Feature 9 */}
            <Route path="features/prevention-impact" element={<PreventionImpact />} />
            <Route path="features/prevention" element={<PreventionImpact />} />

            {/* Feature 10 */}
            <Route path="features/weather-risk" element={<WeatherRisk />} />
            <Route path="features/weather" element={<WeatherRisk />} />

            {/* Operations */}
            <Route path="operations/incidents" element={<IncidentIntake />} />
            <Route path="operations/intake" element={<IncidentIntake />} />
            <Route path="operations/work-orders" element={<WorkOrders />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
