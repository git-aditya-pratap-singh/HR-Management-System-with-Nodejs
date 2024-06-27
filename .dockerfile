FROM node:latest
COPY . .
RUN npm install
EXPOSE 5005
CMD ["npm", "run", "dev"]