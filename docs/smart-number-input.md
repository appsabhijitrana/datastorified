# SmartNumberInput

`SmartNumberInput` is the shared, spinner-free numeric input for DataStorified calculators and utilities. It is a controlled, memoized React component built around a text input with `inputMode="decimal"`, allowing mobile numeric keyboards without browser number spinners or inconsistent native formatting.

## Supported modes

`currency`, `percentage`, `integer`, `decimal`, `distance`, `weight`, `temperature`, `years`, `months`, `days`, `area`, `volume`, `data-size`, and `custom`.

Formatting can use Indian grouping, international grouping, normal numeric output, or optional scientific notation. Accepted shorthand includes `25 lakh`, `25L`, `25 lac`, `2cr`, `2.5 crore`, `85k`, `3M`, `4 million`, `5 billion`, `10bn`, currency symbols, and already-grouped values.

## API

```tsx
import { SmartNumberInput } from "@datastorified/ui/smart-number-input";

<SmartNumberInput
  label="Loan amount"
  description="How much would you like to borrow?"
  value={loanAmount}
  onChange={(result) => setLoanAmount(result.numericValue)}
  currency="INR"
  locale="en-IN"
  mode="currency"
  format="indian"
  showWords
  showSlider
  showStepper
  showChips
  helperText="Enter the sanctioned principal"
  min={50_000}
  max={200_000_000}
  step={100_000}
  allowNegative={false}
  allowDecimal
  placeholder="₹25 lakh"
/>
```

`onChange` returns `rawInput`, `numericValue`, `formattedValue`, `words`, `isValid`, and `validationErrors`.

The component forwards its input ref and supports `name` and `onBlur`, so it works with React Hook Form’s `Controller`. Validation uses Zod-compatible numeric constraints and returns friendly plain-language messages.

## Interaction model

- Currency values format live with layout-phase caret correction.
- Arrow Up/Down changes by `step`; Enter commits; Escape restores the controlled value.
- Optional steppers support press-and-hold repetition.
- Sliders, chips, keyboard input, and external values remain synchronized.
- Clear, copy, paste, reset, and calculator actions are optional and keyboard accessible.
- Focus uses a soft gradient border; errors use a restrained shake; valid touched values receive a subtle check.
- Labels, descriptions, number words, validation state, and errors are connected through ARIA.

## Utilities and hooks

The package exports `parseIndianNumber`, `formatIndianNumber`, `numberToIndianWords`, `parseInternationalNumber`, `formatInternationalNumber`, `useSmartNumberParser`, `useIndianFormatter`, `useNumberToWords`, and `useInputFormatter`.

## Stories and tests

`packages/ui/smart-number-input.stories.tsx` contains Currency, Percentage, Loan, Salary, Weight, Slider, Stepper, and Error stories. A dark-mode story is intentionally omitted because DataStorified’s approved product direction is light-only.

The focused suite covers 28 parser/component cases, including INR grouping, shorthand, scientific opt-in, number words, friendly validation, cursor placement, mobile input attributes, keyboard stepping, chips, and slider synchronization. Playwright verifies the integrated mobile calculator has no horizontal overflow.
