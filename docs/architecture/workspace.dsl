// Entry point for the Hopin architecture model. Keep this file at docs/architecture/:
// !docs and !adrs paths must be this directory or a subdirectory of it.
// Model fragments live in model/ and are pulled in with !include (order matters).
//
// Status: TARGET architecture for the MVP. Nothing here is built or deployed yet.
// Every fact is documented intent from docs/hopin-plan.md and the ADRs.
workspace "Hopin" "Target architecture for the Hopin ride-hailing MVP. Planned, not deployed." {

    !identifiers hierarchical

    configuration {
        scope softwaresystem
    }

    !docs overview
    !adrs decisions

    properties {
        // Docs and ADRs are attached at workspace level, so the per-system
        // documentation/decision inspections do not apply.
        "structurizr.inspection.model.softwaresystem.documentation" "ignore"
        "structurizr.inspection.model.softwaresystem.decisions" "ignore"
    }

    model {
        !include model/people-systems.dsl
        !include model/containers.dsl
        !include model/deployment.dsl
    }

    views {
        !include model/views.dsl
        !include model/styles.dsl
    }

}
