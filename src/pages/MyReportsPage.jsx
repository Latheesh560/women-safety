import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import {
  FileText,
  MapPin,
  Calendar,
  AlertTriangle,
  Plus,
  Loader2,
  Filter,
  RefreshCw
} from 'lucide-react';

const MyReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('All');
  const [filterSeverity, setFilterSeverity] = useState('All');
  const navigate = useNavigate();

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await api.get('/incidents/my-reports');
      setReports(data || []);
      setFilteredReports(data || []);
    } catch (err) {
      console.error('Failed to load user reports.', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    let result = [...reports];
    if (filterType !== 'All') {
      result = result.filter(r => r.type === filterType);
    }
    if (filterSeverity !== 'All') {
      result = result.filter(r => r.severity === filterSeverity);
    }
    setFilteredReports(result);
  }, [filterType, filterSeverity, reports]);

  const getSeverityBadgeClass = (severity) => {
    switch (severity) {
      case 'Low': return 'text-emerald-700 bg-emerald-500/10 border-emerald-500/25';
      case 'Medium': return 'text-amber-700 bg-amber-500/10 border-amber-500/25';
      case 'High': return 'text-pink-700 bg-pink-500/10 border-pink-500/25';
      case 'Critical': return 'text-rose-700 bg-rose-500/10 border-rose-500/25';
      default: return 'text-slate-500 bg-slate-50 border-slate-200';
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Resolved': return 'text-emerald-700 border border-emerald-500/25 bg-emerald-500/5';
      case 'Investigating': return 'text-primary-dark border border-primary/25 bg-primary/5';
      default: return 'text-slate-500 border border-slate-200 bg-slate-50';
    }
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return '';
    const date = new Date(isoStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-primary-dark" /> My Reports
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Monitor and review the status of safety concerns logged by you.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchReports}
            className="p-2.5 bg-white/70 hover:bg-white/95 border border-pink-100/50 hover:border-pink-200/60 rounded-xl text-slate-500 hover:text-slate-800 shadow-sm transition-all"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => navigate('/incident-report')}
            className="py-2.5 px-4 bg-gradient-to-r from-primary-dark to-primary hover:from-primary hover:to-accent text-white font-bold text-xs rounded-xl shadow-[0_4px_14px_rgba(255,141,161,0.25)] flex items-center gap-1.5 transition-all duration-200 active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" /> Log New Incident
          </button>
        </div>
      </header>

      <div className="bg-white/70 backdrop-blur-md border border-white/60 shadow-[0_8px_32px_rgba(255,182,193,0.08)] rounded-[20px] p-4 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-2">
          <Filter className="w-3.5 h-3.5 text-primary-dark" /> Filters:
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600 font-semibold">Type</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-white border border-slate-200/80 rounded-xl text-xs px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-slate-700 font-medium cursor-pointer shadow-sm hover:border-slate-300 transition-colors"
          >
            <option value="All">All Types</option>
            <option value="Harassment">Harassment</option>
            <option value="Assault">Assault</option>
            <option value="Theft">Theft</option>
            <option value="Suspicious">Suspicious</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600 font-semibold">Severity</span>
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="bg-white border border-slate-200/80 rounded-xl text-xs px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-slate-700 font-medium cursor-pointer shadow-sm hover:border-slate-300 transition-colors"
          >
            <option value="All">All Severities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>
        {(filterType !== 'All' || filterSeverity !== 'All') && (
          <button
            onClick={() => { setFilterType('All'); setFilterSeverity('All'); }}
            className="text-xs font-bold text-primary-dark hover:text-primary ml-auto"
          >
            Clear Filters
          </button>
        )}
      </div>

      <section>
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white/70 backdrop-blur-md border border-white/60 p-6 animate-pulse flex flex-col gap-3 rounded-[20px]">
                <div className="flex justify-between items-start">
                  <div className="h-5 bg-slate-200 rounded w-1/3"></div>
                  <div className="h-5 bg-slate-200 rounded w-16"></div>
                </div>
                <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                <div className="h-12 bg-slate-200 rounded w-full mt-2"></div>
              </div>
            ))}
          </div>
        ) : filteredReports.length > 0 ? (
          <div className="space-y-4 animate-in fade-in duration-300">
            {filteredReports.map((report) => (
              <div
                key={report.id}
                className="bg-white/70 backdrop-blur-md border border-white/60 hover:border-pink-200/50 shadow-[0_8px_32px_rgba(255,182,193,0.06)] hover:shadow-[0_12px_36px_rgba(255,182,193,0.14)] p-5 transition-all duration-300 flex flex-col md:flex-row justify-between md:items-start gap-4 relative overflow-hidden rounded-[20px]"
              >
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-base font-bold text-slate-800 hover:text-primary-dark transition-colors">
                      {report.title}
                    </h3>
                    <span className={`px-2 py-0.5 border text-[10px] font-extrabold uppercase rounded-md tracking-wider shrink-0 ${getSeverityBadgeClass(report.severity)}`}>
                      {report.severity}
                    </span>
                    <span className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded-md text-[10px] text-slate-500 font-bold uppercase">
                      {report.type}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 font-semibold">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-primary-dark shrink-0" /> {report.location}
                    </span>
                    <span className="flex items-center gap-1 border-l border-pink-100/40 pl-4">
                      <Calendar className="w-3.5 h-3.5 text-primary-dark shrink-0" /> {formatDate(report.created_at)}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed max-w-4xl pt-1">
                    {report.description}
                  </p>
                </div>

                <div className="flex flex-row md:flex-col justify-between items-center md:items-end shrink-0 gap-3 border-t md:border-t-0 border-pink-50/20 pt-3 md:pt-0">
                  <div className={`px-3 py-1 text-xs font-bold rounded-lg ${getStatusBadgeClass(report.status)}`}>
                    {report.status}
                  </div>
                  <div className="text-[10px] text-slate-500 md:text-right text-left">
                    REF: <span className="font-mono text-slate-800 font-bold bg-slate-50 border border-slate-200/60 px-1.5 py-0.5 rounded select-all">{report.id}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white/50 backdrop-blur-md border border-dashed border-pink-200/60 shadow-sm p-12 flex flex-col items-center justify-center text-center py-20 rounded-[20px] hover:border-primary/40 transition-all duration-300">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FFF5F6] to-[#EEF2FF] border border-pink-100/60 flex items-center justify-center mb-5 shadow-sm">
              <FileText className="w-7 h-7 text-primary-dark" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">No Incident Logs Recorded</h3>
            <p className="text-slate-600 text-xs sm:text-sm max-w-sm mt-2 leading-relaxed mb-5">
              You haven't reported any safety hazards or incidents yet. Log reports to help keep other women safe!
            </p>
            <button
              onClick={() => navigate('/incident-report')}
              className="py-2.5 px-4 bg-gradient-to-r from-primary-dark to-primary hover:from-primary hover:to-accent text-white font-bold text-xs rounded-xl shadow-[0_4px_14px_rgba(255,141,161,0.25)] flex items-center gap-1.5 transition-all duration-200 active:scale-[0.98]"
            >
              <Plus className="w-3.5 h-3.5" /> Record First Incident
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

export default MyReportsPage;
