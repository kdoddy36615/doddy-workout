# doddy-workout

Private 6-day Push/Pull/Legs tracker for Kevin and Emily. Mobile-first, dark, no login.

- **Program**: `src/program.ts` (days, sets/reps, swaps, injury warnings). Change it and push.
- **Logic**: `src/logic.ts` (progression, deloads, rotation), tested in `src/logic.test.ts`.
- **Data**: Supabase project `doddy-workout` (`lqrxythejnvlxbkaqpmc`), schema in `supabase/migrations/`.
- **Research and decisions**: `docs/research.md`.
- **Form clips**: `public/media/*.mp4` (muted, looped, cached on the phone by `public/sw.js`).

```sh
npm install
npm run dev      # needs .env.local with VITE_SUPABASE_URL and VITE_SUPABASE_KEY
npm test
npm run build
```

Adding a clip: drop an `.mp4`/`.gif` in `public/media/` and set `media: '/media/<file>'` on the exercise in `src/program.ts`.
