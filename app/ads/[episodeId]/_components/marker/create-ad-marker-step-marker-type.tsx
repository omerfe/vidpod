"use client";

import { CircleDashed, Crosshair, FlaskConical } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { MarkerType } from "@/lib/ads/contracts";
import { cn } from "@/lib/utils";
import type { AdMarkerFormApi } from "./create-ad-marker-form-api";

const TYPE_ROWS: {
  value: MarkerType;
  title: string;
  description: string;
  Icon: typeof CircleDashed;
}[] = [
  {
    value: "auto",
    title: "Auto",
    description: "Automatic ad insertions",
    Icon: CircleDashed,
  },
  {
    value: "static",
    title: "Static",
    description: "A marker for a specific ad that you select",
    Icon: Crosshair,
  },
  {
    value: "ab_test",
    title: "A/B test",
    description: "Compare the performance of multiple ads",
    Icon: FlaskConical,
  },
];

export function CreateAdMarkerStepMarkerType(props: { form: AdMarkerFormApi }) {
  const { form } = props;

  return (
    <form.Field name="markerType">
      {(field) => (
        <RadioGroup
          value={field.state.value}
          onValueChange={(value) => {
            field.handleChange(value as MarkerType);
          }}
          className="flex flex-col gap-3"
        >
          {TYPE_ROWS.map(({ value, title, description, Icon }) => {
            const inputId = `marker-type-${value}`;
            const isSelected = field.state.value === value;

            return (
              <label
                key={value}
                htmlFor={inputId}
                className={cn(
                  "block cursor-pointer rounded-lg border p-4 transition-colors",
                  isSelected
                    ? "border-foreground/25 bg-muted/40"
                    : "border-border hover:bg-muted/20",
                )}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="flex size-11 shrink-0 items-center justify-center rounded-lg"
                    aria-hidden
                  >
                    <Icon
                      className="size-8 text-foreground"
                      strokeWidth={1.5}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium leading-tight">{title}</div>
                    <p className="mt-0.5 text-sm leading-snug text-muted-foreground">
                      {description}
                    </p>
                  </div>
                  <RadioGroupItem
                    value={value}
                    id={inputId}
                    className="size-4 shrink-0"
                  />
                </div>
              </label>
            );
          })}
        </RadioGroup>
      )}
    </form.Field>
  );
}
