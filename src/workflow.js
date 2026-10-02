import { WorkflowEntrypoint } from "cloudflare:workers";
import { hydrateArtifactEvent } from "./artifact-events.js";
import { validateCompositionRepo } from "./composition-validation.js";

export class ArtifactPushWorkflow extends WorkflowEntrypoint {
  async run(event, step) {
    const artifactEvent = hydrateArtifactEvent(event.payload, event.timestamp);

    const recorded = await step.do("record-artifact-push", async () => {
      const stub = this.env.SEMALANE_STATE.getByName("global");
      const response = await stub.fetch("https://semalane.internal/events", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(artifactEvent)
      });
      if (!response.ok) throw new Error(await response.text());
      return await response.json();
    });

    const repoName = artifactEvent.source?.repoName;
    if (!repoName?.startsWith("compose-")) return { recorded };

    const validation = await step.do("validate-composition-provenance", async () => {
      return validateCompositionRepo(
        this.env,
        repoName,
        artifactEvent.payload?.ref?.replace("refs/heads/", "") || "main"
      );
    });

    await step.do("record-composition-validation", async () => {
      const stub = this.env.SEMALANE_STATE.getByName("global");
      const response = await stub.fetch("https://semalane.internal/composition-validation", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(validation)
      });
      if (!response.ok) throw new Error(await response.text());
    });

    return { recorded, validation };
  }
}
