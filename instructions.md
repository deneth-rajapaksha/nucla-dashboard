# Deploying Nucla on GitHub Pages

This guide outlines the steps to deploy the Nucla front-end application to GitHub Pages. Because GitHub Pages offers secure static hosting, this will utilize Angular's client-side capabilities.

## Prerequisites
1. Ensure you have committed your recent changes.
2. Push your code to a repository on GitHub.

---

## Method 1: Easy Deployment using Angular CLI (Recommended)

The easiest way to manually publish your application to GitHub pages is by utilizing the official `angular-cli-ghpages` package.

1. **Install the deployer** package inside your terminal:
   ```bash
   ng add angular-cli-ghpages
   ```

2. **Build and Deploy** the application by specifying your GitHub repository name as your base `href`. Replace `<your-username>` with your GitHub username, and `<repo-name>` with your repository name.
   ```bash
   ng deploy --base-href="https://<your-username>.github.io/<repo-name>/"
   ```
   > **Note:** If you are using a custom domain (e.g. `www.nucla.app`), simply use `--base-href="/"`.

The CLI will automatically build a production version of the Angular app and push the contents to the `gh-pages` branch, making your site live instantly.

---

## Method 2: Automated Deployment via GitHub Actions

To automatically build and deploy your app every time you push to your `main` branch, you can leverage GitHub Actions.

1. **Create the GitHub Workflow Directory**
   Inside your project root, create `.github/workflows/deploy.yml` with the following contents:

   ```yaml
   name: Deploy to GitHub Pages
   
   on:
     push:
       branches:
         - main  # Set to your default branch
   
   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - name: Checkout repository
           uses: actions/checkout@v4
   
         - name: Setup Node.js
           uses: actions/setup-node@v4
           with:
             node-version: '20' # Required for recent Angular apps
   
         - name: Install dependencies
           run: npm ci
   
         - name: Build the Angular app
           # The base-href MUST be your github.io URL, not the github.com repo URL
           run: npm run build -- --base-href="https://deneth-rajapaksha.github.io/nucla-dashboard/"
   
         - name: Deploy to GitHub Pages
           uses: peaceiris/actions-gh-pages@v4
           with:
             github_token: ${{ secrets.GITHUB_TOKEN }}
             # Make sure this matches your Angular 'outputMode' directory structure. 
             # If using browser builder, it is usually dist/<project-name>/browser
             publish_dir: ./dist/app/browser 
   ```

2. **Adjust GitHub Action Permissions**
   - Head over to your GitHub Repository **Settings**.
   - On the left sidebar, navigate to **Actions > General**.
   - Scroll down to the **Workflow permissions** section.
   - Select **Read and write permissions**, then click **Save**.

3. **Enable GitHub Pages**
   - Go to **Settings > Pages**.
   - Under *Build and deployment*, set the Source to **Deploy from a branch**.
   - Select the `gh-pages` branch (it will be created automatically by the Action script or `ng deploy`) and the `/ (root)` folder.
   
Once the workflow has completed, your app will be accessible at: `https://<your-username>.github.io/<repo-name>/`.

---

## Important Limitations for SSR Apps on GitHub Pages
Nucla is currently configured to support advanced Server-Side Rendering (SSR) in Angular. GitHub Pages is exclusively an environment for static sites. 
The application will degrade gracefully returning client-side rendering logic or pre-rendering output. 
If in the future you require backend code to run via node servers or cloud functions dynamically, you should consider deploying to *Netlify*, *Vercel*, or *Google Cloud Run* instead.
