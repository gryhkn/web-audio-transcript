import React from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface TranscriptionOptionsProps {
  showTimestamps: boolean;
  onTimestampChange: (value: boolean) => void;
}

export const TranscriptionOptions: React.FC<TranscriptionOptionsProps> = ({
  showTimestamps,
  onTimestampChange,
}) => {
  return (
    <div className="flex items-center space-x-2">
      <Switch
        id="timestamps"
        checked={showTimestamps}
        onCheckedChange={onTimestampChange}
      />
      <Label htmlFor="timestamps">Show Timestamps</Label>
    </div>
  );
};
