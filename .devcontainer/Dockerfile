ARG PJT_NAME="actions"
ARG IMG_BASE="mcr.microsoft.com/devcontainers"
ARG IMG_TYPE="typescript-node"
ARG IMG_VERSION="16"
FROM "${IMG_BASE}/${IMG_TYPE}:${IMG_VERSION}"

# Install act
RUN curl -s https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash