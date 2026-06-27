FROM node:20-alpine

WORKDIR /app

# نصب dependencies
COPY package*.json ./
RUN npm install

# کپی کل پروژه
COPY . .

# پورت برنامه
EXPOSE 3015

# اجرای سرور
CMD ["node", "server.js"]