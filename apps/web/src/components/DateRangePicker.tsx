import { Calendar } from "lucide-react";

interface DateRangePickerProps {
  /** Fecha desde (YYYY-MM-DD) */
  startDate: string;
  /** Fecha hasta (YYYY-MM-DD) */
  endDate: string;
  /** Callback al cambiar fecha desde */
  onStartChange: (value: string) => void;
  /** Callback al cambiar fecha hasta */
  onEndChange: (value: string) => void;
  /** Label opcional */
  label?: string;
}

/**
 * DateRangePicker — Selector de rango de fechas con dos inputs.
 *
 * @example
 * <DateRangePicker
 *   startDate={from} endDate={to}
 *   onStartChange={setFrom} onEndChange={setTo}
 *   label="Filtrar por fecha"
 * />
 */
export function DateRangePicker({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  label,
}: DateRangePickerProps) {
  return (
    <div className="date-range-picker">
      {label && <span className="date-range-label">{label}</span>}
      <div className="date-range-inputs">
        <div className="date-range-field">
          <Calendar size={14} className="date-range-icon" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartChange(e.target.value)}
            className="date-range-input"
            title="Desde"
          />
        </div>
        <span className="date-range-separator">—</span>
        <div className="date-range-field">
          <Calendar size={14} className="date-range-icon" />
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndChange(e.target.value)}
            className="date-range-input"
            title="Hasta"
          />
        </div>
      </div>
    </div>
  );
}
