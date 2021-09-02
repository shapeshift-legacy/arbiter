FROM node:10.9

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json .

RUN npm install --registry=http://nexus.redacted.example.com/repository/npm/

COPY .npmrc .

# Bundle app source
COPY . .

EXPOSE 3000
