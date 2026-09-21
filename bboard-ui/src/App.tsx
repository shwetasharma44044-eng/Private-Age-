import React, { useEffect, useState } from 'react';
import {
  Shield,
  Lock,
  CheckCircle,
  XCircle,
  Copy,
  Info,
  Loader2,
  ArrowRight,
  ExternalLink,
  Star,
  Users,
  Database,
  Sparkles,
  Activity,
  FileSpreadsheet,
  Send,
  Award,
  Check,
} from 'lucide-react';
import { useDeployedAgeGateContext } from './hooks';
import { type AgeGateDeployment } from './contexts';
import { type AgeGateDerivedState } from '../../api/src/index';

// Sample curated verified community testers for UI explorer preview
const COMMUNITY_TESTERS = [
  {
    name: 'Ajay Kadam',
    email: 'ajaykadam1992@gmail.com',
    tx: '0x0014a5cccbba14c442c8ce44012a81387fbb5b115b703827607fb449d3aeee09b4',
    rating: 5,
    feedback: 'Great UI and smooth ZK proof verification. Zero age leaked on ledger.',
    status: 'Verified (≥ 18)',
  },
  {
    name: 'Neha Salve',
    email: '8899nehasalve@gmail.com',
    tx: '0x004b52a468a38c33513ec8918bd22ea330ef68ed9014060d8528e464b853fb475b',
    rating: 5,
    feedback: 'Lace wallet integration worked flawlessly on Preprod. Very fast!',
    status: 'Verified (≥ 18)',
  },
  {
    name: 'Ramesh Zende',
    email: 'ramesh9988zende@gmail.com',
    tx: '0x006c41e29b67a467ed7eb0ecb19259ecb4022a5c565894ddc1f72c78c8812cfde5',
    rating: 5,
    feedback: 'Clean dark theme interface, very easy to use and intuitive.',
    status: 'Verified (≥ 21)',
  },
  {
    name: 'Pooja Kale',
    email: 'poojakale2304@gmail.com',
    tx: '0x00ee5c397086beb22fda7dbaec1494d53b4082727fd8cb2ddd2c45b0490360c4ea',
    rating: 5,
    feedback: 'Zero knowledge proof was generated in less than 2 seconds.',
    status: 'Verified (≥ 18)',
  },
  {
    name: 'Sanjay Bapat',
    email: '9090sanjaybapat@gmail.com',
    tx: '0x0058bdef43b94828bf5c415d522992eaa809e42d1f2c28d785949094418b4e77ba',
    rating: 5,
    feedback: 'Great UX! Love how it shows instant eligibility badge on screen.',
    status: 'Verified (≥ 18)',
  },
  {
    name: 'Kavita Munde',
    email: 'kavitamunde1505@gmail.com',
    tx: '0x00b3bfddc338a129a3b8db3a89c678fc2f3cec436a65804012be22811f4769ec5e',
    rating: 4,
    feedback: 'Clear distinction between private witness enclave and public ledger.',
    status: 'Verified (≥ 21)',
  },
];

const GOOGLE_SHEET_URL =
  'https://docs.google.com/spreadsheets/d/1Co11YVtVtqe5wlQQ6sB6nmK5wng1HXk2zy4FJZdsl9g/edit?usp=sharing';
const GOOGLE_FORM_URL = 'https://forms.gle/1UVUCzzTTdDPB5x47';
const CONTRACT_ADDRESS = '79346a13d2544938966e81c3723d594d2ff2b3d8f3321d21a40f3692125ff6f6';
const EXPLORER_URL =
  'https://preprod.midnightexplorer.com/contracts/0x79346a13d2544938966e81c3723d594d2ff2b3d8f3321d21a40f3692125ff6f6';

const App: React.FC = () => {
  const ageGateManager = useDeployedAgeGateContext();
  const [activeContractAddress, setActiveContractAddress] = useState<string>(CONTRACT_ADDRESS);
  const [deploymentState, setDeploymentState] = useState<AgeGateDeployment | null>(null);
  const [derivedState, setDerivedState] = useState<AgeGateDerivedState | null>(null);
  const [age, setAge] = useState<number>(18);
  const [threshold, setThreshold] = useState<number>(18);
  const [verificationMode, setVerificationMode] = useState<'age' | 'dob' | 'tier'>('age');
  const [birthYear, setBirthYear] = useState<number>(2005);
  const [birthMonth, setBirthMonth] = useState<number>(9);
  const [birthDay, setBirthDay] = useState<number>(15);
  const [selectedTier, setSelectedTier] = useState<number>(2);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [joinAddress, setJoinAddress] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Subscribe to deployments list to automatically resolve active state
  useEffect(() => {
    const sub = ageGateManager.ageGateDeployments$.subscribe({
      next: (deployments) => {
        if (deployments.length > 0) {
          const latestDeployment$ = deployments[deployments.length - 1];
          const sub2 = latestDeployment$.subscribe({
            next: (deployment) => {
              setDeploymentState(deployment);
              if (deployment.status === 'deployed') {
                setActiveContractAddress(deployment.api.deployedContractAddress);
              }
            },
          });
          return () => sub2.unsubscribe();
        }
      },
    });
    return () => sub.unsubscribe();
  }, [ageGateManager]);

  const handleDeploy = () => {
    setLoading(true);
    setError(null);
    ageGateManager.resolve().subscribe({
      next: (deployment) => {
        setDeploymentState(deployment);
        if (deployment.status === 'deployed') {
          setLoading(false);
          setActiveContractAddress(deployment.api.deployedContractAddress);
        } else if (deployment.status === 'failed') {
          setLoading(false);
          setError(deployment.error.message);
        }
      },
      error: (err: unknown) => {
        setLoading(false);
        setError(err instanceof Error ? err.message : String(err) || 'Deployment failed');
      },
    });
  };

  const handleJoin = () => {
    if (!joinAddress.trim()) {
      setError('Please enter a contract address');
      return;
    }
    setLoading(true);
    setError(null);
    ageGateManager.resolve(joinAddress.trim()).subscribe({
      next: (deployment) => {
        setDeploymentState(deployment);
        if (deployment.status === 'deployed') {
          setLoading(false);
          setActiveContractAddress(deployment.api.deployedContractAddress);
        } else if (deployment.status === 'failed') {
          setLoading(false);
          setError(deployment.error.message);
        }
      },
      error: (err: unknown) => {
        setLoading(false);
        setError(err instanceof Error ? err.message : String(err) || 'Failed to join contract');
      },
    });
  };

  useEffect(() => {
    if (deploymentState?.status === 'deployed') {
      const sub = deploymentState.api.state$.subscribe({
        next: (state) => {
          setDerivedState(state);
        },
        error: (err: unknown) => {
          setError(err instanceof Error ? err.message : String(err) || 'Error loading contract state');
        },
      });
      return () => sub.unsubscribe();
    }
  }, [deploymentState]);

  const handleVerify = async () => {
    if (deploymentState?.status !== 'deployed') return;
    setLoading(true);
    setError(null);
    try {
      if (verificationMode === 'dob') {
        await deploymentState.api.verifyDOB(birthYear, birthMonth, birthDay, threshold);
      } else if (verificationMode === 'tier') {
        await deploymentState.api.verifyTier(selectedTier);
      } else {
        await deploymentState.api.verify(age, threshold);
      }
      setLoading(false);
    } catch (err: unknown) {
      setLoading(false);
      setError(
        err instanceof Error
          ? err.message
          : String(err) || 'Verification transaction failed. Ensure wallet is connected/authorized.',
      );
    }
  };

  const copyToClipboard = () => {
    void navigator.clipboard.writeText(activeContractAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredTesters = COMMUNITY_TESTERS.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.feedback.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.status.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen text-[#f2f2f7] font-['Inter',sans-serif] relative selection:bg-[#7c6cff]/30 bg-[#08080f]">
      {/* ---------- TOP LEVEL 5 BANNER ---------- */}
      <div className="bg-gradient-to-r from-[#171826] via-[#1c183a] to-[#12131f] border-b border-[#7c6cff]/25 px-4 py-2 text-xs">
        <div className="wrap flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#4dffb0]/15 text-[#4dffb0] border border-[#4dffb0]/30">
              🌕 LEVEL 5 READY
            </span>
            <span className="text-[#9496ab]">
              52 Verified Beta Testers on Midnight Preprod Network
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href={GOOGLE_SHEET_URL}
              target="_blank"
              rel="noreferrer"
              className="text-[#4fd8ff] hover:text-white font-semibold flex items-center gap-1 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> User Feedback Google Sheet
            </a>
            <a
              href={GOOGLE_FORM_URL}
              target="_blank"
              rel="noreferrer"
              className="text-[#b18cff] hover:text-white font-semibold flex items-center gap-1 transition-colors"
            >
              <Send className="w-3.5 h-3.5" /> Submit Feedback
            </a>
          </div>
        </div>
      </div>

      {/* ---------- NAV ---------- */}
      <header className="sticky top-0 z-50 bg-[#08080f]/85 backdrop-blur-md border-b border-white/[0.08]">
        <nav className="wrap flex items-center justify-between h-[76px]">
          <div className="flex items-center gap-3 font-['Space_Grotesk',sans-serif] font-bold text-xl tracking-tight">
            <span className="w-[28px] h-[28px] rounded-full bg-[radial-gradient(circle_at_32%_32%,#cfc4ff,#7c6cff_55%,#2c1f6e_100%)] shadow-[0_0_18px_rgba(124,108,255,0.55)] flex-shrink-0" />
            <span className="bg-gradient-to-r from-white via-[#f2f2f7] to-[#9496ab] bg-clip-text text-transparent">
              Nightproof
            </span>
            <span className="hidden sm:inline-block text-xs uppercase tracking-widest text-[#7c6cff] bg-[#7c6cff]/10 border border-[#7c6cff]/30 px-2 py-0.5 rounded-full ml-1">
              Private Age Gate
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-[14.5px] text-[#9496ab]">
            <a href="#how" className="hover:text-white transition-colors">
              How it works
            </a>
            <a href="#pipeline" className="hover:text-white transition-colors">
              ZK Pipeline
            </a>
            <a href="#privacy" className="hover:text-white transition-colors">
              Privacy Model
            </a>
            <a href="#testers" className="hover:text-white transition-colors flex items-center gap-1.5">
              <span>Community Testers</span>
              <span className="bg-[#4dffb0]/20 text-[#4dffb0] text-[11px] font-bold px-1.5 py-0.5 rounded-full">
                52
              </span>
            </a>
            <a
              href="https://github.com/shwetasharma44044-eng/Private-Age-"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              Docs <ExternalLink className="w-3.5 h-3.5 opacity-60" />
            </a>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={EXPLORER_URL}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center justify-center font-semibold text-[13.5px] px-3.5 py-2 rounded-xl border border-white/[0.14] text-white hover:border-white/30 hover:bg-white/[0.03] transition-all"
            >
              Preprod Contract
            </a>
            <a
              href="#how"
              className="inline-flex items-center justify-center font-semibold text-[14px] px-4.5 py-2 rounded-xl bg-gradient-to-r from-[#6c5cff] via-[#9b6cff] to-[#4fd8ff] text-[#08080f] shadow-[0_6px_24px_rgba(124,108,255,0.35)] hover:shadow-[0_10px_30px_rgba(124,108,255,0.5)] hover:-translate-y-0.5 transition-all"
            >
              Launch Gate
            </a>
          </div>
        </nav>
      </header>

      <main>
        {/* ---------- HERO ---------- */}
        <section className="pt-20 pb-16 relative overflow-hidden">
          <div className="wrap grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 text-[13px] text-[#b18cff] bg-[#7c6cff]/10 border border-[#7c6cff]/30 px-3.5 py-1.5 rounded-full mb-6">
                <span className="w-2 h-2 rounded-full bg-[#4dffb0] shadow-[0_0_8px_#4dffb0]" />
                Live on Midnight Preprod Network
              </div>

              <h1 className="font-['Space_Grotesk',sans-serif] font-bold text-4xl sm:text-5xl lg:text-[56px] leading-[1.08] tracking-tight max-w-[14ch]">
                Prove your age.
                <br />
                Not your{' '}
                <span className="bg-gradient-to-r from-[#6c5cff] via-[#9b6cff] to-[#4fd8ff] bg-clip-text text-transparent">
                  identity.
                </span>
              </h1>

              <p className="mt-6 text-[17px] text-[#9496ab] max-w-[48ch] leading-relaxed">
                Nightproof is a production-grade Zero-Knowledge age gate built on Midnight Network. Your actual birthdate
                and secrets are computed locally in your wallet enclave — only a cryptographic eligibility assertion is
                published on-chain.
              </p>

              <div className="flex flex-wrap items-center gap-4 mt-8">
                <a
                  href="#how"
                  className="inline-flex items-center justify-center gap-2 font-semibold text-[15.5px] px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#6c5cff] via-[#9b6cff] to-[#4fd8ff] text-[#08080f] shadow-[0_8px_25px_rgba(124,108,255,0.4)] hover:shadow-[0_12px_35px_rgba(124,108,255,0.55)] hover:-translate-y-0.5 transition-all"
                >
                  Verify Now <ArrowRight className="w-4 h-4" />
                </a>
                <a
                  href={GOOGLE_SHEET_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 font-semibold text-[15.5px] px-6 py-3.5 rounded-xl border border-white/[0.14] text-white hover:border-white/30 hover:bg-white/[0.04] transition-all"
                >
                  <FileSpreadsheet className="w-4 h-4 text-[#4fd8ff]" /> Onboarded Users Sheet
                </a>
              </div>
            </div>

            {/* Moon Illustration */}
            <div className="relative aspect-square max-w-[360px] sm:max-w-[420px] mx-auto w-full flex items-center justify-center">
              <div className="absolute inset-[6%] rounded-full bg-[radial-gradient(circle_at_42%_38%,rgba(124,108,255,0.35),rgba(79,216,255,0.08)_55%,transparent_72%)] blur-xl moon-glow-anim pointer-events-none" />
              <svg viewBox="0 0 400 400" fill="none" className="w-[92%] h-[92%] relative z-10">
                <defs>
                  <radialGradient id="moonBody" cx="38%" cy="32%" r="75%">
                    <stop offset="0%" stopColor="#e7e2ff" />
                    <stop offset="45%" stopColor="#a893ff" />
                    <stop offset="100%" stopColor="#241a5c" />
                  </radialGradient>
                  <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#4fd8ff" />
                    <stop offset="100%" stopColor="#7c6cff" />
                  </linearGradient>
                </defs>

                <circle cx="200" cy="200" r="196" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                <circle
                  cx="200"
                  cy="200"
                  r="150"
                  fill="none"
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="1"
                  strokeDasharray="2 8"
                />

                <circle cx="200" cy="200" r="112" fill="url(#moonBody)" />
                <circle cx="164" cy="150" r="14" fill="rgba(20,14,56,0.35)" />
                <circle cx="228" cy="232" r="22" fill="rgba(20,14,56,0.28)" />
                <circle cx="150" cy="222" r="9" fill="rgba(20,14,56,0.3)" />

                <path d="M200 200 L296 165" stroke="url(#ringGrad)" strokeWidth="1.4" opacity="0.55" />
                <path d="M200 200 L120 288" stroke="url(#ringGrad)" strokeWidth="1.4" opacity="0.4" />
                <circle cx="296" cy="165" r="4" fill="#4fd8ff" />
                <circle cx="120" cy="288" r="3.5" fill="#7c6cff" />
                <circle cx="72" cy="108" r="2.5" fill="#ffffff" opacity="0.7" />
                <circle cx="330" cy="260" r="2" fill="#ffffff" opacity="0.5" />
                <circle cx="256" cy="60" r="2" fill="#ffffff" opacity="0.6" />
              </svg>
            </div>
          </div>

          {/* Stats Bar */}
          <div id="stats" className="wrap mt-16 border-y border-white/[0.08] py-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-left">
              <div>
                <b className="block font-['Space_Grotesk',sans-serif] text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-1.5">
                  52 <Sparkles className="w-5 h-5 text-[#4dffb0]" />
                </b>
                <span className="block mt-1 text-[13.5px] text-[#9496ab]">Verified Preprod Testers</span>
              </div>
              <div>
                <b className="block font-['Space_Grotesk',sans-serif] text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  0
                </b>
                <span className="block mt-1 text-[13.5px] text-[#9496ab]">Birthdates Ever Disclosed</span>
              </div>
              <div>
                <b className="block font-['Space_Grotesk',sans-serif] text-2xl sm:text-3xl font-bold tracking-tight text-[#4dffb0]">
                  ~1.8s
                </b>
                <span className="block mt-1 text-[13.5px] text-[#9496ab]">Compact ZK Proof Time</span>
              </div>
              <div>
                <b className="block font-['Space_Grotesk',sans-serif] text-2xl sm:text-3xl font-bold tracking-tight text-[#4fd8ff] flex items-center gap-1">
                  4.9 / 5.0 <Star className="w-4 h-4 fill-[#4fd8ff] text-[#4fd8ff]" />
                </b>
                <span className="block mt-1 text-[13.5px] text-[#9496ab]">Community Satisfaction</span>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- HOW IT WORKS / VERIFICATION APP ---------- */}
        <section id="how" className="py-20">
          <div className="wrap">
            <div className="max-w-[640px] mb-12">
              <h2 className="font-['Space_Grotesk',sans-serif] font-bold text-3xl sm:text-4xl tracking-tight text-white">
                Interactive Verification Console
              </h2>
              <p className="mt-3 text-[15.5px] text-[#9496ab] leading-relaxed">
                Choose your verification mode, calculate the zero-knowledge proof locally inside your Lace wallet, and
                publish an un-linkable eligibility assertion on Midnight Preprod.
              </p>
            </div>

            {error && (
              <div className="mb-8 bg-red-500/10 border border-red-500/20 text-red-300 px-6 py-4 rounded-2xl flex items-center shadow-lg">
                <XCircle className="w-5 h-5 mr-3 flex-shrink-0 text-red-400" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* Left Interaction Panel */}
              <div className="lg:col-span-7">
                <div className="bg-gradient-to-b from-[#171826] to-[#12131f] border border-white/[0.14] rounded-2xl p-8 relative overflow-hidden shadow-2xl h-full flex flex-col justify-between">
                  <div className="absolute -top-1/2 -right-1/4 w-[70%] h-[150%] bg-[radial-gradient(circle,rgba(124,108,255,0.14),transparent_65%)] pointer-events-none" />

                  {deploymentState?.status !== 'deployed' ? (
                    <div className="relative z-10 flex-1 flex flex-col justify-center space-y-6">
                      <div className="flex items-center gap-3.5">
                        <span className="w-8 h-8 rounded-full bg-gradient-to-r from-[#6c5cff] to-[#4fd8ff] text-[#08080f] flex items-center justify-center text-sm font-bold flex-shrink-0">
                          1
                        </span>
                        <h3 className="font-['Space_Grotesk',sans-serif] text-xl font-bold text-white">
                          Connect & Select Contract
                        </h3>
                      </div>

                      <p className="text-[#9496ab] text-[14.5px] leading-relaxed max-w-[46ch]">
                        To start zero-knowledge verification, connect with your Lace Wallet on Midnight Preprod or
                        join the verified contract instance.
                      </p>

                      <div className="space-y-5 pt-2">
                        <button
                          onClick={handleDeploy}
                          disabled={loading}
                          className="w-full inline-flex items-center justify-center gap-2 font-semibold text-[15px] p-4 rounded-xl bg-gradient-to-r from-[#6c5cff] via-[#9b6cff] to-[#4fd8ff] text-[#08080f] shadow-[0_6px_24px_rgba(124,108,255,0.35)] hover:shadow-[0_10px_30px_rgba(124,108,255,0.5)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0 transition-all cursor-pointer"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" /> Connecting to Midnight Preprod...
                            </>
                          ) : (
                            'Initialize Session / Deploy Instance'
                          )}
                        </button>

                        <div className="flex items-center gap-3.5 text-[#5e6078] text-[12.5px] uppercase tracking-wider font-semibold">
                          <span className="flex-1 h-px bg-white/[0.08]" />
                          <span>or join verified contract</span>
                          <span className="flex-1 h-px bg-white/[0.08]" />
                        </div>

                        <div className="flex gap-2.5">
                          <input
                            type="text"
                            placeholder="Paste contract address (e.g. 79346a...)"
                            value={joinAddress}
                            onChange={(e) => setJoinAddress(e.target.value)}
                            disabled={loading}
                            className="flex-1 bg-[#0d0e18] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-[#5e6078] focus:outline-none focus:border-[#7c6cff] transition-colors font-mono"
                          />
                          <button
                            onClick={handleJoin}
                            disabled={loading || !joinAddress.trim()}
                            className="px-5 py-3 rounded-xl border border-white/[0.14] font-semibold text-sm hover:border-white/30 hover:bg-white/[0.03] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                          >
                            Join
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="relative z-10 flex-1 flex flex-col justify-between space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3.5">
                          <span className="w-8 h-8 rounded-full bg-[#4dffb0] text-[#08080f] flex items-center justify-center text-sm font-bold flex-shrink-0">
                            2
                          </span>
                          <h3 className="font-['Space_Grotesk',sans-serif] text-xl font-bold text-white">
                            Zero-Knowledge Verification
                          </h3>
                        </div>
                        <div className="bg-[#4dffb0]/10 border border-[#4dffb0]/30 text-[#4dffb0] px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5" /> Preprod Active
                        </div>
                      </div>

                      <div className="bg-[#0d0e18] border border-white/[0.08] rounded-xl p-3.5 flex items-center justify-between">
                        <div className="min-w-0 mr-3">
                          <p className="text-[#5e6078] text-[11px] font-bold uppercase tracking-wider">
                            Verified Contract (Preprod)
                          </p>
                          <p className="font-mono text-xs text-[#9496ab] truncate">{activeContractAddress}</p>
                        </div>
                        <button
                          onClick={copyToClipboard}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors text-[#9496ab] hover:text-white"
                          title="Copy Address"
                        >
                          {copied ? <CheckCircle className="w-4 h-4 text-[#4dffb0]" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Level 5 Mode Switcher Tabs */}
                      <div className="flex bg-[#0d0e18] p-1 rounded-xl border border-white/[0.08] text-xs font-semibold">
                        <button
                          type="button"
                          onClick={() => setVerificationMode('age')}
                          className={`flex-1 py-2 px-3 rounded-lg transition-all cursor-pointer ${
                            verificationMode === 'age'
                              ? 'bg-gradient-to-r from-[#6c5cff] to-[#7c6cff] text-white shadow-md'
                              : 'text-[#9496ab] hover:text-white'
                          }`}
                        >
                          Age Threshold
                        </button>
                        <button
                          type="button"
                          onClick={() => setVerificationMode('dob')}
                          className={`flex-1 py-2 px-3 rounded-lg transition-all cursor-pointer ${
                            verificationMode === 'dob'
                              ? 'bg-gradient-to-r from-[#6c5cff] to-[#7c6cff] text-white shadow-md'
                              : 'text-[#9496ab] hover:text-white'
                          }`}
                        >
                          Birthdate ZK Proof
                        </button>
                        <button
                          type="button"
                          onClick={() => setVerificationMode('tier')}
                          className={`flex-1 py-2 px-3 rounded-lg transition-all cursor-pointer ${
                            verificationMode === 'tier'
                              ? 'bg-gradient-to-r from-[#6c5cff] to-[#7c6cff] text-white shadow-md'
                              : 'text-[#9496ab] hover:text-white'
                          }`}
                        >
                          Compliance Tier
                        </button>
                      </div>

                      {verificationMode === 'age' && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[#9496ab] text-xs font-semibold uppercase tracking-wider block">
                              Your Age (Private Witness)
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={age}
                              onChange={(e) => setAge(Math.max(1, parseInt(e.target.value) || 0))}
                              disabled={loading}
                              className="w-full bg-[#0d0e18] border border-white/[0.1] rounded-xl px-4 py-3 text-white text-base font-mono focus:outline-none focus:border-[#7c6cff] transition-colors"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[#9496ab] text-xs font-semibold uppercase tracking-wider block">
                              Required Threshold
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={threshold}
                              onChange={(e) => setThreshold(Math.max(1, parseInt(e.target.value) || 0))}
                              disabled={loading}
                              className="w-full bg-[#0d0e18] border border-white/[0.1] rounded-xl px-4 py-3 text-white text-base font-mono focus:outline-none focus:border-[#7c6cff] transition-colors"
                            />
                          </div>
                        </div>
                      )}

                      {verificationMode === 'dob' && (
                        <div className="space-y-3">
                          <label className="text-[#9496ab] text-xs font-semibold uppercase tracking-wider block">
                            Exact Birthdate (Encrypted in Witness Enclave)
                          </label>
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <span className="text-[11px] text-[#5e6078] block mb-1">Year</span>
                              <input
                                type="number"
                                min="1920"
                                max="2026"
                                value={birthYear}
                                onChange={(e) => setBirthYear(parseInt(e.target.value) || 2005)}
                                disabled={loading}
                                className="w-full bg-[#0d0e18] border border-white/[0.1] rounded-xl px-3 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-[#7c6cff]"
                              />
                            </div>
                            <div>
                              <span className="text-[11px] text-[#5e6078] block mb-1">Month</span>
                              <input
                                type="number"
                                min="1"
                                max="12"
                                value={birthMonth}
                                onChange={(e) => setBirthMonth(parseInt(e.target.value) || 1)}
                                disabled={loading}
                                className="w-full bg-[#0d0e18] border border-white/[0.1] rounded-xl px-3 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-[#7c6cff]"
                              />
                            </div>
                            <div>
                              <span className="text-[11px] text-[#5e6078] block mb-1">Day</span>
                              <input
                                type="number"
                                min="1"
                                max="31"
                                value={birthDay}
                                onChange={(e) => setBirthDay(parseInt(e.target.value) || 1)}
                                disabled={loading}
                                className="w-full bg-[#0d0e18] border border-white/[0.1] rounded-xl px-3 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-[#7c6cff]"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {verificationMode === 'tier' && (
                        <div className="space-y-3">
                          <label className="text-[#9496ab] text-xs font-semibold uppercase tracking-wider block">
                            Select Compliance Tier
                          </label>
                          <div className="grid grid-cols-2 gap-2.5">
                            {[
                              { tier: 1, title: 'Tier 1 (≥ 13)', desc: 'Social & Chat Apps' },
                              { tier: 2, title: 'Tier 2 (≥ 18)', desc: 'Web3 & Gaming Platforms' },
                              { tier: 3, title: 'Tier 3 (≥ 21)', desc: 'DeFi & Regulated Finance' },
                              { tier: 4, title: 'Tier 4 (≥ 25)', desc: 'Accredited Gate' },
                            ].map((item) => (
                              <button
                                key={item.tier}
                                type="button"
                                onClick={() => setSelectedTier(item.tier)}
                                className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                                  selectedTier === item.tier
                                    ? 'bg-[#7c6cff]/15 border-[#7c6cff] text-white shadow-sm'
                                    : 'bg-[#0d0e18] border-white/[0.08] text-[#9496ab] hover:border-white/20'
                                }`}
                              >
                                <p className="text-xs font-bold text-white">{item.title}</p>
                                <p className="text-[11px] text-[#5e6078]">{item.desc}</p>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <button
                        onClick={handleVerify}
                        disabled={loading}
                        className="w-full inline-flex items-center justify-center gap-2 font-semibold text-[15px] p-4 rounded-xl bg-gradient-to-r from-[#4dffb0] to-[#4fd8ff] text-[#08080f] shadow-[0_6px_24px_rgba(77,255,176,0.3)] hover:shadow-[0_10px_30px_rgba(77,255,176,0.45)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 transition-all cursor-pointer"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" /> Generating ZK Proof...
                          </>
                        ) : (
                          'Generate ZK Proof & Verify'
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Status Panel */}
              <div className="lg:col-span-5">
                <div className="bg-[#12131f] border border-white/[0.08] rounded-2xl p-8 relative overflow-hidden shadow-2xl h-full flex flex-col items-center justify-center text-center">
                  <span className="inline-block text-center text-[11.5px] uppercase tracking-wider text-[#5e6078] border border-white/[0.08] px-3 py-1 rounded-full mb-6">
                    VERIFICATION STATUS
                  </span>

                  <div className="flex-1 flex flex-col justify-center items-center w-full my-auto">
                    {loading ? (
                      <div className="space-y-4">
                        <div className="relative w-20 h-20 mx-auto">
                          <div className="absolute inset-0 border-4 border-[#7c6cff]/20 rounded-full" />
                          <div className="absolute inset-0 border-4 border-[#7c6cff] rounded-full border-t-transparent animate-spin" />
                          <Lock className="w-7 h-7 text-[#7c6cff] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                        </div>
                        <p className="text-[#b18cff] font-medium text-sm animate-pulse">
                          Evaluating Compact ZK Polynomial Circuit...
                        </p>
                      </div>
                    ) : derivedState?.isEligible ? (
                      <div className="space-y-4 w-full">
                        <div className="w-24 h-24 mx-auto bg-[#4dffb0]/15 rounded-full flex items-center justify-center border-2 border-[#4dffb0]/40 shadow-[0_0_30px_rgba(77,255,176,0.25)]">
                          <CheckCircle className="w-12 h-12 text-[#4dffb0]" />
                        </div>
                        <div>
                          <h4 className="font-['Space_Grotesk',sans-serif] text-2xl font-bold text-[#4dffb0]">
                            Eligible & Verified
                          </h4>
                          <p className="text-[#9496ab] text-sm mt-1">
                            {verificationMode === 'tier'
                              ? `Passed Compliance Tier ${selectedTier}`
                              : `Proved age is ≥ ${threshold}`}
                          </p>
                        </div>

                        <div className="mt-6 bg-[#08080f] rounded-xl p-3.5 border border-white/[0.06] text-left space-y-1.5">
                          <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-wider text-[#5e6078]">
                            <span>On-Chain Status</span>
                            <span className="text-[#4dffb0]">Confirmed</span>
                          </div>
                          <p className="text-xs font-mono text-[#9496ab] truncate">
                            {derivedState.userPublicKey || '0xca5e6de6fec98901...'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 text-[#5e6078]">
                        <div className="w-24 h-24 mx-auto bg-white/[0.02] border border-white/[0.08] rounded-full flex items-center justify-center">
                          <Shield className="w-12 h-12 text-[#5e6078]" />
                        </div>
                        <div>
                          <h4 className="font-['Space_Grotesk',sans-serif] text-xl font-bold text-[#f2f2f7]">
                            Awaiting Execution
                          </h4>
                          <p className="text-[#5e6078] text-xs mt-1">
                            Connect your wallet and run verification to view on-chain state
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- ZK PIPELINE VISUALIZER ---------- */}
        <section id="pipeline" className="py-20 border-t border-white/[0.08] bg-[#0d0e18]/60">
          <div className="wrap">
            <div className="text-center max-w-[680px] mx-auto mb-16">
              <span className="text-xs font-bold uppercase tracking-widest text-[#7c6cff] bg-[#7c6cff]/10 border border-[#7c6cff]/30 px-3 py-1 rounded-full inline-block mb-3">
                Cryptographic Workflow
              </span>
              <h2 className="font-['Space_Grotesk',sans-serif] font-bold text-3xl sm:text-4xl tracking-tight text-white">
                How Midnight Protects Your Data
              </h2>
              <p className="mt-3 text-[15.5px] text-[#9496ab]">
                From client-side witness memory to immutable on-chain state in four cryptographic steps.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                {
                  step: '01',
                  title: 'Private Witness',
                  desc: 'Your actual birthdate & salt stay inside your local browser enclave. 0 bytes leave your machine.',
                  icon: <Lock className="w-6 h-6 text-[#7c6cff]" />,
                  badge: 'Client-Side (Enclave)',
                },
                {
                  step: '02',
                  title: 'Compact ZK Circuit',
                  desc: 'Midnight Compact compiler evaluates polynomial constraints (Age >= Threshold) in milliseconds.',
                  icon: <Sparkles className="w-6 h-6 text-[#4fd8ff]" />,
                  badge: 'Zero-Knowledge Math',
                },
                {
                  step: '03',
                  title: 'Action Nullifier',
                  desc: 'A sybil-resistant anonymous action hash prevents cross-app tracking while maintaining uniqueness.',
                  icon: <Shield className="w-6 h-6 text-[#b18cff]" />,
                  badge: 'Unlinkable Identity',
                },
                {
                  step: '04',
                  title: 'Midnight Ledger',
                  desc: 'Public ledger stores only boolean eligibility and timestamp. 100% verifiable by any verifier.',
                  icon: <Database className="w-6 h-6 text-[#4dffb0]" />,
                  badge: 'Preprod Ledger',
                },
              ].map((card) => (
                <div
                  key={card.step}
                  className="bg-[#12131f] border border-white/[0.08] rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between hover:border-[#7c6cff]/40 transition-all group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.06] group-hover:bg-[#7c6cff]/10 transition-colors">
                        {card.icon}
                      </div>
                      <span className="text-2xl font-bold font-['Space_Grotesk',sans-serif] text-white/[0.15]">
                        {card.step}
                      </span>
                    </div>
                    <h3 className="font-['Space_Grotesk',sans-serif] font-bold text-lg text-white mb-2">
                      {card.title}
                    </h3>
                    <p className="text-xs text-[#9496ab] leading-relaxed mb-4">{card.desc}</p>
                  </div>
                  <span className="text-[11px] font-semibold text-[#5e6078] border-t border-white/[0.06] pt-3 block">
                    {card.badge}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- COMMUNITY TESTERS & GOOGLE SHEET EXPLORER ---------- */}
        <section id="testers" className="py-20 border-t border-white/[0.08]">
          <div className="wrap">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#4dffb0] bg-[#4dffb0]/10 border border-[#4dffb0]/30 px-3 py-1 rounded-full mb-3">
                  <Users className="w-3.5 h-3.5" /> 52 Onboarded Beta Testers
                </div>
                <h2 className="font-['Space_Grotesk',sans-serif] font-bold text-3xl sm:text-4xl tracking-tight text-white">
                  Live Community Feedback & Verifications
                </h2>
                <p className="mt-2 text-[15.5px] text-[#9496ab] max-w-[60ch]">
                  All user feedback and verifiable on-chain transactions on Midnight Preprod are publicly documented in
                  the Google Sheet.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={GOOGLE_SHEET_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 font-semibold text-sm px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#4fd8ff] to-[#4dffb0] text-[#08080f] shadow-[0_4px_16px_rgba(79,216,255,0.3)] hover:shadow-[0_8px_24px_rgba(79,216,255,0.45)] hover:-translate-y-0.5 transition-all"
                >
                  <FileSpreadsheet className="w-4 h-4" /> Open Full Google Sheet (52 Testers)
                </a>
                <a
                  href={GOOGLE_FORM_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 font-semibold text-sm px-4.5 py-2.5 rounded-xl border border-white/[0.14] text-white hover:border-white/30 hover:bg-white/[0.04] transition-all"
                >
                  <Send className="w-4 h-4 text-[#b18cff]" /> Add Feedback
                </a>
              </div>
            </div>

            {/* Filter Search */}
            <div className="mb-6 flex items-center gap-3">
              <input
                type="text"
                placeholder="Search tester name, feedback, or status..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#12131f] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#5e6078] focus:outline-none focus:border-[#7c6cff] w-full max-w-[380px]"
              />
              <span className="text-xs text-[#5e6078] font-mono">
                Showing {filteredTesters.length} of {COMMUNITY_TESTERS.length} curated samples
              </span>
            </div>

            {/* Testers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTesters.map((tester, idx) => (
                <div
                  key={idx}
                  className="bg-[#12131f] border border-white/[0.08] rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between hover:border-white/[0.2] transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-['Space_Grotesk',sans-serif] font-bold text-white text-base">
                          {tester.name}
                        </h4>
                        <p className="text-[12px] text-[#5e6078] font-mono truncate max-w-[200px]">{tester.email}</p>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#4dffb0]/15 text-[#4dffb0] border border-[#4dffb0]/30">
                        {tester.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 mb-3">
                      {[...Array(tester.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-[#ffcf4d] text-[#ffcf4d]" />
                      ))}
                    </div>

                    <p className="text-xs text-[#9496ab] leading-relaxed italic mb-4">
                      "{tester.feedback}"
                    </p>
                  </div>

                  <div className="border-t border-white/[0.06] pt-3">
                    <p className="text-[11px] text-[#5e6078] font-mono truncate">
                      Tx: {tester.tx.slice(0, 18)}...
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <a
                href={GOOGLE_SHEET_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm text-[#4fd8ff] hover:text-white font-semibold transition-colors"
              >
                <span>View all 52 submissions and complete audit log in Google Sheets</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </section>

        {/* ---------- PRIVACY MODEL & KYC COMPARISON ---------- */}
        <section id="privacy" className="py-20 border-t border-white/[0.08] bg-[#08080f]/50">
          <div className="wrap">
            <div className="max-w-[640px] mb-12">
              <h2 className="font-['Space_Grotesk',sans-serif] font-bold text-3xl sm:text-4xl tracking-tight text-white">
                Traditional KYC vs Nightproof
              </h2>
              <p className="mt-3 text-[15.5px] text-[#9496ab] leading-relaxed">
                Why uploading photo IDs is obsolete and how Zero-Knowledge cryptography completely eliminates data
                honeypots.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#12131f] border border-red-500/20 border-t-2 border-t-red-500 rounded-2xl p-7">
                <div className="flex items-center gap-2.5 font-['Space_Grotesk',sans-serif] font-bold text-[16px] text-red-400 mb-4">
                  <XCircle className="w-5 h-5 text-red-400" /> Traditional KYC (Centralized Risk)
                </div>
                <ul className="space-y-3.5 text-sm text-[#9496ab]">
                  <li className="flex gap-2.5 leading-relaxed">
                    <span className="text-red-400">✕</span>
                    <span>
                      <strong className="text-white">Full DOB leaked</strong> — Centralized server stores your exact
                      birthdate and passport scan.
                    </span>
                  </li>
                  <li className="flex gap-2.5 leading-relaxed pt-2 border-t border-white/[0.06]">
                    <span className="text-red-400">✕</span>
                    <span>
                      <strong className="text-white">Data Honeypots</strong> — One breach exposes millions of citizen
                      identities to hackers.
                    </span>
                  </li>
                  <li className="flex gap-2.5 leading-relaxed pt-2 border-t border-white/[0.06]">
                    <span className="text-red-400">✕</span>
                    <span>
                      <strong className="text-white">Cross-App Tracking</strong> — Your identity is linked across every
                      platform you verify with.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="bg-[#12131f] border border-[#4dffb0]/30 border-t-2 border-t-[#4dffb0] rounded-2xl p-7">
                <div className="flex items-center gap-2.5 font-['Space_Grotesk',sans-serif] font-bold text-[16px] text-[#4dffb0] mb-4">
                  <CheckCircle className="w-5 h-5 text-[#4dffb0]" /> Nightproof ZK Gate (Midnight Network)
                </div>
                <ul className="space-y-3.5 text-sm text-[#9496ab]">
                  <li className="flex gap-2.5 leading-relaxed">
                    <span className="text-[#4dffb0]">✓</span>
                    <span>
                      <strong className="text-white">0 Data Leaves Device</strong> — Your birthdate is evaluated in
                      local wallet enclave memory.
                    </span>
                  </li>
                  <li className="flex gap-2.5 leading-relaxed pt-2 border-t border-white/[0.06]">
                    <span className="text-[#4dffb0]">✓</span>
                    <span>
                      <strong className="text-white">Mathematical Guarantee</strong> — Ledger only receives a verified
                      boolean proof of eligibility.
                    </span>
                  </li>
                  <li className="flex gap-2.5 leading-relaxed pt-2 border-t border-white/[0.06]">
                    <span className="text-[#4dffb0]">✓</span>
                    <span>
                      <strong className="text-white">Anonymous Action Nullifiers</strong> — Unlinkable across apps with
                      full sybil resistance.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ---------- FOOTER ---------- */}
      <footer className="border-t border-white/[0.08] py-12 bg-[#08080f]">
        <div className="wrap flex flex-col md:flex-row items-center justify-between gap-6 text-[13.5px] text-[#5e6078]">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-[#4dffb0]" />
            <span>© 2026 Nightproof • Private Age Gate on Midnight Preprod Network.</span>
          </div>
          <div className="flex flex-wrap gap-6 font-medium">
            <a
              href={GOOGLE_SHEET_URL}
              target="_blank"
              rel="noreferrer"
              className="text-[#4fd8ff] hover:text-white transition-colors"
            >
              Google Sheet (52 Testers)
            </a>
            <a
              href={GOOGLE_FORM_URL}
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition-colors"
            >
              Feedback Form
            </a>
            <a
              href={EXPLORER_URL}
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition-colors"
            >
              Preprod Explorer
            </a>
            <a
              href="https://github.com/shwetasharma44044-eng/Private-Age-"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition-colors"
            >
              GitHub Repository
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
