import { useEffect, useState, type FormEvent } from "react";
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
}

const initialFormState: JobApplicationCreateInput = {
  companyName: "",
  position: "",
  status: JobApplicationStatus.Applied,
};

const JobApplicationForm = ({
  onCreate,
  onUpdate,
  editingApplication,
  onCancelEdit,
}: JobApplicationFormProps) => {
  const [form, setForm] = useState<JobApplicationCreateInput>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (editingApplication) {
      setForm({
        companyName: editingApplication.companyName,
        position: editingApplication.position,
        status: editingApplication.status,
      });
    } else {
      setForm(initialFormState);
    }

    setErrorMessage(null);
  }, [editingApplication]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (editingApplication) {
        await onUpdate(editingApplication.id, {
          companyName: form.companyName,
          position: form.position,
          status: form.status,
          dateApplied: editingApplication.dateApplied,
        });
        onCancelEdit();
      } else {
        await onCreate(form);
        setForm(initialFormState);
      }
    } catch (error) {
      console.error("Save job application failed:", error);
      setErrorMessage("Could not save the application. Check the form and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="panel panel-form">
      <div className="panel-header">
        <div>
          <p className="eyebrow">{editingApplication ? "Edit application" : "New application"}</p>
          <h2>{editingApplication ? "Update job application" : "Add a job application"}</h2>
        </div>
      </div>

      <form className="job-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Company Name</span>
          <input
            value={form.companyName}
            onChange={(event) => setForm((current) => ({ ...current, companyName: event.target.value }))}
            placeholder="Example: Stripe"
            required
          />
        </label>

        <label className="field">
          <span>Position</span>
          <input
            value={form.position}
            onChange={(event) => setForm((current) => ({ ...current, position: event.target.value }))}
            placeholder="Example: Backend Engineer"
            required
          />
        </label>

        <label className="field">
          <span>Status</span>
          <select
            value={form.status}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                status: Number(event.target.value) as JobApplicationStatus,
              }))
            }
          >
            {Object.values(JobApplicationStatus)
              .filter((value): value is JobApplicationStatus => typeof value === "number")
              .map((value) => (
                <option key={value} value={value}>
                  {jobApplicationStatusLabels[value]}
                </option>
              ))}
          </select>
        </label>

        {errorMessage ? <p className="form-error">{errorMessage}</p> : null}

        <div className="form-actions">
          <button className="primary-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : editingApplication ? "Save Changes" : "Add Application"}
          </button>
          {editingApplication ? (
            <button className="ghost-button" type="button" onClick={onCancelEdit}>
              Cancel
            </button>
          ) : null}
        </div>
      </form>
    </section>
  );
};

export default JobApplicationForm;
