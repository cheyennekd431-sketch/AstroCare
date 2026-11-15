export type HealthStatus = 'normal' | 'watch' | 'alert';

export const statusStyles: Record<
  HealthStatus,
  { dot: string; text: string; chip: string; bar: string; svg: string }
> = {
  normal: {
    dot: 'bg-success',
    text: 'text-success',
    chip: 'border-success/40 bg-success/10 text-success',
    bar: 'bg-success/60',
    svg: 'hsl(var(--success))',
  },
  watch: {
    dot: 'bg-warning',
    text: 'text-warning',
    chip: 'border-warning/40 bg-warning/10 text-warning',
    bar: 'bg-warning/60',
    svg: 'hsl(var(--warning))',
  },
  alert: {
    dot: 'bg-destructive',
    text: 'text-destructive',
    chip: 'border-destructive/40 bg-destructive/10 text-destructive',
    bar: 'bg-destructive/60',
    svg: 'hsl(var(--destructive))',
  },
};
