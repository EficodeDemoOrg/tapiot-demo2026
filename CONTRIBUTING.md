# Contributing to Barbarian Arena

Thank you for your interest in contributing! This document provides guidelines for contributing to this project.

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Create a feature branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. Make your changes
5. Test locally:
   ```bash
   cd games/barbarian
   npm install
   npm start
   ```
6. Commit using [Conventional Commits](https://www.conventionalcommits.org/):
   ```
   feat: add new attack animation
   fix: correct hitbox collision detection
   docs: update control scheme in README
   chore: update dependencies
   ```

## Branch Naming

Use the following prefixes:
- `feature/` — New features
- `fix/` — Bug fixes
- `chore/` — Maintenance tasks
- `docs/` — Documentation updates

## Pull Request Process

1. Ensure your code follows the project's coding style (see `.github/copilot-instructions.md`)
2. Update documentation if your changes affect usage or controls
3. Fill out the PR description with a clear summary of changes
4. All PRs require at least one review from a code owner before merging
5. CI checks must pass before merging

## Coding Standards

- **JavaScript:** Use `const`/`let` (never `var`), meaningful variable names, small focused functions
- **Security:** Validate user input, never hardcode secrets, escape dynamic content
- **Async:** Prefer `async`/`await` over callbacks

## Reporting Issues

- Use GitHub Issues to report bugs or request features
- For security vulnerabilities, see [SECURITY.md](SECURITY.md)

## Code of Conduct

Be respectful, inclusive, and constructive. We are committed to providing a welcoming environment for everyone.
