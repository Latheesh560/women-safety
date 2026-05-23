import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import {
  AlertTriangle,
  MapPin,
  Info,
  ShieldCheck,
  ChevronRight,
  Send,
  Loader2,
  FileCheck2
} from 'lucide-react';

const IncidentReportPage = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    type: 'Harassment',
    severity: 'Medium',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [reportedId, setReportedId] = useState('');
  const navigate = useNavigate();

  const incidentTypes = ['Harassment', 'Assault', 'Theft', 'Suspicious', 'Other'];
  const severityLevels = ['Low', 'Medium', 'High', 'Critical'];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { title, description, location } = formData;

    if (!title || !description || !location) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      const data = await api.post('/incidents/report', formData);
      if (data.success) {
        setSuccess(true);
        setReportedId(data.report.id);
        setFormData({
          title: '',
          description: '',
          location: '',
          type: 'Harassment',
          severity: 'Medium',
        });
      }
    } catch (err) {
      setError('An error occurred while logging your report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2.5">
            <AlertTriangle className="w-6 h-6 text-[#FFD480]" /> Report Incident
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Help other community members bypass unsafe zones. Log hazards, incidents, or poor surveillance.
          </p>
        </div>
        <button
          onClick={() => navigate('/my-reports')}
          className="py-2.5 px-4 bg-white/70 hover:bg-white/90 border border-pink-100/50 hover:border-primary-dark/20 hover:shadow-sm text-primary-dark font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all duration-200"
        >
          View My Reports <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </header>

      <div className="grid md:grid-cols-12 gap-6 items-start">
        <section className="md:col-span-8">
          {success ? (
            <div className="bg-white/75 backdrop-blur-md border border-emerald-200/50 shadow-[0_8px_32px_rgba(123,196,168,0.1)] rounded-[20px] p-8 md:p-12 text-center flex flex-col items-center justify-center animate-in zoom-in duration-300">
              <div className="w-14 h-14 rounded-full bg-success/15 border border-success/30 flex items-center justify-center mb-5 text-success-dark">
                <FileCheck2 className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Incident Logged Securely!</h2>
              <p className="text-slate-600 text-sm max-w-sm mx-auto leading-relaxed mb-5">
                Your report has been encrypted and saved. Other users will receive safety indicators based on this entry.
              </p>
              <div className="bg-slate-50/80 border border-slate-200/60 p-3.5 rounded-xl text-xs text-slate-500 mb-6 max-w-xs mx-auto shadow-sm">
                Report ID: <strong className="text-slate-800 font-mono select-all bg-white px-1.5 py-0.5 border border-slate-200/60 rounded">{reportedId}</strong>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center w-full max-w-xs">
                <button 
                  onClick={() => setSuccess(false)} 
                  className="py-2.5 px-4 bg-gradient-to-r from-primary-dark to-primary hover:from-primary hover:to-accent text-white font-bold text-xs rounded-xl shadow-[0_4px_14px_rgba(255,141,161,0.2)] flex justify-center items-center gap-1.5 transition-all duration-200 active:scale-[0.98]"
                >
                  Log Another Report
                </button>
                <button 
                  onClick={() => navigate('/my-reports')} 
                  className="py-2.5 px-4 bg-white/70 hover:bg-white/95 border border-slate-200/60 hover:border-slate-300 hover:shadow-sm text-slate-700 font-bold text-xs rounded-xl flex justify-center items-center gap-1.5 transition-all duration-200 active:scale-[0.98]"
                >
                  Browse My Reports
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white/70 backdrop-blur-md border border-white/60 shadow-[0_8px_32px_rgba(255,182,193,0.08)] rounded-[20px] p-6">
              {error && (
                <div className="mb-5 p-3.5 bg-danger/10 border border-danger/20 text-danger-dark text-sm rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="input-label text-slate-600 font-bold">Incident Title <span className="text-primary-dark">*</span></label>
                  <input
                    type="text"
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g., Broken streetlights near park walkway"
                    className="input-field bg-white/80 border-slate-200/80 focus:border-primary/60 text-slate-800"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="input-label text-slate-600 font-bold">Incident Type</label>
                    <select 
                      name="type" 
                      value={formData.type} 
                      onChange={handleChange} 
                      className="input-field bg-white/80 border-slate-200/80 focus:border-primary/60 text-slate-800"
                    >
                      {incidentTypes.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="input-label text-slate-600 font-bold">Severity Level</label>
                    <select 
                      name="severity" 
                      value={formData.severity} 
                      onChange={handleChange} 
                      className="input-field bg-white/80 border-slate-200/80 focus:border-primary/60 text-slate-800"
                    >
                      {severityLevels.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="input-label flex items-center gap-1.5 text-slate-600 font-bold">
                    <MapPin className="w-3.5 h-3.5 text-primary-dark" /> Incident Location <span className="text-primary-dark">*</span>
                  </label>
                  <input
                    type="text"
                    name="location"
                    required
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g., Block B Lane 3, near Central Library"
                    className="input-field bg-white/80 border-slate-200/80 focus:border-primary/60 text-slate-800"
                  />
                </div>

                <div>
                  <label className="input-label text-slate-600 font-bold">Detailed Description <span className="text-primary-dark">*</span></label>
                  <textarea
                    name="description"
                    required
                    rows="4"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Please describe what happened. What details would help other women walking alone stay safe?"
                    className="input-field bg-white/80 border-slate-200/80 focus:border-primary/60 text-slate-800 resize-none"
                  ></textarea>
                </div>

                <button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full py-3 px-4 bg-gradient-to-r from-primary-dark to-primary hover:from-primary hover:to-accent text-white font-bold rounded-xl shadow-[0_4px_14px_rgba(255,141,161,0.3)] hover:shadow-[0_6px_20px_rgba(255,141,161,0.4)] flex justify-center items-center gap-2 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none mt-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      Encrypting & Filing Report...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Submit Secure Report
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </section>

        <section className="md:col-span-4 space-y-5">
          <div className="bg-white/70 backdrop-blur-md border border-white/60 shadow-[0_8px_32px_rgba(255,182,193,0.08)] rounded-[20px] p-5 bg-gradient-to-br from-primary/5 to-white/30">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mb-4">
              <Info className="w-4 h-4 text-primary-dark" /> Severity Class Guide
            </h3>
            <div className="space-y-3.5 text-xs">
              <div className="p-3.5 bg-emerald-500/5 border border-emerald-500/10 rounded-xl hover:shadow-sm transition-all duration-200">
                <span className="font-extrabold text-emerald-600 text-[10px] tracking-wider uppercase block">Low Severity</span>
                <p className="mt-1 text-slate-600 leading-relaxed text-[11px]">Infrastructural hazards like dark alleyways, malfunctioning CCTV, or poor fencing.</p>
              </div>
              <div className="p-3.5 bg-amber-500/5 border border-amber-500/10 rounded-xl hover:shadow-sm transition-all duration-200">
                <span className="font-extrabold text-amber-600 text-[10px] tracking-wider uppercase block">Medium Severity</span>
                <p className="mt-1 text-slate-600 leading-relaxed text-[11px]">Suspicious behavior, verbal harassment, or groups loitering and intimidating commuters.</p>
              </div>
              <div className="p-3.5 bg-pink-500/5 border border-pink-500/10 rounded-xl hover:shadow-sm transition-all duration-200">
                <span className="font-extrabold text-primary-dark text-[10px] tracking-wider uppercase block">High Severity</span>
                <p className="mt-1 text-slate-600 leading-relaxed text-[11px]">Physical harassment, stalking incidents, or muggings/thefts directly reported.</p>
              </div>
              <div className="p-3.5 bg-danger-dark/5 border border-danger-dark/10 rounded-xl hover:shadow-sm transition-all duration-200">
                <span className="font-extrabold text-danger-dark text-[10px] tracking-wider uppercase block">Critical Severity</span>
                <p className="mt-1 text-slate-600 leading-relaxed text-[11px]">Assaults, active threat environments, or hostage/kidnapping hazards needing dispatch.</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex gap-2.5 items-start shadow-sm shadow-emerald-500/5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-[11px] text-slate-600 leading-normal">
              <strong className="text-emerald-700 font-bold">GDPR & Encryption</strong>: Incident reports are processed via secure cryptographic hashes. Your identity is visible only to emergency response coordinators.
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default IncidentReportPage;

