# norm0
Simple Middleman 4 site with a Webpack pipeline (Yarn).

[![Netlify Status](https://api.netlify.com/api/v1/badges/948a5fc1-5e27-4807-bf3c-cd289ad3f581/deploy-status)](https://app.netlify.com/sites/sharp-feynman-e1511f/deploys)

## Prereqs
- Ruby `3.2.4` (Bundler `2.3.26`)
- Node `20.17.0`
- Yarn (uses `yarn.lock`)
- Middleman and dependencies via Bundler

With `asdf` installed, run `asdf install` to sync to the repo versions.

## Setup
```bash
gem install bundler:2.3.26   # if needed
bundle install
yarn install
```

## Development
```bash
bundle exec middleman server
```
Middleman will start the dev server and run `yarn start` through the external pipeline for assets.

## Production build
```bash
bundle exec middleman build
```
This triggers `yarn build` for assets and outputs the static site to `build/`.
