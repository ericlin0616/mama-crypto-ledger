import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

type Props = {
  value: number[];
  onValueChange: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  "aria-label"?: string;
};

export function Slider({
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  className,
  "aria-label": ariaLabel,
}: Props) {
  return (
    <SliderPrimitive.Root
      className={cn(
        "relative flex h-11 w-full touch-none items-center select-none",
        className,
      )}
      value={value}
      onValueChange={onValueChange}
      min={min}
      max={max}
      step={step}
      aria-label={ariaLabel}
    >
      <SliderPrimitive.Track className="relative h-1.5 w-full grow rounded-pill bg-line">
        <SliderPrimitive.Range className="absolute h-full rounded-pill bg-accent" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="block size-7 rounded-pill bg-paper shadow-card outline-none transition-transform duration-150 ease-out focus-visible:ring-2 focus-visible:ring-accent active:scale-95" />
    </SliderPrimitive.Root>
  );
}
