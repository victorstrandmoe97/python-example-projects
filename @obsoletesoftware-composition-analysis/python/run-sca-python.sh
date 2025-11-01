set -e


echo "<<<<<<<<<<<<Starting Software Composition Analysis>>>>>>>>>>>>"

echo "<<<<<<<<<<<<Preparing directories>>>>>>>>>>>>"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$SCRIPT_DIR"
PROJECT_DIR="$SCRIPT_DIR/python-example"

OUTPUT_DIR="$PROJECT_DIR/scan_output"

FULL_DEPS_TREE_PATH="$OUTPUT_DIR/full-deps-tree.json"
SBOM_PATH="$OUTPUT_DIR/sbom.json"
TRANSFORMED_SBOM_OUTPUT_PATH="$OUTPUT_DIR/transformed_sbom.json"



echo "<<<<<<<<<<<<Installing dependencies>>>>>>>>>>>>"
cd $PROJECT_DIR
# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Install your original requirements
pip install -r requirements.txt

# Generate a lockfile for scanning only (do NOT overwrite original)
pip freeze > requirements.lock

# Optional: install pipdeptree if you're building a full tree
pip install pipdeptree


echo "<<<<<<<<<<<<Installed dependencies>>>>>>>>>>>>"


mkdir -p "$OUTPUT_DIR"


echo "<<<<<<<<<<<<Creating dependency tree>>>>>>>>>>>>"

./venv/bin/pipdeptree --json-tree > "$FULL_DEPS_TREE_PATH"

echo "<<<<<<<<<<<<Created dependency tree>>>>>>>>>>>>"

echo "<<<<<<<<<<<<Creating SBOM>>>>>>>>>>>>"
cd "$BASE_DIR"

docker run --rm -v "$PROJECT_DIR:/project" anchore/syft:latest /project -o cyclonedx-json --source-version=1.0.0 | jq '.' > "$SBOM_PATH"

echo "<<<<<<<<<<<<Created SBOM>>>>>>>>>>>>"



echo "<<<<<<<<<<<<Running Grype Vulnerability checker>>>>>>>>>>>>"
docker run --rm -v "$PROJECT_DIR:/data" anchore/grype sbom:/data/scan_output/sbom.json -o json | jq '.' > $OUTPUT_DIR/grype-report.json

echo "<<<<<<<<<<<<Finished Grype Vulnerability checker>>>>>>>>>>>>"

echo "<<<<<<<<<<<<Running OSV Vulnerability checker>>>>>>>>>>>>"
docker run --rm -v "$PROJECT_DIR:/work" ghcr.io/google/osv-scanner scan source /work --format json > "$OUTPUT_DIR/osv-report.json"
echo "<<<<<<<<<<<<Finished OSV Vulnerability checker>>>>>>>>>>>>"