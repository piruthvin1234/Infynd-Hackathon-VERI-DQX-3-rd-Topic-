import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { ArrowLeft, Search, ChevronDown, ChevronRight, Briefcase, TrendingUp, Loader } from 'lucide-react';

const JobAnalysis = () => {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [jobAnalysis, setJobAnalysis] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedFields, setExpandedFields] = useState(new Set());
    const [totalTitles, setTotalTitles] = useState(0);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Get job titles from URL params (passed from DataQualityCopilot)
        const titlesParam = searchParams.get('titles');
        if (titlesParam) {
            try {
                const titles = JSON.parse(decodeURIComponent(titlesParam));
                analyzeJobTitles(titles);
            } catch (err) {
                setError('Failed to parse job titles');
            }
        }
    }, [searchParams]);

    const analyzeJobTitles = async (titles) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('http://localhost:8000/api/job-analysis/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    job_titles: titles,
                    project_id: searchParams.get('project_id') || 'default'
                })
            });

            if (!response.ok) {
                throw new Error('Failed to analyze job titles');
            }

            const data = await response.json();
            setJobAnalysis(data.job_analysis || []);
            setTotalTitles(data.total_titles || 0);

            // Auto-expand first field
            if (data.job_analysis && data.job_analysis.length > 0) {
                setExpandedFields(new Set([data.job_analysis[0].job_function]));
            }
        } catch (err) {
            setError(err.message);
            console.error('Job analysis error:', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleField = (fieldName) => {
        const newExpanded = new Set(expandedFields);
        if (newExpanded.has(fieldName)) {
            newExpanded.delete(fieldName);
        } else {
            newExpanded.add(fieldName);
        }
        setExpandedFields(newExpanded);
    };

    const filteredAnalysis = jobAnalysis.filter(field => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            field.job_function.toLowerCase().includes(query) ||
            field.job_titles.some(title => title.toLowerCase().includes(query))
        );
    });

    const totalFields = filteredAnalysis.length;

    return (
        <div className={`min-h-screen ${theme.background} ${theme.text} transition-colors duration-300`}>
            {/* Header */}
            <div className={`${theme.surface} border-b ${theme.border} sticky top-0 z-10`}>
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate(-1)}
                                className={`p-2 rounded-lg ${theme.hover} transition-colors`}
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div className="flex items-center gap-3">
                                <div className={`p-3 rounded-xl ${theme.primary} bg-opacity-10`}>
                                    <Briefcase className={`w-6 h-6 ${theme.primary}`} />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold">Job Title Analysis</h1>
                                    <p className={`text-sm ${theme.textSecondary}`}>
                                        AI-Powered categorization using Groq LLM
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className={`px-4 py-2 rounded-xl ${theme.surface} border ${theme.border}`}>
                            <div className="flex items-center gap-2">
                                <TrendingUp className={`w-5 h-5 ${theme.primary}`} />
                                <span className="text-sm font-medium">Total Functions: {totalFields}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Search Bar */}
                <div className="mb-6">
                    <div className="relative">
                        <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme.textSecondary}`} />
                        <input
                            type="text"
                            placeholder="Search job titles or functions..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full pl-12 pr-4 py-3 rounded-xl ${theme.surface} border ${theme.border} ${theme.text} focus:outline-none focus:ring-2 ${theme.ring}`}
                        />
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader className={`w-12 h-12 ${theme.primary} animate-spin mb-4`} />
                        <p className={`text-lg ${theme.textSecondary}`}>Analyzing job titles with AI...</p>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className={`p-6 rounded-xl ${theme.surface} border ${theme.border} text-center`}>
                        <p className="text-red-500">{error}</p>
                    </div>
                )}

                {/* Job Analysis Results */}
                {!loading && !error && filteredAnalysis.length > 0 && (
                    <div className="space-y-3">
                        {filteredAnalysis.map((field, index) => {
                            const isExpanded = expandedFields.has(field.job_function);

                            return (
                                <div
                                    key={index}
                                    className={`${theme.surface} border ${theme.border} rounded-xl overflow-hidden transition-all duration-200 hover:shadow-lg`}
                                >
                                    {/* Field Header */}
                                    <button
                                        onClick={() => toggleField(field.job_function)}
                                        className={`w-full px-6 py-4 flex items-center justify-between ${theme.hover} transition-colors`}
                                    >
                                        <div className="flex items-center gap-4">
                                            {isExpanded ? (
                                                <ChevronDown className={`w-5 h-5 ${theme.primary}`} />
                                            ) : (
                                                <ChevronRight className={`w-5 h-5 ${theme.textSecondary}`} />
                                            )}
                                            <div className={`p-2 rounded-lg ${theme.primary} bg-opacity-10`}>
                                                <Briefcase className={`w-5 h-5 ${theme.primary}`} />
                                            </div>
                                            <div className="text-left">
                                                <h3 className="text-lg font-semibold">{field.job_function}</h3>
                                                <p className={`text-sm ${theme.textSecondary}`}>
                                                    {field.job_titles.length} unique {field.job_titles.length === 1 ? 'title' : 'titles'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className={`px-4 py-2 rounded-lg ${theme.primary} bg-opacity-10`}>
                                            <span className={`text-sm font-semibold ${theme.primary}`}>
                                                {field.job_titles.length}
                                            </span>
                                        </div>
                                    </button>

                                    {/* Job Titles List */}
                                    {isExpanded && (
                                        <div className={`px-6 pb-4 border-t ${theme.border}`}>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-4">
                                                {field.job_titles.map((title, titleIndex) => (
                                                    <div
                                                        key={titleIndex}
                                                        className={`px-4 py-3 rounded-lg ${theme.background} border ${theme.border} flex items-center gap-2`}
                                                    >
                                                        <div className={`w-2 h-2 rounded-full ${theme.primary} bg-opacity-60`} />
                                                        <span className="text-sm">{title}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Empty State */}
                {!loading && !error && filteredAnalysis.length === 0 && jobAnalysis.length > 0 && (
                    <div className={`p-12 rounded-xl ${theme.surface} border ${theme.border} text-center`}>
                        <Search className={`w-16 h-16 ${theme.textSecondary} mx-auto mb-4 opacity-50`} />
                        <p className={`text-lg ${theme.textSecondary}`}>No results found for "{searchQuery}"</p>
                    </div>
                )}

                {/* No Data State */}
                {!loading && !error && jobAnalysis.length === 0 && (
                    <div className={`p-12 rounded-xl ${theme.surface} border ${theme.border} text-center`}>
                        <Briefcase className={`w-16 h-16 ${theme.textSecondary} mx-auto mb-4 opacity-50`} />
                        <p className={`text-lg ${theme.textSecondary} mb-2`}>No job data available</p>
                        <p className={`text-sm ${theme.textSecondary}`}>
                            Upload a CSV file with job titles to see analysis
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default JobAnalysis;
