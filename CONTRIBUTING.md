
# Contributing to InvoLex

First off, thank you for considering contributing to InvoLex! It's people like you that make the open-source community such a fantastic place. We welcome any and all contributions.

## Table of Contents

-   [Code of Conduct](#code-of-conduct)
-   [How Can I Contribute?](#how-can-i-contribute)
    -   [Reporting Bugs](#reporting-bugs)
    -   [Suggesting Enhancements](#suggesting-enhancements)
    -   [Pull Requests](#pull-requests)
-   [Development Setup](#development-setup)
-   [Styleguides](#styleguides)

## Code of Conduct

This project and everyone participating in it is governed by the [InvoLex Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior.

## How Can I Contribute?

### Reporting Bugs

If you find a bug, please ensure the bug was not already reported by searching on GitHub under [Issues](https://github.com/your-repo/invo-lex/issues).

If you're unable to find an open issue addressing the problem, [open a new one](https://github.com/your-repo/invo-lex/issues/new). Be sure to include a **title and clear description**, as much relevant information as possible, and a **code sample or an executable test case** demonstrating the expected behavior that is not occurring.

### Suggesting Enhancements

If you have an idea for a new feature or an improvement to an existing one, please open an issue with the "enhancement" label. Provide a clear and detailed explanation of the feature, why it's needed, and how it would work.

### Pull Requests

We love pull requests! To submit one:

1.  Fork the Project.
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the Branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

Please provide a clear description of the problem and solution. Include the relevant issue number if applicable.

## Development Setup

This project is designed to run in a browser-based development environment.

1.  **API Key**: The environment must be configured with a `API_KEY` environment variable containing a valid Google Gemini API key.
2.  **Run**: Simply open the `index.html` file in a modern browser. All necessary scripts are loaded via an import map.

## Styleguides

-   **Code Style**: Please adhere to the existing code style (React with Hooks, TypeScript, Tailwind CSS utility-first classes). We use Prettier for code formatting.
-   **Commit Messages**: Please write clear and concise commit messages.
-   **UI/UX**: All contributions should strive for a high-quality, intuitive, and aesthetically pleasing user experience. Accessibility (ARIA attributes, semantic HTML) is a priority.
