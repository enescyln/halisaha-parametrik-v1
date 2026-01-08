
import React, { useState, useEffect, useMemo } from 'react';
import { Match, Player, FinancialStats, GeneralExpense, LeagueIncome } from './types';
import { getFinancialSummary } from './services/geminiService';
import { 
  PlusIcon, 
  TrashIcon,
  ChartBarIcon,
  SparklesIcon,
  ChevronRightIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon,
  ClipboardDocumentCheckIcon,
  ArrowDownCircleIcon,
  ArrowUpCircleIcon,
  Cog6ToothIcon,
  UserPlusIcon,
  CheckCircleIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

export default function App() {
  // --- CONFIGURATION (Settings) ---
  const [configFieldFee, setConfigFieldFee] = useState<number>(() => {
    const saved = localStorage.getItem('config_field_fee');
    return saved ? JSON.parse(saved) : 2800;
  });
  
  const [configPlayerFee, setConfigPlayerFee] = useState<number>(() => {
    const saved = localStorage.getItem('config_player_fee');
    return saved ? JSON.parse(saved) : 225;
  });

  const [players, setPlayers] = useState<Player[]>(() => {
    const saved = localStorage.getItem('players');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'Kaptan Ali' }, { id: '2', name: 'Mehmet' },
      { id: '3', name: 'Ahmet' }, { id: '4', name: 'Can' },
      { id: '5', name: 'Efe' }, { id: '6', name: 'Murat' },
      { id: '7', name: 'Burak' }, { id: '8', name: 'Selin' },
      { id: '9', name: 'Hakan' }, { id: '10', name: 'Kemal' },
      { id: '11', name: 'Yigit' }, { id: '12', name: 'Omer' }
    ];
  });

  const [matches, setMatches] = useState<Match[]>(() => {
    const saved = localStorage.getItem('matches');
    return saved ? JSON.parse(saved) : [];
  });

  const [leagueExpenses, setLeagueExpenses] = useState<GeneralExpense[]>(() => {
    const saved = localStorage.getItem('league_expenses');
    return saved ? JSON.parse(saved) : [];
  });

  const [leagueIncomes, setLeagueIncomes] = useState<LeagueIncome[]>(() => {
    const saved = localStorage.getItem('league_incomes');
    return saved ? JSON.parse(saved) : [];
  });

  // --- UI STATE ---
  const [activeTab, setActiveTab] = useState<'dashboard' | 'matches' | 'finance' | 'settings' | 'ai'>('dashboard');
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // --- PERSISTENCE ---
  useEffect(() => {
    localStorage.setItem('config_field_fee', JSON.stringify(configFieldFee));
    localStorage.setItem('config_player_fee', JSON.stringify(configPlayerFee));
    localStorage.setItem('players', JSON.stringify(players));
    localStorage.setItem('matches', JSON.stringify(matches));
    localStorage.setItem('league_expenses', JSON.stringify(leagueExpenses));
    localStorage.setItem('league_incomes', JSON.stringify(leagueIncomes));
  }, [configFieldFee, configPlayerFee, players, matches, leagueExpenses, leagueIncomes]);

  // --- CALCULATIONS ---
  const stats: FinancialStats = useMemo(() => {
    let totalCollectedFromPlayers = 0;
    let totalWeeklyExpenses = 0;

    matches.forEach(m => {
      // Ödeyen (Gelen) sayısı * Kişi Başı Ücret
      totalCollectedFromPlayers += m.payments.reduce((acc, p) => acc + (p.isPaid ? p.amount : 0), 0);
      totalWeeklyExpenses += (m.fieldFee + m.keeperFee + m.otherExpense);
    });

    const totalLeagueExpenses = leagueExpenses.reduce((acc, exp) => acc + exp.price, 0);
    const totalExtraIncome = leagueIncomes.reduce((acc, inc) => acc + inc.amount, 0);

    return {
      totalCollectedFromPlayers,
      totalExtraIncome,
      totalWeeklyExpenses,
      totalLeagueExpenses,
      vaultBalance: (totalCollectedFromPlayers + totalExtraIncome) - (totalWeeklyExpenses + totalLeagueExpenses),
      matchCount: matches.length
    };
  }, [matches, leagueExpenses, leagueIncomes]);

  // --- ACTIONS ---
  const addMatch = (data: any) => {
    const newMatch: Match = {
      id: Date.now().toString(),
      date: data.date,
      fieldFee: configFieldFee,
      keeperFee: data.keeperFee,
      otherExpense: data.otherExpense,
      payments: players.map(p => ({
        playerId: p.id,
        amount: configPlayerFee,
        isPaid: false
      }))
    };
    setMatches([newMatch, ...matches]);
    setShowMatchModal(false);
  };

  const addPlayer = () => {
    if (newPlayerName.trim()) {
      setPlayers([...players, { id: Date.now().toString(), name: newPlayerName.trim() }]);
      setNewPlayerName('');
    }
  };

  const removePlayer = (id: string) => {
    if (confirm('Bu oyuncuyu silmek istediğinize emin misiniz?')) {
      setPlayers(players.filter(p => p.id !== id));
    }
  };

  const togglePayment = (matchId: string, playerId: string) => {
    setMatches(prevMatches => prevMatches.map(m => {
      if (m.id === matchId) {
        return {
          ...m,
          payments: m.payments.map(p => 
            p.playerId === playerId ? { ...p, isPaid: !p.isPaid } : p
          )
        };
      }
      return m;
    }));
  };

  const handleAiAnalysis = async () => {
    setLoadingAi(true);
    const report = await getFinancialSummary(matches, players, leagueExpenses, leagueIncomes);
    setAiReport(report);
    setLoadingAi(false);
    setActiveTab('ai');
  };

  return (
    <div className="min-h-screen pb-28 max-w-md mx-auto bg-[#F2F2F7] flex flex-col text-black font-sans">
      {/* --- HEADER --- */}
      <header className="bg-white px-6 pt-12 pb-6 border-b border-gray-200 sticky top-0 z-40">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-black">KASA</h1>
            <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest mt-1">Parametrik Lig Takip</p>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">TOPLAM BAKİYE</div>
            <div className={`text-3xl font-black tracking-tighter ${stats.vaultBalance >= 0 ? 'text-black' : 'text-red-600'}`}>
              {stats.vaultBalance.toLocaleString()}₺
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 p-5 space-y-6 overflow-y-auto">
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <StatCard label="OYUNCU GELİRİ" value={stats.totalCollectedFromPlayers} icon={<UserGroupIcon className="w-4 h-4" />} />
              <StatCard label="DIŞ GELİRLER" value={stats.totalExtraIncome} icon={<ArrowUpCircleIcon className="w-4 h-4" />} />
              <StatCard label="SAHA GİDERLERİ" value={stats.totalWeeklyExpenses} icon={<BanknotesIcon className="w-4 h-4" />} />
              <StatCard label="DİĞER GİDERLER" value={stats.totalLeagueExpenses} icon={<ArrowDownCircleIcon className="w-4 h-4" />} danger />
            </div>

            {/* AI Callout */}
            <button 
              onClick={handleAiAnalysis}
              disabled={loadingAi}
              className="w-full bg-black text-white p-6 rounded-3xl shadow-lg flex items-center justify-between active:scale-[0.98] transition-all"
            >
              <div className="text-left">
                <h3 className="font-bold text-sm">BAŞKANIN ÖZETİ (AI)</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Kasa analizi ve tavsiyeler</p>
              </div>
              <SparklesIcon className={`w-8 h-8 text-white ${loadingAi ? 'animate-pulse' : ''}`} />
            </button>

            {/* Recent Matches */}
            <section>
              <div className="flex justify-between items-center mb-4 px-1">
                <h2 className="text-xs font-black text-black uppercase tracking-widest">SON MAÇLAR</h2>
                <button onClick={() => setActiveTab('matches')} className="text-xs font-bold text-gray-400 hover:text-black">TÜMÜ</button>
              </div>
              {matches.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-gray-200 text-center text-gray-400 text-sm font-medium">Henüz maç kaydı yok.</div>
              ) : (
                matches.slice(0, 3).map(m => (
                  <MatchCard 
                    key={m.id} 
                    match={m} 
                    players={players} 
                    onTogglePayment={togglePayment} 
                    onDelete={(id) => setMatches(matches.filter(x => x.id !== id))} 
                    playerFee={configPlayerFee}
                  />
                ))
              )}
            </section>
          </div>
        )}

        {activeTab === 'matches' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center mb-2 px-1">
              <h2 className="text-xl font-black text-black tracking-tight">Maç Geçmişi</h2>
              <button 
                onClick={() => setShowMatchModal(true)} 
                className="bg-black text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-md active:scale-95 transition-all"
              >
                <PlusIcon className="w-4 h-4" /> YENİ HAFTA
              </button>
            </div>
            {matches.map(m => (
              <MatchCard 
                key={m.id} 
                match={m} 
                players={players} 
                onTogglePayment={togglePayment} 
                onDelete={(id) => setMatches(matches.filter(x => x.id !== id))} 
                playerFee={configPlayerFee}
              />
            ))}
          </div>
        )}

        {activeTab === 'finance' && (
          <div className="space-y-8 animate-fadeIn">
            <FinanceSection 
              title="EKSTRA GELİRLER" 
              items={leagueIncomes.map(i => ({ id: i.id, label: i.description, amount: i.amount, date: i.date }))}
              onAdd={() => setShowIncomeModal(true)}
              onDelete={(id) => setLeagueIncomes(leagueIncomes.filter(i => i.id !== id))}
              type="income"
            />
            <FinanceSection 
              title="LİG GİDERLERİ" 
              items={leagueExpenses.map(e => ({ id: e.id, label: e.itemName, amount: e.price, date: e.date }))}
              onAdd={() => setShowExpenseModal(true)}
              onDelete={(id) => setLeagueExpenses(leagueExpenses.filter(e => e.id !== id))}
              type="expense"
            />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-8 animate-fadeIn pb-10">
            <section className="bg-white p-7 rounded-[2rem] border border-gray-200 shadow-sm space-y-6">
              <h2 className="text-xs font-black text-black uppercase tracking-widest">Saha & Ücret Ayarları</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase">Saha Ücreti (₺)</label>
                  <input 
                    type="number" 
                    value={configFieldFee} 
                    onChange={e => setConfigFieldFee(Number(e.target.value))}
                    className="w-full bg-gray-50 p-4 rounded-2xl text-base font-black border-0 ring-1 ring-gray-100 focus:ring-black outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase">Oyuncu Ücreti (₺)</label>
                  <input 
                    type="number" 
                    value={configPlayerFee} 
                    onChange={e => setConfigPlayerFee(Number(e.target.value))}
                    className="w-full bg-gray-50 p-4 rounded-2xl text-base font-black border-0 ring-1 ring-gray-100 focus:ring-black outline-none"
                  />
                </div>
              </div>
            </section>

            <section className="bg-white p-7 rounded-[2rem] border border-gray-200 shadow-sm space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xs font-black text-black uppercase tracking-widest">Oyuncu Yönetimi</h2>
                <span className="text-[10px] font-bold text-gray-400">{players.length} Kişi</span>
              </div>
              <div className="flex gap-2">
                <input 
                  placeholder="Yeni Oyuncu Ekle..." 
                  value={newPlayerName}
                  onChange={e => setNewPlayerName(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && addPlayer()}
                  className="flex-1 bg-gray-50 p-4 rounded-2xl text-sm font-bold border-0 ring-1 ring-gray-100 focus:ring-black outline-none"
                />
                <button onClick={addPlayer} className="bg-black text-white px-5 rounded-2xl active:scale-90 transition-all shadow-md">
                  <UserPlusIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto pr-1">
                {players.map(p => (
                  <div key={p.id} className="py-4 flex justify-between items-center group">
                    <span className="text-sm font-bold text-black">{p.name}</span>
                    <button onClick={() => removePlayer(p.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <SparklesIcon className="w-6 h-6 text-black" />
                <h2 className="text-sm font-black uppercase tracking-widest text-black">ANALİZ RAPORU</h2>
              </div>
              <div className="text-sm leading-relaxed text-black font-medium whitespace-pre-wrap italic">
                 {aiReport || "Kaptan, veriler taranıyor, hemen geliyorum..."}
              </div>
            </div>
            <button onClick={() => setActiveTab('dashboard')} className="w-full py-5 bg-black text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg">GÖSTERGEYE DÖN</button>
          </div>
        )}
      </main>

      {/* --- NAVIGATION --- */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/90 backdrop-blur-xl border-t border-gray-200 flex justify-around p-4 pb-10 z-50">
        <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<ChartBarIcon className="w-6 h-6" />} label="DURUM" />
        <NavButton active={activeTab === 'matches'} onClick={() => setActiveTab('matches')} icon={<ClipboardDocumentCheckIcon className="w-6 h-6" />} label="MAÇLAR" />
        <NavButton active={activeTab === 'finance'} onClick={() => setActiveTab('finance')} icon={<BanknotesIcon className="w-6 h-6" />} label="FİNANS" />
        <NavButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Cog6ToothIcon className="w-6 h-6" />} label="AYARLAR" />
      </nav>

      {/* --- MODALS --- */}
      {showMatchModal && (
        <MatchModal 
          onClose={() => setShowMatchModal(false)} 
          onSubmit={addMatch} 
          fieldFee={configFieldFee} 
          playerFee={configPlayerFee} 
        />
      )}
      {showIncomeModal && (
        <FinanceModal 
          title="EKSTRA GELİR" 
          onSubmit={(d) => { setLeagueIncomes([{ id: Date.now().toString(), ...d }, ...leagueIncomes]); setShowIncomeModal(false); }} 
          onClose={() => setShowIncomeModal(false)}
          type="income"
        />
      )}
      {showExpenseModal && (
        <FinanceModal 
          title="LİG GİDERİ" 
          onSubmit={(d) => { setLeagueExpenses([{ id: Date.now().toString(), itemName: d.description, price: d.amount, date: d.date }, ...leagueExpenses]); setShowExpenseModal(false); }} 
          onClose={() => setShowExpenseModal(false)}
          type="expense"
        />
      )}
    </div>
  );
}

// --- SUBCOMPONENTS ---

const StatCard = ({ label, value, icon, danger }: any) => (
  <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm">
    <div className="flex items-center gap-1.5 mb-1.5 opacity-40">
      {icon}
      <span className="text-[10px] font-black uppercase tracking-widest leading-none">{label}</span>
    </div>
    <div className={`text-xl font-black tracking-tighter ${danger ? 'text-red-600' : 'text-black'}`}>
      {value.toLocaleString()}₺
    </div>
  </div>
);

const NavButton = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1.5 transition-all ${active ? 'text-black scale-105' : 'text-gray-300'}`}>
    <div className={`p-2.5 rounded-2xl transition-all ${active ? 'bg-gray-100 text-black' : ''}`}>
      {icon}
    </div>
    <span className={`text-[9px] font-black tracking-widest ${active ? 'opacity-100' : 'opacity-40'}`}>{label}</span>
  </button>
);

const MatchCard = ({ match, players, onTogglePayment, onDelete, playerFee }: any) => {
  const [expanded, setExpanded] = useState(false);
  // Gelenlerin toplamı: Ödeyen Sayısı * Kişi Ücreti
  const paidCount = match.payments.filter(p => p.isPaid).length;
  const playerIncome = paidCount * playerFee;
  const totalCost = match.fieldFee + match.keeperFee + match.otherExpense;
  const matchBalance = playerIncome - totalCost;

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden mb-4 transition-all active:shadow-md">
      <div className="p-5 flex justify-between items-center" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-4">
          <div className="bg-black text-white w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-black">
            <span className="text-[8px] opacity-60 uppercase">{new Date(match.date).toLocaleDateString('tr-TR', { month: 'short' })}</span>
            <span className="text-xl leading-none">{new Date(match.date).getDate()}</span>
          </div>
          <div>
            <h4 className="font-bold text-sm text-black">{new Date(match.date).toLocaleDateString('tr-TR', { weekday: 'long' })}</h4>
            <div className="flex items-center gap-2 mt-0.5">
               <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                 {paidCount} Gelen
               </span>
               <span className="text-[10px] font-black text-black">
                 {playerIncome}₺ Toplandı
               </span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-sm font-black tracking-tight ${matchBalance >= 0 ? 'text-black' : 'text-red-500'}`}>
            {matchBalance > 0 ? '+' : ''}{matchBalance}₺
          </div>
          <ChevronRightIcon className={`w-3 h-3 text-gray-300 ml-auto mt-1 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </div>
      </div>

      {expanded && (
        <div className="p-6 bg-[#FAFAFA] border-t border-gray-100 space-y-6 animate-fadeIn">
          {/* Progress to Covering Field Fee */}
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Saha Ücreti Karşılama</span>
              <span className="text-xs font-bold text-black">{playerIncome} / {match.fieldFee}₺</span>
            </div>
            <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
               <div 
                 className={`h-full transition-all duration-700 ${playerIncome >= match.fieldFee ? 'bg-black' : 'bg-gray-400'}`} 
                 style={{ width: `${Math.min((playerIncome / match.fieldFee) * 100, 100)}%` }}
               />
            </div>
          </div>

          {/* Breakdown Grid */}
          <div className="grid grid-cols-2 gap-3">
             <div className="bg-white p-4 rounded-2xl border border-gray-100 text-center shadow-sm">
                <div className="text-[9px] font-black text-gray-400 uppercase mb-1">DİĞER GİDERLER</div>
                <div className="text-sm font-black text-black">{match.keeperFee + match.otherExpense}₺</div>
             </div>
             <div className="bg-white p-4 rounded-2xl border border-gray-100 text-center shadow-sm">
                <div className="text-[9px] font-black text-gray-400 uppercase mb-1">KASA ETKİSİ</div>
                <div className={`text-sm font-black ${matchBalance >= 0 ? 'text-black' : 'text-red-600'}`}>{matchBalance}₺</div>
             </div>
          </div>

          {/* Player Selection List */}
          <div className="space-y-3">
            <h5 className="text-[10px] font-black text-black uppercase tracking-widest px-1">BU HAFTA KİMLER GELDİ?</h5>
            <div className="grid grid-cols-2 gap-2">
              {players.map(p => {
                const pay = match.payments.find(x => x.playerId === p.id);
                return (
                  <button 
                    key={p.id}
                    onClick={(e) => { e.stopPropagation(); onTogglePayment(match.id, p.id); }}
                    className={`flex justify-between items-center p-3.5 rounded-2xl border transition-all ${pay?.isPaid ? 'bg-black text-white border-black shadow-md' : 'bg-white text-black border-gray-200'}`}
                  >
                    <span className="text-[11px] font-bold truncate pr-1">{p.name}</span>
                    {pay?.isPaid ? (
                      <CheckCircleIcon className="w-4 h-4 text-white" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-gray-300" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
          
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(match.id); }} 
            className="w-full pt-4 text-[10px] font-black text-red-300 uppercase tracking-[0.2em] hover:text-red-500 transition-colors"
          >
            MAÇ KAYDINI KALDIR
          </button>
        </div>
      )}
    </div>
  );
};

const FinanceSection = ({ title, items, onAdd, onDelete, type }: any) => (
  <section className="space-y-4">
    <div className="flex justify-between items-center px-1">
      <h2 className="text-xs font-black uppercase tracking-widest text-black">{title}</h2>
      <button onClick={onAdd} className="bg-black text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">EKLE</button>
    </div>
    <div className="bg-white rounded-[2rem] border border-gray-200 shadow-sm divide-y divide-gray-100 overflow-hidden">
      {items.length === 0 ? (
        <div className="p-12 text-center text-gray-400 text-sm font-medium italic">Henüz kayıt yok.</div>
      ) : (
        items.map((i: any) => (
          <div key={i.id} className="p-5 flex justify-between items-center hover:bg-gray-50 transition-colors">
            <div>
              <div className="text-sm font-black text-black uppercase">{i.label}</div>
              <div className="text-[10px] text-gray-400 font-bold mt-0.5">{new Date(i.date).toLocaleDateString('tr-TR')}</div>
            </div>
            <div className="flex items-center gap-6">
              <span className={`font-black text-base ${type === 'income' ? 'text-black' : 'text-red-500'}`}>
                {type === 'income' ? '+' : '-'}{i.amount.toLocaleString()}₺
              </span>
              <button onClick={() => onDelete(i.id)} className="text-gray-300 hover:text-red-500 transition-all p-1">
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  </section>
);

// --- MODALS ---

const MatchModal = ({ onClose, onSubmit, fieldFee, playerFee }: any) => {
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    keeperFee: 200,
    otherExpense: 0
  });

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-6 z-[100] animate-fadeIn">
      <div className="bg-white w-full rounded-[2.5rem] p-8 space-y-7 shadow-2xl text-black">
        <div className="text-center">
          <h3 className="text-2xl font-black tracking-tight">YENİ MAÇ</h3>
          <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Saha: {fieldFee}₺ | Kişi: {playerFee}₺</p>
        </div>
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">HAFTANIN TARİHİ</label>
            <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full bg-gray-50 p-4 rounded-2xl text-base font-bold border-0 ring-1 ring-gray-100 focus:ring-black outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">KALECİ (₺)</label>
              <input type="number" value={form.keeperFee} onChange={e => setForm({...form, keeperFee: Number(e.target.value)})} className="w-full bg-gray-50 p-4 rounded-2xl text-base font-black border-0 ring-1 ring-gray-100 focus:ring-black outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">DİĞER (₺)</label>
              <input type="number" value={form.otherExpense} onChange={e => setForm({...form, otherExpense: Number(e.target.value)})} className="w-full bg-gray-50 p-4 rounded-2xl text-base font-black border-0 ring-1 ring-gray-100 focus:ring-black outline-none" />
            </div>
          </div>
        </div>
        <div className="pt-4 space-y-4">
          <button onClick={() => onSubmit(form)} className="w-full bg-black text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl active:scale-95 transition-all">MAÇI OLUŞTUR</button>
          <button onClick={onClose} className="w-full py-2 text-gray-400 font-black text-[11px] uppercase tracking-widest">VAZGEÇ</button>
        </div>
      </div>
    </div>
  );
};

const FinanceModal = ({ title, onSubmit, onClose, type }: any) => {
  const [form, setForm] = useState({ description: '', amount: 0, date: new Date().toISOString().split('T')[0] });
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-6 z-[100] animate-fadeIn">
      <div className="bg-white w-full rounded-[2.5rem] p-8 space-y-7 shadow-2xl">
        <h3 className="text-2xl font-black text-center tracking-tight text-black">{title}</h3>
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">AÇIKLAMA</label>
            <input placeholder="Harcama veya gelir kalemi..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full bg-gray-50 p-4 rounded-2xl text-base font-bold border-0 ring-1 ring-gray-100 focus:ring-black outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">TUTAR (₺)</label>
              <input type="number" value={form.amount} onChange={e => setForm({...form, amount: Number(e.target.value)})} className="w-full bg-gray-50 p-4 rounded-2xl text-base font-black border-0 ring-1 ring-gray-100 focus:ring-black outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">TARİH</label>
              <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full bg-gray-50 p-4 rounded-2xl text-xs font-bold border-0 ring-1 ring-gray-100 focus:ring-black outline-none" />
            </div>
          </div>
        </div>
        <div className="pt-4 space-y-4">
          <button onClick={() => form.description && onSubmit(form)} className={`w-full ${type === 'income' ? 'bg-black' : 'bg-red-600'} text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl active:scale-95 transition-all`}>KAYDET</button>
          <button onClick={onClose} className="w-full py-2 text-gray-400 font-black text-[11px] uppercase tracking-widest">VAZGEÇ</button>
        </div>
      </div>
    </div>
  );
};
