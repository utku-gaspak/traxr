import { useState, type FormEvent } from "react";
import { JobApplicationStatus, jobApplicationStatusLabels, type JobApplication, type JobApplicationCreateInput } from "../types";

interface JobApplicationFormProps {
  onCreate: (input: JobApplicationCreateInput) => Promise<JobApplication>;
}

const initialFormState: JobApplicationCreateInput = {
  companyName: "",
  position: "",
  status: JobApplicationStatus.Applied,
};

const JobApplicationForm = ({ onCreate }: JobApplicationFormProps) => {
  const [form, setForm] = useState<JobApplicationCreateInput>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await onCreate(form);
      setForm(initialFormState);
    } catch (error) {
      console.error("Create job application failed:", error);
      setErrorMessage("Could not save the application. Check the form and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="panel panel-form">
      <div className="panel-header">
        <div>
          <p className="eyebrow">New application</p>
          <h2>Add a job application</h2>
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

        <button className="primary-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Add Application"}
        </button>
      </form>
    </section>
  );
};

export default JobApplicationForm;
