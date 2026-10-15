<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## App architecture
- Keep each public screen in its own top-level TanStack route with unique leaf metadata, so every screen has a stable URL and preview title.
- Share the first-stage couples UI and navigation through `src/components/between-us.tsx`; keep visual tokens and reusable styles in `src/styles.css` for a consistent phone-first experience.
- Account, connection, and storage controls are explicitly nonpersistent previews until a real secured backend is connected; never simulate successful authentication or partner linking.
- Keep the manually registered PWA service worker network-only; never cache relationship pages or account data, to avoid exposing private information on shared devices.
