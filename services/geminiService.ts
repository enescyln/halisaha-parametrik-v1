
import { GoogleGenAI } from "@google/genai";
import { Match, Player, GeneralExpense, LeagueIncome } from "../types";

export const getFinancialSummary = async (matches: Match[], players: Player[], leagueExpenses: GeneralExpense[], leagueIncomes: LeagueIncome[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const matchSummary = matches.map(m => {
    const totalMatchCost = m.fieldFee + m.keeperFee + m.otherExpense;
    const paid = m.payments.reduce((acc, p) => acc + (p.isPaid ? p.amount : 0), 0);
    return {
      date: m.date,
      cost: totalMatchCost,
      paid: paid,
      balance: paid - totalMatchCost
    };
  });

  const leagueExpenseTotal = leagueExpenses.reduce((acc, exp) => acc + exp.price, 0);
  const leagueIncomeTotal = leagueIncomes.reduce((acc, inc) => acc + inc.amount, 0);

  const prompt = `
    Aşağıda "Parametrik Futbol Ligi"nin detaylı finansal verileri var:
    
    Maç Bazlı Tahsilat ve Masraflar: ${JSON.stringify(matchSummary)}
    Lig Genel Giderleri (Ekipman vb.): ${leagueExpenses.length} kalem, Toplam: ${leagueExpenseTotal}₺
    Lig Ekstra Gelirleri (Sponsor, Bağış vb.): ${leagueIncomes.length} kalem, Toplam: ${leagueIncomeTotal}₺
    Oyuncu Sayısı: ${players.length}
    
    Lütfen bu verilere dayanarak lig başkanı üslubuyla samimi bir özet hazırla. 
    Özellikle dışarıdan gelen paraların (gelirlerin) kasayı nasıl rahatlattığını veya eksideyse nasıl bir yol izlenmesi gerektiğini yorumla.
    Türkçe cevap ver.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Analiz şu an yapılamıyor, kaptan!";
  }
};
