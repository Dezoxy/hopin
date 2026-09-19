#!/usr/bin/env bash
# Render a Structurizr workspace's Documentation tab and views as one PDF.
#
# Run from the repository root. It exports every view as PNG plus the workspace
# as JSON into <arch-dir>/generated/ (keep that folder gitignored), assembles
# the Markdown with build_architecture_pdf_source.py, and renders it with
# Pandoc and the Eisvogel template. The PDF lands beside the exports, named
# <project>-architecture-<date>-<edition>.pdf.
#
# An operator tool: run it by hand, or let the Docs / Architecture PDF workflow
# run it through `make pdf` when an operator starts that workflow on main.
# Never trigger it automatically.
#
#   STRUCTURIZR_IMAGE  required: the pinned Structurizr image your viewer runs,
#                      e.g. structurizr/structurizr:2026.06.28 (the PNG export
#                      uses its -playwright tag)
#   PANDOC_IMAGE       optional: default pandoc/extra:3.11.0.0-debian, the
#                      version this was tested with (LaTeX, Eisvogel; ~2 GB)
#   ARCH_DIR           optional: default docs/architecture
set -euo pipefail

: "${STRUCTURIZR_IMAGE:?Set STRUCTURIZR_IMAGE to your pinned Structurizr image}"
PANDOC_IMAGE="${PANDOC_IMAGE:-pandoc/extra:3.11.0.0-debian}"
ARCH_DIR="${ARCH_DIR:-docs/architecture}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
arch="$(cd "${ARCH_DIR}" && pwd)"
generated="${arch}/generated"

mkdir -p "${generated}"
# The Structurizr container writes as its own user.
chmod 777 "${generated}"

docker run --rm -v "${arch}:/w:ro" -v "${generated}:/out" "${STRUCTURIZR_IMAGE}" \
  export -workspace /w/workspace.dsl -format json -output /out
docker run --rm -v "${arch}:/w:ro" -v "${generated}:/out" "${STRUCTURIZR_IMAGE}-playwright" \
  export -workspace /w/workspace.dsl -format png -output /out

pdf="$(python3 "${SCRIPT_DIR}/build_architecture_pdf_source.py" \
  "${arch}" "${generated}" "${generated}/architecture.md")"

docker run --rm -u "$(id -u):$(id -g)" -e HOME=/tmp -v "${arch}:/data" -w /data \
  "${PANDOC_IMAGE}" generated/architecture.md -o "generated/${pdf}" \
  --template eisvogel --pdf-engine=xelatex --resource-path=/data

echo "wrote ${ARCH_DIR}/generated/${pdf}"
