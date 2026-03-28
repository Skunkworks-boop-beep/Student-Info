/** Tactical chrome for admin ops surfaces — matches student dashboard / map panels */
export const adminTactical = {
  border: 'border-2 border-[#6f7a5e]/45 dark:border-[#4a5c46]/70',
  borderSoft: 'border border-[#6f7a5e]/35 dark:border-[#3d4a38]/55',
  gridBg:
    'bg-[linear-gradient(rgba(60,80,50,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(60,80,50,0.06)_1px,transparent_1px)] bg-[size:24px_24px]',
  wash: 'bg-gradient-to-br from-[#5c6b4a]/[0.07] via-transparent to-[#8b7355]/[0.06] dark:from-[#2a3528]/35 dark:to-[#1a1f16]/40',
  label: 'text-[10px] font-mono uppercase tracking-[0.18em] text-[#3d4a38] dark:text-[#9faa8c]',
  panelInner: 'bg-card/80 dark:bg-card/60 backdrop-blur-[2px]',
} as const;
