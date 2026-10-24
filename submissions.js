import { randomUUID } from "node:crypto";

const submissions = [];

export function addSubmission(values) {
  const submission = {
    id: randomUUID(),
    ...values,
    createdAt: new Date().toISOString()
  };
  submissions.unshift(submission);
  return submission;
}

export function getSubmissions() {
  return submissions.map((submission) => ({ ...submission }));
}
