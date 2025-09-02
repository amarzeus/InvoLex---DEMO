

import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { BillableEntry, BillableEntryStatus, AnalyticsData, AnalyticsInsight } from '../types';
import { aiService } from '../services/aiService';
import Spinner from './ui/Spinner';
import { LightBulbIcon } from './icons/Icons';

interface AnalyticsViewProps {
  billableEntries: BillableEntry[];
}

const COLORS = {
  [BillableEntryStatus.Synced]: '#22c55e', // green-500
  [BillableEntryStatus.Pending]: '#facc15', // yellow-400
  [BillableEntryStatus.Error]: '#f87171', // red-400
};

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ billableEntries }) => {
  const [filter, setFilter] = useState('30d');
  const [insights, setInsights] = useState<AnalyticsInsight | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  
  const filteredEntries = useMemo(() => {
    const now = new Date();
    if (filter === 'all') {
      return billableEntries;
    }
    const days = parseInt(filter.replace('d', ''), 10);
    const cutoffDate = new Date(new Date().setDate(now.getDate() - days));
    return billableEntries.filter(entry => new Date(entry.date) >= cutoffDate);
  }, [billableEntries, filter]);

  const data: AnalyticsData = useMemo(() => {
    const hoursByMatter: { [key: string]: number } = {};
    const entriesByStatus: { [key: string]: number } = {
      [BillableEntryStatus.Pending]: 0,
      [BillableEntryStatus.Synced]: 0,
      [BillableEntryStatus.Error]: 0,
    };
    const revenueByMonth: { [key: string]: number } = {};
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];


    filteredEntries.forEach(entry => {
      if (entry.status === BillableEntryStatus.Synced) {
        hoursByMatter[entry.matter] = (hoursByMatter[entry.matter] || 0) + entry.hours;
        
        const date = new Date(entry.date);
        const monthKey = `${date.getFullYear()}-${monthNames[date.getMonth()]}`;
        revenueByMonth[monthKey] = (revenueByMonth[monthKey] || 0) + entry.hours * entry.rate;
      }
      if(entry.status !== BillableEntryStatus.Generating) {
        if(entriesByStatus[entry.status] !== undefined) { // Check to make sure status is a key
            entriesByStatus[entry.status]++;
        }
      }
    });

    return {
      hoursByMatter: Object.entries(hoursByMatter).map(([name, hours]) => ({ name, hours })).sort((a,b) => b.hours - a.hours),
      revenueByMonth: Object.entries(revenueByMonth).map(([name, revenue]) => ({ name: name.split('-')[1], revenue })).slice(-6), // Show last 6 months of data
      entriesByStatus: Object.entries(entriesByStatus).map(([name, value]) => ({ name, value }))
    };
  }, [filteredEntries]);

  useEffect(() => {
    const fetchInsights = async () => {
      if (data.hoursByMatter.length === 0 && data.revenueByMonth.length === 0) {
        setInsights({ insights: ["Not enough data to generate insights for this period."] });
        return;
      }
      setLoadingInsights(true);
      try {
        const result = await aiService.generateAnalyticsInsights(data);
        setInsights(result);
      } catch (error) {
        console.error("Failed to fetch analytics insights", error);
        setInsights({ insights: ["Could not load insights due to an error."] });
      } finally {
        setLoadingInsights(false);
      }
    };

    fetchInsights();
  }, [data]);

  const pieChartData = data.entriesByStatus.filter(e => e.value > 0);
  const hasData = filteredEntries.length > 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-brand-text">Analytics</h1>
          <p className="text-brand-text-secondary mt-1">Visualize your firm's productivity and revenue.</p>
        </div>
        <div className="w-full sm:w-auto">
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full sm:w-48 bg-brand-primary border border-slate-600 rounded-md px-3 py-2 text-brand-text focus:ring-brand-accent focus:border-brand-accent"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* AI Productivity Insights */}
      <div className="bg-brand-primary p-6 rounded-lg shadow-lg">
        <h2 className="text-lg font-semibold text-brand-text mb-4 flex items-center">
            <LightBulbIcon className="h-6 w-6 text-yellow-400 mr-3" />
            AI Productivity Insights
        </h2>
        {loadingInsights ? (
            <div className="flex justify-center items-center h-24">
                <Spinner />
            </div>
        ) : (
            <ul className="space-y-2 text-brand-text-secondary list-disc list-inside">
              {insights?.insights.map((insight, index) => (
                  <li key={index}>{insight}</li>
              ))}
            </ul>
        )}
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-brand-primary p-6 rounded-lg shadow-lg">
          <h2 className="text-lg font-semibold text-brand-text mb-4">Billable Hours by Matter</h2>
          {hasData && data.hoursByMatter.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.hoursByMatter} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} cursor={{fill: '#33415580'}} />
                <Legend wrapperStyle={{fontSize: "14px"}}/>
                <Bar dataKey="hours" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
             <div className="flex items-center justify-center h-[300px] text-brand-text-secondary">No synced billable hours for this period.</div>
          )}
        </div>

        <div className="bg-brand-primary p-6 rounded-lg shadow-lg">
          <h2 className="text-lg font-semibold text-brand-text mb-4">Entry Status Distribution</h2>
          {hasData && pieChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={110}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || '#8884d8'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                <Legend wrapperStyle={{fontSize: "14px"}} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-brand-text-secondary">No entries for this period.</div>
          )}
        </div>
      </div>
       <div className="bg-brand-primary p-6 rounded-lg shadow-lg">
          <h2 className="text-lg font-semibold text-brand-text mb-4">Monthly Revenue Overview</h2>
           {hasData && data.revenueByMonth.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
             <BarChart data={data.revenueByMonth} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                 <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                 <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                 <YAxis stroke="#94a3b8" fontSize={12} unit="$" tickFormatter={(value) => new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short' }).format(value)} />
                 <Tooltip formatter={(value: number) => value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} cursor={{fill: '#33415580'}}/>
                 <Legend wrapperStyle={{fontSize: "14px"}}/>
                 <Bar dataKey="revenue" fill="#8b5cf6" />
               </BarChart>
             </ResponsiveContainer>
           ) : (
             <div className="flex items-center justify-center h-[300px] text-brand-text-secondary">No revenue data for this period.</div>
           )}
        </div>
    </div>
  );
};

export default AnalyticsView;