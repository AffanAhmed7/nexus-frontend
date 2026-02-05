import React, { useEffect, useState } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, Cell, PieChart, Pie
} from 'recharts';
import { TrendingUp, CheckCircle2, AlertTriangle, ListTodo, Calendar } from 'lucide-react';
import api from '../../utils/api.js';
import '../../styles/ProjectAnalytics.css';

const COLORS = ['#6366f1', '#f59e0b', '#8b5cf6', '#10b981'];
const PRIORITY_COLORS = {
    LOW: '#6366f1',
    MEDIUM: '#f59e0b',
    HIGH: '#ef4444'
};

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="custom-tooltip">
                <p className="tooltip-label">{label}</p>
                <p className="tooltip-value">
                    <span>{payload[0].name}</span>
                    <strong>{payload[0].value}</strong>
                </p>
            </div>
        );
    }
    return null;
};

const ProjectAnalytics = ({ projectId }: { projectId: string }) => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get(`/projects/${projectId}/stats`);
                setStats(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [projectId]);

    if (loading || !stats) return <div className="analytics-loading">Loading insights...</div>;

    const statusData = [
        { name: 'To Do', value: stats.statusCounts.TODO },
        { name: 'In Progress', value: stats.statusCounts.IN_PROGRESS },
        { name: 'Review', value: stats.statusCounts.IN_REVIEW },
        { name: 'Done', value: stats.statusCounts.DONE },
    ];

    const priorityData = [
        { name: 'Low', value: stats.priorityCounts.LOW, fill: PRIORITY_COLORS.LOW },
        { name: 'Medium', value: stats.priorityCounts.MEDIUM, fill: PRIORITY_COLORS.MEDIUM },
        { name: 'High', value: stats.priorityCounts.HIGH, fill: PRIORITY_COLORS.HIGH },
    ];

    return (
        <div className="analytics-container">
            {/* SVG Gradients for Charts */}
            <svg style={{ height: 0, width: 0, position: 'absolute' }}>
                <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.8} />
                    </linearGradient>
                    <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="transparent" stopOpacity={0} />
                    </linearGradient>
                </defs>
            </svg>

            <div className="analytics-metrics">
                <MetricCard icon={<ListTodo size={20} />} label="Total Tasks" value={stats.total} />
                <MetricCard icon={<CheckCircle2 size={20} color="#10b981" />} label="Completed" value={stats.statusCounts.DONE} />
                <MetricCard icon={<TrendingUp size={20} color="var(--primary)" />} label="Completion Rate" value={`${Math.round(stats.completionRate)}%`} />
                <MetricCard icon={<AlertTriangle size={20} color="#ef4444" />} label="High Priority" value={stats.priorityCounts.HIGH} />
            </div>

            <div className="analytics-charts">
                {/* Status Breakdown */}
                <div className="glass analytics-chart-card">
                    <h3 className="analytics-chart-title">
                        <Calendar size={18} color="var(--primary)" />
                        Task Status Distribution
                    </h3>
                    <div className="analytics-chart-container">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={statusData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} />
                                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }} />
                                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill="url(#barGradient)" />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Completion Trend */}
                <div className="glass analytics-chart-card">
                    <h3 className="analytics-chart-title">Velocity (Tasks Done)</h3>
                    <div className="analytics-chart-container">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={stats.recentTrend.length > 0 ? stats.recentTrend : [{ day: 'N/A', count: 0 }]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="lineAreaGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.15} vertical={false} />
                                <XAxis
                                    dataKey="day"
                                    stroke="var(--text-muted)"
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                    dy={10}
                                />
                                <YAxis
                                    stroke="var(--text-muted)"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    allowDecimals={false}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#6366f1', strokeWidth: 2, strokeDasharray: '5 5' }} />
                                <Line
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#6366f1"
                                    strokeWidth={3}
                                    dot={{ fill: '#6366f1', strokeWidth: 3, r: 5, stroke: '#1e293b' }}
                                    activeDot={{ r: 7, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
                                    fill="url(#lineAreaGradient)"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MetricCard = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) => (
    <div className="glass analytics-metric-card">
        <div className="analytics-metric-icon">
            {icon}
        </div>
        <div>
            <div className="analytics-metric-label">{label}</div>
            <div className="analytics-metric-value">{value}</div>
        </div>
    </div>
);

export default ProjectAnalytics;
