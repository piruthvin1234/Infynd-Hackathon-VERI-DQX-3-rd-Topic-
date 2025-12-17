import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Splash from "./pages/Splash";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import ReviewUI from "./pages/ReviewUI";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import DataView from "./pages/DataView";
import DataQualityCopilot from "./pages/DataQualityCopilot";
import RunDetail from "./pages/RunDetail";
import DifferentialAnalysis from "./pages/DifferentialAnalysis";
import DifferentialAnalysisDashboard from "./pages/DifferentialAnalysisDashboard";
import ProjectSettings from "./pages/ProjectSettings";
import JobNormalizationSummary from "./pages/JobNormalizationSummary";
import Layout from "./Layout";

import { FilterProvider } from "./context/FilterContext";

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            setIsAuthenticated(true);
        }
        setLoading(false);
    }, []);

    if (loading) {
        return null;
    }

    return (
        <FilterProvider>
            <Routes>
                {/* Splash/Landing Page */}
                <Route path="/" element={<Splash />} />

                {/* Auth Routes */}
                <Route
                    path="/login"
                    element={
                        isAuthenticated ? (
                            <Navigate to="/dashboard" replace />
                        ) : (
                            <Login setIsAuthenticated={setIsAuthenticated} />
                        )
                    }
                />
                <Route
                    path="/signup"
                    element={
                        isAuthenticated ? (
                            <Navigate to="/dashboard" replace />
                        ) : (
                            <Signup setIsAuthenticated={setIsAuthenticated} />
                        )
                    }
                />

                {/* Protected Routes using Layout */}
                <Route element={isAuthenticated ? <Layout /> : <Navigate to="/login" replace />}>
                    <Route path="/dashboard" element={<Dashboard setIsAuthenticated={setIsAuthenticated} />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/review" element={<ReviewUI />} />

                    {/* Project Routes */}
                    <Route path="/projects" element={<Projects />} />
                    <Route path="/projects/:projectId" element={<ProjectDetail />} />
                    <Route path="/projects/:projectId/runs/:runId" element={<RunDetail />} />
                    <Route path="/projects/:projectId/settings" element={<ProjectSettings />} />
                    <Route path="/projects/:projectId/runs/:runId/diff" element={<DifferentialAnalysis />} />
                    <Route path="/differential-analysis" element={<DifferentialAnalysisDashboard />} />
                    <Route path="/projects/:projectId/runs/:runId/job-summary" element={<JobNormalizationSummary />} />
                    <Route path="/data-view/:fileId" element={<DataView />} />
                    <Route path="/copilot" element={<DataQualityCopilot />} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </FilterProvider>
    );
}

export default App;


