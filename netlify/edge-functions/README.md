# Protecting project pages

The `protect-project` Edge Function provides password protection for explicitly
configured `/projects/<slug>` routes. Projects that are not listed in
`netlify.toml` remain public.

## Add protection to another project

For a page such as `/projects/client-work`, add both forms of its route to
`netlify.toml`:

```toml
[[edge_functions]]
  function = "protect-project"
  path = "/projects/client-work"

[[edge_functions]]
  function = "protect-project"
  path = "/projects/client-work/"
```

The slug determines the secret names. Hyphens become underscores and letters
become uppercase, so `client-work` uses `CLIENT_WORK_PASSWORD` and
`CLIENT_WORK_SESSION_SECRET`.

Set the production secrets without adding them to the repository:

```sh
netlify env:set CLIENT_WORK_PASSWORD 'your-chosen-password' --secret --context production
openssl rand -hex 32
netlify env:set CLIENT_WORK_SESSION_SECRET 'paste-generated-value' --secret --context production
```

Deploy the site after setting the variables. To protect deploy previews too,
repeat both `netlify env:set` commands with `--context deploy-preview`.

Authenticated sessions last eight hours. To sign out of any protected project,
visit its URL with `?logout=1` appended.
