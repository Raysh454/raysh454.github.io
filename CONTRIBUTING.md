Contributing — Content authoring

Writeups
- Create a Markdown file under src/pages/writeups/ with frontmatter:
  ---
  title: "Post Title"
  slug: "optional-explicit-slug" # recommended for stable links
  date: 2026-05-24
  tags: [tag1, tag2]
  summary: "Short summary"
  draft: false
  ---

Projects
- Create a Markdown file under src/pages/projects/ with frontmatter:
  ---
  title: "Project Title"
  slug: "optional-explicit-slug"
  date: 2026-05-24
  summary: "Short description"
  repo: "https://github.com/username/repo"
  ---

Notes
- If slug is omitted, the site will generate one from the title. Using an explicit slug is recommended to avoid broken links when titles change.
- Add images to the public/ directory and reference them from Markdown using /path.
