# Base image with Python 3
FROM python:3.12-slim

# Install utilities needed for the Makefile
RUN apt-get update && apt-get install -y \
    jq \
    make \
    curl \
    && rm -rf /var/lib/apt/lists/*


RUN apt-get update && apt-get install -y \
docker.io \
&& rm -rf /var/lib/apt/lists/*

# Set working directory inside container
WORKDIR /app/products/sast/

# Ensure the destination directories exist
RUN mkdir -p /app/products/sast/nodejs/ \
    /app/products/sast/python/ \
    /app/products/sast/custom_rules/

    
    
# Copy runtime folders and Python dependencies
COPY nodejs/ /app/products/sast/nodejs/
COPY python/ /app/products/sast/python/
COPY *.py /app/products/sast/
COPY .env.prod /app/products/sast/.env
COPY requirements.txt /app/products/sast/
    
    # Install Python dependencies if requirements.txt exists
RUN pip install --no-cache-dir -r /app/products/sast/requirements.txt || true
RUN pip install --no-cache-dir semgrep

# Semgrep defaults (can override at runtime)
ENV SEMGREP_IMAGE=semgrep/semgrep

# Environment variables for user input
ENV TARGET_RUNTIME=
ENV API_KEY=
ENV CUSTOMER_ID=
ENV SUBDIR=project
ENV OUTDIR=scan_output

# Ensure Makefiles are executable
RUN chmod -R +x /app/products/sast/*/Makefile
RUN find /app/products/sast/ -type f -name "*.sh" -exec chmod +x {} \;
RUN find /app/products/sast/ -type f -name "*.py" -exec chmod +x {} \;
# Mount user project
VOLUME ["/user_project"]

COPY entrypoint.sh /app/products/sast/entrypoint.sh
RUN chmod +x /app/products/sast/entrypoint.sh
ENTRYPOINT ["/app/products/sast/entrypoint.sh"]
# Entry point: copy user project and run Makefile

