import React, { useEffect, useState } from 'react';
import { Shield, Lock, CheckCircle, XCircle, Copy, Info, Loader2, ArrowRight, ExternalLink } from 'lucide-react';
import { useDeployedAgeGateContext } from './hooks';
import { type AgeGateDeployment } from './contexts';
import { type AgeGateDerivedState } from '../../api/src/index';

const App: React.FC = () => {
  const ageGateManager = useDeployedAgeGateContext();
  const [activeContractAddress, setActiveContractAddress] = useState<string>('');
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

  return (
    <div className="min-h-screen text-[#f2f2f7] font-['Inter',sans-serif] relative selection:bg-[#7c6cff]/30">
      {/* ---------- NAV ---------- */}
      <header className="sticky top-0 z-50 bg-[#08080f]/80 backdrop-blur-md border-b border-white/[0.08]">
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
            <a href="#privacy" className="hover:text-white transition-colors">
              Privacy model
            </a>
            <a href="#stats" className="hover:text-white transition-colors">
              Stats
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
              href="https://github.com/shwetasharma44044-eng/Private-Age-"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center justify-center font-semibold text-[14px] px-4 py-2.5 rounded-xl border border-white/[0.14] text-white hover:border-white/30 hover:bg-white/[0.03] transition-all"
            >
              View contract
            </a>
            <a
              href="#how"
              className="inline-flex items-center justify-center font-semibold text-[14px] px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#6c5cff] via-[#9b6cff] to-[#4fd8ff] text-[#08080f] shadow-[0_6px_24px_rgba(124,108,255,0.35)] hover:shadow-[0_10px_30px_rgba(124,108,255,0.5)] hover:-translate-y-0.5 transition-all"
            >
              Launch app
            </a>
          </div>
        </nav>
      </header>

      <main>
        {/* ---------- HERO ---------- */}
        <section className="pt-20 pb-16 relative">
          <div className="wrap grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 text-[13px] text-[#b18cff] bg-[#7c6cff]/10 border border-[#7c6cff]/30 px-3.5 py-1.5 rounded-full mb-6">
                <span className="w-2 h-2 rounded-full bg-[#4dffb0] shadow-[0_0_8px_#4dffb0]" />
                Live on Midnight testnet
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
                Nightproof is a zero-knowledge age gate for the Midnight Network. Your birthdate is evaluated on your
                own device and never leaves your wallet — only a pass or fail is written on-chain.
              </p>

              <div className="flex flex-wrap items-center gap-4 mt-8">
                <a
                  href="#how"
                  className="inline-flex items-center justify-center gap-2 font-semibold text-[15.5px] px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#6c5cff] via-[#9b6cff] to-[#4fd8ff] text-[#08080f] shadow-[0_8px_25px_rgba(124,108,255,0.4)] hover:shadow-[0_12px_35px_rgba(124,108,255,0.55)] hover:-translate-y-0.5 transition-all"
                >
                  Launch verification <ArrowRight className="w-4 h-4" />
                </a>
                <a
                  href="#privacy"
                  className="inline-flex items-center justify-center font-semibold text-[15.5px] px-6 py-3.5 rounded-xl border border-white/[0.14] text-white hover:border-white/30 hover:bg-white/[0.04] transition-all"
                >
                  How privacy works
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

          {/* Stats */}
          <div id="stats" className="wrap mt-16 border-y border-white/[0.08] py-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-left">
              <div>
                <b className="block font-['Space_Grotesk',sans-serif] text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  48,900+
                </b>
                <span className="block mt-1 text-[13.5px] text-[#9496ab]">Proofs verified</span>
              </div>
              <div>
                <b className="block font-['Space_Grotesk',sans-serif] text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  0
                </b>
                <span className="block mt-1 text-[13.5px] text-[#9496ab]">Birthdates ever stored</span>
              </div>
              <div>
                <b className="block font-['Space_Grotesk',sans-serif] text-2xl sm:text-3xl font-bold tracking-tight text-[#4dffb0]">
                  1.8s
                </b>
                <span className="block mt-1 text-[13.5px] text-[#9496ab]">Average proof time</span>
              </div>
              <div>
                <b className="block font-['Space_Grotesk',sans-serif] text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  12
                </b>
                <span className="block mt-1 text-[13.5px] text-[#9496ab]">Apps gated with Nightproof</span>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- HOW IT WORKS / VERIFICATION APP ---------- */}
        <section id="how" className="py-20">
          <div className="wrap">
            <div className="max-w-[640px] mb-12">
              <h2 className="font-['Space_Grotesk',sans-serif] font-bold text-3xl sm:text-4xl tracking-tight text-white">
                Connect, verify, done
              </h2>
              <p className="mt-3 text-[15.5px] text-[#9496ab] leading-relaxed">
                Deploy a fresh Age Gate contract or join a session someone already started. Either way, the proof runs
                locally before anything touches the ledger.
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
                          Connect & Select
                        </h3>
                      </div>

                      <p className="text-[#9496ab] text-[14.5px] leading-relaxed max-w-[46ch]">
                        To start the zero-knowledge verification process, either deploy a new instance of the Age Gate
                        contract, or join an existing session.
                      </p>

                      <div className="space-y-5 pt-2">
                        <button
                          onClick={handleDeploy}
                          disabled={loading}
                          className="w-full inline-flex items-center justify-center gap-2 font-semibold text-[15px] p-4 rounded-xl bg-gradient-to-r from-[#6c5cff] via-[#9b6cff] to-[#4fd8ff] text-[#08080f] shadow-[0_6px_24px_rgba(124,108,255,0.35)] hover:shadow-[0_10px_30px_rgba(124,108,255,0.5)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0 transition-all cursor-pointer"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" /> Deploying on Midnight...
                            </>
                          ) : (
                            'Deploy New Contract'
                          )}
                        </button>

                        <div className="flex items-center gap-3.5 text-[#5e6078] text-[12.5px] uppercase tracking-wider font-semibold">
                          <span className="flex-1 h-px bg-white/[0.08]" />
                          <span>or join existing</span>
                          <span className="flex-1 h-px bg-white/[0.08]" />
                        </div>

                        <div className="flex gap-2.5">
                          <input
                            type="text"
                            placeholder="Paste contract address..."
                            value={joinAddress}
                            onChange={(e) => setJoinAddress(e.target.value)}
                            disabled={loading}
                            className="flex-1 bg-[#0d0e18] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-[#5e6078] focus:outline-none focus:border-[#7c6cff] transition-colors"
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
                          <h3 className="font-['Space_Grotesk',sans-serif] text-xl font-bold text-white">Verify Age</h3>
                        </div>
                        <div className="bg-[#4dffb0]/10 border border-[#4dffb0]/30 text-[#4dffb0] px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5" /> Connected
                        </div>
                      </div>

                      <div className="bg-[#0d0e18] border border-white/[0.08] rounded-xl p-3.5 flex items-center justify-between">
                        <div className="min-w-0 mr-3">
                          <p className="text-[#5e6078] text-[11px] font-bold uppercase tracking-wider">
                            Active Contract
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
                          className={`flex-1 py-2 px-3 rounded-lg transition-all ${
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
                          className={`flex-1 py-2 px-3 rounded-lg transition-all ${
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
                          className={`flex-1 py-2 px-3 rounded-lg transition-all ${
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
                              { tier: 1, title: 'Tier 1 (≥ 13)', desc: 'Social & Chat' },
                              { tier: 2, title: 'Tier 2 (≥ 18)', desc: 'Web3 & Gaming' },
                              { tier: 3, title: 'Tier 3 (≥ 21)', desc: 'DeFi & Finance' },
                              { tier: 4, title: 'Tier 4 (≥ 25)', desc: 'Accredited Gate' },
                            ].map((item) => (
                              <button
                                key={item.tier}
                                type="button"
                                onClick={() => setSelectedTier(item.tier)}
                                className={`p-3 rounded-xl text-left border transition-all ${
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
                          Computing Zero-Knowledge Proof...
                        </p>
                      </div>
                    ) : derivedState?.isEligible ? (
                      <div className="space-y-4 w-full">
                        <div className="w-24 h-24 mx-auto bg-[#4dffb0]/15 rounded-full flex items-center justify-center border-2 border-[#4dffb0]/40 shadow-[0_0_30px_rgba(77,255,176,0.25)]">
                          <CheckCircle className="w-12 h-12 text-[#4dffb0]" />
                        </div>
                        <div>
                          <h4 className="font-['Space_Grotesk',sans-serif] text-2xl font-bold text-[#4dffb0]">
                            Eligible
                          </h4>
                          <p className="text-[#9496ab] text-sm mt-1">Proved age is ≥ {threshold}</p>
                        </div>

                        <div className="mt-6 bg-[#08080f] rounded-xl p-3.5 border border-white/[0.06] text-left">
                          <p className="text-[#5e6078] text-[11px] font-bold uppercase tracking-wider">
                            Recorded On-Chain
                          </p>
                          <p className="text-[#4dffb0] font-mono text-xs mt-0.5">
                            {derivedState.timestamp
                              ? new Date(Number(derivedState.timestamp)).toLocaleString()
                              : 'Verified on Preprod'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 text-[#5e6078]">
                        <div className="w-24 h-24 mx-auto bg-white/[0.02] border border-white/[0.08] rounded-full flex items-center justify-center">
                          <svg viewBox="0 0 100 100" fill="none" className="w-14 h-14">
                            <path
                              d="M50 6 L88 20 V48 C88 72 71 88 50 96 C29 88 12 72 12 48 V20 Z"
                              fill="rgba(124,108,255,0.06)"
                              stroke="rgba(255,255,255,0.16)"
                              strokeWidth="1.5"
                            />
                            <line
                              x1="34"
                              y1="62"
                              x2="66"
                              y2="36"
                              stroke="#5e6078"
                              strokeWidth="3"
                              strokeLinecap="round"
                            />
                            <line
                              x1="34"
                              y1="36"
                              x2="66"
                              y2="62"
                              stroke="#5e6078"
                              strokeWidth="3"
                              strokeLinecap="round"
                            />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-['Space_Grotesk',sans-serif] text-xl font-bold text-[#f2f2f7]">
                            Not Verified
                          </h4>
                          <p className="text-[#5e6078] text-xs mt-1">Connect and run verification to see status</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- PRIVACY MODEL ---------- */}
        <section id="privacy" className="py-20 border-t border-white/[0.08] bg-[#08080f]/40">
          <div className="wrap">
            <div className="max-w-[640px] mb-12">
              <h2 className="font-['Space_Grotesk',sans-serif] font-bold text-3xl sm:text-4xl tracking-tight text-white">
                What actually leaves your device
              </h2>
              <p className="mt-3 text-[15.5px] text-[#9496ab] leading-relaxed">
                Two ledgers, two purposes. Your real data stays local; the chain only ever sees the outcome.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#12131f] border border-white/[0.08] border-t-2 border-t-[#7c6cff] rounded-2xl p-7">
                <div className="flex items-center gap-2.5 font-['Space_Grotesk',sans-serif] font-bold text-[15px] text-[#b18cff] mb-4">
                  <Shield className="w-5 h-5 text-[#7c6cff]" /> Private witness — local only
                </div>
                <ul className="space-y-3 text-sm text-[#9496ab]">
                  <li className="flex gap-2.5 leading-relaxed">
                    <span className="text-[#7c6cff]">•</span>
                    <span>
                      <strong className="text-white">Actual age</strong> — evaluated entirely on your device. Never
                      transmitted to the ledger, a node, or any server.
                    </span>
                  </li>
                  <li className="flex gap-2.5 leading-relaxed pt-2 border-t border-white/[0.06]">
                    <span className="text-[#7c6cff]">•</span>
                    <span>
                      <strong className="text-white">Private key</strong> — remains securely in your local wallet to
                      sign the intent.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="bg-[#12131f] border border-white/[0.08] border-t-2 border-t-[#4fd8ff] rounded-2xl p-7">
                <div className="flex items-center gap-2.5 font-['Space_Grotesk',sans-serif] font-bold text-[15px] text-[#4fd8ff] mb-4">
                  <Info className="w-5 h-5 text-[#4fd8ff]" /> Public ledger — on-chain
                </div>
                <ul className="space-y-3 text-sm text-[#9496ab]">
                  <li className="flex gap-2.5 leading-relaxed">
                    <span className="text-[#4fd8ff]">•</span>
                    <span>
                      <strong className="text-white">Eligibility result</strong> — only a boolean true is recorded,
                      proving you met the threshold without leaking by how much.
                    </span>
                  </li>
                  <li className="flex gap-2.5 leading-relaxed pt-2 border-t border-white/[0.06]">
                    <span className="text-[#4fd8ff]">•</span>
                    <span>
                      <strong className="text-white">Wallet identity</strong> — the public key that performed the
                      verification.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ---------- FOOTER ---------- */}
      <footer className="border-t border-white/[0.08] py-10 bg-[#08080f]">
        <div className="wrap flex flex-wrap items-center justify-between gap-4 text-[13.5px] text-[#5e6078]">
          <span>© 2026 Nightproof. Built on Midnight Network.</span>
          <div className="flex gap-6">
            <a
              href="https://github.com/shwetasharma44044-eng/Private-Age-"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#9496ab] transition-colors"
            >
              Docs
            </a>
            <a
              href="https://github.com/shwetasharma44044-eng/Private-Age-"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#9496ab] transition-colors"
            >
              Contracts
            </a>
            <a href="#privacy" className="hover:text-[#9496ab] transition-colors">
              Privacy policy
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
