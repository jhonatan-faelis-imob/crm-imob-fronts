import { create } from 'zustand'

export interface SimulationDraft {
  income?: number
  fgtsValue?: number
  ownResources?: number
}

interface SimulationDraftStore {
  draft: SimulationDraft | null
  setDraft: (draft: SimulationDraft) => void
  clearDraft: () => void
}

// Só em memória, de propósito: dado financeiro não vai para a URL nem para o localStorage.
// "Cadastrar como lead" grava aqui, a tela de Leads lê ao abrir o formulário e limpa.
export const useSimulationDraftStore = create<SimulationDraftStore>((set) => ({
  draft: null,
  setDraft: (draft) => set({ draft }),
  clearDraft: () => set({ draft: null }),
}))
