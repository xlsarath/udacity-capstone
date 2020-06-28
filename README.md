# Functionality of the application

This application will allow users to pin their travel notes/diaries. A destination photo along with notes can be tagged on page.

# How to run the application

## Backend

To deploy an application run the following commands:

```
cd backend
npm install
sls deploy -v
```

## Frontend

To run a client application first edit the `client/src/config.ts` file to set correct parameters. And then run the following commands:

```
cd client
npm install
npm run start
```

This should start a development server with the React application that will interact with the serverless TODO application.

# Application preview

![Alt text](images/Frontend_view.png?raw=true "Image 1")
