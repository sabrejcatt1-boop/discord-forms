"use client";

import { useMemo, useState } from "react";

type StatusState =
  | {
      type: "success" | "error";
      message: string;
    }
  | null;

const roles = [
  "Student",
  "Working",
  "Freelancer or builder",
  "Just figuring life out",
  "Other"
];

const stuckOptions = [
  "Not knowing what to do next",
  "Too many options",
  "Overthinking",
  "Starting is easy, finishing is hard",
  "Staying consistent",
  "Other"
];

const benefitOptions = [
  "Clear next steps",
  "Better decisions",
  "Saving time",
  "Less stress",
  "Making money",
  "Learning faster"
];

const payOptions = ["No", "Maybe", "Yes ($5-$10/mo)", "Yes ($10-$25/mo)"];

const initialForm = {
  role: "",
  frustration: "",
  stuckOn: "",
  triedTools: "",
  wantHelp: "",
  benefit: "",
  pay: "",
  dealbreaker: "",
  magic: "",
  contact: "",
  company: ""
};

const requiredFields = [
  "role",
  "frustration",
  "stuckOn",
  "triedTools",
  "wantHelp",
  "benefit",
  "pay",
  "dealbreaker",
  "magic"
] as const;

type RequiredField = (typeof requiredFields)[number];
type FormState = typeof initialForm;
type FieldErrorState = Partial<Record<RequiredField, string>>;

const requiredLabels: Record<RequiredField, string> = {
  role: "Role",
  frustration: "Weekly frustration",
  stuckOn: "Stuck on",
  triedTools: "Tried tools",
  wantHelp: "Want help with",
  benefit: "Biggest benefit",
  pay: "Pay willingness",
  dealbreaker: "Dealbreaker",
  magic: "Magic button"
};

const textInputClasses =
  "w-full rounded-xl bg-[#0a1322]/85 px-4 py-3 text-sm text-[var(--text-main)] ring-1 ring-white/10 placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)]";

type QuestionCardProps = {
  index: string;
  title: string;
  description?: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
};

type RadioGroupProps = {
  name: keyof FormState;
  options: string[];
  value: string;
  hasError?: boolean;
  onChange: (value: string) => void;
};

function QuestionCard({
  index,
  title,
  description,
  required = true,
  error,
  children
}: QuestionCardProps) {
  return (
    <section
      className={`reveal rounded-2xl bg-white/[0.045] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.22)] ring-1 sm:p-6 ${
        error ? "ring-orange-300/45" : "ring-white/10"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
            {index}
          </p>
          <h2 className="mt-2 font-display text-[1.35rem] leading-tight text-[var(--text-main)]">
            {title}
          </h2>
          {description && (
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--text-soft)]">
              {description}
            </p>
          )}
        </div>
        {required && (
          <span className="rounded-full bg-black/30 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)] ring-1 ring-white/10">
            Required
          </span>
        )}
      </div>
      <div className="mt-5">{children}</div>
      {error && <p className="mt-3 text-sm text-orange-200">{error}</p>}
    </section>
  );
}

function RadioGroup({ name, options, value, hasError = false, onChange }: RadioGroupProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {options.map((option) => (
        <label
          key={option}
          className={`group flex cursor-pointer items-center gap-3 rounded-xl bg-[#0a1322]/85 px-4 py-3 text-sm text-[var(--text-soft)] ring-1 transition hover:-translate-y-0.5 hover:text-[var(--text-main)] focus-within:text-[var(--text-main)] ${
            hasError
              ? "ring-orange-300/45"
              : "ring-white/10 hover:ring-[var(--line-strong)] focus-within:ring-[var(--line-strong)]"
          }`}
        >
          <input
            type="radio"
            name={name}
            value={option}
            checked={value === option}
            onChange={(event) => onChange(event.target.value)}
            className="h-4 w-4 border-white/20 bg-transparent text-[var(--accent)] focus:ring-[var(--accent)]"
          />
          <span>{option}</span>
        </label>
      ))}
    </div>
  );
}

export default function HomePage() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [status, setStatus] = useState<StatusState>(null);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrorState>({});

  const completedRequired = useMemo(
    () => requiredFields.filter((key) => form[key].trim().length > 0).length,
    [form]
  );
  const progress = Math.round((completedRequired / requiredFields.length) * 100);

  const updateField = (name: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name in requiredLabels) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name as RequiredField];
        return next;
      });
    }
  };

  const validate = () => {
    const missing = requiredFields.filter(
      (key) => form[key as RequiredField].trim().length === 0
    );

    if (missing.length > 0) {
      const nextErrors: FieldErrorState = {};
      missing.forEach((field) => {
        nextErrors[field] = `${requiredLabels[field]} is required.`;
      });
      setFieldErrors(nextErrors);
      setStatus({
        type: "error",
        message: `Please complete ${missing.length} required ${
          missing.length === 1 ? "question" : "questions"
        }.`
      });
      return false;
    }

    setFieldErrors({});
    return true;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;

    setStatus(null);
    if (!validate()) return;

    setLoading(true);

    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      const data = await response.json().catch(() => null);

      if (response.ok && data?.ok) {
        setStatus({
          type: "success",
          message: "Thanks. Your response has been sent."
        });
        setForm(initialForm);
        setFieldErrors({});
      } else {
        setStatus({
          type: "error",
          message: data?.error || "Something went wrong while sending your response."
        });
      }
    } catch {
      setStatus({
        type: "error",
        message: "Network error. Please try again in a moment."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative isolate min-h-screen overflow-hidden px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto grid w-full max-w-[1200px] gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="reveal overflow-hidden rounded-[28px] bg-[linear-gradient(150deg,rgba(8,14,26,0.92),rgba(10,20,28,0.88))] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.38)] ring-1 ring-white/10 sm:p-10">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)] ring-1 ring-white/10">
              Founding user research
            </div>
            <div className="space-y-3">
              <h1 className="max-w-3xl font-display text-4xl leading-[1.08] text-[var(--text-main)] sm:text-5xl">
                Help shape a better tool for real-world decision making.
              </h1>
              <p className="max-w-3xl text-base leading-relaxed text-[var(--text-soft)] sm:text-lg">
                This is a short survey about where you get stuck and what would actually make
                progress easier.
              </p>
            </div>
            <div className="grid gap-3 text-sm text-[var(--text-soft)] sm:grid-cols-3">
              <div className="rounded-xl bg-[#0a1322]/80 px-4 py-3 ring-1 ring-white/10">~2 minutes</div>
              <div className="rounded-xl bg-[#0a1322]/80 px-4 py-3 ring-1 ring-white/10">9 required prompts</div>
              <div className="rounded-xl bg-[#0a1322]/80 px-4 py-3 ring-1 ring-white/10">Anonymous by default</div>
            </div>
            <div className="mt-2">
              <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                <span>Progress</span>
                <span>{progress}% complete</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,var(--accent),var(--accent-2))] transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          <form className="mt-10 space-y-5" onSubmit={handleSubmit} noValidate>
            <div className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden">
              <label htmlFor="company">Company</label>
              <input
                id="company"
                name="company"
                type="text"
                value={form.company}
                onChange={(event) => updateField("company", event.target.value)}
                autoComplete="off"
                tabIndex={-1}
              />
            </div>

            <QuestionCard index="01" title="Role" error={fieldErrors.role}>
              <RadioGroup
                name="role"
                options={roles}
                value={form.role}
                hasError={!!fieldErrors.role}
                onChange={(value) => updateField("role", value)}
              />
            </QuestionCard>

            <QuestionCard
              index="02"
              title="Weekly frustration"
              description="What is one thing you deal with constantly that feels harder than it should be?"
              error={fieldErrors.frustration}
            >
              <input
                type="text"
                name="frustration"
                value={form.frustration}
                onChange={(event) => updateField("frustration", event.target.value)}
                className={`${textInputClasses} ${fieldErrors.frustration ? "border-orange-300/45" : ""}`}
                placeholder="Write a short answer"
                maxLength={240}
                required
              />
              <p className="mt-2 text-xs text-[var(--text-muted)]">{form.frustration.length}/240</p>
            </QuestionCard>

            <QuestionCard index="03" title="Stuck on" error={fieldErrors.stuckOn}>
              <RadioGroup
                name="stuckOn"
                options={stuckOptions}
                value={form.stuckOn}
                hasError={!!fieldErrors.stuckOn}
                onChange={(value) => updateField("stuckOn", value)}
              />
            </QuestionCard>

            <QuestionCard
              index="04"
              title="Tried tools"
              description="What have you tried that did not work?"
              error={fieldErrors.triedTools}
            >
              <textarea
                name="triedTools"
                value={form.triedTools}
                onChange={(event) => updateField("triedTools", event.target.value)}
                className={`min-h-[140px] ${textInputClasses} ${fieldErrors.triedTools ? "border-orange-300/45" : ""}`}
                placeholder="Share anything you have tested"
                maxLength={2000}
                required
              />
              <p className="mt-2 text-xs text-[var(--text-muted)]">{form.triedTools.length}/2000</p>
            </QuestionCard>

            <QuestionCard
              index="05"
              title="Want help with"
              description="If you could get a clear answer quickly, what would you want help with?"
              error={fieldErrors.wantHelp}
            >
              <textarea
                name="wantHelp"
                value={form.wantHelp}
                onChange={(event) => updateField("wantHelp", event.target.value)}
                className={`min-h-[140px] ${textInputClasses} ${fieldErrors.wantHelp ? "border-orange-300/45" : ""}`}
                placeholder="Describe the outcome you want"
                maxLength={2000}
                required
              />
              <p className="mt-2 text-xs text-[var(--text-muted)]">{form.wantHelp.length}/2000</p>
            </QuestionCard>

            <QuestionCard index="06" title="Biggest benefit" error={fieldErrors.benefit}>
              <RadioGroup
                name="benefit"
                options={benefitOptions}
                value={form.benefit}
                hasError={!!fieldErrors.benefit}
                onChange={(value) => updateField("benefit", value)}
              />
            </QuestionCard>

            <QuestionCard index="07" title="Pay willingness" error={fieldErrors.pay}>
              <RadioGroup
                name="pay"
                options={payOptions}
                value={form.pay}
                hasError={!!fieldErrors.pay}
                onChange={(value) => updateField("pay", value)}
              />
            </QuestionCard>

            <QuestionCard
              index="08"
              title="Dealbreaker"
              description="What would make a tool like this annoying or useless?"
              error={fieldErrors.dealbreaker}
            >
              <textarea
                name="dealbreaker"
                value={form.dealbreaker}
                onChange={(event) => updateField("dealbreaker", event.target.value)}
                className={`min-h-[140px] ${textInputClasses} ${fieldErrors.dealbreaker ? "border-orange-300/45" : ""}`}
                placeholder="Share your dealbreakers"
                maxLength={2000}
                required
              />
              <p className="mt-2 text-xs text-[var(--text-muted)]">{form.dealbreaker.length}/2000</p>
            </QuestionCard>

            <QuestionCard
              index="09"
              title="Magic button"
              description="If you could remove one annoying problem from your life right now, what would it be?"
              error={fieldErrors.magic}
            >
              <textarea
                name="magic"
                value={form.magic}
                onChange={(event) => updateField("magic", event.target.value)}
                className={`min-h-[140px] ${textInputClasses} ${fieldErrors.magic ? "border-orange-300/45" : ""}`}
                placeholder="Name the one problem you would remove"
                maxLength={2000}
                required
              />
              <p className="mt-2 text-xs text-[var(--text-muted)]">{form.magic.length}/2000</p>
            </QuestionCard>

            <QuestionCard
              index="10"
              title="Optional contact"
              description="If you want early access, drop your email."
              required={false}
            >
              <input
                type="email"
                name="contact"
                value={form.contact}
                onChange={(event) => updateField("contact", event.target.value)}
                className={textInputClasses}
                placeholder="you@example.com"
                maxLength={200}
              />
              <p className="mt-2 text-xs text-[var(--text-muted)]">{form.contact.length}/200</p>
            </QuestionCard>

            <div className="reveal rounded-2xl bg-[#0a1322]/70 p-5 ring-1 ring-white/10 sm:p-6">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center rounded-xl bg-[linear-gradient(95deg,var(--accent),var(--accent-2))] px-6 py-3 text-sm font-semibold text-[#071117] shadow-[0_14px_36px_rgba(20,184,166,0.35)] transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Sending..." : "Send response"}
              </button>

              {status && (
                <div
                  role="status"
                  aria-live="polite"
                  className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
                    status.type === "success"
                      ? "border-emerald-300/40 bg-emerald-500/10 text-emerald-100"
                      : "border-orange-300/40 bg-orange-500/10 text-orange-100"
                  }`}
                >
                  {status.message}
                </div>
              )}
            </div>
          </form>
        </section>

        <aside className="space-y-5 lg:sticky lg:top-8 lg:self-start">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
            Survey Notes
          </p>
          <div className="reveal rounded-[24px] bg-[linear-gradient(145deg,rgba(10,19,31,0.92),rgba(11,26,30,0.86))] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] ring-1 ring-white/10">
            <h3 className="font-display text-[1.55rem] leading-tight text-[var(--text-main)]">Quick status</h3>
            <div className="mt-4 space-y-3 text-sm text-[var(--text-soft)]">
              <p className="rounded-xl bg-[#0a1322]/75 px-4 py-3 ring-1 ring-white/10">
                Completed required: {completedRequired}/{requiredFields.length}
              </p>
              <p className="rounded-xl bg-[#0a1322]/75 px-4 py-3 ring-1 ring-white/10">
                Estimated time left: {completedRequired >= 7 ? "under 1 min" : "about 2 min"}
              </p>
            </div>
          </div>

          <div className="reveal rounded-[24px] bg-[linear-gradient(145deg,rgba(10,19,31,0.92),rgba(14,24,20,0.82))] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] ring-1 ring-white/10">
            <h3 className="font-display text-[1.55rem] leading-tight text-[var(--text-main)]">What happens next</h3>
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-[var(--text-soft)]">
              <p>Responses are reviewed weekly and grouped by patterns.</p>
              <p>The highest-friction problems are prioritized first.</p>
              <p>Early testers get a short follow-up if they opt in.</p>
            </div>
          </div>

          <div className="reveal rounded-[24px] bg-[linear-gradient(145deg,rgba(10,19,31,0.92),rgba(20,19,12,0.82))] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] ring-1 ring-white/10">
            <h3 className="font-display text-[1.55rem] leading-tight text-[var(--text-main)]">Tips for better signal</h3>
            <div className="mt-4 space-y-3 text-sm text-[var(--text-soft)]">
              <p className="rounded-xl bg-[#0a1322]/75 px-4 py-3 ring-1 ring-white/10">
                Specific examples beat general feedback.
              </p>
              <p className="rounded-xl bg-[#0a1322]/75 px-4 py-3 ring-1 ring-white/10">
                Short and clear answers help the most.
              </p>
              <p className="rounded-xl bg-[#0a1322]/75 px-4 py-3 ring-1 ring-white/10">
                No email is required.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
