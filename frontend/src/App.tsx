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
      <div className="min-h-screen bg-bg-main flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent-cyan border-t-transparent rounded-full animate-spin" />
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

            {/* All 10 Intelligence Features */}
            <Route path="features/graph" element={<RelationshipGraph />} />
            <Route path="features/geospatial" element={<GeospatialIntelligence />} />
            <Route path="features/predictive" element={<PredictiveML />} />
            <Route path="features/cascade" element={<CascadingImpact />} />
            <Route path="features/impact" element={<ImpactSeverity />} />
            <Route path="features/priority" element={<SmartPriority />} />
            <Route path="features/whatif" element={<WhatIfSimulation />} />
            <Route path="features/recommendations" element={<PreventiveRecommendations />} />
            <Route path="features/prevention" element={<PreventionImpact />} />
            <Route path="features/weather" element={<WeatherRisk />} />

            {/* Operations */}
            <Route path="operations/intake" element={<IncidentIntake />} />
            <Route path="operations/work-orders" element={<WorkOrders />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
