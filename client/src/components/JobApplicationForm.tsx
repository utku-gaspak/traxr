import { X } from "lucide-react";
import { useEffect, useState, type FormEvent, type KeyboardEvent } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import {
  JobApplicationStatus,
  jobApplicationStatusLabels,
  type JobApplication,
  type JobApplicationCreateInput,
  type JobApplicationUpdateInput,
} from "../types";

interface JobApplicationFormProps {
  onCreate: (input: JobApplicationCreateInput) => Promise<JobApplication>;
  onUpdate: (id: string, input: JobApplicationUpdateInput) => Promise<void>;
  editingApplication: JobApplication | null;
  onCancelEdit: () => void;
  onSuccess: () => void;
  submitLabel?: string;
  submittingLabel?: string;
  cancelLabel?: string;
}

interface ValidationErrors {
  companyName?: string;
  position?: string;
}

const initialFormState: JobApplicationCreateInput = {
  companyName: "",
  position: "",
  jobUrl: "",
  location: "",
  salaryRange: "",
  jobDescription: "",
  interestLevel: null,
  technicalStack: "",
  status: JobApplicationStatus.Applied,
};

const splitTechnicalStack = (value?: string | null) =>
  value
    ?.split(",")
    .map((skill) => skill.trim())
    .filter(Boolean) ?? [];

const joinTechnicalStack = (skills: string[]) => skills.join(", ");
const defaultInterestLevel = 3;

const JobApplicationForm = ({
  onCreate,
  onUpdate,
  editingApplication,
  onCancelEdit,
  onSuccess,
  submitLabel,
  submittingLabel = "Saving...",
  cancelLabel = "Cancel",
}: JobApplicationFormProps) => {
  const [form, setForm] = useState<JobApplicationCreateInput>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {},
  );
  const [technicalStackDraft, setTechnicalStackDraft] = useState("");

  useEffect(() => {
    if (editingApplication) {
      setForm({
        companyName: editingApplication.companyName,
        position: editingApplication.position,
        jobUrl: editingApplication.jobUrl ?? "",
        location: editingApplication.location ?? "",
        salaryRange: editingApplication.salaryRange ?? "",
        jobDescription: editingApplication.jobDescription ?? "",
        interestLevel: editingApplication.interestLevel ?? null,
        technicalStack: editingApplication.technicalStack ?? "",
        status: editingApplication.status,
      });
    } else {
      setForm(initialFormState);
    }

    setErrorMessage(null);
    setValidationErrors({});
    setTechnicalStackDraft("");
  }, [editingApplication]);

  const technicalStackSkills = splitTechnicalStack(form.technicalStack);

  const setTechnicalStackSkills = (skills: string[]) => {
    setForm((current) => ({
      ...current,
      technicalStack: joinTechnicalStack(skills),
    }));
  };

  const addTechnicalStackSkill = () => {
    const nextSkill = technicalStackDraft.trim();

    if (!nextSkill) {
      return;
    }

    const alreadyExists = technicalStackSkills.some(
      (skill) => skill.toLowerCase() === nextSkill.toLowerCase(),
    );

    if (!alreadyExists) {
      setTechnicalStackSkills([...technicalStackSkills, nextSkill]);
    }

    setTechnicalStackDraft("");
  };

  const removeTechnicalStackSkill = (skillToRemove: string) => {
    setTechnicalStackSkills(
      technicalStackSkills.filter((skill) => skill !== skillToRemove),
    );
  };

  const handleTechnicalStackKeyDown = (
    event: KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    addTechnicalStackSkill();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    const trimmedTechnicalStackDraft = technicalStackDraft.trim();
    const nextTechnicalStackSkills = trimmedTechnicalStackDraft
      ? [
          ...technicalStackSkills,
          ...(!technicalStackSkills.some(
            (skill) =>
              skill.toLowerCase() === trimmedTechnicalStackDraft.toLowerCase(),
          )
            ? [trimmedTechnicalStackDraft]
            : []),
        ]
      : technicalStackSkills;
    const nextTechnicalStack = joinTechnicalStack(nextTechnicalStackSkills);

    const nextValidationErrors: ValidationErrors = {};

    if (!form.companyName.trim()) {
      nextValidationErrors.companyName = "Company name is required.";
    }

    if (!form.position.trim()) {
      nextValidationErrors.position = "Position is required.";
    }

    if (Object.keys(nextValidationErrors).length > 0) {
      setValidationErrors(nextValidationErrors);
      return;
    }

    setValidationErrors({});
    setIsSubmitting(true);

    try {
      if (editingApplication) {
        await onUpdate(editingApplication.id, {
          companyName: form.companyName,
          position: form.position,
          jobUrl: form.jobUrl,
          location: form.location,
          salaryRange: form.salaryRange,
          jobDescription: form.jobDescription,
          interestLevel: form.interestLevel,
          technicalStack: nextTechnicalStack,
          status: form.status,
          dateApplied: editingApplication.dateApplied,
        });
      } else {
        await onCreate({
          ...form,
          technicalStack: nextTechnicalStack,
        });
        setForm(initialFormState);
        setTechnicalStackDraft("");
      }

      onSuccess();
    } catch (error) {
      console.error("Save job application failed:", error);
      setErrorMessage(
        "Could not save the application. Check the form and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      className="grid gap-5 p-6 md:grid-cols-2"
      noValidate
      onSubmit={handleSubmit}
    >
      <label className="grid gap-2 md:col-span-2">
        <span className="text-sm font-semibold uppercase tracking-[0.12em] text-deco-muted">
          Company Name
        </span>
        <Input
          aria-label="Company Name"
          value={form.companyName}
          onChange={(event) => {
            const value = event.target.value;
            setForm((current) => ({ ...current, companyName: value }));
            setValidationErrors((current) => ({
              ...current,
              companyName: undefined,
            }));
          }}
          placeholder="Example: Stripe"
          required
        />
        {validationErrors.companyName ? (
          <span className="text-sm text-danger">
            {validationErrors.companyName}
          </span>
        ) : null}
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-semibold uppercase tracking-[0.12em] text-deco-muted">
          Position
        </span>
        <Input
          aria-label="Position"
          value={form.position}
          onChange={(event) => {
            const value = event.target.value;
            setForm((current) => ({ ...current, position: value }));
            setValidationErrors((current) => ({
              ...current,
              position: undefined,
            }));
          }}
          placeholder="Example: Backend Engineer"
          required
        />
        {validationErrors.position ? (
          <span className="text-sm text-danger">
            {validationErrors.position}
          </span>
        ) : null}
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-semibold uppercase tracking-[0.12em] text-deco-muted">
          Status
        </span>
        <select
          aria-label="Status"
          className="deco-frame h-11 border-border-gold-muted bg-deco-input px-3 py-2 text-sm shadow-sm outline-none transition-colors focus:border-primary-gold focus:ring-2 focus:ring-primary-gold-muted"
          value={form.status}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              status: Number(event.target.value) as JobApplicationStatus,
            }))
          }
        >
          {Object.values(JobApplicationStatus)
            .filter(
              (value): value is JobApplicationStatus =>
                typeof value === "number",
            )
            .map((value) => (
              <option key={value} value={value}>
                {jobApplicationStatusLabels[value]}
              </option>
            ))}
        </select>
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-semibold uppercase tracking-[0.12em] text-deco-muted">
          Job URL
        </span>
        <Input
          aria-label="Job URL"
          value={form.jobUrl ?? ""}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              jobUrl: event.target.value,
            }))
          }
          placeholder="https://..."
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-semibold uppercase tracking-[0.12em] text-deco-muted">
          Location
        </span>
        <Input
          aria-label="Location"
          value={form.location ?? ""}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              location: event.target.value,
            }))
          }
          placeholder="Remote / Essen"
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-semibold uppercase tracking-[0.12em] text-deco-muted">
          Salary Range
        </span>
        <Input
          aria-label="Salary Range"
          value={form.salaryRange ?? ""}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              salaryRange: event.target.value,
            }))
          }
          placeholder="48k€ - 54k€"
        />
      </label>

      <label className="grid gap-2">
        <span className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold uppercase tracking-[0.12em] text-deco-muted">
            Interest Level
          </span>
          <span
            aria-live="polite"
            className="deco-frame border-border-gold-muted bg-deco-surface px-2 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-primary-gold"
          >
          {form.interestLevel ?? defaultInterestLevel}/5
          </span>
        </span>
        <input
          aria-label="Interest Level"
          className="deco-range-slider"
          max={5}
          min={1}
          step={1}
          type="range"
          value={form.interestLevel ?? defaultInterestLevel}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              interestLevel: Number(event.target.value),
            }))
          }
        />
      </label>

      <div className="grid gap-2">
        <span className="text-sm font-semibold uppercase tracking-[0.12em] text-deco-muted">
          Technical Stack
        </span>
        <div className="grid gap-2">
          {technicalStackSkills.length > 0 ? (
            <div
              aria-label="Selected technical stack"
              className="deco-frame flex min-h-10 flex-wrap gap-2 border-border-gold-muted bg-deco-surface-soft p-2"
            >
              {technicalStackSkills.map((skill) => (
                <span
                  className="deco-frame inline-flex items-center gap-2 border-border-gold-muted bg-deco-card px-2 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-deco-foreground"
                  key={skill}
                >
                  {skill}
                  <button
                    aria-label={`Remove ${skill}`}
                    className="text-deco-muted transition-colors hover:text-danger focus:outline-none focus:ring-2 focus:ring-primary-gold-muted"
                    onClick={() => removeTechnicalStackSkill(skill)}
                    type="button"
                  >
                    <X aria-hidden="true" className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          ) : null}
          <Input
            aria-label="Technical Stack"
            value={technicalStackDraft}
            onBlur={addTechnicalStackSkill}
            onChange={(event) => setTechnicalStackDraft(event.target.value)}
            onKeyDown={handleTechnicalStackKeyDown}
            placeholder="Type a skill and press Enter"
          />
        </div>
      </div>

      <label className="grid gap-2">
        <span className="text-sm font-semibold uppercase tracking-[0.12em] text-deco-muted">
          Job Description
        </span>
        <Textarea
          aria-label="Job Description"
          value={form.jobDescription ?? ""}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              jobDescription: event.target.value,
            }))
          }
          placeholder="Paste the full job post here for future reference..."
        />
      </label>

      {errorMessage ? (
        <p className="deco-frame border-danger bg-danger-soft px-3 py-2 text-sm text-danger md:col-span-2">
          {errorMessage}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3 pt-2 md:col-span-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? submittingLabel
            : (submitLabel ??
              (editingApplication ? "Save Changes" : "Add Application"))}
        </Button>
        <Button variant="ghost" type="button" onClick={onCancelEdit}>
          {cancelLabel}
        </Button>
      </div>
    </form>
  );
};

export default JobApplicationForm;
