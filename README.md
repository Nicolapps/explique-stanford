# explique.ai

## Getting Started

Please make sure you have [Node.js](https://nodejs.org/en/) installed on your machine.

The first time you need the project, install the dependencies using:

```bash
npm install
```

### Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Set up the environment variables

You can set up the environment variables of the deployment on the Convex dashboard (run `npx convex dashboard` to open it).

#### OpenAI API key

Create an OpenAI account, and set the environment variable `OPENAI_API_KEY` to an OpenAI API key.

#### Google client

This project uses the Google APIs to implement authentication.

Follow [this tutorial](https://support.google.com/cloud/answer/6158849?hl=en#zippy=%2Cuser-consent%2Cauthorized-domains%2Cpublic-and-internal-applications) to create a client ID.

When prompted for authorized redirect URIs, add `{BASE_URL}/authRedirect`, where `{BASE_URL}` is the address users access the website from (e.g. `http://localhost:3000` for a local development instance).

Copy the resulting client ID and secret in the `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` environment variables in the Convex dashboard.
