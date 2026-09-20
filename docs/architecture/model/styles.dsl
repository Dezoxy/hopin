// Hopin's styles. Shared meanings (people, systems, external, shapes, security
// markings, arrows) and the approved palette come from styles-shared.dsl,
// copied unchanged from architecture-base. This file only maps Hopin's layers and
// groups onto palette families. Tag order on an element: layer first,
// security marking last.

styles {
    !include styles-shared.dsl

    // Layers: Clients magenta, Services green, Data slate, Recovery teal.
    element "Layer Clients" {
        background ${MAGENTA_FILL}
        stroke ${MAGENTA_STROKE}
    }
    relationship "Layer Clients" {
        color ${MAGENTA_STROKE}
    }
    element "Layer Services" {
        background ${GREEN_FILL}
        stroke ${GREEN_STROKE}
    }
    relationship "Layer Services" {
        color ${GREEN_STROKE}
    }
    element "Layer Data" {
        background ${SLATE_FILL}
        stroke ${SLATE_STROKE}
    }
    relationship "Layer Data" {
        color ${SLATE_STROKE}
    }
    element "Layer Recovery" {
        background ${TEAL_FILL}
        stroke ${TEAL_STROKE}
    }
    relationship "Layer Recovery" {
        color ${TEAL_STROKE}
    }

    // Groups mark where things run; their tint follows the layer they hold.
    element "Group:Client devices (untrusted)" {
        color ${MAGENTA_LABEL}
        stroke ${MAGENTA_STROKE}
        background ${MAGENTA_FRAME}
    }
    element "Group:AWS eu-central-1" {
        color ${SLATE_LABEL}
        stroke ${SLATE_STROKE}
        background ${SLATE_FRAME}
    }
    element "Group:Azure (off-provider recovery)" {
        color ${TEAL_LABEL}
        stroke ${TEAL_STROKE}
        background ${TEAL_FRAME}
    }

    // Local extras.
    element "Staff" {
        background #ede9fe
    }
    element "Vault" {
        shape Folder
    }
}
