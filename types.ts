
export interface Player {
  id: string;
  name: string;
}

export interface Payment {
  playerId: string;
  amount: number;
  isPaid: boolean;
}

export interface Match {
  id: string;
  date: string;
  fieldFee: number;      // Halı saha ücreti
  keeperFee: number;     // Kaleci ücreti
  otherExpense: number;  // Genel Masraf
  payments: Payment[];
}

export interface GeneralExpense {
  id: string;
  itemName: string;
  date: string;
  price: number;
}

export interface LeagueIncome {
  id: string;
  description: string;
  date: string;
  amount: number;
}

export interface FinancialStats {
  totalCollectedFromPlayers: number;
  totalExtraIncome: number;
  totalWeeklyExpenses: number;
  totalLeagueExpenses: number;
  vaultBalance: number;
  matchCount: number;
}
