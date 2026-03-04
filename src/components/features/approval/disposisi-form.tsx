"use client";

import { useState } from "react";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface DisposisiFormProps {
  onSubmit?: (decision: string, notes: string) => void;
}

const decisionOptions = [
  { value: "", label: "-- Pilih Keputusan --" },
  { value: "Setuju", label: "Setuju" },
  { value: "Tolak", label: "Tolak" },
  { value: "Kembalikan", label: "Kembalikan" },
];

export function DisposisiForm({ onSubmit }: DisposisiFormProps) {
  const [decision, setDecision] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = () => {
    if (!decision) return;
    onSubmit?.(decision, notes);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-ptba-charcoal">
        Formulir Disposisi
      </h3>

      <Select
        label="Keputusan"
        options={decisionOptions}
        value={decision}
        onChange={(e) => setDecision(e.target.value)}
      />

      <Textarea
        label="Catatan"
        placeholder="Masukkan catatan disposisi..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={4}
      />

      <Button
        variant="gold"
        onClick={handleSubmit}
        disabled={!decision}
        className="w-full"
      >
        Kirim Disposisi
      </Button>
    </div>
  );
}
