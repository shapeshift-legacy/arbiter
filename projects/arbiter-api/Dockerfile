FROM node:latest

# Add chamber CLI for secrets
ADD https://github.com/segmentio/chamber/releases/download/v2.1.0/chamber-v2.1.0-linux-amd64 /usr/bin/chamber
RUN chmod 0755 /usr/bin/chamber

# Create app directory
WORKDIR /arbiter

# copy root manifest
COPY package.json .
COPY packages ./packages

# Create app directory
WORKDIR /arbiter/projects/arbiter-api

COPY projects/arbiter-api .
RUN yarn
RUN yarn build
