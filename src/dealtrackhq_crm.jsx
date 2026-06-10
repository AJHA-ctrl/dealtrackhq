import React, { useState, useEffect, useContext, createContext } from 'react';
import {
  Users, LayoutDashboard, CheckSquare, Settings, Bell,
  Search, Plus, Calendar, Mail, Phone, Building,
  TrendingUp, DollarSign, Clock, CheckCircle2,
  X, LogOut, Briefcase,
  Sparkles, Bot, Copy, Check, Wand2, BrainCircuit, Thermometer,
  AlertTriangle, Target, CalendarClock, FileText, ListTodo, RefreshCw
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// ─── Persistent storage helpers ──────────────────────────────────────────────
const db = {
  get: (key) => { try { return JSON.parse(localStorage.getItem(`dealtrack_${key}`) || 'null'); } catch { return null; } },
  set: (key, val) => { try { localStorage.setItem(`dealtrack_${key}`, JSON.stringify(val)); } catch {} },
};

// ─── Constants ────────────────────────────────────────────────────────────────
const PIPELINE_STAGES = [
  { id: 'new',         label: 'New Lead',       color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { id: 'contacted',   label: 'Contacted',      color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  { id: 'interested',  label: 'Interested',     color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { id: 'proposal',    label: 'Proposal Sent',  color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { id: 'negotiation', label: 'Negotiation',    color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { id: 'won',         label: 'Won',            color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { id: 'lost',        label: 'Lost',           color: 'bg-rose-100 text-rose-700 border-rose-200' },
];

const INITIAL_LEADS = [
  { id: '1', name: 'Sarah Jenkins', email: 'sarah@techflow.io', phone: '+1 (555) 123-4567', businessName: 'TechFlow Inc', source: 'Website', status: 'proposal', value: 12500, followUpDate: '2026-06-10', notes: 'Interested in enterprise plan.', createdAt: '2026-06-01T10:00:00Z', aiDealHealth: { score: 88, positiveFactors: ['High budget', 'Clear timeline'], negativeFactors: ['Competitor involved'] }, aiQualification: { status: 'Hot', reasoning: 'Strong intent to buy and budget available.' }, aiSalesCoach: { nextAction: 'Send customized enterprise ROI study', risks: ['May delay decision to Q3'], opportunities: ['Upsell additional seats'] }, aiScheduler: { suggestedDate: '2026-06-12', reasoning: 'Follow up before their weekly stakeholder meeting.' } },
  { id: '2', name: 'Marcus Chen',   email: 'm.chen@designco.com', phone: '+1 (555) 987-6543', businessName: 'DesignCo', source: 'Referral', status: 'new', value: 4500, followUpDate: '2026-06-14', notes: 'Needs a new brand identity.', createdAt: '2026-06-05T12:30:00Z' },
  { id: '3', name: 'Emily Rodriguez', email: 'emily@rodriguezlaw.com', phone: '+1 (555) 456-7890', businessName: 'Rodriguez Law', source: 'LinkedIn', status: 'interested', value: 8000, followUpDate: '2026-06-16', notes: 'Wants retainer agreement.', createdAt: '2026-06-03T09:15:00Z' },
  { id: '4', name: 'David Smith',   email: 'david@smithconsulting.net', phone: '+1 (555) 222-3333', businessName: 'Smith Consulting', source: 'Cold Call', status: 'negotiation', value: 15000, followUpDate: '2026-06-11', notes: 'Discussing final discount.', createdAt: '2026-05-28T14:20:00Z', aiDealHealth: { score: 92, positiveFactors: ['Verbal agreement', 'Decision maker bought in'], negativeFactors: ['Pricing concerns'] }, aiQualification: { status: 'Hot', reasoning: 'In final negotiations.' }, aiSalesCoach: { nextAction: 'Offer 5% discount conditional on signing this week.', risks: ['Discount might lower perceived value'], opportunities: ['Multi-year contract lock-in'] }, aiScheduler: { suggestedDate: '2026-06-11', reasoning: 'Follow up exactly on the agreed date to maintain momentum.' } },
];

const INITIAL_TASKS = [
  { id: '1', title: 'Prepare proposal for TechFlow', dueDate: '2026-06-12', priority: 'high', completed: false, createdAt: '2026-06-05T00:00:00Z' },
  { id: '2', title: 'Follow up with David regarding discount', dueDate: '2026-06-11', priority: 'high', completed: false, createdAt: '2026-06-06T00:00:00Z' },
  { id: '3', title: 'Update LinkedIn profile', dueDate: '2026-06-20', priority: 'low', completed: true, createdAt: '2026-06-01T00:00:00Z' },
];

// ─── Context ──────────────────────────────────────────────────────────────────
const AppContext = createContext();

const AppProvider = ({ children }) => {
  const [user, setUser]                   = useState(null);
  const [isAuthReady, setIsAuthReady]     = useState(false);
  const [dataLoading, setDataLoading]     = useState(true);
  const [leads, setLeads]                 = useState([]);
  const [tasks, setTasks]                 = useState([]);
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [hasEnteredApp, setHasEnteredApp] = useState(false);

  // Restore session on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('dealtrack_user');
      if (stored) { setUser(JSON.parse(stored)); setHasEnteredApp(true); }
    } catch {}
    setIsAuthReady(true);
  }, []);

  // Load data when user is set
  useEffect(() => {
    if (!user) { setLeads([]); setTasks([]); setDataLoading(false); return; }
    setDataLoading(true);
    let storedLeads = db.get(`leads_${user.id}`);
    let storedTasks = db.get(`tasks_${user.id}`);
    if (!storedLeads) { storedLeads = INITIAL_LEADS; db.set(`leads_${user.id}`, storedLeads); }
    if (!storedTasks) { storedTasks = INITIAL_TASKS; db.set(`tasks_${user.id}`, storedTasks); }
    setLeads([...storedLeads].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    setTasks([...storedTasks].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    setDataLoading(false);
  }, [user]);

  const login = (email) => {
    const newUser = { id: 'u1', name: 'Alex Founder', email, avatar: 'https://i.pravatar.cc/150?u=alex' };
    setUser(newUser);
    localStorage.setItem('dealtrack_user', JSON.stringify(newUser));
    setHasEnteredApp(true);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('dealtrack_user');
    setHasEnteredApp(false);
  };

  const addLead = (lead) => {
    if (!user) return;
    const newLead = { ...lead, id: Math.random().toString(36).substr(2, 9), createdAt: new Date().toISOString() };
    const updated = [newLead, ...leads];
    setLeads(updated);
    db.set(`leads_${user.id}`, updated);
  };

  const updateLeadStatus = (leadId, newStatus) => {
    if (!user) return;
    const updated = leads.map(l => l.id === leadId ? { ...l, status: newStatus } : l);
    setLeads(updated);
    db.set(`leads_${user.id}`, updated);
  };

  const updateLead = (leadId, updates) => {
    if (!user) return;
    const updated = leads.map(l => l.id === leadId ? { ...l, ...updates } : l);
    setLeads(updated);
    db.set(`leads_${user.id}`, updated);
  };

  const addTask = (task) => {
    if (!user) return;
    const newTask = { ...task, id: Math.random().toString(36).substr(2, 9), createdAt: new Date().toISOString() };
    const updated = [newTask, ...tasks];
    setTasks(updated);
    db.set(`tasks_${user.id}`, updated);
  };

  const toggleTask = (taskId) => {
    if (!user) return;
    const updated = tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
    setTasks(updated);
    db.set(`tasks_${user.id}`, updated);
  };

  return (
    <AppContext.Provider value={{
      user, isAuthReady, hasEnteredApp, login, logout,
      leads, addLead, updateLeadStatus, updateLead,
      tasks, addTask, toggleTask,
      dataLoading, selectedLeadId, setSelectedLeadId,
    }}>
      {children}
    </AppContext.Provider>
  );
};

// ─── Claude API helper ────────────────────────────────────────────────────────
const callClaudeAPI = async (prompt, asJson = false) => {
  const systemPrompt = asJson
    ? 'You are a helpful sales AI assistant. Always respond with valid JSON only. No markdown fences, no preamble, no explanation — raw JSON only.'
    : 'You are a helpful sales AI assistant. Be concise and professional.';
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    const data = await response.json();
    const text = data.content?.map(b => b.type === 'text' ? b.text : '').join('').trim();
    if (!text) throw new Error('No text returned');
    if (asJson) {
      const clean = text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
      return JSON.parse(clean);
    }
    return text;
  } catch (err) {
    console.error('Claude API error:', err);
    return null;
  }
};

// ─── Shared UI components ─────────────────────────────────────────────────────
const Button = ({ children, variant = 'primary', className = '', disabled, onClick, type }) => {
  const base = 'inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2';
  const variants = {
    primary:   'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm focus:ring-indigo-500',
    secondary: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 focus:ring-indigo-500',
    danger:    'bg-rose-600 text-white hover:bg-rose-700 shadow-sm focus:ring-rose-500',
    ghost:     'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  };
  return (
    <button
      type={type || 'button'}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  );
};

const Input = ({ label, icon: Icon, ...props }) => (
  <div className="mb-4">
    {label && <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>}
    <div className="relative">
      {Icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icon className="h-5 w-5 text-slate-400" />
        </div>
      )}
      <input
        className={`block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${Icon ? 'pl-10' : ''}`}
        {...props}
      />
    </div>
  </div>
);

const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden ${className}`}>
    {children}
  </div>
);

// ─── Lead Details Modal ───────────────────────────────────────────────────────
const LeadDetailsModal = () => {
  const { leads, selectedLeadId, setSelectedLeadId, updateLead, addTask } = useContext(AppContext);
  const lead = leads.find(l => l.id === selectedLeadId);

  const [activeTab,          setActiveTab]          = useState('ai');
  const [isAnalyzing,        setIsAnalyzing]        = useState(false);
  const [isDrafting,         setIsDrafting]         = useState(false);
  const [isProcessingNotes,  setIsProcessingNotes]  = useState(false);
  const [draftEmail,         setDraftEmail]         = useState('');
  const [meetingNotes,       setMeetingNotes]       = useState('');
  const [meetingSummary,     setMeetingSummary]     = useState(null);
  const [copied,             setCopied]             = useState(false);

  useEffect(() => {
    if (!lead) return;
    setDraftEmail(lead.savedEmailDraft || '');
    setMeetingSummary(null);
    setMeetingNotes('');
  }, [lead?.id]);

  if (!lead) return null;

  const handleAnalyzeLead = async () => {
    setIsAnalyzing(true);
    const prompt = `Analyze this sales lead and provide comprehensive insights. Current Date: ${new Date().toISOString()}
Name: ${lead.name}
Business: ${lead.businessName || 'N/A'}
Value: $${lead.value}
Source: ${lead.source}
Notes: ${lead.notes}
Pipeline Stage: ${lead.status}

Respond ONLY with valid JSON matching this exact schema:
{
  "qualification": { "status": "Hot", "reasoning": "one sentence" },
  "dealHealth": { "score": 75, "positiveFactors": ["factor"], "negativeFactors": ["factor"] },
  "salesCoach": { "nextAction": "specific action", "risks": ["risk"], "opportunities": ["opportunity"] },
  "scheduler": { "suggestedDate": "YYYY-MM-DD", "reasoning": "why this date" }
}
status must be one of: "Hot", "Warm", "Cold"`;

    const result = await callClaudeAPI(prompt, true);
    if (result) {
      updateLead(lead.id, {
        aiQualification: result.qualification,
        aiDealHealth:    result.dealHealth,
        aiSalesCoach:    result.salesCoach,
        aiScheduler:     result.scheduler,
      });
    }
    setIsAnalyzing(false);
  };

  const handleDraftEmail = async () => {
    setIsDrafting(true);
    const prompt = `Write a professional, concise follow-up email to this sales lead.
Do not use placeholder brackets. Sign off generically.

Lead: ${lead.name} at ${lead.businessName || 'their company'}
Notes: ${lead.notes}
Pipeline Stage: ${lead.status}

Return the email body only (no subject line):`;
    const text = await callClaudeAPI(prompt, false);
    if (text) {
      setDraftEmail(text);
      updateLead(lead.id, { savedEmailDraft: text });
    }
    setIsDrafting(false);
  };

  const handleProcessMeetingNotes = async () => {
    if (!meetingNotes.trim()) return;
    setIsProcessingNotes(true);
    const today = new Date().toISOString().split('T')[0];
    const prompt = `Analyze these meeting notes for lead ${lead.name}. Current date: ${today}.

Notes: ${meetingNotes}

Respond ONLY with valid JSON:
{
  "summary": "2-3 sentence summary",
  "actionItems": [
    { "title": "task description", "priority": "high", "dueDate": "YYYY-MM-DD" }
  ]
}
priority must be one of: "high", "normal", "low"`;

    const result = await callClaudeAPI(prompt, true);
    if (result) {
      setMeetingSummary(result.summary);
      (result.actionItems || []).forEach(item =>
        addTask({ title: item.title, priority: item.priority, dueDate: item.dueDate, completed: false, leadId: lead.id })
      );
      setMeetingNotes('');
    }
    setIsProcessingNotes(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(draftEmail).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const qualColor = lead.aiQualification?.status === 'Hot'
    ? 'bg-rose-100 text-rose-700'
    : lead.aiQualification?.status === 'Warm'
      ? 'bg-amber-100 text-amber-700'
      : 'bg-blue-100 text-blue-700';

  const tabs = [
    { id: 'details', label: 'Details',       Icon: null },
    { id: 'ai',      label: 'AI Co-Pilot',   Icon: BrainCircuit },
    { id: 'meeting', label: 'Meeting Notes', Icon: FileText },
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-end z-[100]">
      <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-800">{lead.name}</h2>
              {lead.aiQualification && (
                <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${qualColor}`}>
                  {lead.aiQualification.status} Lead
                </span>
              )}
            </div>
            {lead.businessName && (
              <p className="text-sm text-slate-500 flex items-center mt-1">
                <Building className="w-3 h-3 mr-1" />{lead.businessName}
              </p>
            )}
          </div>
          <button
            onClick={() => setSelectedLeadId(null)}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-slate-200 px-6 gap-6 overflow-x-auto shrink-0">
          {tabs.map(({ id, label, Icon }) => {
            const activeColor = id === 'ai' ? 'border-violet-600 text-violet-600' : id === 'meeting' ? 'border-blue-600 text-blue-600' : 'border-indigo-600 text-indigo-600';
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`pb-3 pt-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${activeTab === id ? activeColor : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                {Icon && <Icon className="w-4 h-4" />}
                {label}
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">

          {/* ── Details tab ── */}
          {activeTab === 'details' && (
            <div className="space-y-4">
              <Card className="p-4">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Contact Info</h3>
                <div className="space-y-2 text-sm">
                  <p className="flex items-center text-slate-700"><Mail className="w-4 h-4 mr-3 text-slate-400" />{lead.email}</p>
                  <p className="flex items-center text-slate-700"><Phone className="w-4 h-4 mr-3 text-slate-400" />{lead.phone}</p>
                </div>
              </Card>
              <Card className="p-4">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Deal Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><p className="text-slate-500 mb-0.5">Value</p><p className="font-semibold text-slate-800">${(lead.value || 0).toLocaleString()}</p></div>
                  <div><p className="text-slate-500 mb-0.5">Stage</p><p className="font-semibold text-slate-800 capitalize">{lead.status.replace('-', ' ')}</p></div>
                  <div><p className="text-slate-500 mb-0.5">Source</p><p className="font-semibold text-slate-800">{lead.source}</p></div>
                  <div><p className="text-slate-500 mb-0.5">Follow Up</p><p className="font-semibold text-slate-800">{lead.followUpDate ? new Date(lead.followUpDate).toLocaleDateString() : 'None'}</p></div>
                </div>
              </Card>
              <Card className="p-4">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Notes</h3>
                <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{lead.notes || 'No notes added yet.'}</p>
              </Card>
            </div>
          )}

          {/* ── AI Co-Pilot tab ── */}
          {activeTab === 'ai' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-violet-600" /> Intelligence Hub
                </h3>
                <Button variant="secondary" className="text-xs py-1.5" onClick={handleAnalyzeLead} disabled={isAnalyzing}>
                  {isAnalyzing ? 'Analyzing…' : <><RefreshCw className="w-3 h-3 mr-1.5" />Refresh Analysis</>}
                </Button>
              </div>

              {!lead.aiDealHealth && !isAnalyzing && (
                <div className="text-center py-10 bg-white rounded-xl border border-dashed border-violet-200">
                  <div className="w-12 h-12 bg-violet-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Wand2 className="w-6 h-6 text-violet-500" />
                  </div>
                  <h4 className="text-slate-800 font-medium mb-2">No AI Analysis Yet</h4>
                  <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">Generate a complete breakdown of this deal — health score, qualification, coaching, and suggested follow-up date.</p>
                  <Button className="bg-violet-600 hover:bg-violet-700 text-white" onClick={handleAnalyzeLead}>
                    Generate Intelligence Report
                  </Button>
                </div>
              )}

              {isAnalyzing && (
                <div className="text-center py-10">
                  <RefreshCw className="w-8 h-8 text-violet-500 animate-spin mx-auto mb-3" />
                  <p className="text-sm text-slate-500">Claude is analyzing your lead…</p>
                </div>
              )}

              {!isAnalyzing && lead.aiDealHealth && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Deal Health */}
                    <Card className="p-4">
                      <div className="flex items-center gap-2 mb-2 text-sm font-medium text-slate-700">
                        <Thermometer className="w-4 h-4 text-rose-500" /> Deal Health
                      </div>
                      <div className="flex items-end gap-1 mb-3">
                        <span className="text-3xl font-bold text-slate-900">{lead.aiDealHealth.score}</span>
                        <span className="text-sm text-slate-400 mb-1">/ 100</span>
                      </div>
                      <div className="space-y-1.5">
                        {lead.aiDealHealth.positiveFactors?.map((f, i) => (
                          <div key={i} className="flex gap-2 text-xs text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />{f}
                          </div>
                        ))}
                        {lead.aiDealHealth.negativeFactors?.map((f, i) => (
                          <div key={i} className="flex gap-2 text-xs text-rose-700">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />{f}
                          </div>
                        ))}
                      </div>
                    </Card>

                    {/* Qualification */}
                    <Card className="p-4 flex flex-col">
                      <div className="flex items-center gap-2 mb-2 text-sm font-medium text-slate-700">
                        <Target className="w-4 h-4 text-blue-500" /> Qualification
                      </div>
                      {lead.aiQualification && (
                        <>
                          <div className={`inline-flex self-start px-2.5 py-1 rounded-md text-sm font-bold uppercase tracking-wider mb-3 ${qualColor}`}>
                            {lead.aiQualification.status}
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">{lead.aiQualification.reasoning}</p>
                        </>
                      )}
                    </Card>
                  </div>

                  {/* Sales Coach */}
                  {lead.aiSalesCoach && (
                    <Card className="p-4 bg-violet-50/30 border-violet-100">
                      <div className="flex items-center gap-2 mb-3 text-sm font-medium text-violet-900">
                        <BrainCircuit className="w-4 h-4 text-violet-600" /> AI Sales Coach
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-violet-100 mb-3">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Recommended Next Action</p>
                        <p className="text-sm text-slate-800 font-medium">{lead.aiSalesCoach.nextAction}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white p-3 rounded-lg border border-rose-100">
                          <p className="text-xs font-semibold text-rose-600 uppercase tracking-wider mb-2">Risks</p>
                          <ul className="text-xs text-slate-600 list-disc pl-4 space-y-1">
                            {lead.aiSalesCoach.risks?.map((r, i) => <li key={i}>{r}</li>)}
                          </ul>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-emerald-100">
                          <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2">Opportunities</p>
                          <ul className="text-xs text-slate-600 list-disc pl-4 space-y-1">
                            {lead.aiSalesCoach.opportunities?.map((o, i) => <li key={i}>{o}</li>)}
                          </ul>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Smart Follow-up */}
                  {lead.aiScheduler && (
                    <Card className="p-4 bg-blue-50/30 border-blue-100">
                      <div className="flex items-center gap-2 mb-2 text-sm font-medium text-blue-900">
                        <CalendarClock className="w-4 h-4 text-blue-600" /> Smart Follow-up
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="bg-white px-3 py-2 rounded-lg border border-blue-100 font-semibold text-blue-700 whitespace-nowrap text-sm">
                          {new Date(lead.aiScheduler.suggestedDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{lead.aiScheduler.reasoning}</p>
                      </div>
                    </Card>
                  )}
                </div>
              )}

              {/* Email Draft */}
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Mail className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-semibold text-slate-800">Smart Email Draft</h3>
                </div>
                {!draftEmail ? (
                  <div className="text-center py-2">
                    <p className="text-sm text-slate-500 mb-4">Generate a context-aware follow-up email based on this lead's pipeline stage and AI insights.</p>
                    <Button variant="secondary" className="w-full" onClick={handleDraftEmail} disabled={isDrafting}>
                      {isDrafting ? 'Drafting…' : <><Wand2 className="w-4 h-4 mr-2 text-indigo-600" />Generate Draft</>}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <textarea
                      className="w-full h-48 p-3 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                      value={draftEmail}
                      onChange={e => setDraftEmail(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button variant="secondary" className="flex-1 text-sm" onClick={copyToClipboard}>
                        {copied
                          ? <><Check className="w-4 h-4 mr-2 text-emerald-600" />Copied!</>
                          : <><Copy className="w-4 h-4 mr-2" />Copy to Clipboard</>}
                      </Button>
                      <Button variant="ghost" className="px-3" onClick={handleDraftEmail} disabled={isDrafting}>
                        <RefreshCw className="w-4 h-4 text-slate-500" />
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* ── Meeting Notes tab ── */}
          {activeTab === 'meeting' && (
            <div className="space-y-4">
              <Card className="p-5 bg-blue-50/30 border-blue-100">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-slate-800">Meeting Notes Processor</h3>
                </div>
                <p className="text-sm text-slate-600 mb-4">
                  Paste raw meeting notes or transcripts. Claude will summarise the conversation and automatically extract tasks into your CRM.
                </p>
                <textarea
                  className="w-full h-40 p-3 text-sm border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none resize-none mb-3"
                  placeholder="Paste meeting notes here…"
                  value={meetingNotes}
                  onChange={e => setMeetingNotes(e.target.value)}
                />
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={handleProcessMeetingNotes}
                  disabled={isProcessingNotes || !meetingNotes.trim()}
                >
                  {isProcessingNotes
                    ? 'Extracting Action Items…'
                    : <><ListTodo className="w-4 h-4 mr-2" />Process &amp; Create Tasks</>}
                </Button>
              </Card>

              {meetingSummary && (
                <Card className="p-4 bg-emerald-50/30 border-emerald-100">
                  <h4 className="text-sm font-semibold text-emerald-800 mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Processing Complete
                  </h4>
                  <p className="text-sm text-slate-700 leading-relaxed mb-3">
                    <strong>Summary:</strong> {meetingSummary}
                  </p>
                  <p className="text-xs text-emerald-600 font-medium">
                    Extracted tasks have been added to your Task Management dashboard.
                  </p>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
const DashboardView = ({ navigate }) => {
  const { leads, tasks } = useContext(AppContext);
  const [aiInsights, setAiInsights]               = useState(null);
  const [isGeneratingInsights, setIsGenerating]   = useState(false);

  const wonLeads    = leads.filter(l => l.status === 'won');
  const activeLeads = leads.filter(l => !['won', 'lost'].includes(l.status));
  const revenue     = wonLeads.reduce((s, l) => s + (l.value || 0), 0);
  const winRate     = leads.length ? Math.round((wonLeads.length / leads.length) * 100) : 0;

  const handleGenerateInsights = async () => {
    setIsGenerating(true);
    const sources = leads.reduce((acc, l) => { acc[l.source] = (acc[l.source] || 0) + 1; return acc; }, {});
    const sourceStr = Object.entries(sources).map(([s, c]) => `${s}: ${c}`).join(', ');
    const prompt = `Act as an expert CRO. Analyse this CRM data and provide a concise dashboard summary. Date: ${new Date().toISOString()}
Total Leads: ${leads.length} | Active Deals: ${activeLeads.length} | Won: ${wonLeads.length} | Revenue: $${revenue}
Sources: ${sourceStr}

Respond ONLY with valid JSON:
{
  "weeklySummary": "2-3 sentence summary",
  "bottlenecks": ["bottleneck 1", "bottleneck 2"],
  "topSources": ["insight 1"],
  "revenuePredictions": "one sentence trajectory"
}`;
    const result = await callClaudeAPI(prompt, true);
    if (result) setAiInsights(result);
    setIsGenerating(false);
  };

  const chartData = [
    { name: 'Jan', revenue: 4000 },
    { name: 'Feb', revenue: 7000 },
    { name: 'Mar', revenue: 5500 },
    { name: 'Apr', revenue: 12000 },
    { name: 'May', revenue: 18000 },
    { name: 'Jun', revenue: revenue || 0 },
  ];

  const stats = [
    { title: 'Total Revenue', value: `$${revenue.toLocaleString()}`, icon: DollarSign, trend: '+12%', color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { title: 'Active Deals',  value: activeLeads.length,            icon: Briefcase,   trend: '+4',   color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { title: 'Win Rate',      value: `${winRate}%`,                 icon: TrendingUp,  trend: '+2%',  color: 'text-blue-600',   bg: 'bg-blue-100' },
    { title: 'Total Leads',   value: leads.length,                  icon: Users,       trend: '+18%', color: 'text-purple-600', bg: 'bg-purple-100' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* AI Briefing Banner */}
      <Card className="bg-gradient-to-r from-indigo-900 via-violet-900 to-purple-900 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <BrainCircuit className="w-48 h-48" />
        </div>
        <div className="p-6 relative z-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-300" /> Executive AI Briefing
            </h2>
            {!aiInsights && (
              <Button
                onClick={handleGenerateInsights}
                disabled={isGeneratingInsights}
                className="bg-white/10 hover:bg-white/20 text-white border-none shadow-none text-sm py-1.5"
              >
                {isGeneratingInsights ? 'Analyzing Pipeline…' : 'Generate Insights'}
              </Button>
            )}
          </div>

          {aiInsights ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
              <div className="md:col-span-2 space-y-4">
                <div>
                  <p className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-1">Weekly Summary</p>
                  <p className="text-sm text-slate-100 leading-relaxed">{aiInsights.weeklySummary}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/20 rounded-lg p-3 border border-white/5">
                    <p className="text-rose-300 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Bottlenecks
                    </p>
                    <ul className="text-xs text-slate-200 list-disc pl-4 space-y-1">
                      {aiInsights.bottlenecks?.map((b, i) => <li key={i}>{b}</li>)}
                    </ul>
                  </div>
                  <div className="bg-black/20 rounded-lg p-3 border border-white/5">
                    <p className="text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Target className="w-3 h-3" /> Top Sources
                    </p>
                    <ul className="text-xs text-slate-200 list-disc pl-4 space-y-1">
                      {aiInsights.topSources?.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
              <div className="bg-white text-slate-900 rounded-xl p-5 shadow-xl flex flex-col justify-center">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-indigo-500" /> Revenue Trajectory
                </p>
                <p className="text-base font-semibold text-slate-800 leading-snug mb-4">{aiInsights.revenuePredictions}</p>
                <Button variant="ghost" className="w-full text-xs text-indigo-600 hover:bg-indigo-50" onClick={handleGenerateInsights} disabled={isGeneratingInsights}>
                  <RefreshCw className={`w-3 h-3 mr-1.5 ${isGeneratingInsights ? 'animate-spin' : ''}`} /> Update Briefing
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-indigo-200 text-sm max-w-xl">
              Generate a complete pipeline analysis — bottlenecks, revenue predictions, and a weekly performance summary based on your live CRM data.
            </p>
          )}
        </div>
      </Card>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <Card key={i} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">{s.title}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{s.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.bg}`}>
                <s.icon className={`w-6 h-6 ${s.color}`} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-emerald-600 font-medium">{s.trend}</span>
              <span className="text-slate-400 ml-2">vs last month</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Chart + Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Revenue Overview</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#4f46e5" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={v => `$${v / 1000}k`} />
                <Tooltip contentStyle={{ borderRadius: '0.5rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0/0.1)' }} formatter={v => [`$${v}`, 'Revenue']} />
                <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800">Priority Tasks</h3>
            <button onClick={() => navigate('tasks')} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">View All</button>
          </div>
          <div className="space-y-3 flex-1 overflow-y-auto">
            {tasks.filter(t => !t.completed).slice(0, 5).map(task => (
              <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors">
                <CheckCircle2 className="w-5 h-5 mt-0.5 text-slate-300 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-slate-800 leading-snug">{task.title}</p>
                  <div className="flex items-center mt-1 text-xs text-slate-500">
                    <Calendar className="w-3 h-3 mr-1" />
                    {new Date(task.dueDate).toLocaleDateString()}
                    {task.priority === 'high' && (
                      <span className="ml-2 px-1.5 py-0.5 bg-rose-100 text-rose-700 rounded text-[10px] font-bold uppercase">High</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {tasks.filter(t => !t.completed).length === 0 && (
              <p className="text-center text-slate-500 py-8 text-sm">All caught up! 🎉</p>
            )}
          </div>
          <Button variant="secondary" className="w-full mt-4 text-sm" onClick={() => navigate('tasks')}>
            <Plus className="w-4 h-4 mr-2" /> Add Task
          </Button>
        </Card>
      </div>
    </div>
  );
};

// ─── Pipeline (Kanban) ────────────────────────────────────────────────────────
const PipelineView = () => {
  const { leads, updateLeadStatus, setSelectedLeadId } = useContext(AppContext);
  const [draggedLead, setDraggedLead] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const handleDragStart = (e, lead) => {
    setDraggedLead(lead);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => { if (e.target) e.target.style.opacity = '0.5'; }, 0);
  };
  const handleDragEnd   = (e) => { if (e.target) e.target.style.opacity = '1'; setDraggedLead(null); };
  const handleDragOver  = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
  const handleDrop      = (e, targetStatus) => {
    e.preventDefault();
    if (draggedLead && draggedLead.status !== targetStatus) updateLeadStatus(draggedLead.id, targetStatus);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <p className="text-slate-600 text-sm">Drag and drop leads to update their pipeline stage.</p>
        <Button onClick={() => setShowAddModal(true)}><Plus className="w-4 h-4 mr-2" />Add Deal</Button>
      </div>

      <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
        {PIPELINE_STAGES.map(stage => {
          const stageLeads  = leads.filter(l => l.status === stage.id);
          const totalValue  = stageLeads.reduce((s, l) => s + (l.value || 0), 0);
          return (
            <div
              key={stage.id}
              className="flex flex-col bg-slate-100/50 rounded-xl min-w-[270px] max-w-[270px] border border-slate-200/60 shrink-0"
              onDragOver={handleDragOver}
              onDrop={e => handleDrop(e, stage.id)}
            >
              <div className="p-3 border-b border-slate-200/60 bg-slate-100 rounded-t-xl flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${stage.color}`}>{stage.label}</span>
                  <span className="text-xs text-slate-500 font-medium">{stageLeads.length}</span>
                </div>
                <span className="text-xs font-semibold text-slate-700">${totalValue.toLocaleString()}</span>
              </div>

              <div className="p-3 flex-1 overflow-y-auto space-y-3 min-h-[120px]">
                {stageLeads.map(lead => (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={e => handleDragStart(e, lead)}
                    onDragEnd={handleDragEnd}
                    onClick={() => setSelectedLeadId(lead.id)}
                    className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm cursor-grab active:cursor-grabbing hover:border-indigo-300 hover:shadow-md transition-all"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-semibold text-slate-800 text-sm leading-tight">{lead.businessName || lead.name}</h4>
                      {lead.aiDealHealth?.score && (
                        <span className="flex items-center text-[10px] font-bold bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded shrink-0 ml-1">
                          <Sparkles className="w-3 h-3 mr-0.5" />{lead.aiDealHealth.score}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 flex items-center mb-3">
                      <Users className="w-3 h-3 mr-1" />{lead.name}
                    </p>
                    <div className="flex justify-between items-end pt-2 border-t border-slate-100">
                      <span className="text-xs font-medium text-slate-600">${(lead.value || 0).toLocaleString()}</span>
                      {lead.followUpDate && (
                        <span className={`flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded ${new Date(lead.followUpDate) < new Date() ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
                          <Clock className="w-3 h-3 mr-1" />
                          {new Date(lead.followUpDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {showAddModal && <AddLeadModal onClose={() => setShowAddModal(false)} />}
    </div>
  );
};

// ─── Add Lead Modal ───────────────────────────────────────────────────────────
const AddLeadModal = ({ onClose }) => {
  const { addLead } = useContext(AppContext);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', businessName: '', value: '', source: 'Website', notes: '',
  });

  const update = (field) => (e) => setFormData(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = () => {
    if (!formData.name.trim() || !formData.value) return;
    addLead({
      ...formData,
      value: parseFloat(formData.value) || 0,
      status: 'new',
      followUpDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">Add New Deal</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full p-1 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-0">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Contact Name *"    value={formData.name}         onChange={update('name')} />
            <Input label="Business/Company"  value={formData.businessName} onChange={update('businessName')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Email"  type="email" value={formData.email} onChange={update('email')} />
            <Input label="Phone"              value={formData.phone} onChange={update('phone')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Deal Value ($) *" type="number" value={formData.value} onChange={update('value')} />
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Source</label>
              <select
                className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={formData.source}
                onChange={update('source')}
              >
                <option>Website</option>
                <option>Referral</option>
                <option>Cold Call</option>
                <option>LinkedIn</option>
                <option>Other</option>
              </select>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">Initial Notes</label>
            <textarea
              rows={3}
              className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={formData.notes}
              onChange={update('notes')}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit}>Create Deal</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Leads List ───────────────────────────────────────────────────────────────
const LeadsListView = () => {
  const { leads, setSelectedLeadId } = useContext(AppContext);
  const [searchTerm,   setSearchTerm]   = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const filtered = leads.filter(l =>
    l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (l.businessName && l.businessName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search leads or businesses…"
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={() => setShowAddModal(true)} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" /> Add Lead
        </Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                <th className="p-4">Contact</th>
                <th className="p-4">Status</th>
                <th className="p-4">Value</th>
                <th className="p-4 hidden md:table-cell">AI Health</th>
                <th className="p-4 hidden md:table-cell">Follow Up</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {filtered.map(lead => {
                const stage = PIPELINE_STAGES.find(s => s.id === lead.status);
                const score = lead.aiDealHealth?.score;
                return (
                  <tr
                    key={lead.id}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => setSelectedLeadId(lead.id)}
                  >
                    <td className="p-4">
                      <div className="font-semibold text-slate-900">{lead.name}</div>
                      {lead.businessName && (
                        <div className="text-slate-500 text-xs flex items-center mt-0.5">
                          <Building className="w-3 h-3 mr-1" />{lead.businessName}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium border ${stage?.color || 'bg-slate-100'}`}>
                        {stage?.label}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-slate-700">${(lead.value || 0).toLocaleString()}</td>
                    <td className="p-4 hidden md:table-cell">
                      {score
                        ? <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold border ${score >= 80 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : score >= 50 ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                            <Bot className="w-3 h-3" />{score}
                          </span>
                        : <span className="text-slate-400 text-xs">—</span>
                      }
                    </td>
                    <td className="p-4 hidden md:table-cell text-slate-600">
                      {lead.followUpDate ? new Date(lead.followUpDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        className="text-indigo-600 hover:text-indigo-900 font-medium text-sm"
                        onClick={e => { e.stopPropagation(); setSelectedLeadId(lead.id); }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500">No leads found matching your search.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {showAddModal && <AddLeadModal onClose={() => setShowAddModal(false)} />}
    </div>
  );
};

// ─── Tasks ────────────────────────────────────────────────────────────────────
const TasksView = () => {
  const { tasks, toggleTask, addTask } = useContext(AppContext);
  const [newTitle, setNewTitle] = useState('');

  const handleAddTask = () => {
    if (!newTitle.trim()) return;
    addTask({ title: newTitle.trim(), dueDate: new Date().toISOString(), priority: 'normal', completed: false });
    setNewTitle('');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-6">Task Management</h2>

        <div className="flex gap-3 mb-8">
          <input
            type="text"
            placeholder="What needs to be done?"
            className="flex-1 rounded-lg border border-slate-300 px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddTask()}
          />
          <Button onClick={handleAddTask}>Add Task</Button>
        </div>

        <div className="space-y-3">
          {tasks.map(task => (
            <div
              key={task.id}
              className={`flex items-center gap-4 p-4 rounded-xl border ${task.completed ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-200 shadow-sm'}`}
            >
              <button
                onClick={() => toggleTask(task.id)}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${task.completed ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-300 hover:border-indigo-500'}`}
              >
                {task.completed && <CheckCircle2 className="w-4 h-4" />}
              </button>
              <div className="flex-1">
                <p className={`font-medium ${task.completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>{task.title}</p>
                <div className="flex gap-3 mt-1 text-xs text-slate-500">
                  <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" />{new Date(task.dueDate).toLocaleDateString()}</span>
                  {task.priority === 'high' && <span className="text-rose-600 font-semibold">High Priority</span>}
                </div>
              </div>
            </div>
          ))}
          {tasks.length === 0 && <p className="text-center text-slate-500 py-8 text-sm">No tasks yet. Add one above!</p>}
        </div>
      </Card>
    </div>
  );
};

// ─── Settings ─────────────────────────────────────────────────────────────────
const SettingsView = () => {
  const { user } = useContext(AppContext);
  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Account Settings</h2>
      <div className="grid gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold border-b border-slate-100 pb-4 mb-4">Profile Information</h3>
          <div className="grid grid-cols-2 gap-4 max-w-xl">
            <Input label="First Name" defaultValue="Alex" />
            <Input label="Last Name"  defaultValue="Founder" />
            <div className="col-span-2">
              <Input label="Email" type="email" defaultValue={user?.email || 'alex@dealtrack.hq'} />
            </div>
            <div className="col-span-2">
              <Button>Save Changes</Button>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="text-lg font-semibold border-b border-slate-100 pb-4 mb-4">Preferences</h3>
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 text-indigo-600 rounded" defaultChecked />
              <span className="text-sm font-medium text-slate-700">Email notifications for overdue tasks</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 text-indigo-600 rounded" defaultChecked />
              <span className="text-sm font-medium text-slate-700">Weekly pipeline summary report</span>
            </label>
          </div>
        </Card>
      </div>
    </div>
  );
};

// ─── Main Layout ──────────────────────────────────────────────────────────────
const MainLayout = ({ children, currentRoute, setCurrentRoute }) => {
  const { user, logout } = useContext(AppContext);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pipeline',  label: 'Pipeline',  icon: Briefcase },
    { id: 'leads',     label: 'Leads',     icon: Users },
    { id: 'tasks',     label: 'Tasks',     icon: CheckSquare },
    { id: 'settings',  label: 'Settings',  icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex-col hidden md:flex shrink-0">
        <div className="p-4 border-b border-slate-100">
          <h1 className="text-xl font-bold text-indigo-600 flex items-center gap-2">
            <Target className="w-6 h-6" /> DealTrackHQ
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setCurrentRoute(id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentRoute === id ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
            >
              <Icon className="w-5 h-5" />{label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-100">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg"
          >
            <LogOut className="w-5 h-5" /> Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 shrink-0">
          <h2 className="text-xl font-bold text-slate-800 capitalize">{currentRoute}</h2>
          <div className="flex items-center gap-4">
            <button className="text-slate-400 hover:text-slate-600"><Bell className="w-5 h-5" /></button>
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden">
              <img src={user?.avatar || 'https://i.pravatar.cc/150?u=alex'} alt="Avatar" className="w-full h-full object-cover" />
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
      </main>

      {/* Modal rendered at layout level so it overlays correctly */}
      <LeadDetailsModal />
    </div>
  );
};

// ─── Landing Page ─────────────────────────────────────────────────────────────
const LandingPage = ({ onNavigate }) => (
  <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-center p-6">
    <Target className="w-16 h-16 text-indigo-600 mb-6" />
    <h1 className="text-5xl font-extrabold text-slate-900 mb-4">DealTrackHQ</h1>
    <p className="text-xl text-slate-600 mb-8 max-w-2xl">
      The ultimate AI-powered CRM and follow-up management platform for modern businesses.
    </p>
    <Button onClick={() => onNavigate('login')} className="text-lg px-8 py-3">
      Get Started
    </Button>
  </div>
);

// ─── Auth Page ────────────────────────────────────────────────────────────────
const AuthPage = () => {
  const { login } = useContext(AppContext);
  const [email, setEmail] = useState('demo@dealtrack.hq');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <Target className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900">Welcome Back</h2>
          <p className="text-slate-500 mt-1">Sign in to your account</p>
        </div>
        <div className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <Input
            label="Password"
            type="password"
            defaultValue="password"
          />
          <Button onClick={() => login(email)} className="w-full">
            Sign In
          </Button>
          <p className="text-xs text-center text-slate-400">Demo account pre-filled — just click Sign In</p>
        </div>
      </Card>
    </div>
  );
};

// ─── App shell ────────────────────────────────────────────────────────────────
const AppContent = () => {
  const { hasEnteredApp, isAuthReady, dataLoading, login } = useContext(AppContext);
  const [currentRoute, setCurrentRoute] = useState('dashboard');

  // Auto-login: skip landing page, go straight to dashboard
  useEffect(() => {
    if (isAuthReady && !hasEnteredApp) {
      login('demo@dealtrack.hq');
    }
  }, [isAuthReady, hasEnteredApp, login]);

  if (!isAuthReady || !hasEnteredApp || dataLoading) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
      <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
      <p className="text-slate-500 text-sm">Loading DealTrackHQ…</p>
    </div>
  );

  return (
    <MainLayout currentRoute={currentRoute} setCurrentRoute={setCurrentRoute}>
      {currentRoute === 'dashboard' && <DashboardView navigate={setCurrentRoute} />}
      {currentRoute === 'pipeline'  && <PipelineView />}
      {currentRoute === 'leads'     && <LeadsListView />}
      {currentRoute === 'tasks'     && <TasksView />}
      {currentRoute === 'settings'  && <SettingsView />}
    </MainLayout>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
