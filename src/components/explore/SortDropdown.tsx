import { ArrowUpDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SORTS, type SortValue } from "@/lib/explore-data";

export function SortDropdown({
  value,
  onChange,
}: {
  value: SortValue;
  onChange: (v: SortValue) => void;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as SortValue)}>
      <SelectTrigger className="h-9 w-[160px] gap-2 rounded-xl border-border bg-card px-3 text-sm font-semibold shadow-sm">
        <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="rounded-xl">
        {SORTS.map((s) => (
          <SelectItem key={s.value} value={s.value} className="rounded-lg text-sm font-medium">
            {s.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
