import axios from "axios";
import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd";
import {
  BadgePlus,
  BriefcaseBusiness,
  Columns3,
  Diamond,
  ExternalLink,
  FileText,
  LogOut,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import {
  createJobApplication,
  deleteJobApplication,
  listJobApplications,
  updateJobApplication,
} from "../api/jobApplicationsApi";
import JobApplicationForm from "./JobApplicationForm";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "./ui/sheet";
import {
  JobApplicationStatus,
  jobApplicationStatusLabels,
  jobApplicationStatusOrder,
  type JobApplication,
  type JobApplicationCreateInput,
  type JobApplicationUpdateInput,
} from "../types";

const formatAppliedDate = (isoDate: string) =>
  new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).format(new Date(isoDate));

const getLoadApplicationsErrorMessage = (error: unknown) => {
  // Keep server-side failures and connectivity failures distinct so the UI can suggest the right next step.
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return "Could not reach the server. Check your connection and try again.";
    }

    if (error.response.status >= 500) {
      return "Something went wrong. Please try again.";
    }
  }

  return "Could not load job applications.";
};

const boardColumns = [
  {
    status: JobApplicationStatus.Applied,
    title: "Applied",
    subtitle: "Fresh outreach",
    borderClass: "border-l-[color:var(--color-column-applied)]",
    accentClass: "text-[color:var(--color-column-applied)]",
    dotClass: "bg-[color:var(--color-column-applied)]",
  },
  {
    status: JobApplicationStatus.Interviewing,
    title: "Interviewing",
    subtitle: "Active conversations",
    borderClass: "border-l-[color:var(--color-column-interviewing)]",
    accentClass: "text-[color:var(--color-column-interviewing)]",
    dotClass: "bg-[color:var(--color-column-interviewing)]",
  },
  {
    status: JobApplicationStatus.Rejected,
    title: "Rejected",
    subtitle: "Closed loops",
    borderClass: "border-l-[color:var(--color-column-rejected)]",
    accentClass: "text-[color:var(--color-column-rejected)]",
    dotClass: "bg-[color:var(--color-column-rejected)]",
  },
  {
    status: JobApplicationStatus.Offer,
    title: "Offer",
    subtitle: "Decision stage",
    borderClass: "border-l-[color:var(--color-column-offer)]",
    accentClass: "text-[color:var(--color-column-offer)]",
    dotClass: "bg-[color:var(--color-column-offer)]",
  },
] as const;

const buildColumns = (applications: JobApplication[]) =>
  jobApplicationStatusOrder.reduce<
    Record<JobApplicationStatus, JobApplication[]>
  >(
    (columns, status) => {
      columns[status] = applications.filter(
        (application) => application.status === status,
      );
      return columns;
    },
    {
      [JobApplicationStatus.Applied]: [],
      [JobApplicationStatus.Interviewing]: [],
      [JobApplicationStatus.Rejected]: [],
      [JobApplicationStatus.Offer]: [],
    },
  );

const flattenColumns = (
  columns: Record<JobApplicationStatus, JobApplication[]>,
) => jobApplicationStatusOrder.flatMap((status) => columns[status]);

const reorderApplications = (
  applications: JobApplication[],
  sourceStatus: JobApplicationStatus,
  destinationStatus: JobApplicationStatus,
  sourceIndex: number,
  destinationIndex: number,
) => {
  const columns = buildColumns(applications);
  const sourceItems = [...columns[sourceStatus]];
  const [movedApplication] = sourceItems.splice(sourceIndex, 1);

  if (!movedApplication) {
    return null;
  }

  const destinationItems =
    sourceStatus === destinationStatus
      ? sourceItems
      : [...columns[destinationStatus]];
  const nextApplication =
    sourceStatus === destinationStatus
      ? movedApplication
      : { ...movedApplication, status: destinationStatus };

  destinationItems.splice(destinationIndex, 0, nextApplication);

  const nextColumns = {
    ...columns,
    [sourceStatus]: sourceItems,
    [destinationStatus]: destinationItems,
  };

  return {
    movedApplication: nextApplication,
    nextApplications: flattenColumns(nextColumns),
  };
};

const detailRows = (application: JobApplication) => [
  { label: "Company", value: application.companyName },
  { label: "Position", value: application.position },
  { label: "Status", value: jobApplicationStatusLabels[application.status] },
  { label: "Date", value: formatAppliedDate(application.dateApplied) },
  { label: "Location", value: application.location ?? "Not provided" },
  { label: "Salary", value: application.salaryRange ?? "Not provided" },
  // These remain view-only placeholders until the backend model persists them.
  { label: "Technical Stack", value: "Not tracked yet" },
] as const;

const Dashboard = () => {
  const { logout } = useAuth();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [isDetailEditing, setIsDetailEditing] = useState(false);

  const columns = useMemo(() => buildColumns(applications), [applications]);

  useEffect(() => {
    const loadApplications = async () => {
      try {
        setErrorMessage(null);
        const items = await listJobApplications();
        setApplications(items);
      } catch (error) {
        console.error("Load job applications failed:", error);
        setErrorMessage(getLoadApplicationsErrorMessage(error));
      } finally {
        setIsLoading(false);
      }
    };

    void loadApplications();
  }, []);

  const openCreateDialog = () => {
    setIsCreateDialogOpen(true);
  };

  const closeCreateDialog = () => {
    setIsCreateDialogOpen(false);
  };

  const openDetails = (application: JobApplication) => {
    setSelectedApplication(application);
    setIsDetailEditing(false);
  };

  const closeDetails = () => {
    setSelectedApplication(null);
    setIsDetailEditing(false);
  };

  const handleCreate = async (input: JobApplicationCreateInput) => {
    const createdApplication = await createJobApplication(input);
    setApplications((current) => [createdApplication, ...current]);
    toast.success("Application added.");
    return createdApplication;
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteJobApplication(id);
      setApplications((current) =>
        current.filter((application) => application.id !== id),
      );
      setSelectedApplication((current) => (current?.id === id ? null : current));
      setIsDetailEditing(false);
      toast.success("Application removed.");
    } catch (error) {
      console.error("Delete job application failed:", error);
      setErrorMessage("Could not delete the application.");
    }
  };

  const handleUpdate = async (id: string, input: JobApplicationUpdateInput) => {
    await updateJobApplication(id, input);

    let updatedApplication: JobApplication | null = null;

    setApplications((current) =>
      current.map((application) => {
        if (application.id !== id) {
          return application;
        }

        updatedApplication = {
          ...application,
          companyName: input.companyName,
          position: input.position,
          jobUrl: input.jobUrl ?? null,
          location: input.location ?? null,
          salaryRange: input.salaryRange ?? null,
          jobDescription: input.jobDescription ?? null,
          status: input.status,
          dateApplied: input.dateApplied,
        };

        return updatedApplication;
      }),
    );

    if (updatedApplication) {
      setSelectedApplication(updatedApplication);
    }

    setIsDetailEditing(false);
    toast.success("Application updated.");
  };

  const handleDragEnd = async (result: DropResult) => {
    const destination = result.destination;

    if (!destination) {
      return;
    }

    const sourceStatus = Number(
      result.source.droppableId,
    ) as JobApplicationStatus;
    const destinationStatus = Number(
      destination.droppableId,
    ) as JobApplicationStatus;

    if (
      sourceStatus === destinationStatus &&
      result.source.index === destination.index
    ) {
      return;
    }

    const reordered = reorderApplications(
      applications,
      sourceStatus,
      destinationStatus,
      result.source.index,
      destination.index,
    );

    if (!reordered) {
      return;
    }

    const previousApplications = applications;
    setApplications(reordered.nextApplications);

    if (selectedApplication?.id === reordered.movedApplication.id) {
      setSelectedApplication(reordered.movedApplication);
    }

    if (sourceStatus === destinationStatus) {
      return;
    }

    try {
      // The board responds immediately on drop, then rolls back if the persisted status update fails.
      await updateJobApplication(reordered.movedApplication.id, {
        companyName: reordered.movedApplication.companyName,
        position: reordered.movedApplication.position,
        jobUrl: reordered.movedApplication.jobUrl ?? undefined,
        location: reordered.movedApplication.location ?? undefined,
        salaryRange: reordered.movedApplication.salaryRange ?? undefined,
        jobDescription: reordered.movedApplication.jobDescription ?? undefined,
        status: reordered.movedApplication.status,
        dateApplied: reordered.movedApplication.dateApplied,
      });

      toast.success(
        `${reordered.movedApplication.companyName} moved to ${jobApplicationStatusLabels[destinationStatus]}.`,
      );
    } catch (error) {
      console.error("Move job application failed:", error);
      setApplications(previousApplications);
      if (selectedApplication?.id === reordered.movedApplication.id) {
        const previousSelected = previousApplications.find(
          (application) => application.id === reordered.movedApplication.id,
        );
        setSelectedApplication(previousSelected ?? null);
      }
      setErrorMessage("Could not update the application status.");
      toast.error("Could not update the application status.");
    }
  };

  return (
    <main className="mx-auto grid min-h-screen max-w-[1600px] gap-6 px-4 py-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-6">
      <aside className="deco-sidebar sticky top-6 self-start border border-[color:var(--color-border-strong)] bg-[color:rgba(255,255,255,0.74)] p-6 shadow-[var(--shadow-panel)] backdrop-blur md:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-primary)]">
          Job Application Tracker
        </p>
        <h1 className="mt-3 text-4xl leading-[0.95] text-[color:var(--color-foreground)]">
          Application dashboard
        </h1>
        <p className="mt-4 text-sm leading-6 text-[color:var(--color-muted-foreground)]">
          A Kanban style board for managing job applications.
        </p>

        <Card className="mt-8 border-[color:var(--color-border-strong)] bg-[color:rgba(255,255,255,0.86)]">
          <CardHeader className="pb-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-primary)]">
              Summary
            </p>
            <CardTitle className="text-3xl">{applications.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[color:var(--color-muted-foreground)]">
              Total applications tracked
            </p>
          </CardContent>
        </Card>

        <nav className="mt-8 grid gap-2">
          {boardColumns.map((column) => (
            <a
              key={column.status}
              href={`#column-${column.title.toLowerCase()}`}
              className="flex items-center justify-between border border-transparent px-3 py-2 text-sm uppercase tracking-[0.16em] text-[color:var(--color-muted-foreground)] transition-colors hover:border-[color:var(--color-border)] hover:bg-[color:rgba(255,255,255,0.5)] hover:text-[color:var(--color-primary)]"
            >
              <span>{column.title}</span>
              <span className={column.accentClass}>
                {columns[column.status].length}
              </span>
            </a>
          ))}
        </nav>

        <div className="mt-8 grid gap-3">
          <Button className="w-full justify-center" onClick={openCreateDialog}>
            <BadgePlus className="h-4 w-4" />
            New Application
          </Button>
          <Button
            className="w-full justify-center"
            variant="outline"
            onClick={logout}
          >
            <LogOut className="h-4 w-4" />
            Log out
          </Button>
        </div>
      </aside>

      <section className="grid gap-6">
        <header className="flex flex-col gap-4 border border-[color:var(--color-border)] bg-[color:rgba(255,255,255,0.52)] p-6 shadow-[var(--shadow-panel)] md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-primary)]">
              High-End Boutique Office
            </p>
            <div className="mt-2 flex items-center gap-3">
              <BriefcaseBusiness className="h-5 w-5 text-[color:var(--color-primary)]" />
              <h2 className="text-3xl text-[color:var(--color-foreground)]">
                Track every move with precision.
              </h2>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm uppercase tracking-[0.14em] text-[color:var(--color-muted-foreground)]">
            <span className="inline-flex items-center gap-2">
              <Columns3 className="h-4 w-4 text-[color:var(--color-primary)]" />
              Drag to update status
            </span>
          </div>
        </header>

        {errorMessage ? (
          <p className="border border-[color:var(--color-danger)] bg-[color:var(--color-danger-soft)] px-4 py-3 text-sm text-[color:var(--color-danger)]">
            {errorMessage}
          </p>
        ) : null}

        {isLoading ? (
          <p className="border border-[color:var(--color-border)] bg-[color:rgba(255,255,255,0.72)] px-4 py-3 text-sm text-[color:var(--color-muted-foreground)]">
            Loading applications...
          </p>
        ) : null}

        {!isLoading && applications.length === 0 ? (
          <div className="border border-[color:var(--color-border)] bg-[color:rgba(255,255,255,0.78)] px-5 py-10 text-center shadow-[var(--shadow-panel)]">
            <p className="font-heading text-2xl text-[color:var(--color-foreground)]">
              No applications yet.
            </p>
            <p className="mt-3 text-sm text-[color:var(--color-muted-foreground)]">
              No applications yet. Add your first one and it will appear here
              immediately.
            </p>
            <Button className="mt-6" onClick={openCreateDialog}>
              <BadgePlus className="h-4 w-4" />
              Add Application
            </Button>
          </div>
        ) : null}

        {!isLoading && applications.length > 0 ? (
          <DragDropContext onDragEnd={(result) => void handleDragEnd(result)}>
            <div className="grid gap-5 xl:grid-cols-4">
              {boardColumns.map((column) => (
                <section
                  className="kanban-column flex min-h-[26rem] flex-col border border-[color:var(--color-border)] bg-[color:rgba(255,255,255,0.74)] p-4"
                  id={`column-${column.title.toLowerCase()}`}
                  key={column.status}
                >
                  <div className="border-b border-[color:var(--color-primary)] pb-3">
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <h3 className="text-2xl text-[color:var(--color-foreground)]">
                          {column.title}
                        </h3>
                        <p className="mt-1 text-sm text-[color:var(--color-muted-foreground)]">
                          {column.subtitle}
                        </p>
                      </div>
                      <span className={column.accentClass}>
                        {columns[column.status].length}
                      </span>
                    </div>
                  </div>

                  <Droppable droppableId={String(column.status)}>
                    {(droppableProvided, droppableSnapshot) => (
                      <div
                        className={`mt-4 flex min-h-[16rem] flex-1 flex-col gap-2 transition-colors ${
                          droppableSnapshot.isDraggingOver
                            ? "bg-[color:rgba(212,175,55,0.06)]"
                            : ""
                        }`}
                        ref={droppableProvided.innerRef}
                        {...droppableProvided.droppableProps}
                      >
                        {columns[column.status].map((application, index) => (
                          <Draggable
                            draggableId={application.id}
                            index={index}
                            key={application.id}
                          >
                            {(draggableProvided, draggableSnapshot) => (
                              <article
                                className={`application-card ${column.borderClass} cursor-pointer border-l-[2px] border-y border-r border-[color:var(--color-border)] bg-[color:rgba(255,255,255,0.9)] px-3 py-2 font-sans text-[0.78rem] tracking-[0.02em] text-[color:var(--color-foreground)] shadow-sm transition-shadow hover:shadow-[0_0_10px_rgba(212,175,55,0.14)] ${
                                  draggableSnapshot.isDragging
                                    ? "shadow-[0_0_14px_rgba(212,175,55,0.18)]"
                                    : ""
                                }`}
                                key={application.id}
                                ref={draggableProvided.innerRef}
                                {...draggableProvided.draggableProps}
                                {...draggableProvided.dragHandleProps}
                                onClick={() => openDetails(application)}
                              >
                                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                                  <div className="flex min-w-0 items-center gap-2 overflow-hidden whitespace-nowrap">
                                    <span className="truncate font-semibold uppercase tracking-[0.08em] text-[color:var(--color-foreground)]">
                                      {application.companyName}
                                    </span>
                                    <span className="shrink-0 text-[color:var(--color-primary)]">-</span>
                                    <span className="truncate text-[color:var(--color-muted-foreground)]">
                                      {application.position}
                                    </span>
                                  </div>
                                  <span className="shrink-0 text-right text-[color:var(--color-muted-foreground)]">
                                    {formatAppliedDate(application.dateApplied)}
                                  </span>
                                </div>
                              </article>
                            )}
                          </Draggable>
                        ))}
                        {droppableProvided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </section>
              ))}
            </div>
          </DragDropContext>
        ) : null}

        <Dialog
          open={isCreateDialogOpen}
          onOpenChange={(open) => {
            setIsCreateDialogOpen(open);
          }}
        >
          <DialogContent className="p-0">
            <DialogHeader>
              <DialogTitle>Add Application</DialogTitle>
              <DialogDescription>
                Capture the company, role, and current status in the board.
              </DialogDescription>
            </DialogHeader>
            <JobApplicationForm
              editingApplication={null}
              onCancelEdit={closeCreateDialog}
              onCreate={handleCreate}
              onSuccess={closeCreateDialog}
              onUpdate={handleUpdate}
            />
          </DialogContent>
        </Dialog>

        <Sheet
          open={selectedApplication !== null}
          onOpenChange={(open) => {
            if (!open) {
              closeDetails();
            }
          }}
        >
          <SheetContent className="border-l border-[color:var(--color-border-strong)] bg-[linear-gradient(180deg,rgba(255,251,243,0.98),rgba(252,245,229,0.98))]">
            <SheetHeader>
              <SheetTitle>
                {selectedApplication
                  ? `${selectedApplication.companyName} Details`
                  : "Job Details"}
              </SheetTitle>
              <SheetDescription>
                {selectedApplication?.position ?? "Application details"}
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {selectedApplication ? (
                <div className="space-y-6">
                  {isDetailEditing ? (
                    <JobApplicationForm
                      editingApplication={selectedApplication}
                      onCancelEdit={() => setIsDetailEditing(false)}
                      onCreate={handleCreate}
                      onSuccess={() => setIsDetailEditing(false)}
                      onUpdate={handleUpdate}
                      submitLabel="Save Changes"
                      submittingLabel="Saving Changes..."
                      cancelLabel="Discard"
                    />
                  ) : (
                    <>
                      <section className="space-y-4 border-b border-[color:var(--color-primary)]/40 pb-5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-primary)]">
                              Application Record
                            </p>
                            <h3 className="mt-2 text-3xl text-[color:var(--color-foreground)]">
                              {selectedApplication.companyName}
                            </h3>
                            <p className="mt-2 text-sm uppercase tracking-[0.14em] text-[color:var(--color-muted-foreground)]">
                              {selectedApplication.position}
                            </p>
                          </div>
                          <Badge>
                            {jobApplicationStatusLabels[selectedApplication.status]}
                          </Badge>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          {detailRows(selectedApplication).map((row) => (
                            <div key={row.label} className="space-y-1">
                              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-primary)]">
                                {row.label}
                              </p>
                              <p className="text-sm leading-6 text-[color:var(--color-foreground)]">
                                {row.value}
                              </p>
                            </div>
                          ))}
                          <div className="space-y-1">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-primary)]">
                              Interest Level
                            </p>
                            <div className="flex items-center gap-1 text-[color:var(--color-primary)]">
                              <Diamond className="h-4 w-4 fill-current" />
                              <Diamond className="h-4 w-4 fill-current opacity-70" />
                              <Diamond className="h-4 w-4 opacity-30" />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-primary)]">
                              Job URL
                            </p>
                            {selectedApplication.jobUrl ? (
                              <a
                                className="inline-flex items-center gap-2 text-sm text-[color:var(--color-foreground)] underline decoration-[color:var(--color-primary)] underline-offset-4 transition-colors hover:text-[color:var(--color-primary)]"
                                href={selectedApplication.jobUrl}
                                rel="noreferrer"
                                target="_blank"
                              >
                                <ExternalLink className="h-4 w-4" />
                                Open posting
                              </a>
                            ) : (
                              <p className="text-sm leading-6 text-[color:var(--color-foreground)]">
                                Not provided
                              </p>
                            )}
                          </div>
                        </div>
                      </section>

                      <section className="space-y-3 border-b border-[color:var(--color-primary)]/40 pb-5">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-[color:var(--color-primary)]" />
                          <h4 className="text-xl text-[color:var(--color-foreground)]">
                            Job Description
                          </h4>
                        </div>
                        <div className="max-h-[22rem] overflow-y-auto border border-[color:var(--color-border)] bg-[color:rgba(255,255,255,0.72)] p-4 shadow-sm">
                          <pre className="whitespace-pre-wrap break-words text-sm leading-7 text-[color:var(--color-foreground)] font-[ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation_Mono,Courier_New,monospace]">
                            {selectedApplication.jobDescription?.trim()
                              ? selectedApplication.jobDescription
                              : "No job description saved."}
                          </pre>
                        </div>
                      </section>

                      <div className="space-y-3">
                        <Button
                          className="w-full justify-center"
                          onClick={() => setIsDetailEditing(true)}
                        >
                          Edit Application
                        </Button>
                        <Button
                          className="w-full justify-center text-[color:var(--color-danger)] hover:text-[color:var(--color-danger)]"
                          variant="ghost"
                          onClick={() => void handleDelete(selectedApplication.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete Application
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ) : null}
            </div>
          </SheetContent>
        </Sheet>
      </section>
    </main>
  );
};

export default Dashboard;
