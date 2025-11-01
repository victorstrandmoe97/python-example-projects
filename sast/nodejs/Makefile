SEMGREP_IMAGE=semgrep/semgrep
export SEMGREP_APP_TOKEN=3cce026d83392cef6b4b4608063c723dbff93584dbb47ffd59b309fda1e3deb4
SUBDIR=project
OUTDIR=scan_output
export API_KEY
export RUNTIME
export CUSTOMER_ID

.PHONY: initialise_run start_run  scan request_general_reports upload_blob_storage complete_run run

# TODO: --force-nosem to semgrep scan for CI git diffs


initialise_run:
	@if [ -z "$(CUSTOMER_ID)" ]; then echo "❌ Missing CUSTOMER_ID user param"; exit 1; fi
	@if [ -z "$(API_KEY)" ]; then echo "❌ Missing API_KEY user param"; exit 1; fi
	@if [ -z "$(RUNTIME)" ]; then echo "❌ Missing RUNTIME user param"; exit 1; fi
	@if [ "$(RUNTIME)" != "nodejs" ] && [ "$(RUNTIME)" != "python" ]; then echo "❌ Invalid runtime user param"; exit 1; fi
	mkdir -p scan_output
	rm -rf scan_output/*
	python3 ../initialise_run.py --customer_id=$(CUSTOMER_ID) --api_key=$(API_KEY) --runtime=$(RUNTIME)

start_run:
	python3 ../start_run_audit.py --customer_id=$(CUSTOMER_ID) --api_key=$(API_KEY) --runtime=$(RUNTIME)

scan:
	python3 ../update_run_audit.py --status=started --customer_id=$(CUSTOMER_ID) --api_key=$(API_KEY) --runtime=$(RUNTIME)
	echo "Start scanning......"
	mkdir -p $(OUTDIR)

	# Run Semgrep locally, mimicking Docker behavior
	cd $(SUBDIR) && \
	semgrep scan \
		--config p/default \
		--config ../custom_rules \
		--exclude-rule=javascript.express.web.cors-default-config-express.cors-default-config-express \
		--exclude-rule=javascript.crypto-js.cryptojs-weak-algorithm.cryptojs-weak-algorithm \
		--exclude-rule=javascript.koa.web.cors-default-config-koa.cors-default-config-koa \
		--include '**/*.js' --include '**/*.ts' \
		--exclude node_modules/ \
		--exclude .npm/ \
		--exclude .yarn/ \
		--metrics=off \
		--disable-version-check \
		--no-git-ignore \
		--verbose \
		--json --json-output=../$(OUTDIR)/semgrep.json \
		.

	# Post-processing with jq
	jq '.' $(OUTDIR)/semgrep.json > $(OUTDIR)/tmp.json && mv $(OUTDIR)/tmp.json $(OUTDIR)/semgrep.json
	jq ".results | map({ \
		file: .path, \
		line: .start.line, \
		rule_id: .check_id, \
		message: .extra.message, \
		likelihood: .extra.metadata.likelihood, \
		impact: .extra.metadata.impact, \
		confidence: .extra.metadata.confidence, \
		cwe: .extra.metadata.cwe, \
		owasp: .extra.metadata.owasp, \
		references: .extra.metadata.references, \
		vulnerability_class: .extra.metadata.vulnerability_class \
	}) | {results: .}" \
	$(OUTDIR)/semgrep.json > $(OUTDIR)/semgrep_minimal.json


request_general_reports:
	python3 ../update_run_audit.py --status=request_general_reports --customer_id=$(CUSTOMER_ID) --api_key=$(API_KEY) --runtime=$(RUNTIME)
	echo "Requesting general reports"
	python3 ../main.py --customer_id=$(CUSTOMER_ID) --api_key=$(API_KEY) --runtime=$(RUNTIME)


upload_blob_storage:
	python3 ../update_run_audit.py --status=upload_blob_storage --customer_id=$(CUSTOMER_ID) --api_key=$(API_KEY) --runtime=$(RUNTIME)
	python3 ../upload_blob_storage.py  --customer_id=$(CUSTOMER_ID) --api_key=$(API_KEY) --runtime=$(RUNTIME)

complete_run:
	python3 ../complete_run_audit.py --customer_id=$(CUSTOMER_ID) --api_key=$(API_KEY) --runtime=$(RUNTIME)

run: initialise_run start_run scan request_general_reports upload_blob_storage complete_run

#run:   complete_run
#run: initialise_run start_run upload_blob_storage complete_run
#run: complete_run
