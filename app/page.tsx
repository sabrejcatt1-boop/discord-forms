"use client";

import { useState } from "react";

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

type QuestionCardProps = {
  index: string;
  title: string;
  description?: string;
  required?: boolean;
  children: React.ReactNode;
};

type RadioGroupProps = {
  name: keyof FormState;
  options: string[];
  value: string;
  onChange: (value: string) => void;
};

function QuestionCard({
  index,
  title,
  description,
  required = true,
  children
}: QuestionCardProps) {
  return (
    <section className="reveal rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
            {index}
          </p>
          <h2 className="mt-2 font-display text-xl text-[var(--text-main)]">{title}</h2>
          {description && (
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--text-soft)]">
              {description}
            </p>
          )}
        </div>
        {required && (
          <span className="rounded-full border border-white/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
            Required
          </span>
        )}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function RadioGroup({ name, options, value, onChange }: RadioGroupProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {options.map((option) => (
        <label
          key={option}
          className="group flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-[var(--text-soft)] transition hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:bg-black/35 focus-within:border-[var(--line-strong)]"
        >
          <input
            type="radio"
            name={name}
            value={option}
            checked={value === option}
            onChange={(event) => onChange(event.target.value)}
            className="h-4 w-4 border-white/20 bg-transparent text-[var(--accent)] focus:ring-[var(--accent)]"
          />
          <span className="group-hover:text-[var(--text-main)]">{option}</span>
        </label>
      ))}
    </div>
  );
}

export default function HomePage() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [status, setStatus] = useState<StatusState>(null);
  const [loading, setLoading] = useState(false);

  const updateField = (name: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const missing = requiredFields.filter(
      (key) => form[key as RequiredField].trim().length === 0
    );

    if (missing.length > 0) {
      setStatus({
        type: "error",
        message: "Please fill in all required questions before submitting."
      });
      return false;
    }

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
    <main className="relative isolate min-h-screen overflow-hidden px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="reveal overflow-hidden rounded-[30px] border border-white/15 bg-[linear-gradient(140deg,rgba(8,15,30,0.92),rgba(8,16,18,0.92))] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.45)] sm:p-10">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
              Founding user research
            </div>
            <div className="space-y-3">
              <h1 className="max-w-2xl font-display text-4xl leading-tight text-[var(--text-main)] sm:text-5xl">
                Help shape a better tool for real-world decision making.
              </h1>
              <p className="max-w-3xl text-base leading-relaxed text-[var(--text-soft)] sm:text-lg">
                This is a short survey about where you get stuck and what would actually make
                progress easier.
              </p>
            </div>
            <div className="grid gap-3 text-sm text-[var(--text-soft)] sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">~2 minutes</div>
              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">9 required prompts</div>
              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">Anonymous by default</div>
            </div>
          </div>

          <form className="mt-10 space-y-6" onSubmit={handleSubmit}>
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

            <QuestionCard index="01" title="Role">
              <RadioGroup
                name="role"
                options={roles}
                value={form.role}
                onChange={(value) => updateField("role", value)}
              />
            </QuestionCard>

            <QuestionCard
              index="02"
              title="Weekly frustration"
              description="What is one thing you deal with constantly that feels harder than it should be?"
            >
              <input
                type="text"
                name="frustration"
                value={form.frustration}
                onChange={(event) => updateField("frustration", event.target.value)}
                className="w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:border-[var(--line-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)]"
                placeholder="Write a short answer"
                maxLength={240}
                required
              />
            </QuestionCard>

            <QuestionCard index="03" title="Stuck on">
              <RadioGroup
                name="stuckOn"
                options={stuckOptions}
                value={form.stuckOn}
                onChange={(value) => updateField("stuckOn", value)}
              />
            </QuestionCard>

            <QuestionCard
              index="04"
              title="Tried tools"
              description="What have you tried that did not work?"
            >
              <textarea
                name="triedTools"
                value={form.triedTools}
                onChange={(event) => updateField("triedTools", event.target.value)}
                className="min-h-[140px] w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:border-[var(--line-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)]"
                placeholder="Share anything you have tested"
                maxLength={2000}
                required
              />
            </QuestionCard>

            <QuestionCard
              index="05"
              title="Want help with"
              description="If you could get a clear answer quickly, what would you want help with?"
            >
              <textarea
                name="wantHelp"
                value={form.wantHelp}
                onChange={(event) => updateField("wantHelp", event.target.value)}
                className="min-h-[140px] w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:border-[var(--line-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)]"
                placeholder="Describe the outcome you want"
                maxLength={2000}
                required
              />
            </QuestionCard>

            <QuestionCard index="06" title="Biggest benefit">
              <RadioGroup
                name="benefit"
                options={benefitOptions}
                value={form.benefit}
                onChange={(value) => updateField("benefit", value)}
              />
            </QuestionCard>

            <QuestionCard index="07" title="Pay willingness">
              <RadioGroup
                name="pay"
                options={payOptions}
                value={form.pay}
                onChange={(value) => updateField("pay", value)}
              />
            </QuestionCard>

            <QuestionCard
              index="08"
              title="Dealbreaker"
              description="What would make a tool like this annoying or useless?"
            >
              <textarea
                name="dealbreaker"
                value={form.dealbreaker}
                onChange={(event) => updateField("dealbreaker", event.target.value)}
                className="min-h-[140px] w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:border-[var(--line-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)]"
                placeholder="Share your dealbreakers"
                maxLength={2000}
                required
              />
            </QuestionCard>

            <QuestionCard
              index="09"
              title="Magic button"
              description="If you could remove one annoying problem from your life right now, what would it be?"
            >
              <textarea
                name="magic"
                value={form.magic}
                onChange={(event) => updateField("magic", event.target.value)}
                className="min-h-[140px] w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:border-[var(--line-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)]"
                placeholder="Name the one problem you would remove"
                maxLength={2000}
                required
              />
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
                className="w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:border-[var(--line-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)]"
                placeholder="you@example.com"
                maxLength={200}
              />
            </QuestionCard>

            <div className="reveal rounded-3xl border border-white/10 bg-black/20 p-5 sm:p-6">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-[linear-gradient(90deg,var(--accent),var(--accent-2))] px-6 py-3 text-sm font-semibold text-[#071117] shadow-[0_14px_36px_rgba(20,184,166,0.35)] transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Sending..." : "Send response"}
              </button>

              {status && (
                <div
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

        <aside className="space-y-6 lg:sticky lg:top-8 lg:self-start">
          <div className="reveal rounded-[26px] border border-white/15 bg-[linear-gradient(145deg,rgba(8,15,30,0.85),rgba(14,24,20,0.82))] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
            <h3 className="font-display text-2xl text-[var(--text-main)]">What happens next</h3>
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-[var(--text-soft)]">
              <p>Responses are reviewed weekly and grouped by patterns.</p>
              <p>The highest-friction problems are prioritized first.</p>
              <p>Early testers get a short follow-up if they opt in.</p>
            </div>
          </div>

          <div className="reveal rounded-[26px] border border-white/15 bg-[linear-gradient(145deg,rgba(8,15,30,0.85),rgba(20,19,12,0.82))] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
            <h3 className="font-display text-2xl text-[var(--text-main)]">Tips for better signal</h3>
            <div className="mt-4 space-y-3 text-sm text-[var(--text-soft)]">
              <p className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                Specific examples beat general feedback.
              </p>
              <p className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                Short and clear answers help the most.
              </p>
              <p className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                No email is required.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
