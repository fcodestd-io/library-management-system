"use client";

import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useDebounce } from "use-debounce";

interface Option {
  id: string;
  label: string;
  subLabel?: string;
}

interface AsyncComboboxProps {
  placeholder: string;
  value?: string;
  displayValue?: string;
  onSelect: (option: Option) => void;
  fetcher: (query: string) => Promise<Option[]>;
}

export function AsyncCombobox({
  placeholder,
  value,
  displayValue,
  onSelect,
  fetcher,
}: AsyncComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery] = useDebounce(query, 400);
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      setLoading(true);
      fetcher(debouncedQuery).then((res) => {
        setOptions(res);
        setLoading(false);
      });
    } else {
      setOptions([]);
    }
  }, [debouncedQuery, fetcher]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {/* 
        Hapus `asChild` pada PopoverTrigger dan langsung gunakan PopoverTrigger sebagai tombolnya,
        atau bungkus menggunakan className yang sama dengan Button tanpa bersinggungan tag <button>
      */}
      <PopoverTrigger className="w-full justify-between font-normal text-left flex items-center h-9 px-3 py-2 border rounded-md text-sm bg-white hover:bg-slate-50 transition-colors">
        <span className="truncate">{displayValue || placeholder}</span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </PopoverTrigger>

      <PopoverContent className="w-[300px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Ketik min 2 huruf..."
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {loading && (
              <div className="p-4 text-center text-xs text-slate-500 flex justify-center items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Mencari...
              </div>
            )}
            {!loading && query.length < 2 && (
              <CommandEmpty className="p-2 text-xs text-slate-500 text-center">
                Minimal 2 karakter untuk mencari
              </CommandEmpty>
            )}
            {!loading && query.length >= 2 && options.length === 0 && (
              <CommandEmpty className="p-2 text-xs text-slate-500 text-center">
                Data tidak ditemukan.
              </CommandEmpty>
            )}
            {!loading && options.length > 0 && (
              <CommandGroup>
                {options.map((opt) => (
                  <CommandItem
                    key={opt.id}
                    value={opt.id}
                    onSelect={() => {
                      onSelect(opt);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === opt.id ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <div>
                      <div className="font-medium text-slate-900">
                        {opt.label}
                      </div>
                      {opt.subLabel && (
                        <div className="text-xs text-slate-500">
                          {opt.subLabel}
                        </div>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
