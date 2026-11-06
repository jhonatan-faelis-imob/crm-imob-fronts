const normalize = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase()

export const isWonStage = (stageName?: string) => normalize(stageName ?? '') === 'ganho'
export const isLostStage = (stageName?: string) => normalize(stageName ?? '') === 'perdido'
