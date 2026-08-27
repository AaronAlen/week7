import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api from '../services/api.ts';
import {
  Award,
  Sparkles,
  Upload,
  FileText,
  DollarSign,
  ShieldCheck,
  Clock,
  Send,
  Building2,
  Copy,
  Check,
  RefreshCw,
  Sliders,
  History,
  TrendingDown,
  Layers,
  Download,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Trash2,
  Eye,
  Mail,
  Phone,
  MessageSquare,
  Edit3,
  ExternalLink,
  Info,
  UserCheck
} from 'lucide-react';

interface ExtractedVendor {
  vendorName: string;
  vendorEmail?: string;
  vendorPhone?: string;
  unitPrice: number;
  warrantyMonths: number;
  leadTimeDays: number;
  qualityGrade: string;
  defectRatePct: string;
  paymentTerms: string;
  notes?: string;
}

interface ScoredVendor {
  vendorName: string;
  vendorEmail?: string;
  vendorPhone?: string;
  priceScore: number;
  qualityScore: number;
  warrantyScore: number;
  leadTimeScore: number;
  compositeScore: number;
  pros: string[];
  cons: string[];
  estimatedTotalContractCost: number;
}

interface EvaluationResult {
  bestVendorName: string;
  bestVendorEmail?: string;
  bestVendorPhone?: string;
  overallRecommendationScore: number;
  extractedVendors?: ExtractedVendor[];
  scoringMatrix: ScoredVendor[];
  executiveSummary: string;
  keyTradeoffs: { comparison: string; analysis: string }[];
  riskAnalysis: string;
  negotiationStrategy: string;
  emailSubject?: string;
  emailDraft: string;
  smsDraft?: string;
}

interface UploadedDocItem {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  included: boolean;
  previewUrl: string;
}

interface PastEvaluation {
  id: number;
  title: string;
  productCategory: string;
  targetQuantity: number;
  priorityFocus: string;
  bestVendorName: string;
  overallRecommendationScore: number;
  createdAt: string;
}

export const VendorAnalysis: React.FC = () => {
  const currentUser = useSelector((state: any) => state.auth?.user);

  const [title, setTitle] = useState('Industrial 4K Display Panels Sourcing RFP');
  const [productCategory, setProductCategory] = useState('Displays & Photonics');
  const [targetQuantity, setTargetQuantity] = useState(500);
  const [priorityFocus, setPriorityFocus] = useState('BALANCED');

  // User uploaded document list
  const [documentList, setDocumentList] = useState<UploadedDocItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EvaluationResult | null>(null);

  // Editable Communication State
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [smsContent, setSmsContent] = useState('');

  // Dispatch States
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<string | null>(null);
  const [sendingSms, setSendingSms] = useState(false);
  const [smsStatus, setSmsStatus] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);

  // History / Archive
  const [historyList, setHistoryList] = useState<PastEvaluation[]>([]);
  const [activeTab, setActiveTab] = useState<'EVALUATOR' | 'HISTORY'>('EVALUATOR');

  const fetchHistory = async () => {
    try {
      const res = await api.get('/vendor-evaluations');
      setHistoryList(res.data || []);
    } catch (err) {
      console.error('Failed to load history', err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // When AI finishes or winner changes, sync communication form using logged-in user details
  useEffect(() => {
    if (result) {
      const userName = currentUser?.name || 'Procurement Specialist';
      const userRole = currentUser?.role || 'MANAGER';
      const userEmail = currentUser?.email || 'procurement@stockpilot.com';

      setRecipientEmail(result.bestVendorEmail || 'sales@vendor.com');
      setRecipientPhone(result.bestVendorPhone || '+15550199');
      setEmailSubject(result.emailSubject || `Award Notification – ${result.bestVendorName} for ${title}`);

      // Sanitize email content: remove phone placeholders, inject user signature
      let cleanEmail = result.emailDraft || '';
      cleanEmail = cleanEmail
        .replace(/\[Your Name\]/gi, userName)
        .replace(/\[Name\]/gi, userName)
        .replace(/\[Email\]/gi, userEmail)
        .replace(/\[Phone\]/gi, '')
        .replace(/(?:Phone|Tel|Mobile|WhatsApp)[\s:]*\[?[+\d\s()-]+\]?/gi, '')
        .replace(/\n\s*\n\s*\n/g, '\n\n')
        .trim();

      if (!cleanEmail.includes(userName)) {
        cleanEmail += `\n\nBest regards,\n${userName}\n${userRole} | StockPilot Sourcing\n${userEmail}`;
      }
      setEmailContent(cleanEmail);

      // Human-friendly, polite, professional business SMS
      let cleanSms = result.smsDraft || '';
      if (
        !cleanSms ||
        cleanSms.toLowerCase().includes('check your email') ||
        cleanSms.toLowerCase().includes('check email') ||
        cleanSms.startsWith('StockPilot:') ||
        cleanSms.includes('awarded')
      ) {
        cleanSms = `Hi ${result.bestVendorName} team, this is ${userName} from StockPilot. We have approved your quotation for ${targetQuantity} units of ${title}. Please reply with your pro-forma invoice to confirm the order. Thank you!`;
      }
      setSmsContent(cleanSms);

      setEmailStatus(null);
      setSmsStatus(null);
    }
  }, [result, title, targetQuantity, currentUser]);

  // Handle local file selection from computer
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const newItems: UploadedDocItem[] = filesArray.map(file => ({
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        file,
        name: file.name,
        size: file.size,
        type: file.type || 'application/pdf',
        included: true,
        previewUrl: URL.createObjectURL(file)
      }));

      setDocumentList(prev => [...prev, ...newItems]);
      e.target.value = '';
    }
  };

  const handleToggleInclude = (id: string) => {
    setDocumentList(prev =>
      prev.map(item => (item.id === id ? { ...item, included: !item.included } : item))
    );
  };

  const handleRemoveDocument = (id: string) => {
    setDocumentList(prev => {
      const item = prev.find(i => i.id === id);
      if (item?.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
      }
      return prev.filter(i => i.id !== id);
    });
  };

  const handleClearAllDocuments = () => {
    documentList.forEach(item => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });
    setDocumentList([]);
  };

  const activeDocuments = documentList.filter(d => d.included);

  const handleRunEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (activeDocuments.length < 2) {
      alert('Please upload and select at least 2 vendor quote documents to compare.');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('productCategory', productCategory);
      formData.append('targetQuantity', String(targetQuantity));
      formData.append('priorityFocus', priorityFocus);
      formData.append('senderName', currentUser?.name || 'Procurement Specialist');
      formData.append('senderRole', currentUser?.role || 'MANAGER');
      formData.append('senderEmail', currentUser?.email || 'procurement@stockpilot.com');

      activeDocuments.forEach(item => {
        formData.append('documents', item.file);
      });

      const res = await api.post('/vendor-evaluations/evaluate', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.data?.data?.decision) {
        setResult(res.data.data.decision);
        fetchHistory();
      }
    } catch (err: any) {
      console.error('Vendor Evaluation Error:', err);
      alert(err.response?.data?.error || 'Evaluation failed. Please check your uploaded files.');
    } finally {
      setLoading(false);
    }
  };

  // Dispatch Email via Nodemailer
  const handleSendEmail = async () => {
    if (!recipientEmail || !emailContent) {
      alert('Please provide recipient email address and email content.');
      return;
    }

    setSendingEmail(true);
    setEmailStatus(null);
    try {
      const res = await api.post('/vendor-evaluations/send-email', {
        to: recipientEmail,
        vendorName: result?.bestVendorName || 'Vendor Partner',
        subject: emailSubject,
        content: emailContent
      });

      setEmailStatus(`✅ Email successfully sent to ${recipientEmail}`);
    } catch (err: any) {
      setEmailStatus(`❌ Failed to send email: ${err.response?.data?.error || err.message}`);
    } finally {
      setSendingEmail(false);
    }
  };

  // Dispatch SMS via Twilio
  const handleSendSMS = async () => {
    if (!recipientPhone || !smsContent) {
      alert('Please provide recipient phone number and SMS content.');
      return;
    }

    setSendingSms(true);
    setSmsStatus(null);
    try {
      const res = await api.post('/vendor-evaluations/send-sms', {
        to: recipientPhone,
        vendorName: result?.bestVendorName || 'Vendor Partner',
        message: smsContent
      });

      setSmsStatus(`✅ SMS alert dispatched to ${recipientPhone}`);
    } catch (err: any) {
      setSmsStatus(`❌ Failed to send SMS: ${err.response?.data?.error || err.message}`);
    } finally {
      setSendingSms(false);
    }
  };

  const copyEmailDraft = () => {
    if (emailContent) {
      navigator.clipboard.writeText(emailContent);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    }
  };

  const loadPastEvaluation = async (id: number) => {
    try {
      setLoading(true);
      const res = await api.get(`/vendor-evaluations/${id}`);
      if (res.data) {
        setResult({
          bestVendorName: res.data.bestVendorName,
          bestVendorEmail: 'sales@vendor.com',
          bestVendorPhone: '+15550199',
          overallRecommendationScore: Number(res.data.overallRecommendationScore),
          scoringMatrix: res.data.scoringMatrix || [],
          executiveSummary: res.data.executiveSummary,
          keyTradeoffs: res.data.keyTradeoffs || [],
          riskAnalysis: res.data.riskAnalysis || 'No specific risks logged.',
          negotiationStrategy: res.data.negotiationStrategy || '',
          emailDraft: res.data.emailDraft || '',
          smsDraft: `[StockPilot] Dear ${res.data.bestVendorName}, your proposal has been selected for ${res.data.title}.`
        });
        setActiveTab('EVALUATOR');
      }
    } catch (err) {
      console.error('Failed to load evaluation', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl shadow-lg shadow-blue-500/20 text-white">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
                <span>Autonomous Document-Driven Vendor Selection Agent</span>
                <span className="text-[10px] bg-blue-500/20 text-blue-300 font-mono px-2 py-0.5 rounded-full border border-blue-500/30">
                  AGENT 5
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Upload your supplier PDF quotes. The AI extracts emails, phones, pricing, warranty & SLAs, ranks the best vendor, and dispatches official emails & SMS alerts.
              </p>
            </div>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('EVALUATOR')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
              activeTab === 'EVALUATOR' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Document Evaluator</span>
          </button>
          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
              activeTab === 'HISTORY' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Archive ({historyList.length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'HISTORY' ? (
        /* ARCHIVE TABLE */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <History className="w-4 h-4 text-blue-400" />
            <span>Historical Sourcing Decisions</span>
          </h2>

          {historyList.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center">No past vendor evaluations found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/70 text-slate-400 uppercase text-[10px] font-semibold">
                  <tr>
                    <th className="px-4 py-3 rounded-l-xl">RFP Title</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Target Volume</th>
                    <th className="px-4 py-3">Strategic Focus</th>
                    <th className="px-4 py-3">Winner Vendor</th>
                    <th className="px-4 py-3">Score</th>
                    <th className="px-4 py-3 rounded-r-xl text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {historyList.map(item => (
                    <tr key={item.id} className="hover:bg-slate-800/30 transition">
                      <td className="px-4 py-3 font-semibold text-white">{item.title}</td>
                      <td className="px-4 py-3 text-slate-400">{item.productCategory}</td>
                      <td className="px-4 py-3 font-mono">{item.targetQuantity} units</td>
                      <td className="px-4 py-3">
                        <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px] font-mono">
                          {item.priorityFocus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-emerald-400 font-bold flex items-center space-x-1.5">
                        <Award className="w-3.5 h-3.5" />
                        <span>{item.bestVendorName}</span>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-blue-400">
                        {item.overallRecommendationScore}/100
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => loadPastEvaluation(item.id)}
                          className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded-lg text-xs font-medium transition"
                        >
                          View Report
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* EVALUATOR FORM */
        <div className="space-y-6">
          <form onSubmit={handleRunEvaluation} className="space-y-6">
            {/* Step 1: Procurement Scope & Strategic Priorities */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-blue-400" />
                <span>1. Procurement Scope & Strategic Ranking Category</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                <div className="md:col-span-2">
                  <label className="text-slate-400 block mb-1 font-medium">Procurement Project Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    required
                    placeholder="e.g. Industrial 4K Display Panels Sourcing RFP"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-2.5 text-slate-100 outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Category</label>
                  <input
                    type="text"
                    value={productCategory}
                    onChange={e => setProductCategory(e.target.value)}
                    placeholder="e.g. Displays & Photonics"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-2.5 text-slate-100 outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Target Order Volume</label>
                  <input
                    type="number"
                    value={targetQuantity}
                    onChange={e => setTargetQuantity(Math.max(1, Number(e.target.value)))}
                    required
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-2.5 text-slate-100 outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-medium">Strategic Ranking Priority Category</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { key: 'BALANCED', label: '⚖️ Balanced Scorecard', desc: 'Equal weight on all factors' },
                    { key: 'LOWEST_PRICE', label: '💰 Lowest Unit Price', desc: 'Prioritize commercial cost' },
                    { key: 'LONGEST_WARRANTY', label: '🛡️ Maximum Warranty', desc: 'Longest coverage & SLA' },
                    { key: 'HIGHEST_QUALITY', label: '💎 Highest Quality Grade', desc: 'Zero defect & TUV/MIL spec' },
                    { key: 'FASTEST_LEAD_TIME', label: '⚡ Fastest Delivery', desc: 'Rapid turnaround speed' }
                  ].map(item => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setPriorityFocus(item.key)}
                      className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                        priorityFocus === item.key
                          ? 'bg-blue-600/20 border-blue-500 text-blue-900 dark:text-white font-bold shadow-sm'
                          : 'bg-slate-950/60 border-slate-800 text-slate-700 dark:text-slate-400 hover:border-slate-700 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      <span className="text-xs font-bold text-blue-950 dark:text-slate-100">{item.label}</span>
                      <span className="text-[10px] text-blue-800/80 dark:text-slate-400 mt-1">{item.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Step 2: Upload Documents from Computer (Select, View, Download, Remove) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                    <Upload className="w-4 h-4 text-blue-400" />
                    <span>2. Upload Vendor Quotation Documents from Your Computer</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Select multiple supplier quote PDF, TXT, CSV, or JSON documents. You can view, download, include/exclude, or remove files before running analysis.
                  </p>
                </div>

                {documentList.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllDocuments}
                    className="text-xs text-slate-400 hover:text-rose-400 transition flex items-center space-x-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear All Files</span>
                  </button>
                )}
              </div>

              {/* Drag and Drop Zone */}
              <div className="border-2 border-dashed border-slate-700 hover:border-blue-500/80 rounded-2xl p-6 text-center transition bg-slate-950/50">
                <input
                  type="file"
                  multiple
                  id="user-file-input"
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.txt,.csv,.json,.doc,.docx"
                />
                <label htmlFor="user-file-input" className="cursor-pointer block space-y-2">
                  <div className="inline-flex p-3 bg-blue-600/10 border border-blue-500/30 rounded-2xl text-blue-400 shadow-lg">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-white block">
                      Click to Browse Files or Drag & Drop Here
                    </span>
                    <span className="text-xs text-slate-400">
                      Upload 2 or more supplier PDFs (e.g. 3 files, 7 files, 10 files, etc.)
                    </span>
                  </div>
                </label>
              </div>

              {/* Uploaded Documents Management Grid */}
              {documentList.length > 0 ? (
                <div className="space-y-2.5 pt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-semibold">
                      Uploaded Documents ({activeDocuments.length} of {documentList.length} selected for AI analysis):
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Use checkboxes to select/deselect specific files
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {documentList.map(doc => (
                      <div
                        key={doc.id}
                        className={`rounded-2xl p-3.5 border transition flex flex-col justify-between space-y-3 ${
                          doc.included
                            ? 'bg-slate-950 border-blue-500/40 shadow-md'
                            : 'bg-slate-950/40 border-slate-800/80 opacity-60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center space-x-2 truncate">
                            <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                            <div className="truncate">
                              <h4 className="text-xs font-bold text-white truncate" title={doc.name}>
                                {doc.name}
                              </h4>
                              <span className="text-[10px] text-slate-500 font-mono">
                                {(doc.size / 1024).toFixed(1)} KB
                              </span>
                            </div>
                          </div>

                          {/* Include Checkbox */}
                          <button
                            type="button"
                            onClick={() => handleToggleInclude(doc.id)}
                            className={`p-1 rounded-lg border transition ${
                              doc.included
                                ? 'bg-blue-600 border-blue-500 text-white'
                                : 'bg-slate-900 border-slate-700 text-slate-500'
                            }`}
                            title={doc.included ? 'Included in evaluation' : 'Excluded from evaluation'}
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Actions: View / Download / Remove */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                          <div className="flex items-center space-x-2">
                            <a
                              href={doc.previewUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-slate-400 hover:text-blue-400 flex items-center space-x-1 transition text-[11px]"
                              title="View Document in New Tab"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View</span>
                            </a>
                            <a
                              href={doc.previewUrl}
                              download={doc.name}
                              className="text-slate-400 hover:text-emerald-400 flex items-center space-x-1 transition text-[11px]"
                              title="Download File"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Download</span>
                            </a>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveDocument(doc.id)}
                            className="text-slate-500 hover:text-rose-400 p-1 transition"
                            title="Remove file"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-4 text-center">
                  <p className="text-xs text-slate-500">
                    No files uploaded yet. Select files from your computer above to begin.
                  </p>
                </div>
              )}
            </div>

            {/* Run Button Banner */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">
                    Ready to evaluate {activeDocuments.length} supplier document{activeDocuments.length === 1 ? '' : 's'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {activeDocuments.length < 2
                      ? '⚠️ Please select or upload at least 2 vendor quote files to start ranking.'
                      : `Priority Focus: ${priorityFocus} | Target Volume: ${targetQuantity} units`}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || activeDocuments.length < 2}
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-8 py-3 rounded-xl text-xs font-bold shadow-xl shadow-indigo-600/25 flex items-center justify-center space-x-2 transition disabled:opacity-40"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>AI Extracting Details & Ranking {activeDocuments.length} Suppliers...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Run AI Vendor Intelligence Ranking</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* RESULTS & COMMUNICATION HUB */}
          {result && (
            <div className="space-y-6 pt-4 animate-in fade-in zoom-in-95 duration-300">
              {/* Winner Hero Banner */}
              <div className="bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold px-3 py-1 rounded-full flex items-center space-x-1.5">
                        <Award className="w-3.5 h-3.5" />
                        <span>#1 WINNING VENDOR</span>
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        Target Volume: {targetQuantity} units
                      </span>
                      <span className="text-xs text-indigo-300 font-mono bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                        {priorityFocus}
                      </span>
                    </div>

                    <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                      {result.bestVendorName}
                    </h2>

                    {/* Extracted Contact Badge */}
                    <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                      {result.bestVendorEmail && (
                        <div className="flex items-center space-x-1.5 text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20">
                          <Mail className="w-3.5 h-3.5" />
                          <span className="font-mono">{result.bestVendorEmail}</span>
                        </div>
                      )}
                      {result.bestVendorPhone && (
                        <div className="flex items-center space-x-1.5 text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                          <Phone className="w-3.5 h-3.5" />
                          <span className="font-mono">{result.bestVendorPhone}</span>
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-slate-300 max-w-2xl leading-relaxed pt-1">
                      {result.executiveSummary}
                    </p>
                  </div>

                  <div className="flex flex-col items-center justify-center bg-slate-900/80 border border-slate-800 rounded-2xl p-5 min-w-[180px] text-center shadow-lg">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Composite Score</span>
                    <span className="text-4xl font-extrabold text-emerald-400 font-mono mt-1">
                      {result.overallRecommendationScore}
                      <span className="text-base text-slate-500">/100</span>
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1 font-medium">
                      Ranked #1 Across {result.scoringMatrix.length} Suppliers
                    </span>
                  </div>
                </div>
              </div>

              {/* Multi-Vendor Comparison Matrix */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <Layers className="w-4 h-4 text-blue-400" />
                    <span>Multi-Criteria Vendor Ranking Matrix ({result.scoringMatrix.length} Suppliers)</span>
                  </h3>
                  <span className="text-xs text-slate-400">Ranked by Composite Score</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {result.scoringMatrix.map((v, i) => {
                    const isWinner = v.vendorName === result.bestVendorName;
                    return (
                      <div
                        key={i}
                        className={`rounded-2xl p-5 border space-y-4 transition ${
                          isWinner
                            ? 'bg-indigo-950/30 border-indigo-500/50 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/30'
                            : 'bg-slate-950/60 border-slate-800'
                        }`}
                      >
                        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                isWinner ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                              }`}>
                                #{i + 1}
                              </span>
                              <h4 className="text-sm font-bold text-white truncate max-w-[150px]" title={v.vendorName}>
                                {v.vendorName}
                              </h4>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                              Total Cost: ${v.estimatedTotalContractCost?.toLocaleString() || 'N/A'}
                            </span>
                            {v.vendorEmail && (
                              <span className="text-[10px] text-blue-400 font-mono truncate block max-w-[180px]">
                                ✉️ {v.vendorEmail}
                              </span>
                            )}
                          </div>
                          <div className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold ${
                            isWinner ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-300'
                          }`}>
                            {v.compositeScore}/100
                          </div>
                        </div>

                        {/* Score Bars */}
                        <div className="space-y-2 text-xs">
                          <div>
                            <div className="flex justify-between text-[11px] mb-1">
                              <span className="text-slate-400">Price Score</span>
                              <span className="font-mono font-bold text-blue-400">{v.priceScore}%</span>
                            </div>
                            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-blue-500 h-full rounded-full" style={{ width: `${v.priceScore}%` }} />
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-[11px] mb-1">
                              <span className="text-slate-400">Quality & Specs</span>
                              <span className="font-mono font-bold text-purple-400">{v.qualityScore}%</span>
                            </div>
                            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-purple-500 h-full rounded-full" style={{ width: `${v.qualityScore}%` }} />
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-[11px] mb-1">
                              <span className="text-slate-400">Warranty Coverage</span>
                              <span className="font-mono font-bold text-emerald-400">{v.warrantyScore}%</span>
                            </div>
                            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${v.warrantyScore}%` }} />
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-[11px] mb-1">
                              <span className="text-slate-400">Lead Time & Speed</span>
                              <span className="font-mono font-bold text-amber-400">{v.leadTimeScore}%</span>
                            </div>
                            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-amber-500 h-full rounded-full" style={{ width: `${v.leadTimeScore}%` }} />
                            </div>
                          </div>
                        </div>

                        {/* Pros & Cons */}
                        <div className="space-y-2 pt-2 border-t border-slate-800 text-[11px]">
                          <div>
                            <span className="text-emerald-400 font-semibold block mb-1">Strengths:</span>
                            <ul className="space-y-1 text-slate-300">
                              {v.pros?.map((pro, pIdx) => (
                                <li key={pIdx} className="flex items-start space-x-1.5">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                  <span>{pro}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <span className="text-rose-400 font-semibold block mb-1">Constraints:</span>
                            <ul className="space-y-1 text-slate-400">
                              {v.cons?.map((con, cIdx) => (
                                <li key={cIdx} className="flex items-start space-x-1.5">
                                  <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                                  <span>{con}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tradeoffs & Risk Analysis */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <Sliders className="w-4 h-4 text-indigo-400" />
                    <span>Strategic Trade-Offs Analyzed</span>
                  </h3>
                  <div className="space-y-2.5 text-xs text-slate-300">
                    {result.keyTradeoffs?.map((tradeoff, tIdx) => (
                      <div key={tIdx} className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-1">
                        <span className="font-semibold text-indigo-300 block">{tradeoff.comparison}</span>
                        <p className="text-slate-400 leading-relaxed">{tradeoff.analysis}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Risk & Hidden Clause Evaluation</span>
                  </h3>
                  <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 text-xs text-slate-300 leading-relaxed">
                    {result.riskAnalysis}
                  </div>

                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-xs text-blue-300 space-y-1">
                    <span className="font-semibold block flex items-center space-x-1.5 text-blue-200">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Negotiation & Counter-Offer Strategy</span>
                    </span>
                    <p className="text-slate-300 leading-relaxed">{result.negotiationStrategy}</p>
                  </div>
                </div>
              </div>

              {/* EDITABLE VENDOR COMMUNICATION & DISPATCH HUB */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center space-x-2">
                      <Edit3 className="w-4 h-4 text-blue-400" />
                      <span>Vendor Direct Communication Hub (Nodemailer Email & Twilio SMS)</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Edit the context, recipient details, and send official RFP decisions directly from the UI.
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={copyEmailDraft}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition border border-slate-700"
                    >
                      {copiedEmail ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Text</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Recipient Contact Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1 font-medium flex items-center space-x-1.5">
                      <Mail className="w-3.5 h-3.5 text-blue-400" />
                      <span>Recipient Vendor Email (Auto-extracted from PDF)</span>
                    </label>
                    <input
                      type="email"
                      value={recipientEmail}
                      onChange={e => setRecipientEmail(e.target.value)}
                      placeholder="vendor@company.com"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 font-mono outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1 font-medium flex items-center space-x-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Recipient Vendor Phone (Auto-extracted from PDF)</span>
                    </label>
                    <input
                      type="text"
                      value={recipientPhone}
                      onChange={e => setRecipientPhone(e.target.value)}
                      placeholder="+1 555 0199"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 font-mono outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Email Section */}
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="text-slate-400 block mb-1 font-medium text-xs">
                      Email Subject Line
                    </label>
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={e => setEmailSubject(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100 outline-none focus:border-blue-500 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1 font-medium text-xs flex items-center justify-between">
                      <span>Email Message Body (Editable)</span>
                      <span className="text-[11px] text-slate-500">Edit text before dispatching</span>
                    </label>
                    <textarea
                      rows={6}
                      value={emailContent}
                      onChange={e => setEmailContent(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-blue-500 font-sans leading-relaxed"
                    />
                  </div>

                  {emailStatus && (
                    <div className={`p-3 rounded-xl text-xs font-semibold ${
                      emailStatus.startsWith('✅') ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                    }`}>
                      {emailStatus}
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleSendEmail}
                      disabled={sendingEmail || !recipientEmail}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-blue-600/20 flex items-center space-x-2 transition disabled:opacity-40"
                    >
                      {sendingEmail ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Dispatching via Nodemailer...</span>
                        </>
                      ) : (
                        <>
                          <Mail className="w-3.5 h-3.5" />
                          <span>Send Email via Nodemailer</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* SMS Section */}
                <div className="space-y-3 pt-4 border-t border-slate-800">
                  <div>
                    <label className="text-slate-400 block mb-1 font-medium text-xs flex items-center justify-between">
                      <span className="flex items-center space-x-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                        <span>SMS Notification Body (Twilio)</span>
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">{smsContent.length}/160 characters</span>
                    </label>
                    <textarea
                      rows={2}
                      value={smsContent}
                      onChange={e => setSmsContent(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-purple-500 font-mono leading-relaxed"
                    />
                  </div>

                  {smsStatus && (
                    <div className={`p-3 rounded-xl text-xs font-semibold ${
                      smsStatus.startsWith('✅') ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                    }`}>
                      {smsStatus}
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleSendSMS}
                      disabled={sendingSms || !recipientPhone}
                      className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-purple-600/20 flex items-center space-x-2 transition disabled:opacity-40"
                    >
                      {sendingSms ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Dispatching SMS via Twilio...</span>
                        </>
                      ) : (
                        <>
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Send SMS via Twilio</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
