# Shared architecture styles. Canonical in architecture-base; every repository
# copies this file unchanged and includes it first inside its styles { } block:
#
#     styles {
#         !include styles-shared.dsl
#         ... this repository's layer mapping ...
#     }
#
# It defines what a colour, border or line means, so a reader of any of our
# workspaces reads the same meaning. It never mentions a specific system. Fix
# or extend it in architecture-base first, then copy it back out.

# ── Approved layer palette ───────────────────────────────────────────────────
# A repository maps each of its layers (groups of containers by capability) to
# one family below, in its own styles.dsl:
#     element "Layer Edge"      { background ${PURPLE_FILL} stroke ${PURPLE_STROKE} }
#     element "Group:Edge"      { color ${PURPLE_LABEL} stroke ${PURPLE_STROKE} background ${PURPLE_FRAME} }
#     relationship "Layer Edge" { color ${PURPLE_STROKE} }
# FILL is the container background, STROKE its border and the arrows leaving
# it, LABEL the group title, FRAME the group's tint. Five layers at most; if a
# system has more, the views need splitting, not more colours.
!const PURPLE_FILL "#f1eeff"
!const PURPLE_STROKE "#8b7fd9"
!const PURPLE_LABEL "#6d5bd0"
!const PURPLE_FRAME "#faf8ff"
!const MAGENTA_FILL "#fbeaf6"
!const MAGENTA_STROKE "#b8509f"
!const MAGENTA_LABEL "#94407f"
!const MAGENTA_FRAME "#fdf5fb"
!const GREEN_FILL "#e9f7ee"
!const GREEN_STROKE "#5fb574"
!const GREEN_LABEL "#2f855a"
!const GREEN_FRAME "#f5fbf7"
!const TEAL_FILL "#e5f6f5"
!const TEAL_STROKE "#3fb0ac"
!const TEAL_LABEL "#23807c"
!const TEAL_FRAME "#f3fbfa"
!const SLATE_FILL "#eef1f6"
!const SLATE_STROKE "#7a8aa0"
!const SLATE_LABEL "#56657a"
!const SLATE_FRAME "#f7f8fb"

# ── Reserved colours ─────────────────────────────────────────────────────────
# Never a layer colour: person blue, system blue, external grey, and the two
# security colours. Red means one thing only, a crossing into the trust
# boundary or a service reachable from the internet.
!const PERSON_BLUE "#2563eb"
!const SYSTEM_BLUE "#1168bd"
!const EXTERNAL_GREY "#8a96a8"
!const SECURITY_RED "#d9534f"
!const SECURITY_AMBER "#e8a33d"

# ── Elements ────────────────────────────────────────────────────────────────
# Light fills, coloured borders, dark text.
element "Element" {
    shape RoundedBox
    color #1f2937
    strokeWidth 3
    fontSize 22
}
element "Person" {
    shape Person
    background #dbeafe
    stroke ${PERSON_BLUE}
}
element "Software System" {
    background #e8f1fb
    stroke ${SYSTEM_BLUE}
}
element "Container" {
    background #e8f1fb
    stroke ${SYSTEM_BLUE}
}
# Owned by another team in the same organisation: grey, solid border.
element "Existing System" {
    background #f1f3f5
    stroke ${EXTERNAL_GREY}
}
# Outside the organisation: grey, dashed border.
element "External" {
    background #f1f3f5
    stroke ${EXTERNAL_GREY}
    border dashed
}
element "Group" {
    strokeWidth 4
    border solid
    fontSize 26
}
element "Infrastructure Node" {
    background #f1f3f5
    stroke ${EXTERNAL_GREY}
}
element "Deployment Node" {
    color #7f8c9d
}

# Shapes: what kind of thing it is.
element "Web UI" {
    shape WebBrowser
}
element "Mobile App" {
    shape MobileDevicePortrait
}
element "Database" {
    shape Cylinder
}
element "Storage" {
    shape Cylinder
}
element "Queue" {
    shape Pipe
}
element "Gateway" {
    shape Hexagon
}

# Security markings. Put the tag after the element's layer tag: later tags win,
# so the marking keeps its border on any view.
# Answers on its network without authentication.
element "Unauthenticated" {
    stroke ${SECURITY_AMBER}
    strokeWidth 6
}
# Reachable directly from the internet (public endpoint, port forward).
element "Internet-exposed" {
    stroke ${SECURITY_RED}
    strokeWidth 6
}

# ── Relationships ───────────────────────────────────────────────────────────
# An arrow takes the colour of the element it leaves: tag the relationship
# with the source's layer tag, or "Person". Arrows from systems stay grey.
relationship "Relationship" {
    color ${EXTERNAL_GREY}
    thickness 2
    dashed false
    routing Direct
    fontSize 20
}
relationship "Person" {
    color ${PERSON_BLUE}
}
# Something outside the trust boundary reaching in. Overrides the source colour.
relationship "Inbound across trust boundary" {
    color ${SECURITY_RED}
    thickness 3
}
# A path inside the private network that bypasses the public entry point,
# drawn quieter so the public path reads first.
relationship "Internal path" {
    dashed true
    color #b0b8c4
}
