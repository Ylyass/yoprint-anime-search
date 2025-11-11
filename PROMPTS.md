# PROMPTS

## 2025-11-10
Prompt:
```
"Please bring the project into full compliance with the YoPrint spec's setup rules and create the foundation for the app.



Ensure there is exactly one default-exported App component in src/App.tsx. Remove any template remnants (logo, useState, App.css imports). App must render a Material UI AppBar titled 'Anime Search' that links to /, plus a content container that uses React Router to define two routes: / for a search page and /anime/:id for a details page.



In src/main.tsx, wrap the application with Redux Provider (using store), React Router's BrowserRouter, and Material UI's ThemeProvider + CssBaseline. Use a light theme. No class components or any types.



Verify that the app runs strictly with npm install and npm run dev, and that the dev server is bound to port 4000 (update scripts and Vite config if needed). Do not introduce or require environment variables.



Create strong TypeScript interfaces for the Jikan v4 API in src/types/jikan.ts covering list search results and full anime details (images, titles, synopsis, score, year, pagination, status, rating, duration, genres, trailer info).



Create or update PROMPTS.md in the project root to log this prompt verbatim, and state that its purpose was to ensure routing/providers/typing/port-4000 compliance per the YoPrint spec.



Return only the list of files you changed and a brief summary of each change."



Why this matters: this locks in the critical requirements (npm-only, port 4000, no env vars, SPA routing shell) and gives us strict TypeScript types for clean state and components. It aligns to "Core Stack," "Functionality" container, and "Package Manager & Setup (CRITICAL)."
```

Purpose: ensure routing/providers/typing/port-4000 compliance per the YoPrint spec. Typographic quotes were converted to ASCII for repository compatibility.

## 2025-11-10
Prompt:
```
“Add robust state management and page behavior to satisfy the YoPrint functionality requirements.



Create a typed Redux Toolkit store (src/app/store.ts) that exports store, RootState, and AppDispatch.



Implement a search slice that holds query, page, results, totalPages, loading, and optional error and lastUpdated. Add an async thunk to call Jikan’s search endpoint with q, page, limit=12, and sfw=true. The thunk must opt into cancellation via the provided AbortSignal, and on non-OK responses should surface a meaningful error. Add reducers to set the query (resetting page to 1), set the page, and clear errors. Register this slice in the store.



Implement an anime slice that loads full details by id from the /anime/{id}/full endpoint, supports cancellation, and exposes current, loading, and optional error, plus a reducer to clear the current detail. Register this slice in the store.



Build a reusable SearchBar component with an accessible label, a passive search icon, and a clear button that only appears when there is text.



Build a reusable AnimeCard component that shows the best available cover image and title, and navigates to /anime/{mal_id} when clicked.



Replace the search page so that it provides instant search without pressing Enter: mirror the input in local state, debounce API requests to 250ms, and cancel any in-flight request before dispatching a new one. On mount, fetch the first page for an empty query so the UI isn’t blank. Implement server-side pagination: when the page changes, cancel any in-flight request, update state, fetch the new page, and smooth-scroll to top. Show skeleton loaders during loading, a helpful empty state when there are no results, and a friendly error message (including a readable note for HTTP 429 rate limiting).



Replace the detail page so it loads full anime info by id on mount, shows skeletons while loading, a clear error on failure, chips for score/episodes/year/status/rating and each genre, a synopsis, and a link to watch the trailer if present. On unmount, cancel any in-flight request and clear the detail from state.



Update PROMPTS.md to log this prompt verbatim, mentioning that it implemented Redux state, instant search with 250ms debounce + cancellation, server-side pagination, detail loading, skeleton loaders, empty state, and error handling per the spec.



Return only the list of files you created/changed and a short description of how each satisfies the YoPrint spec.”
```

Purpose: captured Redux, instant search with 250ms debounce plus cancellation, pagination, detail loading, skeletons, empty state, and error handling per YoPrint functionality requirements.

